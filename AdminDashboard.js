// Função utilitária para buscar endereço pelo par lat/lng usando Nominatim
// Função para buscar marcador pelo id na API backend
async function buscarMarcadorPorId(id) {
  try {
    const resp = await fetch(`http://localhost:3001/lugares`);
    if (resp.ok) {
      const todos = await resp.json();
      return todos.find((m) => String(m.id) === String(id));
    }
  } catch (e) {}
  return null;
}
async function buscarEnderecoPorCoordenada(lat, lng) {
  try {
    const resp = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`
    );
    if (resp.ok) {
      const data = await resp.json();
      // Extrai apenas a primeira linha relevante do endereço
      if (data.address) {
        // Preferência: road + neighbourhood + city ou road + suburb + city
        const a = data.address;
        let partes = [];
        if (a.road) partes.push(a.road);
        if (a.neighbourhood) partes.push(a.neighbourhood);
        else if (a.suburb) partes.push(a.suburb);
        if (a.city) partes.push(a.city);
        else if (a.town) partes.push(a.town);
        else if (a.village) partes.push(a.village);
        if (partes.length > 0) return partes.join(" - ");
      }
      // Fallback: primeira linha do display_name
      if (data.display_name) {
        return data.display_name.split(",")[0];
      }
      return "";
    }
  } catch (e) {}
  return "";
}

// AdminDashboard.js
// Painel administrativo completo para admins e ONGs

import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  ScrollView,
  Alert,
  TextInput,
  StyleSheet,
  Dimensions,
  RefreshControl,
  Platform,
} from "react-native";
import { useAuth } from "./AuthComponents";
import { adminAPI, denunciasAPI, lugaresAPI, areasAPI } from "./api";

const { width, height } = Dimensions.get("window");

const AdminDashboard = ({
  visible,
  onClose,
  onSelectMarcador,
  onSelectArea,
  onAreasChanged,
}) => {
  // ...existing code...
  const [areasPendentes, setAreasPendentes] = useState([]);
  const [todasAreas, setTodasAreas] = useState([]);
  // Debug: mostrar todos os status das áreas carregadas
  useEffect(() => {
    if (todasAreas && todasAreas.length > 0) {
      console.log(
        "DEBUG status das áreas:",
        todasAreas.map((a) => a.status)
      );
    }
  }, [todasAreas]);
  // Força logout e limpeza do token antigo ao abrir o painel
  useEffect(() => {
    const token = localStorage.getItem("mapcity_token");
    if (token && !/^token_simulado_\d+$/.test(token)) {
      localStorage.removeItem("mapcity_token");
      window.location.reload();
    }
  }, []);
  const { usuario } = useAuth();
  const [activeTab, setActiveTab] = useState("denuncias");
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Estados para denúncias
  const [denuncias, setDenuncias] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [denunciaSelected, setDenunciaSelected] = useState(null);
  const [observacoes, setObservacoes] = useState("");

  const [areaSelected, setAreaSelected] = useState(null);
  const [modalAreaVisible, setModalAreaVisible] = useState(false);
  const [motivoRejeicao, setMotivoRejeicao] = useState("");

  // Estados para marcadores
  const [marcadores, setMarcadores] = useState([]);
  const [marcadorSelected, setMarcadorSelected] = useState(null);
  // Endereços cacheados por denunciaId
  const [enderecos, setEnderecos] = useState({});
  // Filtros para marcadores
  const [filtroTipo, setFiltroTipo] = useState("Todos");
  const [filtroResolvido, setFiltroResolvido] = useState(""); // '', 'sim', 'nao'
  const [filtroDataInicio, setFiltroDataInicio] = useState("");
  const [filtroDataFim, setFiltroDataFim] = useState("");

  useEffect(() => {
    if (
      visible &&
      usuario &&
      (usuario.tipo === "admin" || usuario.tipo === "ong")
    ) {
      carregarDados();
      carregarUsuarios();
    }
  }, [visible, usuario, activeTab]);

  const carregarDados = async () => {
    setLoading(true);
    try {
      await Promise.all([
        carregarDenuncias(),
        carregarAreas(),
        carregarMarcadores(),
      ]);
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
      Alert.alert("Erro", "Falha ao carregar dados do painel");
    } finally {
      setLoading(false);
    }
  };

  const carregarDenuncias = async () => {
    try {
      const token = localStorage.getItem("mapcity_token");
      let response;
      if (usuario.tipo === "ong") {
        response = await denunciasAPI.listarDenuncias(token, usuario.id);
      } else {
        response = await denunciasAPI.listarDenuncias(token);
      }
      // Backend retorna um array diretamente, não um objeto com propriedade denuncias
      setDenuncias(
        Array.isArray(response) ? response : response.denuncias || []
      );
    } catch (error) {
      console.error("Erro ao carregar denúncias:", error);
    }
  };

  // Carregar todos os usuários para exibir nome do denunciante
  const carregarUsuarios = async () => {
    try {
      const resp = await fetch("http://localhost:3001/usuarios");
      if (resp.ok) {
        const lista = await resp.json();
        setUsuarios(lista);
      }
    } catch (e) {
      // erro ao buscar usuários
    }
  };

  const carregarAreas = async () => {
    try {
      if (usuario.tipo === "admin") {
        // Buscar áreas pendentes com nome da ONG responsável
        const pendentes = await adminAPI.buscarAreasPendentes();
        setAreasPendentes(pendentes);
        // Buscar todas as áreas para outra aba, se necessário
        const todas = await adminAPI.buscarTodasAreas();
        setTodasAreas(todas.areas || []);
      } else if (usuario.tipo === "ong") {
        const areas = await areasAPI.buscarAreas(usuario.id);
        setTodasAreas(Array.isArray(areas) ? areas : areas.areas || []);
        setAreasPendentes(
          (Array.isArray(areas) ? areas : areas.areas || []).filter(
            (area) => area.status === "pendente"
          )
        );
      }
    } catch (error) {
      console.error("Erro ao carregar áreas:", error);
    }
  };
  // Renderizar lista de áreas de responsabilidade para ONG
  const renderAreasONG = () => {
    if (usuario.tipo !== "ong") return null;
    return (
      <ScrollView style={styles.tabContent}>
        <Text style={styles.sectionTitle}>
          Áreas de Responsabilidade ({todasAreas.length})
        </Text>
        {todasAreas.length === 0 ? (
          <Text style={{ color: "#888", fontSize: 16, textAlign: "center" }}>
            Nenhuma área cadastrada.
          </Text>
        ) : (
          todasAreas.map((area) => (
            <View key={area.id} style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>{area.nome}</Text>
                <View
                  style={[
                    styles.badge,
                    area.status === "aprovada"
                      ? styles.badgeSuccess
                      : styles.badgeWarning,
                  ]}
                >
                  <Text style={styles.badgeText}>
                    {area.status === "aprovada"
                      ? "Aprovada"
                      : area.status.charAt(0).toUpperCase() +
                        area.status.slice(1)}
                  </Text>
                </View>
              </View>
              <Text style={styles.cardText}>
                Descrição: {area.descricao || "Sem descrição."}
              </Text>
              <Text style={styles.cardText}>
                Criada em: {new Date(area.criada_em).toLocaleDateString()}
              </Text>
              <View style={styles.cardActions}>
                <TouchableOpacity
                  style={[styles.button, styles.buttonDanger]}
                  onPress={async () => {
                    console.log("Excluir área (ONG):", area.id);
                    try {
                      console.log(
                        "[areasAPI.excluirArea] Iniciando fetch DELETE",
                        `http://localhost:3001/areas/${area.id}`
                      );
                      const response = await fetch(
                        `http://localhost:3001/areas/${area.id}`,
                        {
                          method: "DELETE",
                          headers: {
                            "Content-Type": "application/json",
                            Authorization: `Bearer ${localStorage.getItem(
                              "mapcity_token"
                            )}`,
                          },
                        }
                      );
                      console.log(
                        "[areasAPI.excluirArea] Resposta recebida",
                        response
                      );
                      const result = await response.json();
                      console.log(
                        "[areasAPI.excluirArea] Resultado do fetch",
                        result
                      );
                      if (response.ok) {
                        alert("Área excluída com sucesso");
                        await carregarAreas(); // Atualiza a lista após exclusão
                        if (onAreasChanged) await onAreasChanged(); // Notifica o mapa para atualizar
                      } else {
                        alert(
                          "Erro ao excluir área: " +
                            (result.error || response.statusText)
                        );
                      }
                    } catch (error) {
                      console.error("Erro ao excluir área:", error);
                      alert("Erro ao excluir área: " + error.message);
                    }
                  }}
                >
                  <Text style={styles.buttonText}>Excluir</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    );
  };

  const carregarMarcadores = async () => {
    try {
      const response = await lugaresAPI.buscarTodos();

      // Normalizar coordenadas (converter strings para números se necessário)
      const marcadoresNormalizados = response.map((marcador) => ({
        ...marcador,
        latitude:
          typeof marcador.latitude === "string"
            ? parseFloat(marcador.latitude)
            : marcador.latitude,
        longitude:
          typeof marcador.longitude === "string"
            ? parseFloat(marcador.longitude)
            : marcador.longitude,
      }));

      if (usuario.tipo === "ong") {
        // Para ONGs, filtrar apenas marcadores em suas áreas aprovadas
        const areasAprovadas = todasAreas.filter(
          (area) => area.status === "aprovada"
        );
        const marcadoresFiltrados = marcadoresNormalizados.filter(
          (marcador) => {
            // Verificar se as coordenadas são válidas
            if (
              typeof marcador.latitude !== "number" ||
              typeof marcador.longitude !== "number" ||
              isNaN(marcador.latitude) ||
              isNaN(marcador.longitude)
            ) {
              return false;
            }

            return areasAprovadas.some((area) =>
              pontoDentroDoPoligono(
                { lat: marcador.latitude, lng: marcador.longitude },
                area.coordenadas
              )
            );
          }
        );
        setMarcadores(marcadoresFiltrados);
      } else {
        setMarcadores(marcadoresNormalizados);
      }
    } catch (error) {
      console.error("Erro ao carregar marcadores:", error);
    }
  };

  // Função auxiliar para verificar se um ponto está dentro de um polígono
  const pontoDentroDoPoligono = (ponto, coordenadas) => {
    try {
      const coords = Array.isArray(coordenadas)
        ? coordenadas
        : JSON.parse(coordenadas);
      const x = ponto.lat;
      const y = ponto.lng;
      let dentro = false;

      for (let i = 0, j = coords.length - 1; i < coords.length; j = i++) {
        const xi = coords[i].lat;
        const yi = coords[i].lng;
        const xj = coords[j].lat;
        const yj = coords[j].lng;

        if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) {
          dentro = !dentro;
        }
      }

      return dentro;
    } catch (error) {
      console.error("Erro ao verificar ponto no polígono:", error);
      return false;
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await carregarDados();
    setRefreshing(false);
  };

  // Funções para denúncias
  const processarDenuncia = async (denunciaId, acao, obs = "") => {
    try {
      setLoading(true);
      const token = localStorage.getItem("mapcity_token");
      await denunciasAPI.processarDenuncia(denunciaId, acao, obs, token);
      Alert.alert(
        "Sucesso",
        `Denúncia ${acao === "aceitar" ? "aceita" : "rejeitada"} com sucesso`
      );
      setDenunciaSelected(null);
      setObservacoes("");
      await carregarDenuncias();
    } catch (error) {
      Alert.alert("Erro", error.message);
    } finally {
      setLoading(false);
    }
  };

  // Funções para áreas
  const aprovarArea = async (areaId) => {
    try {
      setLoading(true);
      await adminAPI.aprovarArea(areaId);
      Alert.alert("Sucesso", "Área aprovada com sucesso");
      await carregarAreas();
      if (onAreasChanged) await onAreasChanged(); // Notifica o mapa para atualizar
    } catch (error) {
      Alert.alert("Erro", error.message);
    } finally {
      setLoading(false);
    }
  };

  const rejeitarArea = async (areaId) => {
    if (!motivoRejeicao.trim()) {
      Alert.alert("Erro", "Digite o motivo da rejeição");
      return;
    }

    try {
      setLoading(true);
      await adminAPI.rejeitarArea(areaId, motivoRejeicao.trim());
      Alert.alert("Sucesso", "Área rejeitada com sucesso");
      setAreaSelected(null);
      setMotivoRejeicao("");
      await carregarAreas();
      if (onAreasChanged) await onAreasChanged(); // Notifica o mapa para atualizar
    } catch (error) {
      Alert.alert("Erro", error.message);
    } finally {
      setLoading(false);
    }
  };

  const excluirArea = async (areaId) => {
    let confirmar = true;
    // Se estiver rodando no navegador, usar window.confirm
    if (typeof window !== "undefined" && window.confirm) {
      confirmar = window.confirm(
        "Tem certeza que deseja excluir esta área? Esta ação não pode ser desfeita."
      );
    }
    if (!confirmar) return;
    try {
      setLoading(true);
      await areasAPI.excluirArea(areaId);
      await carregarAreas(); // Atualiza o painel sem recarregar a página
    } catch (error) {
      let msg = error && error.message ? error.message : "Erro desconhecido";
      // Loga o erro completo para depuração
      console.error("Erro ao excluir área:", error);
      alert("Erro ao excluir área: " + msg);
    } finally {
      setLoading(false);
    }
  };

  // Funções para marcadores
  const excluirMarcador = async (marcadorId) => {
    try {
      setLoading(true);
      const token = localStorage.getItem("mapcity_token");
      await lugaresAPI.deletar(marcadorId, token);
      window.location.reload();
    } catch (error) {
      console.error("Erro ao excluir marcador:", error);
      alert("Erro ao excluir marcador: " + (error.message || error));
    } finally {
      setLoading(false);
    }
  };

  const marcarComoResolvido = async (marcadorId, resolvido) => {
    try {
      setLoading(true);
      await lugaresAPI.resolver(marcadorId, resolvido);
      Alert.alert(
        "Sucesso",
        `Marcador ${resolvido ? "resolvido" : "reaberto"} com sucesso`
      );
      await carregarMarcadores();
      window.location.reload();
    } catch (error) {
      Alert.alert("Erro", error.message);
    } finally {
      setLoading(false);
    }
  };

  const renderDenuncias = () => {
    const denunciasPendentes = denuncias.filter((d) => d.status === "pendente");

    return (
      <ScrollView
        style={styles.tabContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header com contador */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 16,
            padding: 16,
            backgroundColor:
              denunciasPendentes.length > 0 ? "#FEF3C7" : "#F0F9FF",
            borderRadius: 12,
            borderWidth: 1,
            borderColor: denunciasPendentes.length > 0 ? "#F59E0B" : "#0EA5E9",
          }}
        >
          <View>
            <Text style={[styles.sectionTitle, { marginBottom: 4 }]}>
              🚨 Denúncias Pendentes
            </Text>
            <Text
              style={{
                fontSize: 14,
                color: "#6B7280",
              }}
            >
              {denunciasPendentes.length === 0
                ? "Nenhuma denúncia pendente"
                : `${denunciasPendentes.length} denúncia${
                    denunciasPendentes.length > 1 ? "s" : ""
                  } aguardando análise`}
            </Text>
          </View>

          {denunciasPendentes.length > 0 && (
            <View
              style={{
                backgroundColor: "#DC2626",
                borderRadius: 20,
                paddingHorizontal: 12,
                paddingVertical: 6,
                minWidth: 32,
                alignItems: "center",
              }}
            >
              <Text
                style={{
                  color: "#FFFFFF",
                  fontSize: 14,
                  fontWeight: "700",
                }}
              >
                {denunciasPendentes.length}
              </Text>
            </View>
          )}
        </View>

        {/* Lista de denúncias */}
        {denunciasPendentes.map((denuncia) => (
          <View
            key={denuncia.id}
            style={{
              ...styles.card,
              borderLeftWidth: 4,
              borderLeftColor: "#DC2626",
              backgroundColor: "#FFFBEB",
            }}
          >
            <View style={styles.cardHeader}>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  flexWrap: "wrap",
                }}
              >
                <Text
                  style={{
                    ...styles.cardTitle,
                    color: "#DC2626",
                    marginRight: 8,
                  }}
                >
                  📍 {denuncia.marcador_titulo || denuncia.marcador_nome}
                </Text>
                {(() => {
                  // Busca coordenadas da denúncia ou do marcador
                  let lat = null,
                    lng = null;
                  let buscarMarcadorPromise = null;
                  if (denuncia.latitude && denuncia.longitude) {
                    lat = denuncia.latitude;
                    lng = denuncia.longitude;
                  } else if (denuncia.marcador_id) {
                    // Primeiro tenta na lista local
                    let marcador =
                      marcadores && marcadores.length > 0
                        ? marcadores.find(
                            (m) => String(m.id) === String(denuncia.marcador_id)
                          )
                        : null;
                    if (!marcador) {
                      // Se não achou, busca na API
                      buscarMarcadorPromise = buscarMarcadorPorId(
                        denuncia.marcador_id
                      ).then((marcadorApi) => {
                        if (
                          marcadorApi &&
                          marcadorApi.latitude &&
                          marcadorApi.longitude
                        ) {
                          buscarEnderecoPorCoordenada(
                            marcadorApi.latitude,
                            marcadorApi.longitude
                          ).then((endereco) => {
                            setEnderecos((prev) => ({
                              ...prev,
                              [denuncia.id]:
                                endereco || "Endereço não encontrado",
                            }));
                          });
                        } else {
                          setEnderecos((prev) => ({
                            ...prev,
                            [denuncia.id]: "Sem localização",
                          }));
                        }
                      });
                    } else if (marcador.latitude && marcador.longitude) {
                      lat = marcador.latitude;
                      lng = marcador.longitude;
                    }
                  }
                  if (lat && lng) {
                    // Busca endereço se ainda não buscou
                    if (!enderecos[denuncia.id]) {
                      buscarEnderecoPorCoordenada(lat, lng).then((endereco) => {
                        setEnderecos((prev) => ({
                          ...prev,
                          [denuncia.id]: endereco || "Endereço não encontrado",
                        }));
                      });
                    }
                    return (
                      <Text
                        style={{
                          fontSize: 13,
                          color: "#7C2D12",
                          fontWeight: "bold",
                          maxWidth: 200,
                        }}
                        numberOfLines={1}
                      >
                        {enderecos[denuncia.id]
                          ? enderecos[denuncia.id]
                          : "Buscando endereço..."}
                      </Text>
                    );
                  }
                  // Se está buscando marcador na API, mostra carregando
                  if (buscarMarcadorPromise && !enderecos[denuncia.id]) {
                    return (
                      <Text
                        style={{
                          fontSize: 13,
                          color: "#7C2D12",
                          fontWeight: "bold",
                        }}
                      >
                        Buscando localização...
                      </Text>
                    );
                  }
                  // Se já buscou e não achou, mostra mensagem
                  return (
                    <Text
                      style={{
                        fontSize: 13,
                        color: "#7C2D12",
                        fontWeight: "bold",
                      }}
                    >
                      {enderecos[denuncia.id] || "Sem localização"}
                    </Text>
                  );
                })()}
              </View>
              <View
                style={[
                  styles.badge,
                  { backgroundColor: "#FEE2E2", borderColor: "#EF4444" },
                ]}
              >
                <Text style={{ ...styles.badgeText, color: "#DC2626" }}>
                  🚨 Pendente
                </Text>
              </View>
            </View>

            {/* Informações da denúncia com ícones */}
            <View style={{ marginVertical: 8 }}>
              <Text
                style={{
                  ...styles.cardText,
                  fontWeight: "600",
                  color: "#7C2D12",
                  marginBottom: 6,
                }}
              >
                ⚠️ Motivo:{" "}
                {denuncia.motivo === "conteudo_inadequado"
                  ? "Conteúdo inadequado"
                  : denuncia.motivo === "informacao_incorreta"
                  ? "Informação incorreta"
                  : denuncia.motivo === "spam"
                  ? "Spam ou duplicação"
                  : denuncia.motivo === "local_incorreto"
                  ? "Localização incorreta"
                  : denuncia.motivo === "ja_resolvido"
                  ? "Problema já foi resolvido"
                  : denuncia.motivo || "Não especificado"}
              </Text>

              <Text style={styles.cardText}>
                👤 Denunciante:{" "}
                {(() => {
                  // Sempre tenta buscar nome/email pelo ID na lista de usuários
                  if (denuncia.denunciante_id && usuarios.length > 0) {
                    const user = usuarios.find(
                      (u) => String(u.id) === String(denuncia.denunciante_id)
                    );
                    if (user) {
                      return `${user.nome} (${user.email})`;
                    }
                  }
                  // Se vier direto na denúncia, usa
                  if (denuncia.denunciante_nome && denuncia.denunciante_email) {
                    return `${denuncia.denunciante_nome} (${denuncia.denunciante_email})`;
                  }
                  return "Desconhecido";
                })()}
              </Text>

              <Text style={styles.cardText}>
                📅 Data:{" "}
                {new Date(denuncia.criada_em).toLocaleDateString("pt-BR", {
                  day: "2-digit",
                  month: "2-digit",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </Text>

              {denuncia.latitude && denuncia.longitude && (
                <View>
                  <Text style={styles.cardText}>
                    🌍 Localização: {parseFloat(denuncia.latitude).toFixed(6)},{" "}
                    {parseFloat(denuncia.longitude).toFixed(6)}
                  </Text>
                  <TouchableOpacity
                    style={{
                      ...styles.button,
                      backgroundColor: "#2563eb",
                      alignSelf: "flex-start",
                      marginTop: 4,
                      marginBottom: 8,
                    }}
                    onPress={() => {
                      if (onSelectMarcador) {
                        // Busca o marcador correspondente na lista de marcadores
                        const marcador = marcadores.find(
                          (m) =>
                            m.latitude &&
                            m.longitude &&
                            parseFloat(m.latitude).toFixed(6) ===
                              parseFloat(denuncia.latitude).toFixed(6) &&
                            parseFloat(m.longitude).toFixed(6) ===
                              parseFloat(denuncia.longitude).toFixed(6)
                        );
                        if (marcador) {
                          onSelectMarcador(marcador);
                          if (onClose) onClose();
                        } else {
                          Alert.alert(
                            "Marcador não encontrado",
                            "Não foi possível localizar o marcador desta denúncia no mapa."
                          );
                        }
                      }
                    }}
                  >
                    <Text style={{ color: "white", fontWeight: "bold" }}>
                      Ver no mapa
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>

            {/* Descrição da denúncia */}
            {denuncia.descricao && (
              <View
                style={{
                  backgroundColor: "#FEF3C7",
                  borderRadius: 8,
                  padding: 12,
                  marginVertical: 8,
                  borderWidth: 1,
                  borderColor: "#F59E0B",
                }}
              >
                <Text
                  style={{
                    fontSize: 13,
                    fontWeight: "600",
                    color: "#92400E",
                    marginBottom: 4,
                  }}
                >
                  💬 Descrição adicional:
                </Text>
                <Text
                  style={{
                    fontSize: 13,
                    color: "#92400E",
                    lineHeight: 18,
                  }}
                >
                  {denuncia.descricao}
                </Text>
              </View>
            )}

            {/* Informações do marcador denunciado */}
            {denuncia.marcador_descricao && (
              <View
                style={{
                  backgroundColor: "#F1F5F9",
                  borderRadius: 8,
                  padding: 12,
                  marginVertical: 8,
                  borderWidth: 1,
                  borderColor: "#E2E8F0",
                }}
              >
                <Text
                  style={{
                    fontSize: 13,
                    fontWeight: "600",
                    color: "#334155",
                    marginBottom: 4,
                  }}
                >
                  📝 Descrição do marcador:
                </Text>
                <Text
                  style={{
                    fontSize: 13,
                    color: "#64748B",
                    lineHeight: 18,
                  }}
                >
                  {denuncia.marcador_descricao}
                </Text>
              </View>
            )}

            {/* Botões de ação melhorados */}
            <View
              style={{
                ...styles.cardActions,
                marginTop: 16,
                paddingTop: 16,
                borderTopWidth: 1,
                borderTopColor: "#F3F4F6",
                flexWrap: 'wrap',
                gap: 8,
              }}
            >
              {/* Botão Ver no mapa, se houver marcador associado */}
              {(denuncia.marcador_id || (denuncia.latitude && denuncia.longitude)) && (
                <TouchableOpacity
                  style={[
                    styles.button,
                    { backgroundColor: '#2563eb', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16 }
                  ]}
                  onPress={async () => {
                    if (onSelectMarcador) {
                      let marcador = null;
                      if (denuncia.marcador_id) {
                        marcador = marcadores.find((m) => m.id === denuncia.marcador_id);
                        if (!marcador) {
                          // Buscar do backend se não estiver na lista local
                          try {
                            const resp = await fetch(`http://localhost:3001/lugares`);
                            if (resp.ok) {
                              const todos = await resp.json();
                              marcador = todos.find((m) => m.id === denuncia.marcador_id);
                            }
                          } catch (e) {
                            // erro ao buscar
                          }
                        }
                      }
                      if (!marcador && denuncia.latitude && denuncia.longitude) {
                        marcador = marcadores.find(
                          (m) =>
                            m.latitude &&
                            m.longitude &&
                            parseFloat(m.latitude).toFixed(6) === parseFloat(denuncia.latitude).toFixed(6) &&
                            parseFloat(m.longitude).toFixed(6) === parseFloat(denuncia.longitude).toFixed(6)
                        );
                      }
                      if (marcador) {
                        onSelectMarcador(marcador);
                        if (onClose) onClose();
                      } else {
                        Alert.alert(
                          'Marcador não encontrado',
                          'Não foi possível localizar o marcador desta denúncia no mapa.'
                        );
                      }
                    }
                  }}
                >
                  <Text style={{ ...styles.buttonText, marginRight: 6 }}>🗺️</Text>
                  <Text style={styles.buttonText}>Ver no mapa</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={{
                  ...styles.button,
                  backgroundColor: "#059669",
                  flexDirection: "row",
                  alignItems: "center",
                  paddingHorizontal: 16,
                }}
                onPress={() => processarDenuncia(denuncia.id, "aceitar")}
              >
                <Text style={{ ...styles.buttonText, marginRight: 6 }}>✅</Text>
                <Text style={styles.buttonText}>Aceitar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={{
                  ...styles.button,
                  backgroundColor: "#DC2626",
                  flexDirection: "row",
                  alignItems: "center",
                  paddingHorizontal: 16,
                }}
                onPress={() => {
                  setDenunciaSelected(denuncia);
                  setObservacoes("");
                }}
              >
                <Text style={{ ...styles.buttonText, marginRight: 6 }}>❌</Text>
                <Text style={styles.buttonText}>Rejeitar</Text>
              </TouchableOpacity>
              {/* Modal para rejeitar denúncia */}
              <Modal
                visible={!!denunciaSelected}
                transparent
                animationType="fade"
                onRequestClose={() => setDenunciaSelected(null)}
              >
                <View style={styles.modalOverlay}>
                  <View style={styles.modalContent}>
                    <Text style={styles.modalTitle}>Rejeitar Denúncia</Text>
                    <TextInput
                      style={styles.textArea}
                      placeholder="Motivo/observação da rejeição (opcional)"
                      value={observacoes}
                      onChangeText={setObservacoes}
                      multiline
                      numberOfLines={4}
                    />
                    <View style={styles.modalActions}>
                      <TouchableOpacity
                        style={[styles.button, styles.buttonSecondary]}
                        onPress={() => {
                          setDenunciaSelected(null);
                          setObservacoes("");
                        }}
                      >
                        <Text style={styles.buttonText}>Cancelar</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.button, styles.buttonDanger]}
                        onPress={() => {
                          if (!denunciaSelected) return;
                          processarDenuncia(
                            denunciaSelected.id,
                            "rejeitar",
                            observacoes
                          );
                        }}
                      >
                        <Text style={styles.buttonText}>Rejeitar</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              </Modal>
            </View>
          </View>
        ))}

        {/* Estado vazio melhorado */}
        {denunciasPendentes.length === 0 && (
          <View
            style={{
              ...styles.emptyState,
              backgroundColor: "#F0FDF4",
              borderWidth: 1,
              borderColor: "#BBF7D0",
              borderRadius: 12,
              padding: 24,
              marginTop: 20,
            }}
          >
            <Text
              style={{
                fontSize: 48,
                marginBottom: 12,
              }}
            >
              ✅
            </Text>
            <Text
              style={{
                ...styles.emptyText,
                color: "#059669",
                fontWeight: "600",
                marginBottom: 8,
              }}
            >
              Tudo em ordem!
            </Text>
            <Text
              style={{
                ...styles.emptyText,
                color: "#065F46",
                fontSize: 14,
              }}
            >
              Não há denúncias pendentes no momento.
            </Text>
          </View>
        )}
      </ScrollView>
    );
  };

  const renderAreas = () => (
    <ScrollView
      style={styles.tabContent}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {usuario.tipo === "admin" && (
        <>
          <Text style={styles.sectionTitle}>
            Áreas Pendentes de Aprovação ({areasPendentes.length})
          </Text>

          {areasPendentes.map((area) => (
            <TouchableOpacity
              key={area.id}
              style={styles.card}
              activeOpacity={0.85}
              onPress={() => {
                if (onSelectArea) {
                  onSelectArea(area);
                  onClose && onClose();
                } else {
                  setAreaSelected(area);
                  setModalAreaVisible(true);
                }
              }}
            >
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>{area.nome}</Text>
                <View style={[styles.badge, styles.badgePending]}>
                  <Text style={styles.badgeText}>Pendente</Text>
                </View>
              </View>
              <Text style={styles.cardText}>ONG: {area.ong_nome}</Text>
              <Text style={styles.cardText}>Descrição: {area.descricao}</Text>
              <Text style={styles.cardText}>
                Criada em: {new Date(area.criada_em).toLocaleDateString()}
              </Text>
              <View style={styles.cardActions}>
                {area.status === "pendente" && (
                  <TouchableOpacity
                    style={[styles.button, styles.buttonSuccess]}
                    onPress={async () => {
                      await aprovarArea(area.id);
                      await carregarAreas();
                    }}
                  >
                    <Text style={styles.buttonText}>Aprovar</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  style={[styles.button, styles.buttonDanger]}
                  onPress={() => {
                    setAreaSelected(area);
                    setModalAreaVisible(false); // Fecha o modal de detalhes, se aberto
                  }}
                >
                  <Text style={styles.buttonText}>Rejeitar</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          ))}
        </>
      )}

      <Text style={styles.sectionTitle}>
        Todas as Áreas (
        {
          todasAreas.filter(
            (area) =>
              (area.status || "").toLowerCase().replace(/\s/g, "") !==
              "pendente"
          ).length
        }
        )
      </Text>

      {todasAreas.filter(
        (area) =>
          (area.status || "").toLowerCase().replace(/\s/g, "") !== "pendente"
      ).length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>Nenhuma área encontrada</Text>
        </View>
      ) : (
        todasAreas
          .filter(
            (area) =>
              (area.status || "").toLowerCase().replace(/\s/g, "") !==
              "pendente"
          )
          .map((area) => (
            <TouchableOpacity
              key={area.id}
              style={styles.card}
              activeOpacity={0.85}
              onPress={() => {
                setAreaSelected(area);
                setModalAreaVisible(true);
                if (onSelectArea) {
                  onSelectArea(area);
                  onClose && onClose();
                }
              }}
            >
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>{area.nome}</Text>
                <View
                  style={[
                    styles.badge,
                    area.status === "aprovada"
                      ? styles.badgeSuccess
                      : area.status === "rejeitada"
                      ? styles.badgeDanger
                      : styles.badgePending,
                  ]}
                >
                  <Text style={styles.badgeText}>
                    {area.status === "aprovada"
                      ? "Aprovada"
                      : area.status === "rejeitada"
                      ? "Rejeitada"
                      : "Pendente"}
                  </Text>
                </View>
              </View>
              <Text style={styles.cardText}>ONG: {area.ong_nome}</Text>
              <Text style={styles.cardText}>Descrição: {area.descricao}</Text>
              {area.status === "rejeitada" && area.motivo_rejeicao && (
                <Text style={styles.cardTextDanger}>
                  Motivo da rejeição: {area.motivo_rejeicao}
                </Text>
              )}
              {(usuario.tipo === "admin" ||
                (usuario.tipo === "ong" && area.ong_id === usuario.id)) && (
                <View style={styles.cardActions}>
                  <TouchableOpacity
                    style={[styles.button, styles.buttonDanger]}
                    onPress={() => excluirArea(area.id)}
                  >
                    <Text style={styles.buttonText}>Excluir</Text>
                  </TouchableOpacity>
                </View>
              )}
            </TouchableOpacity>
          ))
      )}
      {/* Modal de detalhes da área removido */}
    </ScrollView>
  );

  const renderMarcadores = () => {
    const filtrados = marcadores.filter((m) => {
      if (filtroTipo && filtroTipo !== 'Todos' && m.tipo !== filtroTipo) return false;
      if (filtroResolvido === 'sim' && !m.resolvido) return false;
      if (filtroResolvido === 'nao' && m.resolvido) return false;
      if (filtroDataInicio) {
        const dataCriado = new Date(m.criado_em);
        const dataInicio = new Date(filtroDataInicio);
        if (dataCriado < dataInicio) return false;
      }
      if (filtroDataFim) {
        const dataCriado = new Date(m.criado_em);
        const dataFim = new Date(filtroDataFim);
        if (dataCriado > dataFim) return false;
      }
      return true;
    });
    return (
      <ScrollView
        style={styles.tabContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <Text style={styles.sectionTitle}>
          Marcadores {usuario.tipo === "ong" ? "na sua área" : "no sistema"} ({filtrados.length})
        </Text>
        {/* Filtros */}
        <View style={{
          marginBottom: 18,
          backgroundColor: '#fff',
          borderRadius: 12,
          padding: 16,
          borderWidth: 1,
          borderColor: '#e5e7eb',
          flexDirection: 'row',
          flexWrap: 'wrap',
          gap: 16,
          alignItems: 'center',
          boxShadow: Platform.OS === 'web' ? '0 2px 8px rgba(0,0,0,0.06)' : undefined,
        }}>
          {/* Tipo */}
          <View style={{ flex: 1, minWidth: 120 }}>
            <Text style={{ fontSize: 13, color: '#374151', marginBottom: 4, fontWeight: 'bold', letterSpacing: 0.2 }}>Tipo</Text>
            {Platform.OS === 'web' ? (
              <select
                value={filtroTipo}
                onChange={e => setFiltroTipo(e.target.value)}
                style={{
                  height: 38,
                  width: '100%',
                  borderRadius: 8,
                  border: '1px solid #d1d5db',
                  padding: '0 12px',
                  fontSize: 15,
                  backgroundColor: '#f9fafb',
                  color: '#222',
                  marginBottom: 0,
                  outline: 'none',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
                  transition: 'border 0.2s, box-shadow 0.2s',
                  cursor: 'pointer',
                }}
                onFocus={e => e.target.style.border = '1.5px solid #2563eb'}
                onBlur={e => e.target.style.border = '1px solid #d1d5db'}
              >
                <option value="Todos">Todos</option>
                <option value="lixo">Lixo</option>
                <option value="buraco">Buraco</option>
                <option value="iluminacao">Iluminação</option>
                <option value="outro">Outro</option>
              </select>
            ) : (
              <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap', marginBottom: 0 }}>
                {[{ value: 'Todos', label: 'Todos' }, { value: 'lixo', label: 'Lixo' }, { value: 'buraco', label: 'Buraco' }, { value: 'iluminacao', label: 'Iluminação' }, { value: 'outro', label: 'Outro' }].map(opt => (
                  <TouchableOpacity
                    key={opt.value}
                    onPress={() => setFiltroTipo(opt.value)}
                    style={{
                      backgroundColor: filtroTipo === opt.value ? '#2563eb' : '#f3f4f6',
                      borderRadius: 8,
                      paddingHorizontal: 12,
                      paddingVertical: 7,
                      marginRight: 0,
                      marginBottom: 4,
                      borderWidth: filtroTipo === opt.value ? 1.5 : 1,
                      borderColor: filtroTipo === opt.value ? '#2563eb' : '#d1d5db',
                      shadowColor: filtroTipo === opt.value ? '#2563eb' : undefined,
                      shadowOpacity: filtroTipo === opt.value ? 0.12 : 0,
                    }}
                  >
                    <Text style={{ color: filtroTipo === opt.value ? '#fff' : '#374151', fontWeight: filtroTipo === opt.value ? 'bold' : '500' }}>{opt.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
          {/* Status */}
          <View style={{ flexDirection: 'column', minWidth: 120 }}>
            <Text style={{ fontSize: 13, color: '#374151', marginBottom: 4, fontWeight: 'bold', letterSpacing: 0.2 }}>Status</Text>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <TouchableOpacity onPress={() => setFiltroResolvido('')} style={{
                backgroundColor: filtroResolvido === '' ? '#2563eb' : '#f3f4f6',
                borderRadius: 8, paddingHorizontal: 12, paddingVertical: 7, marginRight: 0,
                borderWidth: filtroResolvido === '' ? 1.5 : 1,
                borderColor: filtroResolvido === '' ? '#2563eb' : '#d1d5db',
              }}>
                <Text style={{ color: filtroResolvido === '' ? '#fff' : '#374151', fontWeight: filtroResolvido === '' ? 'bold' : '500' }}>Todos</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setFiltroResolvido('sim')} style={{
                backgroundColor: filtroResolvido === 'sim' ? '#059669' : '#f3f4f6',
                borderRadius: 8, paddingHorizontal: 12, paddingVertical: 7, marginRight: 0,
                borderWidth: filtroResolvido === 'sim' ? 1.5 : 1,
                borderColor: filtroResolvido === 'sim' ? '#059669' : '#d1d5db',
              }}>
                <Text style={{ color: filtroResolvido === 'sim' ? '#fff' : '#374151', fontWeight: filtroResolvido === 'sim' ? 'bold' : '500' }}>Resolvido</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setFiltroResolvido('nao')} style={{
                backgroundColor: filtroResolvido === 'nao' ? '#f59e0b' : '#f3f4f6',
                borderRadius: 8, paddingHorizontal: 12, paddingVertical: 7, marginRight: 0,
                borderWidth: filtroResolvido === 'nao' ? 1.5 : 1,
                borderColor: filtroResolvido === 'nao' ? '#f59e0b' : '#d1d5db',
              }}>
                <Text style={{ color: filtroResolvido === 'nao' ? '#fff' : '#374151', fontWeight: filtroResolvido === 'nao' ? 'bold' : '500' }}>Pendente</Text>
              </TouchableOpacity>
            </View>
          </View>
          {/* Data início */}
          <View style={{ flex: 1, minWidth: 120 }}>
            <Text style={{ fontSize: 13, color: '#374151', marginBottom: 4, fontWeight: 'bold', letterSpacing: 0.2 }}>Data inicial</Text>
            {Platform.OS === 'web' ? (
              <input
                type="date"
                value={filtroDataInicio}
                onChange={e => setFiltroDataInicio(e.target.value)}
                style={{
                  padding: '0 12px',
                  fontSize: 15,
                  border: '1px solid #d1d5db',
                  borderRadius: 8,
                  backgroundColor: '#f9fafb',
                  width: '100%',
                  marginBottom: 0,
                  height: 38,
                  outline: 'none',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
                  transition: 'border 0.2s, box-shadow 0.2s',
                }}
                onFocus={e => e.target.style.border = '1.5px solid #2563eb'}
                onBlur={e => e.target.style.border = '1px solid #d1d5db'}
              />
            ) : (
              <TextInput
                placeholder="AAAA-MM-DD"
                value={filtroDataInicio}
                onChangeText={setFiltroDataInicio}
                style={{ paddingHorizontal: 12, fontSize: 15, borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8, backgroundColor: '#f9fafb', width: '100%', marginBottom: 0, height: 38 }}
                keyboardType="numeric"
              />
            )}
          </View>
          {/* Data fim */}
          <View style={{ flex: 1, minWidth: 120 }}>
            <Text style={{ fontSize: 13, color: '#374151', marginBottom: 4, fontWeight: 'bold', letterSpacing: 0.2 }}>Data final</Text>
            {Platform.OS === 'web' ? (
              <input
                type="date"
                value={filtroDataFim}
                onChange={e => setFiltroDataFim(e.target.value)}
                style={{
                  padding: '0 12px',
                  fontSize: 15,
                  border: '1px solid #d1d5db',
                  borderRadius: 8,
                  backgroundColor: '#f9fafb',
                  width: '100%',
                  marginBottom: 0,
                  height: 38,
                  outline: 'none',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
                  transition: 'border 0.2s, box-shadow 0.2s',
                }}
                onFocus={e => e.target.style.border = '1.5px solid #2563eb'}
                onBlur={e => e.target.style.border = '1px solid #d1d5db'}
              />
            ) : (
              <TextInput
                placeholder="AAAA-MM-DD"
                value={filtroDataFim}
                onChangeText={setFiltroDataFim}
                style={{ paddingHorizontal: 12, fontSize: 15, borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8, backgroundColor: '#f9fafb', width: '100%', marginBottom: 0, height: 38 }}
                keyboardType="numeric"
              />
            )}
          </View>
        </View>
        {filtrados.map((marcador) => (
          <TouchableOpacity
            key={marcador.id}
            style={styles.card}
            activeOpacity={0.85}
            onPress={() => {
              if (onSelectMarcador) {
                onSelectMarcador(marcador);
                onClose();
              } else {
                setMarcadorSelected(marcador);
              }
            }}
          >
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>{marcador.nome}</Text>
              <View
                style={[
                  styles.badge,
                  marcador.resolvido ? styles.badgeSuccess : styles.badgeWarning,
                ]}
              >
                <Text style={styles.badgeText}>
                  {marcador.resolvido ? "Resolvido" : "Pendente"}
                </Text>
              </View>
            </View>
            <Text style={styles.cardText}>Tipo: {marcador.tipo}</Text>
            <Text style={styles.cardText}>Descrição: {marcador.descricao}</Text>
            <Text style={styles.cardText}>
              Localização:{" "}
              {typeof marcador.latitude === "number" &&
              typeof marcador.longitude === "number"
                ? `${marcador.latitude.toFixed(6)}, ${marcador.longitude.toFixed(
                    6
                  )}`
                : `${marcador.latitude || "N/A"}, ${marcador.longitude || "N/A"}`}
            </Text>
            <Text style={styles.cardText}>
              Criado em: {new Date(marcador.criado_em).toLocaleDateString()}
            </Text>
            {marcador.resolvido && marcador.resolvido_em && (
              <Text style={styles.cardTextSuccess}>
                Resolvido em:{" "}
                {new Date(marcador.resolvido_em).toLocaleDateString()}
              </Text>
            )}
            <View style={styles.cardActions}>
              <TouchableOpacity
                style={[
                  styles.button,
                  marcador.resolvido
                    ? styles.buttonWarning
                    : styles.buttonSuccess,
                ]}
                onPress={() =>
                  marcarComoResolvido(marcador.id, !marcador.resolvido)
                }
              >
                <Text style={styles.buttonText}>
                  {marcador.resolvido ? "Reabrir" : "Resolver"}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.buttonDanger]}
                onPress={() => excluirMarcador(marcador.id)}
              >
                <Text style={styles.buttonText}>Excluir</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        ))}

        {filtrados.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>Nenhum marcador encontrado</Text>
          </View>
        )}
      </ScrollView>
    );
  };

  const renderTabButtons = () => {
    const denunciasPendentes = denuncias.filter(
      (d) => d.status === "pendente"
    ).length;

    return (
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === "denuncias" && styles.activeTab]}
          onPress={() => setActiveTab("denuncias")}
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              position: "relative",
            }}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === "denuncias" && styles.activeTabText,
              ]}
            >
              Denúncias
            </Text>
            {denunciasPendentes > 0 && (
              <View
                style={{
                  backgroundColor: "#DC2626",
                  borderRadius: 10,
                  paddingHorizontal: 6,
                  paddingVertical: 2,
                  marginLeft: 8,
                  minWidth: 20,
                  alignItems: "center",
                }}
              >
                <Text
                  style={{
                    color: "#FFFFFF",
                    fontSize: 11,
                    fontWeight: "700",
                  }}
                >
                  {denunciasPendentes > 99 ? "99+" : denunciasPendentes}
                </Text>
              </View>
            )}
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === "areas" && styles.activeTab]}
          onPress={() => setActiveTab("areas")}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "areas" && styles.activeTabText,
            ]}
          >
            Áreas
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === "marcadores" && styles.activeTab]}
          onPress={() => setActiveTab("marcadores")}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "marcadores" && styles.activeTabText,
            ]}
          >
            Marcadores
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  if (!usuario || (usuario.tipo !== "admin" && usuario.tipo !== "ong")) {
    return null;
  }
  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: "#f8fafc" }}>
        <View style={styles.header}>
          <Text style={styles.title}>Painel Administrativo</Text>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>×</Text>
          </TouchableOpacity>
        </View>
        <ScrollView
          style={styles.container}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          {renderTabButtons()}
          <View style={styles.content}>
            {activeTab === "denuncias" && renderDenuncias()}
            {activeTab === "areas" && (
              <>{usuario.tipo === "ong" ? renderAreasONG() : renderAreas()}</>
            )}
            {activeTab === "marcadores" && renderMarcadores()}
          </View>
        </ScrollView>
      </View>
      {/* Modal para rejeitar área */}
      <Modal
        visible={areaSelected !== null && !modalAreaVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setAreaSelected(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Rejeitar Área</Text>
            <TextInput
              style={styles.textArea}
              placeholder="Motivo da rejeição *"
              value={motivoRejeicao}
              onChangeText={setMotivoRejeicao}
              multiline
              numberOfLines={4}
            />
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.button, styles.buttonSecondary]}
                onPress={() => {
                  setAreaSelected(null);
                  setMotivoRejeicao("");
                }}
              >
                <Text style={styles.buttonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.buttonDanger]}
                onPress={() => rejeitarArea(areaSelected.id)}
              >
                <Text style={styles.buttonText}>Rejeitar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {marcadorSelected && (
        <Modal
          visible={!!marcadorSelected}
          transparent
          animationType="fade"
          onRequestClose={() => setMarcadorSelected(null)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Detalhes do Marcador</Text>
              <Text style={styles.cardText}>
                <Text style={{ fontWeight: "bold" }}>Nome:</Text>{" "}
                {marcadorSelected.nome}
              </Text>
              <Text style={styles.cardText}>
                <Text style={{ fontWeight: "bold" }}>Tipo:</Text>{" "}
                {marcadorSelected.tipo}
              </Text>
              <Text style={styles.cardText}>
                <Text style={{ fontWeight: "bold" }}>Descrição:</Text>{" "}
                {marcadorSelected.descricao}
              </Text>
              <Text style={styles.cardText}>
                <Text style={{ fontWeight: "bold" }}>Localização:</Text>{" "}
                {typeof marcadorSelected.latitude === "number" &&
                typeof marcadorSelected.longitude === "number"
                  ? `${marcadorSelected.latitude.toFixed(
                      6
                    )}, ${marcadorSelected.longitude.toFixed(6)}`
                  : `${marcadorSelected.latitude || "N/A"}, ${
                      marcadorSelected.longitude || "N/A"
                    }`}
              </Text>
              <Text style={styles.cardText}>
                <Text style={{ fontWeight: "bold" }}>Criado em:</Text>{" "}
                {new Date(marcadorSelected.criado_em).toLocaleDateString()}
              </Text>
              {marcadorSelected.resolvido && marcadorSelected.resolvido_em && (
                <Text style={styles.cardTextSuccess}>
                  <Text style={{ fontWeight: "bold" }}>Resolvido em:</Text>{" "}
                  {new Date(marcadorSelected.resolvido_em).toLocaleDateString()}
                </Text>
              )}
              <TouchableOpacity
                style={[
                  styles.button,
                  styles.buttonSecondary,
                  { marginTop: 16 },
                ]}
                onPress={() => setMarcadorSelected(null)}
              >
                <Text style={styles.buttonText}>Fechar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}
      {loading && (
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingContent}>
            <Text style={styles.loadingText}>Carregando...</Text>
          </View>
        </View>
      )}
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#2E7D32",
    paddingTop: 50,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: "white",
  },
  closeButton: {
    padding: 8,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 20,
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  closeButtonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },
  tabContainer: {
    flexDirection: "row",
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: "center",
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: "#2E7D32",
  },
  tabText: {
    fontSize: 16,
    color: "#6b7280",
  },
  activeTabText: {
    color: "#2E7D32",
    fontWeight: "bold",
  },
  content: {
    flex: 1,
  },
  tabContent: {
    flex: 1,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1f2937",
    marginBottom: 16,
  },
  card: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#1f2937",
    flex: 1,
    marginRight: 8,
  },
  cardText: {
    fontSize: 14,
    color: "#6b7280",
    marginBottom: 6,
  },
  cardTextSuccess: {
    fontSize: 14,
    color: "#10b981",
    marginBottom: 6,
  },
  cardTextDanger: {
    fontSize: 14,
    color: "#ef4444",
    marginBottom: 6,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgePending: {
    backgroundColor: "#fef3c7",
  },
  badgeSuccess: {
    backgroundColor: "#d1fae5",
  },
  badgeDanger: {
    backgroundColor: "#fecaca",
  },
  badgeWarning: {
    backgroundColor: "#fed7aa",
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#1f2937",
  },
  cardActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 12,
    gap: 8,
  },
  button: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: {
    color: "white",
    fontSize: 14,
    fontWeight: "bold",
  },
  buttonSuccess: {
    backgroundColor: "#10b981",
  },
  buttonDanger: {
    backgroundColor: "#ef4444",
  },
  buttonWarning: {
    backgroundColor: "#f59e0b",
  },
  buttonSecondary: {
    backgroundColor: "#6b7280",
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    color: "#6b7280",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center",
    justifyContent: "center",
  },
  modalContent: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 20,
    width: width * 0.9,
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1f2937",
    marginBottom: 16,
  },
  textArea: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    textAlignVertical: "top",
    minHeight: 100,
    marginBottom: 16,
  },
  modalActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 12,
  },
  loadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center",
    justifyContent: "center",
  },
  loadingContent: {
    backgroundColor: "white",
    borderRadius: 8,
    padding: 20,
  },
  loadingText: {
    fontSize: 16,
    color: "#1f2937",
  },
});
export default AdminDashboard;
