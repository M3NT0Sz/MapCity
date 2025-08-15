// Corrige datas do MySQL para formato ISO
// Corrige datas do MySQL para formato ISO e lida com datas inválidas
function parseMySQLDate(dateStr) {
  if (!dateStr) return null;
  // Se já for ISO ou timestamp
  if (typeof dateStr === "string" && dateStr.includes("T")) {
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? null : d;
  }
  // Se vier no formato MySQL "YYYY-MM-DD HH:mm:ss"
  if (
    typeof dateStr === "string" &&
    dateStr.match(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}/)
  ) {
    const iso = dateStr.replace(" ", "T") + "Z";
    const d = new Date(iso);
    return isNaN(d.getTime()) ? null : d;
  }
  // Tenta criar Date diretamente
  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? null : d;
}
import { lugaresAPI, areasAPI, uploadAPI, usuariosAPI as userAPI } from "./api";
import adminAreasAPI from "./AdminAreasAPI";
import AdminDashboard from "./AdminDashboard";
import { Platform, Modal, ScrollView, TextInput, Alert } from "react-native";
import React, { useState, useCallback } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { useAuth } from "./AuthComponents";
const modernTheme = {
  colors: {
    primary: "#2E7D32",
    secondary: "#1976D2",
    success: "#10B981",
    warning: "#F59E0B",
    danger: "#EF4444",
    background: "#F8FAFC",
    surface: "#FFFFFF",
    border: "#E2E8F0",
    text: "#1F2937",
    textSecondary: "#6B7280",
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
  },
  borderRadius: {
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,
  },
  shadows: {
    sm: "0 2px 4px rgba(0,0,0,0.1)",
    md: "0 4px 12px rgba(0,0,0,0.15)",
    lg: "0 8px 25px rgba(0,0,0,0.2)",
  },
};

// Tipos de problemas disponíveis
const PROBLEM_TYPES = [
  { value: "lixo", label: "Lixo na Rua", emoji: "🗑️" },
  { value: "buraco", label: "Buraco", emoji: "🕳️" },
  { value: "iluminacao", label: "Iluminação", emoji: "💡" },
  { value: "outro", label: "Outro", emoji: "❗" },
];

// Componente simples do mapa usando Leaflet
function SimpleMapView({
  onMapClick,
  onMarkerClick,
  markers,
  areas = [],
  areaPoints = [],
  areaDrawingMode = false,
}) {
  const mapRef = React.useRef(null);
  const [mapLoaded, setMapLoaded] = React.useState(false);
  const [isInitializing, setIsInitializing] = React.useState(false);
  const onMapClickRef = React.useRef(onMapClick);

  // Update the ref whenever onMapClick changes
  React.useEffect(() => {
    onMapClickRef.current = onMapClick;
  }, [onMapClick]);

  React.useEffect(() => {
    // ...log removido...

    // Carrega CSS do Leaflet primeiro
    if (!document.querySelector('link[href*="leaflet"]')) {
      const cssLink = document.createElement("link");
      cssLink.rel = "stylesheet";
      cssLink.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      document.head.appendChild(cssLink);
      // ...log removido...
    }

    // JS do Leaflet
    if (!mapRef.current) {
      // ...erro removido...
      return;
    }
    if (window.L) {
      // ...log removido...
      initMap();
    } else {
      // ...log removido...
      const script = document.createElement("script");
      script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
      script.onload = () => {
        // ...log removido...
        initMap();
      };
      script.onerror = () => {};
      document.head.appendChild(script);
      return;
    }
    function initMap() {
      if (!mapRef.current) {
        // ...erro removido...
        return;
      }
      if (!window.L) {
        // ...erro removido...
        return;
      }

      if (isInitializing) {
        // ...log removido...
        return;
      }

      setIsInitializing(true);

      // Verificar se já existe um mapa no container
      if (window.mapInstance) {
        // ...log removido...
        try {
          window.mapInstance.remove();
          window.mapInstance = null;
        } catch (e) {
          console.warn("Erro ao remover mapa existente:", e);
        }
      }

      // Limpar o container se necessário
      if (mapRef.current._leaflet_id) {
        // ...log removido...
        delete mapRef.current._leaflet_id;
      }

      // ...log removido...
      try {
        const map = window.L.map(mapRef.current).setView(
          [-22.1207, -51.3889],
          13
        );
        window.L.tileLayer(
          "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
          {
            attribution: "© OpenStreetMap contributors",
          }
        ).addTo(map);
        map.on("click", function (e) {
          if (
            e.originalEvent &&
            e.originalEvent.target &&
            (e.originalEvent.target.closest(".leaflet-marker-icon") ||
              e.originalEvent.target.closest("path"))
          ) {
            // ...log removido...
            return;
          }
          const { lat, lng } = e.latlng;

          // Validar coordenadas do clique
          if (
            typeof lat !== "number" ||
            typeof lng !== "number" ||
            isNaN(lat) ||
            isNaN(lng) ||
            lat < -90 ||
            lat > 90 ||
            lng < -180 ||
            lng > 180
          ) {
            // ...erro removido...
            return;
          }

          // ...log removido...
          onMapClickRef.current(lat, lng);
        });
        const style = document.createElement("style");
        style.textContent = `
          .custom-popup .leaflet-popup-content-wrapper {
            padding: 0;
            border-radius: 12px;
            box-shadow: 0 8px 25px rgba(0,0,0,0.15);
          }
          .custom-popup .leaflet-popup-content {
            margin: 0;
            padding: 0;
          }
          .custom-popup .leaflet-popup-tip {
            background: white;
            border: none;
          }
          .custom-popup button:hover {
            opacity: 0.9;
            transform: translateY(-1px);
          }
        `;
        document.head.appendChild(style);
        setMapLoaded(true);
        // ...log removido...
        window.mapInstance = map;
        window.markersAdded = new Set();
        setIsInitializing(false);
      } catch (error) {
        // ...erro removido...
        setIsInitializing(false);
      }
    }
    // Se o Leaflet já está carregado, inicializa o mapa
    if (window.L) {
      initMap();
    }

    // Cleanup function
    return () => {
      if (window.mapInstance) {
        // ...log removido...
        try {
          window.mapInstance.remove();
          window.mapInstance = null;
          setMapLoaded(false);
          setIsInitializing(false);
        } catch (e) {
          console.warn("Erro ao limpar mapa no cleanup:", e);
        }
      }
    };
  }, []); // Removed onMapClick dependency to prevent unnecessary map reinitialization

  // Adiciona marcadores
  React.useEffect(() => {
    if (!mapLoaded || !window.mapInstance) return;

    // ...log removido...

    // Limpa todos os marcadores existentes
    window.mapInstance.eachLayer((layer) => {
      if (
        layer instanceof window.L.CircleMarker ||
        layer instanceof window.L.Marker
      ) {
        if (layer.options.isCustomMarker) {
          window.mapInstance.removeLayer(layer);
        }
      }
    });

    // Reseta o conjunto de marcadores adicionados
    window.markersAdded = new Set();

    markers.forEach((marker) => {
      // Validar coordenadas antes de criar o marcador
      if (
        !marker ||
        typeof marker.lat !== "number" ||
        typeof marker.lng !== "number" ||
        isNaN(marker.lat) ||
        isNaN(marker.lng) ||
        marker.lat < -90 ||
        marker.lat > 90 ||
        marker.lng < -180 ||
        marker.lng > 180
      ) {
        // ...erro removido...
        return; // Pula este marcador
      }

      // Cores por tipo
      const colors = {
        lixo: "#27ae60", // Verde - Lixo
        buraco: "#f39c12", // Laranja - Buraco
        iluminacao: "#3498db", // Azul - Iluminação
        outro: "#9b59b6", // Roxo - Outro
      };

      try {
        // Cria marcador base
        const leafletMarker = window.L.circleMarker([marker.lat, marker.lng], {
          color: "white",
          fillColor: colors[marker.type] || "red",
          fillOpacity: marker.resolved ? 0.4 : 0.8,
          weight: 3,
          radius: 15,
          isCustomMarker: true, // Flag para identificar nossos marcadores
          pane: "markerPane", // Garantir que está no pane correto
          zIndexOffset: 1000, // Z-index alto para ficar por cima das áreas
          interactive: true, // Garantir que é interativo
          bubblingMouseEvents: false, // Evita bubbling de eventos
        }).addTo(window.mapInstance);

        // Adiciona símbolo de check se resolvido
        if (marker.resolved) {
          // Verificar novamente as coordenadas antes de criar o check marker
          if (
            typeof marker.lat === "number" &&
            typeof marker.lng === "number" &&
            !isNaN(marker.lat) &&
            !isNaN(marker.lng)
          ) {
            const checkIcon = window.L.divIcon({
              html: `
                <div style="
                  background: #10B981;
                  color: white;
                  border-radius: 50%;
                  width: 20px;
                  height: 20px;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  font-size: 12px;
                  font-weight: bold;
                  border: 2px solid white;
                  box-shadow: 0 2px 4px rgba(0,0,0,0.3);
                ">✓</div>
              `,
              className: "resolved-marker",
              iconSize: [20, 20],
              iconAnchor: [10, 10],
            });

            const checkMarker = window.L.marker([marker.lat, marker.lng], {
              icon: checkIcon,
              isCustomMarker: true,
              pane: "markerPane",
              zIndexOffset: 1100, // Z-index ainda maior para o check
              interactive: true,
              bubblingMouseEvents: false,
            }).addTo(window.mapInstance);

            // Adiciona clique ao ícone de check também (PRIORIDADE MÁXIMA)
            checkMarker.on("click", (e) => {
              if (e.originalEvent) {
                e.originalEvent.stopPropagation();
                e.originalEvent.stopImmediatePropagation();
                e.originalEvent.preventDefault();
              }
              console.log("🖱️ CHECK CLICADO - PRIORIDADE MÁXIMA:", marker.id);
              onMarkerClick(marker);
              return false;
            });

            // Overlay para o check marker também
            const checkElement = checkMarker.getElement();
            if (checkElement && Platform.OS === "web") {
              const checkOverlay = document.createElement("div");
              checkOverlay.style.position = "absolute";
              checkOverlay.style.top = "-10px";
              checkOverlay.style.left = "-10px";
              checkOverlay.style.width = "calc(100% + 20px)";
              checkOverlay.style.height = "calc(100% + 20px)";
              checkOverlay.style.cursor = "pointer";
              checkOverlay.style.zIndex = "9999";
              checkOverlay.style.backgroundColor = "transparent";

              checkOverlay.addEventListener(
                "click",
                (e) => {
                  e.stopPropagation();
                  e.stopImmediatePropagation();
                  e.preventDefault();
                  console.log("🖱️ CHECK OVERLAY CLICADO:", marker.id);
                  onMarkerClick(marker);
                  return false;
                },
                true
              );

              checkElement.style.position = "relative";
              checkElement.appendChild(checkOverlay);
            }

            // Fallback com mousedown
            checkMarker.on("mousedown", (e) => {
              if (e.originalEvent) {
                e.originalEvent.stopPropagation();
                e.originalEvent.stopImmediatePropagation();
              }
              console.log("🖱️ Mousedown no ícone de resolvido:", marker.id);
            });

            // Popup para marcador resolvido
            checkMarker.bindPopup(`
              <div style="text-align: center; padding: 8px;">
                <strong>✅ Problema Resolvido</strong><br>
                <small>Clique para ver detalhes</small>
              </div>
            `);
          }
        }

        // Clique no marcador abre modal (PRIORIDADE MÁXIMA)
        leafletMarker.on("click", (e) => {
          // Tratamento correto para eventos do Leaflet
          if (e.originalEvent) {
            e.originalEvent.stopPropagation();
            e.originalEvent.stopImmediatePropagation();
            e.originalEvent.preventDefault();
          }

          console.log("🖱️ MARCADOR CLICADO - PRIORIDADE MÁXIMA:", marker.id);
          console.log("🖱️ Dados do marcador:", marker);

          // Executar imediatamente
          onMarkerClick(marker);

          return false; // Garantir que não propague
        });

        // SOLUÇÃO ALTERNATIVA: Adicionar div overlay invisível para capturar cliques
        const markerElement = leafletMarker.getElement();
        if (markerElement && Platform.OS === "web") {
          // Criar overlay clicável
          const clickOverlay = document.createElement("div");
          clickOverlay.style.position = "absolute";
          clickOverlay.style.top = "-10px";
          clickOverlay.style.left = "-10px";
          clickOverlay.style.width = "calc(100% + 20px)";
          clickOverlay.style.height = "calc(100% + 20px)";
          clickOverlay.style.cursor = "pointer";
          clickOverlay.style.zIndex = "9999";
          clickOverlay.style.backgroundColor = "transparent";
          clickOverlay.style.borderRadius = "50%";

          clickOverlay.addEventListener(
            "click",
            (e) => {
              e.stopPropagation();
              e.stopImmediatePropagation();
              e.preventDefault();
              console.log("🖱️ OVERLAY CLICADO - PRIORIDADE MÁXIMA:", marker.id);
              onMarkerClick(marker);
              return false;
            },
            true
          );

          clickOverlay.addEventListener(
            "mousedown",
            (e) => {
              e.stopPropagation();
              e.stopImmediatePropagation();
              console.log("🖱️ OVERLAY MOUSEDOWN:", marker.id);
            },
            true
          );

          markerElement.style.position = "relative";
          markerElement.appendChild(clickOverlay);
        }

        // Evento de mousedown como fallback
        leafletMarker.on("mousedown", (e) => {
          if (e.originalEvent) {
            e.originalEvent.stopPropagation();
            e.originalEvent.stopImmediatePropagation();
          }
          console.log("🖱️ Mousedown no marcador:", marker.id);
        });

        // Adicionar popup como fallback visual
        // Removido: não adicionar popup ao marcador

        window.markersAdded.add(marker.id);
        console.log(
          "Marcador adicionado/atualizado:",
          marker.id,
          "Resolvido:",
          marker.resolved
        );
      } catch (error) {
        console.error("Erro ao adicionar marcador:", error);
        console.error("Dados do marcador problemático:", {
          id: marker?.id,
          lat: marker?.lat,
          lng: marker?.lng,
          type: marker?.type,
          latType: typeof marker?.lat,
          lngType: typeof marker?.lng,
          isLatNaN: isNaN(marker?.lat),
          isLngNaN: isNaN(marker?.lng),
        });
      }
    });
  }, [markers, mapLoaded, onMarkerClick]);

  // Desenhar áreas das ONGs
  React.useEffect(() => {
    if (!mapLoaded || !window.mapInstance) return;

    console.log("Atualizando áreas:", areas.length);

    // Limpar áreas existentes
    window.mapInstance.eachLayer((layer) => {
      if (layer.options && layer.options.isAreaLayer) {
        window.mapInstance.removeLayer(layer);
      }
    });

    // Desenhar áreas
    areas.forEach((area) => {
      try {
        // Parse coordenadas se estiver como string JSON
        let coordenadas = area.coordenadas;
        if (typeof coordenadas === "string") {
          try {
            coordenadas = JSON.parse(coordenadas);
          } catch (e) {
            console.error("Erro ao parsear coordenadas da área:", e);
            return;
          }
        }

        if (
          coordenadas &&
          Array.isArray(coordenadas) &&
          coordenadas.length >= 3
        ) {
          // Validar coordenadas da área
          const validCoords = coordenadas.filter(
            (coord) =>
              coord &&
              typeof coord.lat === "number" &&
              typeof coord.lng === "number" &&
              !isNaN(coord.lat) &&
              !isNaN(coord.lng) &&
              coord.lat >= -90 &&
              coord.lat <= 90 &&
              coord.lng >= -180 &&
              coord.lng <= 180
          );

          if (validCoords.length >= 3) {
            const latlngs = validCoords.map((coord) => [coord.lat, coord.lng]);

            // Definir cores baseadas no status da área
            let areaColors = {
              color: "#3B82F6", // Azul para aprovadas
              fillColor: "#3B82F6",
              fillOpacity: 0.2,
            };

            // Cores diferentes para cada status
            switch (area.status) {
              case "pendente":
                areaColors = {
                  color: "#F59E0B", // Amarelo/laranja para pendentes
                  fillColor: "#F59E0B",
                  fillOpacity: 0.3,
                };
                break;
              case "rejeitada":
                areaColors = {
                  color: "#EF4444", // Vermelho para rejeitadas
                  fillColor: "#EF4444",
                  fillOpacity: 0.15,
                };
                break;
              case "aprovada":
              default:
                areaColors = {
                  color: "#10B981", // Verde para aprovadas
                  fillColor: "#10B981",
                  fillOpacity: 0.2,
                };
                break;
            }

            const polygon = window.L.polygon(latlngs, {
              ...areaColors,
              weight: 2,
              isAreaLayer: true,
              areaStatus: area.status || "aprovada",
              pane: "overlayPane", // Usar pane de overlay (menor prioridade que markers)
              interactive: area.status !== "aprovada", // Só áreas não aprovadas são interativas
              bubblingMouseEvents: true, // Permitir bubbling para não interferir nos marcadores
            }).addTo(window.mapInstance);

            // Para áreas aprovadas, adicionar evento de clique que permite criação de marcadores
            if (area.status === "aprovada") {
              polygon.on("click", function (e) {
                // Repassar o evento para o mapa como se fosse um clique normal
                if (window.mapInstance && onMapClick) {
                  onMapClick(e);
                }
              });
            }

            // Popup com informações da área incluindo status
            const statusText = {
              pendente: "⏳ Aguardando Aprovação",
              aprovada: "✅ Aprovada",
              rejeitada: "❌ Rejeitada",
            };

            polygon.bindPopup(`
              <div class="custom-popup">
                <h3>${area.nome}</h3>
                <p><strong>ONG:</strong> ${area.ong_nome || "Não informado"}</p>
                <p><strong>Status:</strong> ${
                  statusText[area.status] || "✅ Aprovada"
                }</p>
                <p><strong>Criada em:</strong> ${new Date(
                  area.criada_em
                ).toLocaleDateString()}</p>
                ${
                  area.status === "aprovada" && area.data_aprovacao
                    ? `<p><strong>Aprovada em:</strong> ${new Date(
                        area.data_aprovacao
                      ).toLocaleDateString()}</p>`
                    : ""
                }
                ${
                  area.status === "rejeitada" && area.motivo_rejeicao
                    ? `<p><strong>Motivo da rejeição:</strong> ${area.motivo_rejeicao}</p>`
                    : ""
                }
                ${
                  area.descricao
                    ? `<p><strong>Descrição:</strong> ${area.descricao}</p>`
                    : ""
                }
              </div>
            `);
          } else {
            console.error(
              "Área com coordenadas insuficientes após validação:",
              area.nome,
              validCoords.length
            );
          }
        }
      } catch (error) {
        console.error("Erro ao desenhar área:", error, area);
      }
    });
  }, [areas, mapLoaded]);

  // Desenhar pontos da área em criação
  React.useEffect(() => {
    if (!mapLoaded || !window.mapInstance) return;

    // Limpar pontos de desenho existentes
    window.mapInstance.eachLayer((layer) => {
      if (layer.options && layer.options.isDrawingPoint) {
        window.mapInstance.removeLayer(layer);
      }
    });

    if (areaDrawingMode && areaPoints.length > 0) {
      console.log("Desenhando pontos da área:", areaPoints.length);

      // Desenhar pontos
      areaPoints.forEach((point, index) => {
        // Validar coordenadas do ponto
        if (
          !point ||
          typeof point.lat !== "number" ||
          typeof point.lng !== "number" ||
          isNaN(point.lat) ||
          isNaN(point.lng) ||
          point.lat < -90 ||
          point.lat > 90 ||
          point.lng < -180 ||
          point.lng > 180
        ) {
          console.error(
            "Ponto de área com coordenadas inválidas ignorado:",
            point
          );
          return; // Pula este ponto
        }

        window.L.circleMarker([point.lat, point.lng], {
          radius: 6,
          color: "#F59E0B",
          fillColor: "#F59E0B",
          fillOpacity: 0.8,
          weight: 2,
          isDrawingPoint: true,
        })
          .addTo(window.mapInstance)
          .bindPopup(`Ponto ${index + 1}`);
      });

      // Desenhar linha conectando os pontos se tiver mais de 1
      if (areaPoints.length > 1) {
        const latlngs = areaPoints.map((point) => [point.lat, point.lng]);

        window.L.polyline(latlngs, {
          color: "#F59E0B",
          weight: 3,
          opacity: 0.8,
          isDrawingPoint: true,
        }).addTo(window.mapInstance);

        // Se tiver 3 ou mais pontos, mostrar prévia do polígono
        if (areaPoints.length >= 3) {
          window.L.polygon(latlngs, {
            color: "#F59E0B",
            fillColor: "#F59E0B",
            fillOpacity: 0.2,
            weight: 2,
            dashArray: "5, 5",
            isDrawingPoint: true,
          }).addTo(window.mapInstance);
        }
      }
    }
  }, [areaPoints, areaDrawingMode, mapLoaded]);

  if (Platform.OS !== "web") {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <Text>Mapa disponível apenas na web</Text>
      </View>
    );
  }

  return (
    <div
      style={{
        width: "100vw",
        height: "100vh",
        position: "fixed",
        top: 0,
        left: 0,
        zIndex: 1000,
        backgroundColor: "#f0f0f0",
      }}
    >
      <div
        ref={el => {
          mapRef.current = el;
        }}
        style={{
          width: "100%",
          height: "100%",
          backgroundColor: "#e0e0e0",
          border: "2px solid red",
        }}
      />
      <div
        style={{
          position: "absolute",
          top: 10,
          left: 10,
          background: "white",
          padding: "10px",
          borderRadius: "5px",
          fontSize: "14px",
          zIndex: 1001,
        }}
      >
        Status: {mapLoaded ? "Mapa Carregado" : "Carregando..."}
        <br />
        Leaflet: {typeof window.L !== "undefined" ? "OK" : "Não carregado"}
        <br />
        MapRef: {mapRef.current ? "OK" : "Null"}
      </div>
    </div>
  );
}

// Componente principal
export default function MapCityMap() {
  // Estado para expandir/retrair filtros
  const [filtrosAbertos, setFiltrosAbertos] = useState(true);

  // Estado dos marcadores deve vir antes do filtro
  const [markers, setMarkers] = useState([]);


  // Filtros para marcadores no mapa
  const [filtroTipo, setFiltroTipo] = useState('Todos');
  const [filtroResolvido, setFiltroResolvido] = useState(''); // '', 'sim', 'nao'
  const [filtroDataInicio, setFiltroDataInicio] = useState('');
  const [filtroDataFim, setFiltroDataFim] = useState('');

  // Filtra os marcadores conforme filtros selecionados
  const marcadoresFiltrados = markers.filter((m) => {
    if (filtroTipo && filtroTipo !== 'Todos' && m.type !== filtroTipo) return false;
    if (filtroResolvido === 'sim' && !m.resolved) return false;
    if (filtroResolvido === 'nao' && m.resolved) return false;
    if (filtroDataInicio) {
      const dataCriado = new Date(m.createdAt || m.criado_em);
      const dataInicio = new Date(filtroDataInicio);
      if (dataCriado < dataInicio) return false;
    }
    if (filtroDataFim) {
      const dataCriado = new Date(m.createdAt || m.criado_em);
      const dataFim = new Date(filtroDataFim);
      if (dataCriado > dataFim) return false;
    }
    return true;
  });

  // Lista de usuários para busca de nome da ONG pelo ong_id

  // Estado para erro de imagem no carrossel
  const [imageError, setImageError] = useState(false);
  const { usuario, token, estaLogado, logout } = useAuth();

  React.useEffect(() => {
    if (estaLogado && usuario) {
      // Usuário logado
    }
  }, [estaLogado, usuario]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isViewModalVisible, setIsViewModalVisible] = useState(false);
  const [clickPosition, setClickPosition] = useState(null);
  const [selectedMarker, setSelectedMarker] = useState(null);
  const [problemType, setProblemType] = useState("");
  const [description, setDescription] = useState("");
  const [selectedImages, setSelectedImages] = useState([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [modalMotivoVisible, setModalMotivoVisible] = useState(false);
  const [motivoArea, setMotivoArea] = useState("");
  const [finalizarAreaPending, setFinalizarAreaPending] = useState(false);

  const confirmarCadastroArea = async () => {
    if (!motivoArea.trim()) {
      Alert.alert(
        "Informe o motivo",
        "Por favor, descreva o motivo do pedido da área."
      );
      return;
    }
    setFinalizarAreaPending(true);
    try {
      const novaArea = {
        nome: `Área ${new Date().toLocaleDateString()}`,
        coordenadas: areaPoints,
        ong_id: usuario.id,
        descricao: motivoArea.trim(),
      };
      await areasAPI.criarArea(novaArea);
      Alert.alert("Sucesso", "Área de responsabilidade criada com sucesso!");
      setAreaDrawingMode(false);
      setAreaPoints([]);
      setMotivoArea("");
      setModalMotivoVisible(false);
      await carregarAreas(); // Atualiza o estado das áreas sem recarregar a página
    } catch (error) {
      console.error("❌ Erro ao criar área:", error);
      Alert.alert("Erro", "Não foi possível criar a área de responsabilidade.");
    } finally {
      setFinalizarAreaPending(false);
    }
  };

  // Resetar erro de imagem ao trocar de imagem no carrossel
  React.useEffect(() => {
    setImageError(false);
  }, [currentImageIndex, selectedMarker]);
  const [markerAddress, setMarkerAddress] = useState("");
  const [addressServiceFailed, setAddressServiceFailed] = useState(false);
  const [clickAddress, setClickAddress] = useState("");

  // Estados para áreas de responsabilidade (ONGs)
  const [areas, setAreas] = useState([]);
  const [isAreaModalVisible, setIsAreaModalVisible] = useState(false);
  const [areaDrawingMode, setAreaDrawingMode] = useState(false);
  const [areaPoints, setAreaPoints] = useState([]);
  const [areaName, setAreaName] = useState("");
  const [areaDescription, setAreaDescription] = useState("");
  const [notificacoes, setNotificacoes] = useState([]);
  const [showNotificacoes, setShowNotificacoes] = useState(false);
  const [isNotificationModalVisible, setIsNotificationModalVisible] =
    useState(false);
  const [isAdminDashboardVisible, setIsAdminDashboardVisible] = useState(false);
  const [areaParaExcluir, setAreaParaExcluir] = useState(null);
  const [marcadorParaExcluir, setMarcadorParaExcluir] = useState(null);

  // Permitir acesso ao mapa para visitantes, mas restringir ações

  // Função auxiliar para gerar endereço de fallback
  const generateFallbackAddress = (lat, lng) => {
    // Determina região aproximada baseada nas coordenadas
    let region = "Localização Desconhecida";

    // Coordenadas aproximadas do Brasil
    if (lat >= -35 && lat <= 5 && lng >= -75 && lng <= -30) {
      region = "Brasil";

      // Regiões aproximadas
      if (lat >= -15 && lng >= -50) {
        region = "Região Central do Brasil";
      } else if (lat >= -25 && lat <= -15) {
        region = "Região Sudeste do Brasil";
      } else if (lat <= -25) {
        region = "Região Sul do Brasil";
      } else if (lat >= -10) {
        region = "Região Norte/Nordeste do Brasil";
      }
    }

    return `${region} (${lat.toFixed(4)}, ${lng.toFixed(4)})`;
  };

  // Função auxiliar para formatar endereço do Nominatim
  const formatAddressFromNominatim = (address) => {
    let formattedAddress = "";

    // Prioriza: Rua + Número, depois Bairro, depois Cidade
    const road =
      address.road || address.pedestrian || address.footway || address.cycleway;
    const houseNumber = address.house_number;
    const suburb =
      address.suburb ||
      address.neighbourhood ||
      address.city_district ||
      address.quarter;
    const city =
      address.city || address.town || address.village || address.municipality;

    if (road) {
      formattedAddress = road;
      if (houseNumber) {
        formattedAddress += `, ${houseNumber}`;
      }
      if (suburb && suburb !== road) {
        formattedAddress += ` - ${suburb}`;
      }
    } else if (suburb) {
      formattedAddress = suburb;
      if (city && city !== suburb) {
        formattedAddress += ` - ${city}`;
      }
    } else if (city) {
      formattedAddress = city;
    } else {
      // Fallback para display_name
      formattedAddress = "Local não identificado";
    }

    return formattedAddress.trim() || "Endereço não encontrado";
  };

  // Função para buscar endereço baseado nas coordenadas
  const getAddressFromCoords = async (lat, lng, retryCount = 0) => {
    // Validar parâmetros de entrada
    if (
      typeof lat !== "number" ||
      typeof lng !== "number" ||
      isNaN(lat) ||
      isNaN(lng)
    ) {
      console.warn("Coordenadas inválidas:", { lat, lng });
      return "Coordenadas inválidas";
    }

    // Se o serviço já falhou antes, usar fallback imediatamente
    if (addressServiceFailed) {
      console.log("Serviço de endereços desabilitado, usando fallback");
      return generateFallbackAddress(lat, lng);
    }

    // Se já tentou 2 vezes, usar fallback e marcar serviço como falho
    if (retryCount >= 2) {
      console.warn(
        "Limite de tentativas excedido, desabilitando serviço de endereços"
      );
      setAddressServiceFailed(true);
      return generateFallbackAddress(lat, lng);
    }

    try {
      // Adicionar timeout e headers para melhor compatibilidade
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 segundos timeout

      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&accept-language=pt-BR&zoom=18`,
        {
          signal: controller.signal,
          headers: {
            "User-Agent": "MapCity/1.0",
            Accept: "application/json",
          },
          mode: "no-cors", // Tentar no-cors first para evitar CORS issues em desenvolvimento
        }
      );

      clearTimeout(timeoutId);

      // Se no-cors retornar opaque response, tente cors
      if (response.type === "opaque") {
        console.warn("Resposta opaca recebida, tentando com CORS...");
        const corsResponse = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&accept-language=pt-BR&zoom=18`,
          {
            headers: {
              "User-Agent": "MapCity/1.0",
              Accept: "application/json",
            },
            mode: "cors",
          }
        );

        if (!corsResponse.ok) {
          throw new Error(`Erro HTTP CORS: ${corsResponse.status}`);
        }

        const data = await corsResponse.json();
        if (data && data.address) {
          return formatAddressFromNominatim(data.address);
        }
      } else {
        if (!response.ok) {
          throw new Error(`Erro HTTP: ${response.status}`);
        }

        const data = await response.json();
        if (data && data.address) {
          return formatAddressFromNominatim(data.address);
        }
      }
    } catch (error) {
      console.error(
        `Erro ao buscar endereço (tentativa ${retryCount + 1}):`,
        error
      );

      // Tratamento específico para diferentes tipos de erro
      if (error.name === "AbortError") {
        console.warn(
          "Busca de endereço cancelada por timeout - tentando novamente"
        );
        return getAddressFromCoords(lat, lng, retryCount + 1);
      } else if (
        error.message.includes("Failed to fetch") ||
        error.message.includes("NetworkError")
      ) {
        console.warn(
          "Problema de rede ao buscar endereço - tentando novamente"
        );
        // Esperar um pouco antes de tentar novamente
        await new Promise((resolve) =>
          setTimeout(resolve, 1000 * (retryCount + 1))
        );
        return getAddressFromCoords(lat, lng, retryCount + 1);
      } else {
        // Para outros erros, usar fallback imediatamente
        console.warn("Erro desconhecido, usando fallback");
        return generateFallbackAddress(lat, lng);
      }
    }
  };

  // Busca endereço quando um marcador é selecionado
  React.useEffect(() => {
    if (
      selectedMarker &&
      typeof selectedMarker.lat === "number" &&
      typeof selectedMarker.lng === "number" &&
      !isNaN(selectedMarker.lat) &&
      !isNaN(selectedMarker.lng)
    ) {
      getAddressFromCoords(selectedMarker.lat, selectedMarker.lng).then(
        (address) => setMarkerAddress(address)
      );
    } else if (selectedMarker) {
      console.warn(
        "Marcador selecionado com coordenadas inválidas:",
        selectedMarker
      );
      setMarkerAddress("Coordenadas inválidas");
    }
  }, [selectedMarker]);

  // Busca endereço quando uma posição é clicada para novo marcador
  React.useEffect(() => {
    if (
      clickPosition &&
      typeof clickPosition.lat === "number" &&
      typeof clickPosition.lng === "number" &&
      !isNaN(clickPosition.lat) &&
      !isNaN(clickPosition.lng)
    ) {
      getAddressFromCoords(clickPosition.lat, clickPosition.lng).then(
        (address) => setClickAddress(address)
      );
    } else if (clickPosition) {
      console.warn("Posição clicada com coordenadas inválidas:", clickPosition);
      setClickAddress("Coordenadas inválidas");
    }
  }, [clickPosition]);

  // Buscar marcadores do backend ao carregar
  React.useEffect(() => {
    const carregarLugares = async () => {
      try {
        const { testarConectividade } = await import("./api");
        const conectado = await testarConectividade();
        if (!conectado) throw new Error("Servidor não está respondendo");
        const data = await lugaresAPI.buscarTodos();
        console.log("📍 Dados recebidos do backend:", data);
        const adaptados = data
          .map((lugar) => {
            let images = [];
            if (lugar.imagem) {
              try {
                if (typeof lugar.imagem === "string") {
                  const imagemTrimmed = lugar.imagem.trim();
                  if (imagemTrimmed === "") {
                    images = [];
                  } else {
                    const parsed = JSON.parse(imagemTrimmed);
                    images = Array.isArray(parsed) ? parsed : [];
                  }
                } else if (Array.isArray(lugar.imagem)) {
                  images = lugar.imagem;
                } else {
                  const imagemString = String(lugar.imagem);
                  const parsed = JSON.parse(imagemString);
                  images = Array.isArray(parsed) ? parsed : [];
                }
              } catch (e) {
                images = [];
              }
            }
            const lat = parseFloat(lugar.latitude);
            const lng = parseFloat(lugar.longitude);
            if (
              isNaN(lat) ||
              isNaN(lng) ||
              !isFinite(lat) ||
              !isFinite(lng) ||
              lat < -90 ||
              lat > 90 ||
              lng < -180 ||
              lng > 180 ||
              lugar.latitude === null ||
              lugar.latitude === undefined ||
              lugar.longitude === null ||
              lugar.longitude === undefined
            ) {
              return null;
            }
            return {
              id: lugar.id,
              lat: lat,
              lng: lng,
              type: lugar.tipo || "outro",
              description: lugar.descricao || lugar.nome,
              images: images,
              resolved: !!lugar.resolvido,
              resolvedAt: lugar.resolvido_em || null,
              area_ong_id: lugar.area_ong_id || null,
              area_ong_nome: lugar.area_ong_nome || null,
              area_ong_email: lugar.area_ong_email || null,
            };
          })
          .filter((lugar) => lugar !== null);
        setMarkers(adaptados);
      } catch (error) {
        console.error("❌ Erro ao buscar lugares:", error);
      }
    };

    const carregarAreasPublicas = async () => {
      try {
        const data = await areasAPI.buscarAreasAprovadas();
        setAreas(data);
      } catch (error) {
        console.error("❌ Erro ao carregar áreas públicas:", error);
      }
    };

    // Sempre carregar marcadores e áreas públicas
    carregarLugares();
    carregarAreasPublicas();

    // Se logado, carregar áreas privadas e notificações
    if (estaLogado) {
      if (usuario) {
        carregarAreas();
        if (usuario.tipo === "ong") {
          carregarNotificacoes();
        }
      }
    }
  }, [estaLogado, usuario]);

  // Carregar áreas de responsabilidade para todos os usuários
  const carregarAreas = useCallback(async () => {
    if (!usuario) return;

    try {
      if (usuario.tipo === "ong") {
        // Buscar todas as áreas (aprovadas de todas as ONGs e pendentes só da própria)
        const todas = await areasAPI.buscarAreas();
        // Filtrar: áreas aprovadas de qualquer ONG + áreas pendentes só da ONG logada
        const areasFiltradas = (
          Array.isArray(todas) ? todas : todas.areas || []
        ).filter((area) => {
          const status = (area.status || "").toLowerCase().trim();
          if (status === "aprovada") return true;
          if (
            status === "pendente" &&
            String(area.ong_id) === String(usuario.id)
          )
            return true;
          return false;
        });
        setAreas(areasFiltradas);
      } else if (usuario.tipo === "admin") {
        const data = await adminAreasAPI.buscarTodasAreas();
        const areasArray = data.areas || [];
        // Log detalhado para debug
        console.log(
          "[ADMIN] Áreas recebidas do backend:",
          areasArray.map((a) => ({ id: a.id, nome: a.nome, status: a.status }))
        );
        // Exibir apenas áreas aprovadas e pendentes para admin (remover rejeitadas do mapa)
        const areasVisiveis = areasArray.filter((area) => {
          const status = (area.status || "").toLowerCase().trim();
          return status === "aprovada" || status === "pendente";
        });
        console.log(
          "[ADMIN] Áreas visíveis no mapa:",
          areasVisiveis.map((a) => ({
            id: a.id,
            nome: a.nome,
            status: a.status,
          }))
        );
        setAreas(areasVisiveis);
      } else if (usuario.tipo === "usuario") {
        // Usuários comuns usam endpoint público para áreas aprovadas
        const data = await areasAPI.buscarAreasAprovadas();
        setAreas(data);
      }
    } catch (error) {
      console.error("❌ Erro ao carregar áreas:", error);

      // Verificar se é erro de autenticação
      if (
        error.message.includes("Token") ||
        error.message.includes("401") ||
        error.message.includes("Sessão expirada")
      ) {
        console.warn("🔐 Problema de autenticação detectado ao carregar áreas");
        Alert.alert(
          "Sessão Expirada",
          "Sua sessão expirou. Por favor, faça login novamente.",
          [{ text: "OK", onPress: () => logout() }]
        );
      } else {
        console.warn("⚠️ Falha ao carregar áreas, continuando sem elas");
        // Não mostrar alert para áreas pois não é crítico para o funcionamento básico
      }
    }
  }, [usuario]);

  // Carregar notificações para ONGs
  const carregarNotificacoes = useCallback(async () => {
    if (!usuario || usuario.tipo !== "ong") return;
    try {
      console.log("🔔 Carregando notificações para ONG:", usuario.id);
      const data = await areasAPI.buscarNotificacoes(usuario.id);
      setNotificacoes(data);
    } catch (error) {
      console.error("❌ Erro ao carregar notificações:", error);
    }
  }, [usuario]);

  // Atualizar notificações sempre que o modal for aberto
  React.useEffect(() => {
    if (isNotificationModalVisible) {
      carregarNotificacoes();
    }
  }, [isNotificationModalVisible, carregarNotificacoes]);

  // Carregar denúncias para ONGs (apenas das suas áreas)
  const [denuncias, setDenuncias] = useState([]);
  const carregarDenuncias = useCallback(async () => {
    if (!usuario || usuario.tipo !== "ong") return;
    try {
      // Busca todas as denúncias (backend já filtra por ong_id se suportado)
      const response = await import("./api");
      const { denunciasAPI } = response;
      const todasDenuncias = await denunciasAPI.listarDenuncias(
        usuario.token,
        usuario.id
      );
      // Filtra no frontend: só denúncias de marcadores dentro das áreas da ONG
      const areaIds = areas.map((a) => a.id);
      const denunciasFiltradas = todasDenuncias.filter((denuncia) => {
        // O backend pode já filtrar, mas garantimos aqui
        // denuncia.area_id ou denuncia.marcador.area_ong_id
        if (denuncia.marcador && denuncia.marcador.area_ong_id) {
          return areaIds.includes(denuncia.marcador.area_ong_id);
        }
        return false;
      });
      setDenuncias(denunciasFiltradas);
    } catch (error) {
      console.error("❌ Erro ao carregar denúncias:", error);
    }
  }, [usuario, areas]);

  // Atualizar denúncias sempre que áreas ou usuário mudarem
  React.useEffect(() => {
    if (usuario && usuario.tipo === "ong") {
      carregarDenuncias();
    }
  }, [usuario, areas, carregarDenuncias]);

  // ========= FUNÇÕES DE ÁREA PARA ONGS =========

  // Iniciar criação de área
  const iniciarCriacaoArea = () => {
    setAreaDrawingMode(true);
    setAreaPoints([]);
    Alert.alert(
      "Marcar Área de Responsabilidade",
      "Clique no mapa para marcar os pontos da sua área de responsabilidade. Clique no primeiro ponto novamente para finalizar."
    );
  };

  // Cancelar criação de área
  const cancelarCriacaoArea = () => {
    setAreaDrawingMode(false);
    setAreaPoints([]);
  };

  // Finalizar criação de área: agora só abre o modal
  const finalizarCriacaoArea = () => {
    if (areaPoints.length < 3) {
      Alert.alert(
        "Erro",
        "É necessário marcar pelo menos 3 pontos para criar uma área."
      );
      return;
    }
    setModalMotivoVisible(true);
  };

  // Função para ONG excluir sua própria área
  const excluirAreaOng = useCallback(
    async (areaId, areaNome) => {
      console.log("🎭 Tipo de usuário:", usuario?.tipo);

      // Encontrar a área para mostrar no modal
      const area = areas.find((a) => a.id === areaId);
      if (area) {
        setAreaParaExcluir(area);
      } else {
        console.error("❌ Área não encontrada:", areaId);
      }
    },
    [usuario, areas]
  );

  const confirmarExclusaoArea = async () => {
    if (!areaParaExcluir) return;

    try {
      console.log("📤 ONG chamando API para excluir área:", areaParaExcluir.id);
      const result = await areasAPI.excluirArea(areaParaExcluir.id);
      setAreaParaExcluir(null); // Fecha o modal antes do reload
      Alert.alert("Sucesso", "Área excluída com sucesso!");
      await carregarAreas(); // Atualiza o estado das áreas sem recarregar a página
    } catch (error) {
      console.error("❌ Erro da ONG ao excluir área:", error);
      console.error("❌ Stack trace:", error.stack);
      Alert.alert("Erro", `Não foi possível excluir a área: ${error.message}`);
    }
  };

  const excluirConta = async () => {
    Alert.alert(
      "Excluir Conta",
      `Tem certeza que deseja excluir sua conta permanentemente? ${
        usuario.tipo === "ong"
          ? "Todas as suas áreas de responsabilidade também serão excluídas."
          : ""
      } Esta ação não pode ser desfeita.`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Excluir Conta",
          style: "destructive",
          onPress: async () => {
            try {
              await userAPI.excluirConta();
              Alert.alert(
                "Conta Excluída",
                "Sua conta foi excluída com sucesso.",
                [
                  {
                    text: "OK",
                    onPress: () => {
                      // Fazer logout
                      logout();
                    },
                  },
                ]
              );
            } catch (error) {
              console.error("❌ Erro ao excluir conta:", error);
              Alert.alert("Erro", "Não foi possível excluir a conta.");
            }
          },
        },
      ]
    );
  };

  console.log("Renderizando componente. Marcadores:", markers.length);

  const handleMapClick = useCallback(
    (lat, lng) => {
      console.log("Clique recebido:", lat, lng);

      // Se estiver no modo de desenho de área, adicionar ponto
      if (areaDrawingMode && usuario && usuario.tipo === "ong") {
        const newPoint = { lat, lng };

        // Verificar se é o primeiro ponto sendo clicado novamente (fechar área)
        if (areaPoints.length >= 3) {
          const firstPoint = areaPoints[0];
          const distance = Math.sqrt(
            Math.pow(lat - firstPoint.lat, 2) +
              Math.pow(lng - firstPoint.lng, 2)
          );

          // Se clicar próximo ao primeiro ponto (tolerância de 0.001)
          if (distance < 0.001) {
            finalizarCriacaoArea();
            return;
          }
        }

        // Adicionar novo ponto
        setAreaPoints((prev) => [...prev, newPoint]);
        console.log(
          "📍 Ponto adicionado à área:",
          newPoint,
          "Total:",
          areaPoints.length + 1
        );
        return;
      }

      // Verificar se o usuário pode adicionar marcadores normais
      if (usuario.tipo === "admin") {
        Alert.alert(
          "Modo Administrador",
          "Como administrador, você pode visualizar e excluir marcadores, mas não criar novos.",
          [{ text: "OK" }]
        );
        return;
      }

      if (usuario.tipo === "usuario" || usuario.tipo === "ong") {
        setClickPosition({ lat, lng });
        setIsModalVisible(true);
      }
    },
    [usuario, areaDrawingMode, areaPoints, finalizarCriacaoArea]
  );

  // ========= FUNÇÕES UTILITÁRIAS =========

  // Função para verificar se um ponto está dentro de um polígono (Ray Casting Algorithm)
  const isPointInPolygon = useCallback((point, polygon) => {
    if (!polygon || polygon.length < 3) {
      return false;
    }

    const x = point.lat;
    const y = point.lng;
    let inside = false;

    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      const xi = polygon[i].lat;
      const yi = polygon[i].lng;
      const xj = polygon[j].lat;
      const yj = polygon[j].lng;

      if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) {
        inside = !inside;
      }
    }

    return inside;
  }, []);

  // Função para encontrar qual ONG é responsável por um ponto
  const findResponsibleONG = useCallback(
    (lat, lng) => {
      if (!areas || areas.length === 0) {
        return null;
      }

      const point = { lat: parseFloat(lat), lng: parseFloat(lng) };

      for (const area of areas) {
        if (area.coordenadas) {
          let polygon = [];

          try {
            // Verificar se coordenadas é string JSON
            if (typeof area.coordenadas === "string") {
              const coordenadas = JSON.parse(area.coordenadas);
              if (Array.isArray(coordenadas) && coordenadas.length >= 3) {
                polygon = coordenadas.map((coord) => ({
                  lat: parseFloat(coord.lat),
                  lng: parseFloat(coord.lng),
                }));
              }
            }
            // Verificar se coordenadas é array diretamente
            else if (
              Array.isArray(area.coordenadas) &&
              area.coordenadas.length >= 3
            ) {
              polygon = area.coordenadas.map((coord) => ({
                lat: parseFloat(coord.lat),
                lng: parseFloat(coord.lng),
              }));
            }

            // Se conseguiu criar o polígono, verificar se o ponto está dentro
            if (polygon.length >= 3 && isPointInPolygon(point, polygon)) {
              // Buscar nome da ONG pelo id do usuário se não houver area.ong_nome
              let resolvedOngNome = area.ong_nome || area.usuario_nome;
              let resolvedOngEmail = area.ong_email || area.usuario_email;
              if ((!resolvedOngNome || resolvedOngNome === 'null') && area.ong_id && Array.isArray(usuarios)) {
                const usuarioOng = usuarios.find(u => String(u.id) === String(area.ong_id));
                if (usuarioOng) {
                  resolvedOngNome = usuarioOng.nome;
                  resolvedOngEmail = usuarioOng.email;
                }
              }
              return {
                id: area.id,
                nome: area.nome,
                ongNome: resolvedOngNome || "ONG não identificada",
                ongEmail: resolvedOngEmail || "",
                status: area.status,
              };
            }
          } catch (error) {
            console.error(
              "❌ Erro ao processar coordenadas da área:",
              area.id,
              error
            );
          }
        }
      }

      return null;
    },
    [areas, isPointInPolygon]
  );

  // Ref para controlar se já atualizou os marcadores com informações da ONG
  const markersUpdatedRef = React.useRef(false);

  // Atualizar marcadores com informações da ONG quando as áreas são carregadas
  React.useEffect(() => {
    if (areas.length > 0 && !markersUpdatedRef.current) {
      markersUpdatedRef.current = true;

      setMarkers((prevMarkers) => {
        if (prevMarkers.length === 0) return prevMarkers;

        return prevMarkers.map((marker) => {
          // Se já tem informação da ONG, não precisa calcular
          if (marker.area_ong_nome) {
            return marker;
          }

          // Calcular qual ONG é responsável
          const ongResponsavel = findResponsibleONG(marker.lat, marker.lng);

          if (ongResponsavel) {
            console.log(
              `🏢 Marcador ${marker.id} está na área da ${ongResponsavel.ongNome}`
            );
            return {
              ...marker,
              area_ong_id: ongResponsavel.id,
              area_ong_nome: ongResponsavel.ongNome,
              area_ong_email: ongResponsavel.ongEmail,
            };
          }

          return marker;
        });
      });
    }
  }, [areas, findResponsibleONG]);

  // Reset do ref quando as áreas mudam significativamente
  React.useEffect(() => {
    markersUpdatedRef.current = false;
  }, [areas.length]);

  // Função para fazer upload das imagens
  const uploadImages = async (images) => {
    console.log(" Iniciando upload de", images?.length || 0, "imagens");

    if (!images || images.length === 0) {
      console.log("⚠️ Nenhuma imagem fornecida para upload");
      return [];
    }

    try {
      // Converter imagens para File objects
      const files = [];

      for (let i = 0; i < images.length; i++) {
        const image = images[i];
        console.log(
          `📁 Processando imagem ${i + 1}/${images.length}:`,
          image.id
        );

        try {
          // Determinar a URI da imagem
          let imageUri;
          if (image.uri) {
            imageUri = image.uri;
          } else if (image.data) {
            imageUri = image.data;
          } else {
            console.error("❌ Objeto image não tem uri nem data:", image);
            continue;
          }

          // Verificar se é data URL válida
          if (!imageUri.startsWith("data:")) {
            console.error(
              "❌ URI não é data URL válida:",
              imageUri.substring(0, 100)
            );
            continue;
          }

          // Separar o header do base64
          const [header, base64Data] = imageUri.split(",");
          if (!base64Data) {
            console.error("❌ Não foi possível separar base64");
            continue;
          }

          // Converter base64 para bytes
          const byteCharacters = atob(base64Data);
          const byteNumbers = new Array(byteCharacters.length);
          for (let j = 0; j < byteCharacters.length; j++) {
            byteNumbers[j] = byteCharacters.charCodeAt(j);
          }
          const byteArray = new Uint8Array(byteNumbers);

          // Detectar MIME type
          const mimeMatch = header.match(
            /data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+)/
          );
          const mimeType = mimeMatch ? mimeMatch[1] : "image/jpeg";

          // Criar File object
          const blob = new Blob([byteArray], { type: mimeType });
          const file = new File([blob], `image_${image.id}.jpg`, {
            type: mimeType,
          });

          files.push(file);
        } catch (error) {
          console.error("❌ Erro ao processar imagem", image.id, ":", error);
        }
      }

      if (files.length === 0) {
        console.log("⚠️ Nenhum arquivo válido para upload");
        return [];
      }

      // Usar a API autenticada para upload
      console.log("🌐 Enviando", files.length, "arquivos...");
      const result = await uploadAPI.enviarImagens(files);
      return result.images || [];
    } catch (error) {
      console.error("❌ Erro no upload:", error);
      Alert.alert("Erro", "Falha no upload das imagens");
      return [];
    }
  };

  const handleSubmit = useCallback(async () => {
    if (!problemType || !description || !clickPosition) {
      Alert.alert("Erro", "Por favor, preencha todos os campos obrigatórios.");
      return;
    }

    console.log(
      "🔐 Enviando marcador como:",
      usuario.email,
      "(",
      usuario.tipo,
      ")"
    );

    // Mapeia o tipo para um nome mais descritivo
    const nomesPorTipo = {
      lixo: "Problema de Lixo",
      buraco: "Buraco na Rua",
      iluminacao: "Problema de Iluminação",
      outro: "Outro Problema",
    };

    const nomeProblema = nomesPorTipo[problemType] || "Problema Reportado";

    try {
      // Primeiro, fazer upload das imagens se houver
      let imagePaths = [];

      if (selectedImages.length > 0) {
        console.log(
          "📤 Fazendo upload de",
          selectedImages.length,
          "imagem(s)..."
        );
        const uploadResult = await uploadImages(selectedImages);
        // Garante que imagePaths seja array de strings (paths)
        if (Array.isArray(uploadResult)) {
          imagePaths = uploadResult
            .map((img) =>
              typeof img === "object" && img.path ? img.path : img
            )
            .filter(Boolean);
        } else {
          imagePaths = [];
        }
      }

      // Verificar se o marcador está dentro de uma área de ONG
      const ongResponsavel = findResponsibleONG(
        clickPosition.lat,
        clickPosition.lng
      );

      // Usar API autenticada para criar lugar
      const dadosLugar = {
        nome: nomeProblema,
        descricao: description,
        tipo: problemType,
        latitude: clickPosition.lat,
        longitude: clickPosition.lng,
        imagem: imagePaths,
        // Só envia area_ong_id se for um usuário do tipo 'ong' e id válido
        area_ong_id:
          ongResponsavel &&
          typeof ongResponsavel.id === "number" &&
          ongResponsavel.id > 0 &&
          ongResponsavel.tipo === "ong"
            ? ongResponsavel.id
            : null,
        area_ong_nome: ongResponsavel?.ongNome || null,
        usuario_id: usuario?.id || null, // Adiciona o ID do usuário logado
      };
      console.log("🏢 ONG responsável:", ongResponsavel);
      const novoLugar = await lugaresAPI.criar(dadosLugar);

      // Adicionar à lista local
      setMarkers((prev) => [
        ...prev,
        {
          id: novoLugar.id,
          lat: clickPosition.lat,
          lng: clickPosition.lng,
          type: problemType,
          description: description,
          images: imagePaths,
          resolved: false,
          // Incluir informações da ONG no estado local
          area_ong_id: ongResponsavel?.id || null,
          area_ong_nome: ongResponsavel?.ongNome || null,
          area_ong_email: ongResponsavel?.ongEmail || null,
        },
      ]);

      Alert.alert("Sucesso", "Problema reportado com sucesso!");

      // Atualizar marcadores do mapa imediatamente após criar
      if (typeof carregarLugares === "function") {
        await carregarLugares();
      }

      // Atualizar notificações imediatamente após criar marcador
      if (typeof carregarNotificacoes === "function") {
        await carregarNotificacoes();
      }
    } catch (err) {
      console.error("❌ Erro ao salvar marcador:", err);
      Alert.alert("Erro", err.message || "Não foi possível salvar o marcador!");
    }

    // Reset
    setProblemType("");
    setDescription("");
    setSelectedImages([]);
    setIsModalVisible(false);
    setClickPosition(null);
    setClickAddress("");
  }, [problemType, description, clickPosition, selectedImages]);

  const closeModal = () => {
    setIsModalVisible(false);
    setProblemType("");
    setDescription("");
    setSelectedImages([]);
    setClickPosition(null);
    setClickAddress("");
  };

  // Função para redimensionar imagem
  const resizeImage = (
    file,
    maxWidth = 800,
    maxHeight = 600,
    quality = 0.8
  ) => {
    return new Promise((resolve) => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      const img = new Image();

      img.onload = () => {
        // Calcula nova dimensão mantendo proporção
        let { width, height } = img;

        if (width > maxWidth || height > maxHeight) {
          if (width > height) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          } else {
            width = (width * maxHeight) / height;
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;

        // Desenha imagem redimensionada
        ctx.drawImage(img, 0, 0, width, height);

        // Converte para base64 com qualidade reduzida
        const resizedDataUrl = canvas.toDataURL("image/jpeg", quality);
        resolve(resizedDataUrl);
      };

      img.src = URL.createObjectURL(file);
    });
  };

  const handleImageUpload = async (event) => {
    const files = Array.from(event.target.files);

    if (files.length === 0) return;

    // Limita a 5 imagens
    if (selectedImages.length + files.length > 5) {
      Alert.alert("Limite de imagens", "Máximo de 5 imagens por problema.");
      return;
    }

    for (const file of files) {
      try {
        // Redimensiona a imagem antes de adicionar
        const resizedImage = await resizeImage(file);

        setSelectedImages((prev) => [
          ...prev,
          {
            id: Date.now() + Math.random(),
            data: resizedImage,
            name: file.name,
          },
        ]);
      } catch (error) {
        console.error("Erro ao redimensionar imagem:", error);
        Alert.alert("Erro", "Não foi possível processar a imagem.");
      }
    }
  };

  const removeImage = (imageId) => {
    setSelectedImages((prev) => prev.filter((img) => img.id !== imageId));
  };

  const handleMarkerClick = useCallback((marker) => {
    if (!marker || typeof marker !== "object") {
      console.warn("Tentativa de clicar em marcador inválido:", marker);
      return;
    }
    console.log("🖱️ Marcador clicado - Iniciando handleMarkerClick");
    console.log("📍 Dados do marcador:", marker);
    console.log("🖼️ Imagens do marcador:", marker.images);
    console.log("🔧 Tipo das imagens:", typeof marker.images);
    try {
      setSelectedMarker(marker);
      setCurrentImageIndex(0);
      setIsViewModalVisible(true);
    } catch (error) {
      console.error("❌ Erro em handleMarkerClick:", error);
    }
  }, []);

  const handleMarkResolved = useCallback(async () => {
    if (!selectedMarker) {
      console.log("Nenhum marcador selecionado");
      return;
    }

    console.log(
      "🔐 Marcando como resolvido:",
      selectedMarker.id,
      "por",
      usuario.email
    );

    try {
      // Usar API autenticada para resolver
      await lugaresAPI.resolver(selectedMarker.id, true);

      // Atualizar no frontend
      setMarkers((prev) => {
        const updated = prev.map((marker) =>
          marker.id === selectedMarker.id
            ? {
                ...marker,
                resolved: true,
                resolvedAt: new Date().toISOString(),
              }
            : marker
        );
        return updated;
      });

      setIsViewModalVisible(false);
      setSelectedMarker(null);
      Alert.alert("Sucesso", "Problema marcado como resolvido!");
    } catch (error) {
      console.error("❌ Erro ao marcar como resolvido:", error);
      Alert.alert("Erro", "Não foi possível marcar como resolvido");
    }
  }, [selectedMarker, usuario]);

  // Função para deletar marcador (apenas admin)
  const handleDeleteMarker = useCallback(async () => {
    if (!selectedMarker) {
      console.log("Nenhum marcador selecionado");
      return;
    }

    if (usuario.tipo !== "admin") {
      Alert.alert("Erro", "Apenas administradores podem deletar marcadores");
      return;
    }

    // Usar modal customizado em vez de Alert
    setMarcadorParaExcluir({
      id: selectedMarker.id,
      nome: selectedMarker.nome,
      tipo: "modal",
    });
  }, [selectedMarker, usuario]);

  // Deletar marcador (admin ou ONG responsável pela área)
  const handleDeleteMarkerWithArea = useCallback(
    async (markerId) => {
      if (!usuario) return;

      try {
        // Admin pode deletar qualquer marcador
        if (usuario.tipo === "admin") {
          const marcador = markers.find((m) => m.id === markerId);
          setMarcadorParaExcluir({
            id: markerId,
            nome: marcador?.nome || "Marcador",
            tipo: "direto",
          });
          return;
        }

        // ONG pode deletar marcadores - usar a API padrão
        if (usuario.tipo === "ong") {
          console.log("🗑️ ONG tentando deletar marcador:", markerId);

          // Usar a API padrão de lugares para deletar
          await lugaresAPI.deletar(markerId);

          // Atualizar estado local
          setMarkers((prev) => prev.filter((marker) => marker.id !== markerId));
          setIsViewModalVisible(false);
          setSelectedMarker(null);
          Alert.alert("Sucesso", "Marcador deletado com sucesso!");
          return;
        }

        Alert.alert("Erro", "Você não tem permissão para deletar marcadores.");
      } catch (error) {
        console.error("❌ Erro ao deletar marcador:", error);
        Alert.alert("Erro", "Não foi possível deletar o marcador.");
      }
    },
    [usuario, markers]
  );

  // Estados para denúncia
  const [isDenunciaModalVisible, setIsDenunciaModalVisible] = useState(false);
  const [motivoDenuncia, setMotivoDenuncia] = useState("");
  const [descricaoDenuncia, setDescricaoDenuncia] = useState("");
  const [marcadorParaDenunciar, setMarcadorParaDenunciar] = useState(null);

  // Opções de motivos para denúncia
  const MOTIVOS_DENUNCIA = [
    { value: "conteudo_inadequado", label: "Conteúdo inadequado" },
    { value: "informacao_incorreta", label: "Informação incorreta" },
    { value: "spam", label: "Spam ou duplicação" },
    { value: "local_incorreto", label: "Localização incorreta" },
    { value: "ja_resolvido", label: "Problema já foi resolvido" },
    { value: "outro", label: "Outro motivo" },
  ];

  // Função para iniciar denúncia
  const iniciarDenuncia = useCallback(
    (marker) => {
      if (!marker || !usuario) return;

      setMarcadorParaDenunciar(marker);
      setMotivoDenuncia("");
      setDescricaoDenuncia("");
      setIsDenunciaModalVisible(true);
    },
    [usuario]
  );

  // Função para enviar denúncia
  const enviarDenuncia = useCallback(async () => {
    if (!marcadorParaDenunciar || !motivoDenuncia) {
      Alert.alert("Erro", "Por favor, selecione um motivo para a denúncia");
      return;
    }

    try {
      // Enviar também o denunciante_id (usuario.id)
      await lugaresAPI.denunciar(
        marcadorParaDenunciar.id,
        motivoDenuncia,
        descricaoDenuncia || "Denúncia enviada pelo usuário",
        usuario?.id // novo campo
      );

      // Fechar modais
      setIsDenunciaModalVisible(false);
      setIsViewModalVisible(false);
      setSelectedMarker(null);
      setMarcadorParaDenunciar(null);

      // Mostrar confirmação melhorada com mais informações
      Alert.alert(
        "✅ Denúncia Enviada com Sucesso!",
        `Obrigado por contribuir com a comunidade!\n\n` +
          `📍 Marcador: ${marcadorParaDenunciar.nome}\n` +
          `🚨 Motivo: ${
            MOTIVOS_DENUNCIA.find((m) => m.value === motivoDenuncia)?.label
          }\n` +
          `📝 ID da Denúncia: #${new Date()
            .getTime()
            .toString()
            .slice(-6)}\n\n` +
          `📋 PRÓXIMOS PASSOS:\n` +
          `• Sua denúncia foi enviada para análise\n` +
          `• A equipe responsável será notificada\n` +
          `• Você pode acompanhar o status no painel\n` +
          `• Medidas serão tomadas se procedente\n\n` +
          `⏱️ Tempo estimado de análise: 24-48 horas`,
        [
          {
            text: "Entendi",
            style: "default",
          },
        ]
      );
    } catch (error) {
      console.error("❌ Erro ao enviar denúncia:", error);
      Alert.alert(
        "Erro",
        `Não foi possível enviar a denúncia: ${error.message}\n\nTente novamente mais tarde.`
      );
    }
  }, [marcadorParaDenunciar, motivoDenuncia, descricaoDenuncia]);

  // Função para denunciar problema (usuários comuns) - REMOVIDA E SUBSTITUÍDA
  const handleReportProblem = useCallback(
    async (marker) => {
      iniciarDenuncia(marker);
    },
    [iniciarDenuncia]
  );

  // Confirmar exclusão de marcador
  const confirmarExclusaoMarcador = async () => {
    if (!marcadorParaExcluir) return;

    try {
      console.log(
        "🗑️ Admin confirmou exclusão do marcador:",
        marcadorParaExcluir.id
      );
      await lugaresAPI.deletar(marcadorParaExcluir.id);

      // Remover do frontend
      setMarkers((prev) =>
        prev.filter((marker) => marker.id !== marcadorParaExcluir.id)
      );

      // Sempre fechar todos os modals relacionados ao marcador
      setIsViewModalVisible(false);
      setSelectedMarker(null);
      setMarcadorParaExcluir(null);

      Alert.alert("Sucesso", "Marcador deletado com sucesso!");
    } catch (error) {
      console.error("❌ Erro ao deletar marcador:", error);
      Alert.alert("Erro", "Não foi possível deletar o marcador");
    }
  };

  // Marcar notificação como lida
  const marcarNotificacaoLida = useCallback(async (notificacaoId) => {
    try {
      await areasAPI.marcarComoLida(notificacaoId);
      setNotificacoes((prev) =>
        prev.map((notif) =>
          notif.id === notificacaoId ? { ...notif, lida: true } : notif
        )
      );
    } catch (error) {
      console.error("❌ Erro ao marcar notificação como lida:", error);
    }
  }, []);
  // Lista de usuários para busca de nome da ONG pelo ong_id
  const [usuarios, setUsuarios] = useState([]);

  React.useEffect(() => {
    async function fetchUsuarios() {
      try {
        const data = await userAPI.buscarTodos();
        console.log('[USUARIOS] Resposta da API /usuarios:', data);
        let usuariosArray = Array.isArray(data) ? data : [];
        if (!usuariosArray || usuariosArray.length === 0) {
          // Fallback para desenvolvimento: usuários mockados
          usuariosArray = [
            { id: 4, nome: 'ONG Salva', email: 'salva@salva.com', tipo: 'ong' },
            { id: 1, nome: 'Admin Desenvolvimento', email: 'admin@mapcity.com', tipo: 'admin' },
            { id: 2, nome: 'Usuario Teste', email: 'usuario@teste.com', tipo: 'usuario' }
          ];
          console.warn('[USUARIOS] Usando fallback de usuários mockados para desenvolvimento.');
        }
        setUsuarios(usuariosArray);
      } catch (e) {
        console.error('[USUARIOS] Erro ao buscar usuários:', e);
        setUsuarios([]);
      }
    }
    fetchUsuarios();
  }, []);

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: modernTheme.colors.background,
      }}
    >
  {/* Header Moderno */}
      <View
        style={{
          backgroundColor: modernTheme.colors.surface,
          paddingTop: Platform.OS === "web" ? modernTheme.spacing.lg : 40,
          paddingHorizontal: modernTheme.spacing.lg,
          paddingBottom: modernTheme.spacing.md,
          borderBottomWidth: 1,
          borderBottomColor: modernTheme.colors.border,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
          elevation: 5,
          zIndex: 9999,
          position: "relative",
        }}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          {/* Badge do tipo de usuário */}
          {usuario && (
            <View
              style={{
                backgroundColor:
                  usuario.tipo === "admin"
                    ? modernTheme.colors.danger
                    : usuario.tipo === "ong"
                    ? modernTheme.colors.secondary
                    : modernTheme.colors.primary,
                paddingHorizontal: modernTheme.spacing.sm,
                paddingVertical: modernTheme.spacing.xs,
                borderRadius: modernTheme.borderRadius.md,
              }}
            >
              <Text
                style={{
                  color: "white",
                  fontSize: 12,
                  fontWeight: "bold",
                }}
              >
                {usuario.tipo === "admin"
                  ? "👑 Admin"
                  : usuario.tipo === "ong"
                  ? "🏢 ONG"
                  : "👤 Usuário"}
              </Text>
            </View>
          )}
        </View>

        {/* Filtros de marcadores */}
        {/* Botão/seta para expandir/retrair filtros */}
        <View style={{ width: '100%', alignItems: 'center', marginTop: 8, marginBottom: filtrosAbertos ? 0 : 18, zIndex: 10 }}>
          <TouchableOpacity
            onPress={() => setFiltrosAbertos((v) => !v)}
            style={{
              backgroundColor: modernTheme.colors.surface,
              borderRadius: 20,
              borderWidth: 1.5,
              borderColor: modernTheme.colors.border,
              padding: 6,
              boxShadow: Platform.OS === 'web' ? modernTheme.shadows.sm : undefined,
              marginBottom: filtrosAbertos ? -12 : 0,
              transition: 'margin-bottom 0.3s',
            }}
          >
            <span
              style={{
                display: 'inline-block',
                transition: 'transform 0.3s',
                transform: filtrosAbertos ? 'rotate(180deg)' : 'rotate(0deg)',
                fontSize: 28,
                color: modernTheme.colors.primary,
                userSelect: 'none',
                lineHeight: 1,
              }}
            >
              ▼
            </span>
          </TouchableOpacity>
        </View>
        {/* Painel de filtros expansível */}
        <View
          style={{
            maxHeight: filtrosAbertos ? 500 : 0,
            overflow: 'hidden',
            opacity: filtrosAbertos ? 1 : 0,
            marginBottom: filtrosAbertos ? 12 : 0,
            marginTop: filtrosAbertos ? 0 : -24,
            transition: 'all 0.35s cubic-bezier(.4,0,.2,1)',
          }}
        >
          <View style={{
            margin: 24,
            marginBottom: 0,
            backgroundColor: modernTheme.colors.background,
            borderRadius: 18,
            padding: 20,
            borderWidth: 0,
            flexDirection: 'row',
            flexWrap: 'wrap',
            gap: 20,
            alignItems: 'center',
            boxShadow: Platform.OS === 'web' ? modernTheme.shadows.md : undefined,
            overflowX: Platform.OS === 'web' ? 'auto' : undefined,
            border: Platform.OS === 'web' ? `1.5px solid ${modernTheme.colors.border}` : undefined,
          }}>
          {/* Tipo */}
  <View style={{ flex: 1, minWidth: 180, marginRight: 8 }}>
            <Text style={{ fontSize: 13, color: '#374151', marginBottom: 4, fontWeight: 'bold', letterSpacing: 0.2 }}>Tipo</Text>
            {Platform.OS === 'web' ? (
              <select
                value={filtroTipo}
                onChange={e => setFiltroTipo(e.target.value)}
                style={{
                  height: 44,
                  width: '100%',
                  maxWidth: 320,
                  minWidth: 180,
                  borderRadius: 12,
                  border: `1.5px solid ${modernTheme.colors.border}`,
                  padding: '0 18px',
                  fontSize: 17,
                  backgroundColor: modernTheme.colors.surface,
                  color: modernTheme.colors.text,
                  marginBottom: 0,
                  outline: 'none',
                  boxShadow: Platform.OS === 'web' ? modernTheme.shadows.sm : undefined,
                  transition: 'border 0.2s, box-shadow 0.2s',
                  cursor: 'pointer',
                  flexGrow: 1,
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
              <View style={{ flexDirection: 'row', gap: 10, flexWrap: 'wrap', marginBottom: 0 }}>
                {[{ value: 'Todos', label: 'Todos' }, { value: 'lixo', label: 'Lixo' }, { value: 'buraco', label: 'Buraco' }, { value: 'iluminacao', label: 'Iluminação' }, { value: 'outro', label: 'Outro' }].map(opt => (
                  <TouchableOpacity
                    key={opt.value}
                    onPress={() => setFiltroTipo(opt.value)}
                    style={{
                      backgroundColor: filtroTipo === opt.value ? modernTheme.colors.primary : modernTheme.colors.surface,
                      borderRadius: 10,
                      paddingHorizontal: 16,
                      paddingVertical: 9,
                      marginRight: 0,
                      marginBottom: 4,
                      borderWidth: filtroTipo === opt.value ? 2 : 1,
                      borderColor: filtroTipo === opt.value ? modernTheme.colors.primary : modernTheme.colors.border,
                      shadowColor: filtroTipo === opt.value ? modernTheme.colors.primary : undefined,
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
  <View style={{ flexDirection: 'column', minWidth: 120, marginRight: 8 }}>
            <Text style={{ fontSize: 13, color: '#374151', marginBottom: 4, fontWeight: 'bold', letterSpacing: 0.2 }}>Status</Text>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <TouchableOpacity onPress={() => setFiltroResolvido('')} style={{
                backgroundColor: filtroResolvido === '' ? modernTheme.colors.primary : modernTheme.colors.surface,
                borderRadius: 10, paddingHorizontal: 16, paddingVertical: 9, marginRight: 0,
                borderWidth: filtroResolvido === '' ? 2 : 1,
                borderColor: filtroResolvido === '' ? modernTheme.colors.primary : modernTheme.colors.border,
              }}>
                <Text style={{ color: filtroResolvido === '' ? '#fff' : '#374151', fontWeight: filtroResolvido === '' ? 'bold' : '500' }}>Todos</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setFiltroResolvido('sim')} style={{
                backgroundColor: filtroResolvido === 'sim' ? modernTheme.colors.success : modernTheme.colors.surface,
                borderRadius: 10, paddingHorizontal: 16, paddingVertical: 9, marginRight: 0,
                borderWidth: filtroResolvido === 'sim' ? 2 : 1,
                borderColor: filtroResolvido === 'sim' ? modernTheme.colors.success : modernTheme.colors.border,
              }}>
                <Text style={{ color: filtroResolvido === 'sim' ? '#fff' : '#374151', fontWeight: filtroResolvido === 'sim' ? 'bold' : '500' }}>Resolvido</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setFiltroResolvido('nao')} style={{
                backgroundColor: filtroResolvido === 'nao' ? modernTheme.colors.warning : modernTheme.colors.surface,
                borderRadius: 10, paddingHorizontal: 16, paddingVertical: 9, marginRight: 0,
                borderWidth: filtroResolvido === 'nao' ? 2 : 1,
                borderColor: filtroResolvido === 'nao' ? modernTheme.colors.warning : modernTheme.colors.border,
              }}>
                <Text style={{ color: filtroResolvido === 'nao' ? '#fff' : '#374151', fontWeight: filtroResolvido === 'nao' ? 'bold' : '500' }}>Pendente</Text>
              </TouchableOpacity>
            </View>
          </View>
          {/* Data início */}
  <View style={{ flex: 1, minWidth: 150, marginRight: 8 }}>
            <Text style={{ fontSize: 13, color: '#374151', marginBottom: 4, fontWeight: 'bold', letterSpacing: 0.2 }}>Data inicial</Text>
            {Platform.OS === 'web' ? (
              <input
                type="date"
                value={filtroDataInicio}
                onChange={e => setFiltroDataInicio(e.target.value)}
                style={{
                  padding: '0 18px',
                  fontSize: 17,
                  border: `1.5px solid ${modernTheme.colors.border}`,
                  borderRadius: 12,
                  backgroundColor: modernTheme.colors.surface,
                  width: '100%',
                  maxWidth: 220,
                  minWidth: 150,
                  marginBottom: 0,
                  height: 44,
                  outline: 'none',
                  boxShadow: Platform.OS === 'web' ? modernTheme.shadows.sm : undefined,
                  transition: 'border 0.2s, box-shadow 0.2s',
                  flexGrow: 1,
                }}
                onFocus={e => e.target.style.border = '1.5px solid #2563eb'}
                onBlur={e => e.target.style.border = '1px solid #d1d5db'}
              />
            ) : (
              <TextInput
                placeholder="AAAA-MM-DD"
                value={filtroDataInicio}
                onChangeText={setFiltroDataInicio}
                style={{ paddingHorizontal: 16, fontSize: 16, borderWidth: 1.5, borderColor: modernTheme.colors.border, borderRadius: 12, backgroundColor: modernTheme.colors.surface, width: '100%', marginBottom: 0, height: 44 }}
                keyboardType="numeric"
              />
            )}
          </View>
          {/* Data fim */}
  <View style={{ flex: 1, minWidth: 150 }}>
            <Text style={{ fontSize: 13, color: '#374151', marginBottom: 4, fontWeight: 'bold', letterSpacing: 0.2 }}>Data final</Text>
            {Platform.OS === 'web' ? (
              <input
                type="date"
                value={filtroDataFim}
                onChange={e => setFiltroDataFim(e.target.value)}
                style={{
                  padding: '0 18px',
                  fontSize: 17,
                  border: `1.5px solid ${modernTheme.colors.border}`,
                  borderRadius: 12,
                  backgroundColor: modernTheme.colors.surface,
                  width: '100%',
                  maxWidth: 220,
                  minWidth: 150,
                  marginBottom: 0,
                  height: 44,
                  outline: 'none',
                  boxShadow: Platform.OS === 'web' ? modernTheme.shadows.sm : undefined,
                  transition: 'border 0.2s, box-shadow 0.2s',
                  flexGrow: 1,
                }}
                onFocus={e => e.target.style.border = '1.5px solid #2563eb'}
                onBlur={e => e.target.style.border = '1px solid #d1d5db'}
              />
            ) : (
              <TextInput
                placeholder="AAAA-MM-DD"
                value={filtroDataFim}
                onChangeText={setFiltroDataFim}
                style={{ paddingHorizontal: 16, fontSize: 16, borderWidth: 1.5, borderColor: modernTheme.colors.border, borderRadius: 12, backgroundColor: modernTheme.colors.surface, width: '100%', marginBottom: 0, height: 44 }}
                keyboardType="numeric"
              />
            )}
          </View>
        </View>
        {/* Estatísticas */}
        <View
          style={{
            flexDirection: "row",
            gap: 18,
            marginTop: 18,
            marginBottom: 8,
          }}
        >
          <View
            style={{
              flex: 1,
              backgroundColor: modernTheme.colors.surface,
              padding: 18,
              borderRadius: 16,
              borderBottomWidth: 3,
              borderBottomColor: modernTheme.colors.primary,
              display: 'flex',
              alignItems: 'flex-start',
              boxShadow: Platform.OS === 'web' ? modernTheme.shadows.sm : undefined,
              minHeight: 60,
            }}
          >
            <Text
              style={{
                fontSize: 28,
                fontWeight: "bold",
                color: modernTheme.colors.primary,
                marginBottom: 2,
              }}
            >
              {marcadoresFiltrados.length}
            </Text>
            <Text
              style={{
                fontSize: 14,
                color: modernTheme.colors.textSecondary,
                fontWeight: 500,
              }}
            >
              Problemas
            </Text>
          </View>

          <View
            style={{
              flex: 1,
              backgroundColor: modernTheme.colors.surface,
              padding: 18,
              borderRadius: 16,
              borderBottomWidth: 3,
              borderBottomColor: modernTheme.colors.success,
              display: 'flex',
              alignItems: 'flex-start',
              boxShadow: Platform.OS === 'web' ? modernTheme.shadows.sm : undefined,
              minHeight: 60,
            }}
          >
            <Text
              style={{
                fontSize: 28,
                fontWeight: "bold",
                color: modernTheme.colors.success,
                marginBottom: 2,
              }}
            >
              {marcadoresFiltrados.filter((m) => m.resolved).length}
            </Text>
            <Text
              style={{
                fontSize: 14,
                color: modernTheme.colors.textSecondary,
                fontWeight: 500,
              }}
            >
              Resolvidos
            </Text>
          </View>

          <View
            style={{
              flex: 1,
              backgroundColor: modernTheme.colors.surface,
              padding: 18,
              borderRadius: 16,
              borderBottomWidth: 3,
              borderBottomColor: modernTheme.colors.secondary,
              display: 'flex',
              alignItems: 'flex-start',
              boxShadow: Platform.OS === 'web' ? modernTheme.shadows.sm : undefined,
              minHeight: 60,
            }}
          >
            <Text
              style={{
                fontSize: 28,
                fontWeight: "bold",
                color: modernTheme.colors.secondary,
                marginBottom: 2,
              }}
            >
              {areas.length}
            </Text>
            <Text
              style={{
                fontSize: 14,
                color: modernTheme.colors.textSecondary,
                fontWeight: 500,
              }}
            >
              Áreas
            </Text>
          </View>
        </View>

        {/* Botões de ação por tipo de usuário */}
        {usuario && (
          <View
            style={{
              flexDirection: "row",
              marginTop: modernTheme.spacing.md,
              gap: modernTheme.spacing.sm,
              flexWrap: "wrap",
              zIndex: 10000,
              position: "relative",
            }}
          >
            {/* Botões para ONGs */}
            {usuario.tipo === "ong" && (
              <>
                <TouchableOpacity
                  style={{
                    backgroundColor: modernTheme.colors.secondary,
                    paddingHorizontal: modernTheme.spacing.md,
                    paddingVertical: modernTheme.spacing.sm,
                    borderRadius: modernTheme.borderRadius.md,
                    flexDirection: "row",
                    alignItems: "center",
                    gap: modernTheme.spacing.xs,
                  }}
                  onPress={() => setIsNotificationModalVisible(true)}
                >
                  <Text style={{ color: "white", fontSize: 16 }}>🔔</Text>
                  <Text style={{ color: "white", fontWeight: "bold" }}>
                    Notificações
                  </Text>
                  {notificacoes.filter((n) => !n.lida).length > 0 && (
                    <View
                      style={{
                        backgroundColor: modernTheme.colors.danger,
                        borderRadius: 10,
                        minWidth: 20,
                        height: 20,
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Text
                        style={{
                          color: "white",
                          fontSize: 10,
                          fontWeight: "bold",
                        }}
                      >
                        {notificacoes.filter((n) => !n.lida).length}
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>

                {areaDrawingMode ? (
                  <>
                    <TouchableOpacity
                      style={{
                        backgroundColor: modernTheme.colors.success,
                        paddingHorizontal: modernTheme.spacing.md,
                        paddingVertical: modernTheme.spacing.sm,
                        borderRadius: modernTheme.borderRadius.md,
                        flexDirection: "row",
                        alignItems: "center",
                        gap: modernTheme.spacing.xs,
                      }}
                      onPress={finalizarCriacaoArea}
                    >
                      <Text style={{ color: "white", fontSize: 16 }}>✅</Text>
                      <Text style={{ color: "white", fontWeight: "bold" }}>
                        Finalizar
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={{
                        backgroundColor: modernTheme.colors.danger,
                        paddingHorizontal: modernTheme.spacing.md,
                        paddingVertical: modernTheme.spacing.sm,
                        borderRadius: modernTheme.borderRadius.md,
                        flexDirection: "row",
                        alignItems: "center",
                        gap: modernTheme.spacing.xs,
                      }}
                      onPress={cancelarCriacaoArea}
                    >
                      <Text style={{ color: "white", fontSize: 16 }}>❌</Text>
                      <Text style={{ color: "white", fontWeight: "bold" }}>
                        Cancelar
                      </Text>
                    </TouchableOpacity>
                  </>
                ) : (
                  <TouchableOpacity
                    style={{
                      backgroundColor: modernTheme.colors.warning,
                      paddingHorizontal: modernTheme.spacing.md,
                      paddingVertical: modernTheme.spacing.sm,
                      borderRadius: modernTheme.borderRadius.md,
                      flexDirection: "row",
                      alignItems: "center",
                      gap: modernTheme.spacing.xs,
                    }}
                    onPress={iniciarCriacaoArea}
                  >
                    <Text style={{ color: "white", fontSize: 16 }}>✏️</Text>
                    <Text style={{ color: "white", fontWeight: "bold" }}>
                      Nova Área
                    </Text>
                  </TouchableOpacity>
                )}
              </>
            )}

            {/* Botões para Admin */}
            {usuario.tipo === "admin" && (
              <>
                <TouchableOpacity
                  style={{
                    backgroundColor: modernTheme.colors.secondary,
                    paddingHorizontal: modernTheme.spacing.md,
                    paddingVertical: modernTheme.spacing.sm,
                    borderRadius: modernTheme.borderRadius.md,
                    flexDirection: "row",
                    alignItems: "center",
                    gap: modernTheme.spacing.xs,
                    elevation: 10,
                    zIndex: 10000,
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.25,
                    shadowRadius: 3.84,
                  }}
                  onPress={() => {
                    console.log("🛠️ Botão Painel Admin clicado!");
                    setIsAdminDashboardVisible(true);
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={{ color: "white", fontSize: 16 }}>🛠️</Text>
                  <Text style={{ color: "white", fontWeight: "bold" }}>
                    Painel Admin
                  </Text>
                </TouchableOpacity>
              </>
            )}

            {/* Botão para ONGs */}
            {usuario.tipo === "ong" && (
              <TouchableOpacity
                style={{
                  backgroundColor: modernTheme.colors.secondary,
                  paddingHorizontal: modernTheme.spacing.md,
                  paddingVertical: modernTheme.spacing.sm,
                  borderRadius: modernTheme.borderRadius.md,
                  flexDirection: "row",
                  alignItems: "center",
                  gap: modernTheme.spacing.xs,
                  elevation: 10,
                  zIndex: 10000,
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.25,
                  shadowRadius: 3.84,
                }}
                onPress={() => {
                  setIsAdminDashboardVisible(true);
                }}
                activeOpacity={0.7}
              >
                <Text style={{ color: "white", fontSize: 16 }}>📊</Text>
                <Text style={{ color: "white", fontWeight: "bold" }}>
                  Painel ONG
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}
        </View>
      </View>

      {/* Status de desenho de área */}
      {areaDrawingMode && (
        <View
          style={{
            position: "absolute",
            top: Platform.OS === "web" ? 180 : 140,
            left: modernTheme.spacing.lg,
            right: modernTheme.spacing.lg,
            backgroundColor: modernTheme.colors.warning + "20",
            borderColor: modernTheme.colors.warning,
            borderWidth: 2,
            borderRadius: modernTheme.borderRadius.lg,
            padding: modernTheme.spacing.md,
            zIndex: 1000,
          }}
        >
          <Text
            style={{
              color: modernTheme.colors.warning,
              fontWeight: "bold",
              textAlign: "center",
            }}
          >
            📍 Modo de Desenho Ativo
          </Text>
          <Text
            style={{
              color: modernTheme.colors.text,
              textAlign: "center",
              marginTop: 4,
            }}
          >
            Clique no mapa para marcar pontos ({areaPoints.length} pontos
            marcados)
          </Text>
        </View>
      )}

      {/* Mapa */}
      <View style={{ flex: 1, position: "relative" }}>
        <SimpleMapView
          onMapClick={handleMapClick}
          onMarkerClick={handleMarkerClick}
          markers={marcadoresFiltrados}
          areas={areas}
          areaPoints={areaPoints}
          areaDrawingMode={areaDrawingMode}
        />

        {/* Aviso de serviço de endereços */}
        {addressServiceFailed && (
          <View
            style={{
              position: "absolute",
              bottom: modernTheme.spacing.lg,
              left: modernTheme.spacing.lg,
              right: modernTheme.spacing.lg,
              backgroundColor: modernTheme.colors.warning + "20",
              borderColor: modernTheme.colors.warning,
              borderWidth: 1,
              borderRadius: modernTheme.borderRadius.lg,
              padding: modernTheme.spacing.md,
              zIndex: 1000,
            }}
          >
            <Text
              style={{
                color: modernTheme.colors.warning,
                textAlign: "center",
                fontSize: 12,
              }}
            >
              ⚠️ Serviço de endereços indisponível. Mostrando coordenadas.
            </Text>
          </View>
        )}
      </View>

      {/* Botão de ação flutuante para adicionar problema */}
      {usuario && (usuario.tipo === "usuario" || usuario.tipo === "ong") && (
        <TouchableOpacity
          style={{
            position: "absolute",
            bottom: 30,
            right: 30,
            width: 60,
            height: 60,
            borderRadius: 30,
            backgroundColor: modernTheme.colors.primary,
            alignItems: "center",
            justifyContent: "center",
            elevation: 8,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 8,
          }}
          onPress={() =>
            Alert.alert("Dica", "Clique no mapa para reportar um problema!")
          }
        >
          <Text
            style={{
              fontSize: 24,
              color: "white",
              fontWeight: "bold",
            }}
          >
            +
          </Text>
        </TouchableOpacity>
      )}

      {/* Modal Moderno para Reportar Problema */}
      <Modal
        visible={isModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={closeModal}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: modernTheme.colors.background,
          }}
        >
          {/* Header do Modal */}
          <View
            style={{
              backgroundColor: modernTheme.colors.surface,
              paddingTop: Platform.OS === "web" ? modernTheme.spacing.lg : 40,
              paddingHorizontal: modernTheme.spacing.lg,
              paddingBottom: modernTheme.spacing.md,
              borderBottomWidth: 1,
              borderBottomColor: modernTheme.colors.border,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 4,
              elevation: 3,
            }}
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <TouchableOpacity
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  backgroundColor: modernTheme.colors.border,
                  alignItems: "center",
                  justifyContent: "center",
                }}
                onPress={closeModal}
              >
                <Text
                  style={{
                    fontSize: 20,
                    color: modernTheme.colors.text,
                    fontWeight: "bold",
                  }}
                >
                  ×
                </Text>
              </TouchableOpacity>

              <View style={{ flex: 1, marginLeft: modernTheme.spacing.md }}>
                <Text
                  style={{
                    fontSize: 20,
                    fontWeight: "bold",
                    color: modernTheme.colors.text,
                    textAlign: "center",
                  }}
                >
                  Reportar Problema
                </Text>
                <Text
                  style={{
                    fontSize: 14,
                    color: modernTheme.colors.textSecondary,
                    textAlign: "center",
                    marginTop: 4,
                  }}
                >
                  {clickAddress || "Carregando endereço..."}
                </Text>
              </View>

              <View style={{ width: 40 }} />
            </View>
          </View>

          <ScrollView
            style={{ flex: 1, padding: modernTheme.spacing.lg }}
            showsVerticalScrollIndicator={false}
          >
            {/* Localização */}
            {clickPosition && (
              <View
                style={{
                  backgroundColor: modernTheme.colors.surface,
                  padding: modernTheme.spacing.md,
                  borderRadius: modernTheme.borderRadius.lg,
                  marginBottom: modernTheme.spacing.lg,
                  borderWidth: 1,
                  borderColor: modernTheme.colors.border,
                }}
              >
                <Text
                  style={{
                    fontSize: 12,
                    color: modernTheme.colors.textSecondary,
                    marginBottom: 4,
                  }}
                >
                  📍 Localização
                </Text>
                <Text
                  style={{
                    fontSize: 16,
                    color: modernTheme.colors.text,
                  }}
                >
                  {clickAddress || "Carregando endereço..."}
                </Text>
              </View>
            )}

            {/* Informações da ONG Responsável */}
            {clickPosition &&
              (() => {
                const ongResponsavel = findResponsibleONG(
                  clickPosition.lat,
                  clickPosition.lng
                );

                if (ongResponsavel) {
                  return (
                    <View
                      style={{
                        backgroundColor: modernTheme.colors.success + "20",
                        padding: modernTheme.spacing.md,
                        borderRadius: modernTheme.borderRadius.lg,
                        marginBottom: modernTheme.spacing.lg,
                        borderWidth: 1,
                        borderColor: modernTheme.colors.success + "40",
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 12,
                          color: modernTheme.colors.textSecondary,
                          marginBottom: 4,
                        }}
                      >
                        🏢 Área de Responsabilidade
                      </Text>
                      <Text
                        style={{
                          fontSize: 16,
                          fontWeight: "bold",
                          color: modernTheme.colors.success,
                          marginBottom: 2,
                        }}
                      >
                        {ongResponsavel.ongNome}
                      </Text>
                      <Text
                        style={{
                          fontSize: 14,
                          color: modernTheme.colors.text,
                          opacity: 0.8,
                        }}
                      >
                        Esta localização está dentro da área de responsabilidade
                        da {ongResponsavel.ongNome}. Eles serão notificados
                        sobre este problema.
                      </Text>
                    </View>
                  );
                }
                return null;
              })()}

            {/* Tipo de Problema */}
            <Text
              style={{
                fontSize: 16,
                fontWeight: "bold",
                color: modernTheme.colors.text,
                marginBottom: modernTheme.spacing.sm,
              }}
            >
              Tipo de Problema *
            </Text>
            <View
              style={{
                flexDirection: "row",
                flexWrap: "wrap",
                gap: modernTheme.spacing.sm,
                marginBottom: modernTheme.spacing.lg,
              }}
            >
              {PROBLEM_TYPES.map((type) => (
                <TouchableOpacity
                  key={type.value}
                  style={{
                    flex: 1,
                    minWidth: "45%",
                    backgroundColor:
                      problemType === type.value
                        ? modernTheme.colors.primary
                        : modernTheme.colors.surface,
                    borderWidth: 2,
                    borderColor:
                      problemType === type.value
                        ? modernTheme.colors.primary
                        : modernTheme.colors.border,
                    borderRadius: modernTheme.borderRadius.lg,
                    padding: modernTheme.spacing.md,
                    alignItems: "center",
                    marginBottom: modernTheme.spacing.sm,
                  }}
                  onPress={() => setProblemType(type.value)}
                >
                  <Text
                    style={{
                      fontSize: 24,
                      marginBottom: modernTheme.spacing.xs,
                    }}
                  >
                    {type.emoji}
                  </Text>
                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight: "bold",
                      color:
                        problemType === type.value
                          ? "white"
                          : modernTheme.colors.text,
                      textAlign: "center",
                    }}
                  >
                    {type.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Descrição */}
            <Text
              style={{
                fontSize: 16,
                fontWeight: "bold",
                color: modernTheme.colors.text,
                marginBottom: modernTheme.spacing.sm,
              }}
            >
              Descrição do Problema *
            </Text>
            <TextInput
              style={{
                backgroundColor: modernTheme.colors.surface,
                borderWidth: 1,
                borderColor: modernTheme.colors.border,
                borderRadius: modernTheme.borderRadius.lg,
                padding: modernTheme.spacing.md,
                height: 120,
                textAlignVertical: "top",
                fontSize: 16,
                color: modernTheme.colors.text,
                marginBottom: modernTheme.spacing.lg,
              }}
              multiline
              numberOfLines={4}
              placeholder="Descreva detalhadamente o problema encontrado..."
              placeholderTextColor={modernTheme.colors.textSecondary}
              value={description}
              onChangeText={setDescription}
            />

            {/* Upload de Fotos */}
            <Text
              style={{
                fontSize: 16,
                fontWeight: "bold",
                color: modernTheme.colors.text,
                marginBottom: modernTheme.spacing.sm,
              }}
            >
              Fotos (Opcional - até 5)
            </Text>
            {Platform.OS === "web" ? (
              <View
                style={{
                  backgroundColor: modernTheme.colors.surface,
                  borderWidth: 2,
                  borderColor: modernTheme.colors.border,
                  borderStyle: "dashed",
                  borderRadius: modernTheme.borderRadius.lg,
                  marginBottom: modernTheme.spacing.lg,
                }}
              >
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageUpload}
                  style={{ display: "none" }}
                  id="image-upload"
                />
                <label
                  htmlFor="image-upload"
                  style={{
                    cursor: "pointer",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    padding: modernTheme.spacing.lg,
                    textAlign: "center",
                  }}
                >
                  <Text
                    style={{
                      color: modernTheme.colors.primary,
                      fontWeight: "bold",
                      fontSize: 24,
                      marginBottom: modernTheme.spacing.sm,
                    }}
                  >
                    📷
                  </Text>
                  <Text
                    style={{
                      color: modernTheme.colors.primary,
                      fontSize: 16,
                      fontWeight: "bold",
                    }}
                  >
                    Clique para adicionar fotos
                  </Text>
                  <Text
                    style={{
                      color: modernTheme.colors.textSecondary,
                      fontSize: 12,
                      marginTop: modernTheme.spacing.xs,
                    }}
                  >
                    {selectedImages.length}/5 fotos selecionadas
                  </Text>
                </label>

                {selectedImages.length > 0 && (
                  <View
                    style={{
                      marginTop: modernTheme.spacing.md,
                      flexDirection: "row",
                      flexWrap: "wrap",
                      gap: modernTheme.spacing.sm,
                      justifyContent: "center",
                      padding: modernTheme.spacing.md,
                    }}
                  >
                    {selectedImages.map((image) => (
                      <View key={image.id} style={{ position: "relative" }}>
                        <img
                          src={image.data}
                          alt="Preview"
                          style={{
                            width: 80,
                            height: 80,
                            objectFit: "cover",
                            borderRadius: modernTheme.borderRadius.md,
                            border: `2px solid ${modernTheme.colors.border}`,
                          }}
                        />
                        <TouchableOpacity
                          style={{
                            position: "absolute",
                            top: -8,
                            right: -8,
                            width: 24,
                            height: 24,
                            borderRadius: 12,
                            backgroundColor: modernTheme.colors.danger,
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                          onPress={() => removeImage(image.id)}
                        >
                          <Text
                            style={{
                              color: "white",
                              fontSize: 12,
                              fontWeight: "bold",
                            }}
                          >
                            ×
                          </Text>
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            ) : (
              <TouchableOpacity
                style={{
                  backgroundColor: modernTheme.colors.surface,
                  borderWidth: 1,
                  borderColor: modernTheme.colors.border,
                  borderRadius: modernTheme.borderRadius.lg,
                  padding: modernTheme.spacing.lg,
                  alignItems: "center",
                  marginBottom: modernTheme.spacing.lg,
                }}
              >
                <Text
                  style={{
                    color: modernTheme.colors.primary,
                    fontSize: 16,
                    fontWeight: "bold",
                  }}
                >
                  📷 Adicionar Fotos
                </Text>
              </TouchableOpacity>
            )}

            {/* Botão de Submit */}
            <TouchableOpacity
              style={{
                backgroundColor:
                  !problemType || !description
                    ? modernTheme.colors.border
                    : modernTheme.colors.success,
                borderRadius: modernTheme.borderRadius.lg,
                padding: modernTheme.spacing.md,
                alignItems: "center",
                marginTop: modernTheme.spacing.lg,
                opacity: !problemType || !description ? 0.6 : 1,
              }}
              onPress={handleSubmit}
              disabled={!problemType || !description}
            >
              <Text
                style={{
                  color: "white",
                  fontSize: 16,
                  fontWeight: "bold",
                }}
              >
                ✅ Reportar Problema
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>

      {/* Modal Moderno de Visualização do Problema */}
      {}
      <Modal
        visible={isViewModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => {
          setIsViewModalVisible(false);
        }}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: modernTheme.colors.background,
          }}
        >
          {/* Header do Modal */}
          <View
            style={{
              backgroundColor: modernTheme.colors.surface,
              paddingTop: Platform.OS === "web" ? modernTheme.spacing.lg : 40,
              paddingHorizontal: modernTheme.spacing.lg,
              paddingBottom: modernTheme.spacing.md,
              borderBottomWidth: 1,
              borderBottomColor: modernTheme.colors.border,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 4,
              elevation: 3,
            }}
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <TouchableOpacity
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  backgroundColor: modernTheme.colors.border,
                  alignItems: "center",
                  justifyContent: "center",
                }}
                onPress={() => setIsViewModalVisible(false)}
              >
                <Text
                  style={{
                    fontSize: 20,
                    color: modernTheme.colors.text,
                    fontWeight: "bold",
                  }}
                >
                  ×
                </Text>
              </TouchableOpacity>

              <View style={{ flex: 1, marginLeft: modernTheme.spacing.md }}>
                <Text
                  style={{
                    fontSize: 20,
                    fontWeight: "bold",
                    color: modernTheme.colors.text,
                    textAlign: "center",
                  }}
                >
                  {selectedMarker?.resolved
                    ? "Problema Resolvido"
                    : "Detalhes do Problema"}
                </Text>
                <Text
                  style={{
                    fontSize: 14,
                    color: modernTheme.colors.textSecondary,
                    textAlign: "center",
                    marginTop: 4,
                  }}
                >
                  {markerAddress || "Carregando endereço..."}
                </Text>
              </View>

              <View style={{ width: 40 }} />
            </View>
          </View>

          <ScrollView
            style={{
              flex: 1,
              padding: modernTheme.spacing.lg,
            }}
            showsVerticalScrollIndicator={false}
          >
            {}
            {selectedMarker ? (
              <>
                {}
                {/* Status Badge */}
                <View
                  style={{
                    backgroundColor: selectedMarker.resolved
                      ? modernTheme.colors.success
                      : modernTheme.colors.warning,
                    paddingHorizontal: modernTheme.spacing.md,
                    paddingVertical: modernTheme.spacing.sm,
                    borderRadius: modernTheme.borderRadius.md,
                    alignSelf: "flex-start",
                    marginBottom: modernTheme.spacing.lg,
                  }}
                >
                  <Text
                    style={{
                      color: "white",
                      fontSize: 12,
                      fontWeight: "bold",
                    }}
                  >
                    {selectedMarker.resolved ? "✅ Resolvido" : "⏳ Pendente"}
                  </Text>
                </View>

                {/* Tipo do Problema */}
                <View
                  style={{
                    backgroundColor: modernTheme.colors.surface,
                    padding: modernTheme.spacing.md,
                    borderRadius: modernTheme.borderRadius.lg,
                    marginBottom: modernTheme.spacing.lg,
                    borderWidth: 1,
                    borderColor: modernTheme.colors.border,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 12,
                      color: modernTheme.colors.textSecondary,
                    }}
                  >
                    Tipo do Problema
                  </Text>
                  <Text
                    style={{
                      fontSize: 18,
                      fontWeight: "bold",
                      marginTop: modernTheme.spacing.xs,
                      color:
                        selectedMarker && selectedMarker.resolved
                          ? modernTheme.colors.success
                          : modernTheme.colors.primary,
                    }}
                  >
                    {selectedMarker &&
                      PROBLEM_TYPES.find((t) => t.value === selectedMarker.type)
                        ?.emoji}{" "}
                    {(selectedMarker &&
                      PROBLEM_TYPES.find((t) => t.value === selectedMarker.type)
                        ?.label) ||
                      "Problema"}
                  </Text>
                </View>

                {/* Galeria de Imagens */}
                {selectedMarker.images && selectedMarker.images.length > 0 && (
                  <View
                    style={{
                      backgroundColor: modernTheme.colors.surface,
                      padding: modernTheme.spacing.md,
                      borderRadius: modernTheme.borderRadius.lg,
                      marginBottom: modernTheme.spacing.lg,
                      borderWidth: 1,
                      borderColor: modernTheme.colors.border,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 12,
                        color: modernTheme.colors.textSecondary,
                        marginBottom: modernTheme.spacing.md,
                      }}
                    >
                      Imagens do Problema ({selectedMarker.images.length})
                    </Text>

                    {/* Carrossel Moderno */}
                    <View
                      style={{
                        position: "relative",
                        width: "100%",
                        borderRadius: modernTheme.borderRadius.lg,
                        overflow: "hidden",
                        backgroundColor: modernTheme.colors.surface,
                        minHeight: 200,
                        maxHeight: 400,
                      }}
                    >
                      <img
                        src={
                          imageError
                            ? "/logoMap.png"
                            : (() => {
                                const img =
                                  selectedMarker.images[currentImageIndex];
                                if (!img) return "/logoMap.png";
                                if (typeof img === "object" && img.data)
                                  return img.data;
                                const path =
                                  typeof img === "object" && img.path
                                    ? img.path
                                    : img;
                                if (
                                  typeof path === "string" &&
                                  path.startsWith("/uploads/")
                                ) {
                                  return `http://localhost:3001${path}`;
                                }
                                return path;
                              })()
                        }
                        alt={`Problema - Imagem ${currentImageIndex + 1}`}
                        style={{
                          width: "100%",
                          maxHeight: "400px",
                          height: "auto",
                          objectFit: "contain",
                          backgroundColor: modernTheme.colors.surface,
                          borderRadius: modernTheme.borderRadius.md,
                          display: "block",
                        }}
                        onError={(e) => {
                          if (!imageError) setImageError(true);
                        }}
                      />
                      {imageError && (
                        <div
                          style={{
                            textAlign: "center",
                            color: "gray",
                            marginTop: 8,
                          }}
                        >
                          Imagem indisponível
                        </div>
                      )}

                      {/* Controles do Carrossel */}
                      {selectedMarker.images.length > 1 && (
                        <>
                          <TouchableOpacity
                            style={{
                              position: "absolute",
                              left: modernTheme.spacing.sm,
                              top: "50%",
                              transform: "translateY(-50%)",
                              width: 40,
                              height: 40,
                              borderRadius: 20,
                              backgroundColor: "rgba(0,0,0,0.7)",
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                            onPress={() =>
                              setCurrentImageIndex((prev) =>
                                prev === 0
                                  ? selectedMarker.images.length - 1
                                  : prev - 1
                              )
                            }
                          >
                            <Text
                              style={{
                                color: "white",
                                fontSize: 18,
                                fontWeight: "bold",
                              }}
                            >
                              ‹
                            </Text>
                          </TouchableOpacity>

                          <TouchableOpacity
                            style={{
                              position: "absolute",
                              right: modernTheme.spacing.sm,
                              top: "50%",
                              transform: "translateY(-50%)",
                              width: 40,
                              height: 40,
                              borderRadius: 20,
                              backgroundColor: "rgba(0,0,0,0.7)",
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                            onPress={() =>
                              setCurrentImageIndex((prev) =>
                                prev === selectedMarker.images.length - 1
                                  ? 0
                                  : prev + 1
                              )
                            }
                          >
                            <Text
                              style={{
                                color: "white",
                                fontSize: 18,
                                fontWeight: "bold",
                              }}
                            >
                              ›
                            </Text>
                          </TouchableOpacity>

                          {/* Indicadores */}
                          <View
                            style={{
                              position: "absolute",
                              bottom: modernTheme.spacing.md,
                              left: "50%",
                              transform: "translateX(-50%)",
                              flexDirection: "row",
                              gap: modernTheme.spacing.xs,
                            }}
                          >
                            {selectedMarker.images.map((_, index) => (
                              <TouchableOpacity
                                key={index}
                                style={{
                                  width: 10,
                                  height: 10,
                                  borderRadius: 5,
                                  backgroundColor:
                                    index === currentImageIndex
                                      ? "white"
                                      : "rgba(255,255,255,0.5)",
                                }}
                                onPress={() => setCurrentImageIndex(index)}
                              />
                            ))}
                          </View>

                          {/* Contador */}
                          <View
                            style={{
                              position: "absolute",
                              top: modernTheme.spacing.md,
                              right: modernTheme.spacing.md,
                              backgroundColor: "rgba(0,0,0,0.7)",
                              paddingHorizontal: modernTheme.spacing.sm,
                              paddingVertical: modernTheme.spacing.xs,
                              borderRadius: modernTheme.borderRadius.md,
                            }}
                          >
                            <Text style={{ fontSize: 12, color: "white" }}>
                              {currentImageIndex + 1}/
                              {selectedMarker.images.length}
                            </Text>
                          </View>
                        </>
                      )}
                    </View>

                    {/* Miniaturas */}
                    {selectedMarker.images.length > 1 && (
                      <View
                        style={{
                          flexDirection: "row",
                          gap: modernTheme.spacing.sm,
                          marginTop: modernTheme.spacing.md,
                          justifyContent: "center",
                          flexWrap: "wrap",
                        }}
                      >
                        {selectedMarker.images.map((image, index) => (
                          <TouchableOpacity
                            key={index}
                            style={{
                              borderWidth: 2,
                              borderColor:
                                index === currentImageIndex
                                  ? modernTheme.colors.primary
                                  : modernTheme.colors.border,
                              borderRadius: modernTheme.borderRadius.md,
                              padding: 2,
                              backgroundColor: "transparent",
                            }}
                            onPress={() => setCurrentImageIndex(index)}
                          >
                            <img
                              src={
                                image.data ||
                                (image?.startsWith("/uploads/")
                                  ? `http://localhost:3001${image}`
                                  : image)
                              }
                              alt={`Miniatura ${index + 1}`}
                              style={{
                                width: 60,
                                height: 60,
                                objectFit: "cover",
                                borderRadius: modernTheme.borderRadius.sm,
                              }}
                              onError={(e) => {
                                e.target.style.display = "none";
                              }}
                            />
                          </TouchableOpacity>
                        ))}
                      </View>
                    )}
                  </View>
                )}

                {/* Descrição */}
                <View
                  style={{
                    backgroundColor: modernTheme.colors.surface,
                    padding: modernTheme.spacing.md,
                    borderRadius: modernTheme.borderRadius.lg,
                    marginBottom: modernTheme.spacing.lg,
                    borderWidth: 1,
                    borderColor: modernTheme.colors.border,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 12,
                      color: modernTheme.colors.textSecondary,
                      marginBottom: modernTheme.spacing.sm,
                    }}
                  >
                    Descrição do Problema
                  </Text>
                  <Text
                    style={{
                      fontSize: 16,
                      color: selectedMarker.resolved
                        ? modernTheme.colors.success
                        : modernTheme.colors.text,
                      lineHeight: 24,
                    }}
                  >
                    {selectedMarker.description ||
                      "Nenhuma descrição fornecida."}
                  </Text>
                </View>

                {/* Informações da ONG Responsável */}
                {(() => {
                  // Verificar se o marcador tem informações da ONG ou calcular dinamicamente
                  // Corrige: usa area_ong_id para buscar a ONG correta
                  // Fallback: se não houver area_ong_id, tenta mostrar o nome salvo no marcador
                  const ongInfo =
                    selectedMarker.area_ong_id || selectedMarker.ong_id
                      ? {
                          ong_id:
                            selectedMarker.area_ong_id || selectedMarker.ong_id,
                          nome: selectedMarker.area_ong_nome,
                          email: selectedMarker.area_ong_email,
                        }
                      : selectedMarker.area_ong_nome
                      ? {
                          nome: selectedMarker.area_ong_nome,
                          email: selectedMarker.area_ong_email,
                        }
                      : findResponsibleONG(
                          selectedMarker.lat,
                          selectedMarker.lng
                        );

                  // Exibe a div se houver nome OU email da ONG, inclusive se vier direto do marcador
                  // DEBUG: Força exibição da div sempre, mostrando nome/email do marcador
                  return (
                    <View
                      style={{
                        backgroundColor: modernTheme.colors.success + "20",
                        padding: modernTheme.spacing.md,
                        borderRadius: modernTheme.borderRadius.lg,
                        marginBottom: modernTheme.spacing.lg,
                        borderWidth: 1,
                        borderColor: modernTheme.colors.success + "40",
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 12,
                          color: modernTheme.colors.textSecondary,
                          marginBottom: modernTheme.spacing.sm,
                        }}
                      >
                        🏢 ONG Responsável pela Área
                      </Text>
                      <Text
                        style={{
                          fontSize: 16,
                          fontWeight: "bold",
                          color: modernTheme.colors.success,
                          marginBottom: 4,
                        }}
                      >
                        {/* Nome da ONG: tenta todos os campos possíveis e mostra explicitamente o valor */}
                        {(() => {
                          // Se area_ong_nome vier null, tenta buscar pelo area_ong_id na lista de usuários
                          if (
                            (!selectedMarker.area_ong_nome ||
                              selectedMarker.area_ong_nome === "null") &&
                            selectedMarker.area_ong_id &&
                            Array.isArray(usuarios)
                          ) {
                            const ong = usuarios.find(
                              (u) =>
                                String(u.id) ===
                                String(selectedMarker.area_ong_id)
                            );
                            if (ong && ong.nome) return ong.nome;
                          }
                          // Se não, usa normalmente
                          return (
                            ongInfo?.nome ||
                            ongInfo?.ongNome ||
                            selectedMarker.area_ong_nome ||
                            "[NOME VAZIO]"
                          );
                        })()}
                      </Text>
                      <Text
                        style={{
                          fontSize: 14,
                          color: modernTheme.colors.text,
                          opacity: 0.8,
                        }}
                      >
                        {/* Se area_ong_email vier null, tenta buscar pelo area_ong_id na lista de usuários */}
                        📧{" "}
                        {(() => {
                          if (
                            (!selectedMarker.area_ong_email ||
                              selectedMarker.area_ong_email === "null") &&
                            selectedMarker.area_ong_id &&
                            Array.isArray(usuarios)
                          ) {
                            const ong = usuarios.find(
                              (u) =>
                                String(u.id) ===
                                String(selectedMarker.area_ong_id)
                            );
                            if (ong && ong.email) return ong.email;
                          }
                          return (
                            ongInfo?.email ||
                            ongInfo?.ongEmail ||
                            selectedMarker.area_ong_email ||
                            "[EMAIL VAZIO]"
                          );
                        })()}
                      </Text>
                      <Text
                        style={{
                          fontSize: 12,
                          color: modernTheme.colors.textSecondary,
                          marginTop: 4,
                          fontStyle: "italic",
                        }}
                      >
                        Esta ONG é responsável por esta área e foi notificada
                        sobre o problema.
                      </Text>
                    </View>
                  );
                })()}

                {/* Informações Adicionais */}
                <View
                  style={{
                    backgroundColor: modernTheme.colors.surface,
                    padding: modernTheme.spacing.md,
                    borderRadius: modernTheme.borderRadius.lg,
                    marginBottom: modernTheme.spacing.lg,
                    borderWidth: 1,
                    borderColor: modernTheme.colors.border,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 12,
                      color: modernTheme.colors.textSecondary,
                      marginBottom: modernTheme.spacing.md,
                    }}
                  >
                    Informações do Relato
                  </Text>

                  <View style={{ gap: modernTheme.spacing.sm }}>
                    <View
                      style={{
                        flexDirection: "row",
                        justifyContent: "space-between",
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 14,
                          color: modernTheme.colors.textSecondary,
                        }}
                      >
                        Localização:
                      </Text>
                      <Text
                        style={{
                          fontSize: 14,
                          color: modernTheme.colors.text,
                          flex: 1,
                          textAlign: "right",
                        }}
                      >
                        {markerAddress || "Carregando..."}
                      </Text>
                    </View>

                    {selectedMarker.createdAt && (
                      <View
                        style={{
                          flexDirection: "row",
                          justifyContent: "space-between",
                        }}
                      >
                        <Text
                          style={{
                            fontSize: 14,
                            color: modernTheme.colors.textSecondary,
                          }}
                        >
                          Reportado em:
                        </Text>
                        <Text
                          style={{
                            fontSize: 14,
                            color: modernTheme.colors.text,
                          }}
                        >
                          {new Date(selectedMarker.createdAt).toLocaleString(
                            "pt-BR",
                            {
                              day: "2-digit",
                              month: "2-digit",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            }
                          )}
                        </Text>
                      </View>
                    )}

                    {selectedMarker.reportedBy && (
                      <View
                        style={{
                          flexDirection: "row",
                          justifyContent: "space-between",
                        }}
                      >
                        <Text
                          style={{
                            fontSize: 14,
                            color: modernTheme.colors.textSecondary,
                          }}
                        >
                          Reportado por:
                        </Text>
                        <Text
                          style={{
                            fontSize: 14,
                            color: modernTheme.colors.text,
                          }}
                        >
                          {selectedMarker.reportedBy}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>

                {/* Banner de Resolução */}
                {selectedMarker.resolved && (
                  <View
                    style={{
                      backgroundColor: modernTheme.colors.success + "20",
                      borderColor: modernTheme.colors.success,
                      borderWidth: 1,
                      borderRadius: modernTheme.borderRadius.lg,
                      padding: modernTheme.spacing.md,
                      marginBottom: modernTheme.spacing.lg,
                    }}
                  >
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        marginBottom: modernTheme.spacing.sm,
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 18,
                          color: modernTheme.colors.success,
                          marginRight: modernTheme.spacing.sm,
                        }}
                      >
                        ✅
                      </Text>
                      <Text
                        style={{
                          fontSize: 16,
                          color: modernTheme.colors.success,
                          fontWeight: "bold",
                        }}
                      >
                        Problema Resolvido
                      </Text>
                    </View>
                    <Text
                      style={{
                        fontSize: 12,
                        color: modernTheme.colors.success,
                      }}
                    >
                      Resolvido em:{" "}
                      {selectedMarker.resolvedAt
                        ? new Date(selectedMarker.resolvedAt).toLocaleString(
                            "pt-BR",
                            {
                              day: "2-digit",
                              month: "2-digit",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            }
                          )
                        : "Data não disponível"}
                    </Text>
                  </View>
                )}

                {/* Logs de depuração temporários */}
                {console.log("DEBUG selectedMarker:", selectedMarker)}
                {console.log("DEBUG usuario:", usuario)}
                {/* Botões de Ação */}
                <View style={{ gap: modernTheme.spacing.md }}>
                  {/* Botões para Usuários Comuns */}
                  {usuario && selectedMarker && usuario.tipo === "usuario" && (
                    <>
                      {!selectedMarker.resolved && (
                        <TouchableOpacity
                          style={{
                            backgroundColor: modernTheme.colors.success,
                            borderRadius: modernTheme.borderRadius.lg,
                            padding: modernTheme.spacing.md,
                            alignItems: "center",
                            shadowColor: modernTheme.colors.success,
                            shadowOffset: { width: 0, height: 4 },
                            shadowOpacity: 0.3,
                            shadowRadius: 8,
                            elevation: 5,
                          }}
                          onPress={handleMarkResolved}
                          activeOpacity={0.8}
                        >
                          <Text
                            style={{
                              color: "white",
                              fontSize: 16,
                              fontWeight: "bold",
                              textAlign: "center",
                            }}
                          >
                            ✓ Marcar como Resolvido
                          </Text>
                        </TouchableOpacity>
                      )}
                      <TouchableOpacity
                        style={{
                          backgroundColor: modernTheme.colors.warning,
                          borderRadius: modernTheme.borderRadius.lg,
                          padding: modernTheme.spacing.md,
                          alignItems: "center",
                          shadowColor: modernTheme.colors.warning,
                          shadowOffset: { width: 0, height: 4 },
                          shadowOpacity: 0.3,
                          shadowRadius: 8,
                          elevation: 5,
                        }}
                        onPress={() => handleReportProblem(selectedMarker)}
                        activeOpacity={0.8}
                      >
                        <Text
                          style={{
                            color: "white",
                            fontSize: 16,
                            fontWeight: "bold",
                            textAlign: "center",
                          }}
                        >
                          🚨 Denunciar Problema
                        </Text>
                      </TouchableOpacity>
                    </>
                  )}

                  {/* Botões para Admin e ONGs */}
                  {selectedMarker &&
                    !selectedMarker.resolved &&
                    usuario &&
                    (usuario.tipo === "admin" || usuario.tipo === "ong") && (
                      <TouchableOpacity
                        style={{
                          backgroundColor: modernTheme.colors.success,
                          borderRadius: modernTheme.borderRadius.lg,
                          padding: modernTheme.spacing.md,
                          alignItems: "center",
                          shadowColor: modernTheme.colors.success,
                          shadowOffset: { width: 0, height: 4 },
                          shadowOpacity: 0.3,
                          shadowRadius: 8,
                          elevation: 5,
                        }}
                        onPress={handleMarkResolved}
                        activeOpacity={0.8}
                      >
                        <Text
                          style={{
                            color: "white",
                            fontSize: 16,
                            fontWeight: "bold",
                            textAlign: "center",
                          }}
                        >
                          ✓ Marcar como Resolvido
                        </Text>
                      </TouchableOpacity>
                    )}

                  {selectedMarker &&
                    usuario &&
                    (usuario.tipo === "admin" || usuario.tipo === "ong") && (
                      <TouchableOpacity
                        style={{
                          backgroundColor: modernTheme.colors.danger,
                          borderRadius: modernTheme.borderRadius.lg,
                          padding: modernTheme.spacing.md,
                          alignItems: "center",
                          shadowColor: modernTheme.colors.danger,
                          shadowOffset: { width: 0, height: 4 },
                          shadowOpacity: 0.3,
                          shadowRadius: 8,
                          elevation: 5,
                        }}
                        onPress={() =>
                          handleDeleteMarkerWithArea(selectedMarker.id)
                        }
                        activeOpacity={0.8}
                      >
                        <Text
                          style={{
                            color: "white",
                            fontSize: 16,
                            fontWeight: "bold",
                            textAlign: "center",
                          }}
                        >
                          🗑️ Deletar Marcador{" "}
                          {usuario.tipo === "admin" ? "(Admin)" : "(ONG)"}
                        </Text>
                      </TouchableOpacity>
                    )}
                </View>
              </>
            ) : (
              // Estado de carregamento
              <View
                style={{
                  flex: 1,
                  justifyContent: "center",
                  alignItems: "center",
                  padding: modernTheme.spacing.xl,
                }}
              >
                <Text
                  style={{
                    fontSize: 18,
                    color: modernTheme.colors.textSecondary,
                    textAlign: "center",
                  }}
                >
                  🔄 Carregando informações...
                </Text>
              </View>
            )}
          </ScrollView>
        </View>
      </Modal>

      {/* Modal de Áreas - ONGs */}
      <Modal
        visible={isAreaModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setIsAreaModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setIsAreaModalVisible(false)}
            >
              <Text style={styles.closeButtonText}>×</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Minhas Áreas</Text>
            <View style={styles.headerSpacer} />
          </View>

          <ScrollView style={styles.modalContent}>
            {areas.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateText}>📍</Text>
                <Text style={styles.emptyStateTitle}>
                  Nenhuma área definida
                </Text>
                <Text style={styles.emptyStateDescription}>
                  Use o botão ✏️ no mapa para marcar sua área de
                  responsabilidade
                </Text>
              </View>
            ) : (
              areas.map((area, index) => (
                <View key={area.id || index} style={styles.areaItem}>
                  <View style={styles.areaHeader}>
                    <Text style={styles.areaName}>{area.nome}</Text>
                    <Text style={styles.areaDate}>
                      {new Date(area.criado_em).toLocaleDateString()}
                    </Text>
                  </View>
                  <Text style={styles.areaPoints}>
                    📍{" "}
                    {(() => {
                      try {
                        const coords =
                          typeof area.coordenadas === "string"
                            ? JSON.parse(area.coordenadas)
                            : area.coordenadas;
                        return Array.isArray(coords) ? coords.length : 0;
                      } catch (e) {
                        return 0;
                      }
                    })()}{" "}
                    pontos
                  </Text>
                  {area.descricao && (
                    <Text style={styles.areaDescription}>{area.descricao}</Text>
                  )}

                  {/* Status da área */}
                  <View style={styles.areaStatus}>
                    <Text
                      style={[
                        styles.statusBadge,
                        {
                          backgroundColor:
                            area.status === "pendente"
                              ? "#F59E0B"
                              : area.status === "aprovada"
                              ? "#10B981"
                              : "#EF4444",
                          color: "white",
                        },
                      ]}
                    >
                      {area.status === "pendente"
                        ? "⏳ Pendente"
                        : area.status === "aprovada"
                        ? "✅ Aprovada"
                        : "❌ Rejeitada"}
                    </Text>
                  </View>

                  {/* Botão de excluir área */}
                  <TouchableOpacity
                    style={styles.deleteAreaButton}
                    onPress={() => {
                      console.log(
                        "🔘 Botão clicado para área:",
                        area.id,
                        area.nome
                      );
                      excluirAreaOng(area.id, area.nome);
                    }}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.deleteAreaButtonText}>
                      🗑️ Excluir Área
                    </Text>
                  </TouchableOpacity>
                </View>
              ))
            )}
          </ScrollView>
        </View>
      </Modal>

      {/* Modal de Notificações - ONGs */}
      <Modal
        visible={isNotificationModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setIsNotificationModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setIsNotificationModalVisible(false)}
            >
              <Text style={styles.closeButtonText}>×</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Notificações</Text>
            <View style={styles.headerSpacer} />
          </View>

          <ScrollView style={styles.modalContent}>
            {notificacoes.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateText}>🔔</Text>
                <Text style={styles.emptyStateTitle}>Nenhuma notificação</Text>
                <Text style={styles.emptyStateDescription}>
                  Você receberá notificações quando novos problemas forem
                  reportados em suas áreas
                </Text>
              </View>
            ) : (
              notificacoes.map((notificacao) => (
                <TouchableOpacity
                  key={notificacao.id}
                  style={[
                    styles.notificationItem,
                    !notificacao.lida && styles.notificationUnread,
                  ]}
                  onPress={async () => {
                    // Marcar como lida
                    await marcarNotificacaoLida(notificacao.id);
                    // Fechar o modal de notificações
                    setIsNotificationModalVisible(false);
                    // Procurar o marcador relacionado (usando lugar_id)
                    const marker = markers.find(
                      (m) => String(m.id) === String(notificacao.lugar_id)
                    );
                    if (marker) {
                      // Forçar fechamento do modal antes de abrir outro
                      setIsViewModalVisible(false);
                      setTimeout(() => {
                        setSelectedMarker(marker);
                        setIsViewModalVisible(true);
                        if (window.mapInstance && marker.lat && marker.lng) {
                          window.mapInstance.setView(
                            [marker.lat, marker.lng],
                            18,
                            { animate: true }
                          );
                        }
                      }, 100);
                    }
                  }}
                >
                  <View style={styles.notificationHeader}>
                    <Text style={styles.notificationTitle}>
                      {notificacao.titulo}
                    </Text>
                    <Text style={styles.notificationDate}>
                      {(() => {
                        // Compatibilidade: aceita criada_em ou criado_em
                        const dataRaw =
                          notificacao.criada_em || notificacao.criado_em;
                        const d = parseMySQLDate(dataRaw);
                        return d ? d.toLocaleDateString() : "Data inválida";
                      })()}
                    </Text>
                  </View>
                  <Text style={styles.notificationMessage}>
                    {notificacao.mensagem}
                  </Text>
                  {!notificacao.lida && <View style={styles.unreadIndicator} />}
                </TouchableOpacity>
              ))
            )}
          </ScrollView>
        </View>
      </Modal>

      {/* Painel Administrativo Completo */}
      <AdminDashboard
        visible={isAdminDashboardVisible}
        onClose={() => setIsAdminDashboardVisible(false)}
        onSelectMarcador={(marcador) => {
          setSelectedMarker({
            ...marcador,
            lat: marcador.latitude,
            lng: marcador.longitude,
            type: marcador.tipo || marcador.type,
          });
          setTimeout(() => {
            if (window.mapInstance && marcador.latitude && marcador.longitude) {
              window.mapInstance.setView(
                [marcador.latitude, marcador.longitude],
                18,
                { animate: true }
              );
            }
          }, 200);
          setIsAdminDashboardVisible(false);
        }}
        onSelectArea={(area) => {
          setTimeout(() => {
            if (window.mapInstance && area.coordenadas) {
              let coords = area.coordenadas;
              if (typeof coords === "string") {
                try {
                  coords = JSON.parse(coords);
                } catch {}
              }
              if (Array.isArray(coords) && coords.length > 0) {
                const latlngs = coords.map((c) => [c.lat, c.lng]);
                window.mapInstance.fitBounds(latlngs, {
                  padding: [60, 60],
                  animate: true,
                  maxZoom: 18,
                });
              }
            }
          }, 200);
        }}
        onAreasChanged={async () => {
          await carregarAreas(); // Atualiza o estado das áreas do mapa
        }}
      />

      {/* Modal de Exclusão de Área (ONG) */}
      <Modal
        visible={!!areaParaExcluir}
        animationType="fade"
        transparent={true}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.5)",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <View
            style={{
              backgroundColor: "white",
              margin: 20,
              padding: 20,
              borderRadius: 12,
              width: "90%",
              maxWidth: 400,
            }}
          >
            <Text
              style={{
                fontSize: 18,
                fontWeight: "bold",
                marginBottom: 15,
                color: "#DC2626",
              }}
            >
              🗑️ Excluir Área
            </Text>

            <Text style={{ fontSize: 14, color: "#6B7280", marginBottom: 10 }}>
              Tem certeza que deseja excluir a área:
            </Text>

            <Text
              style={{
                fontSize: 16,
                fontWeight: "600",
                color: "#1F2937",
                marginBottom: 20,
              }}
            >
              "{areaParaExcluir?.nome}"
            </Text>

            <Text style={{ fontSize: 14, color: "#DC2626", marginBottom: 20 }}>
              ⚠️ Esta ação não pode ser desfeita!
            </Text>

            <View style={{ flexDirection: "row", justifyContent: "flex-end" }}>
              <TouchableOpacity
                style={{
                  backgroundColor: "#F3F4F6",
                  paddingHorizontal: 16,
                  paddingVertical: 8,
                  borderRadius: 8,
                  marginRight: 10,
                }}
                onPress={() => {
                  setAreaParaExcluir(null);
                }}
              >
                <Text style={{ color: "#6B7280", fontWeight: "600" }}>
                  Cancelar
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={{
                  backgroundColor: "#DC2626",
                  paddingHorizontal: 16,
                  paddingVertical: 8,
                  borderRadius: 8,
                }}
                onPress={confirmarExclusaoArea}
              >
                <Text
                  style={{
                    color: "white",
                    fontWeight: "600",
                  }}
                >
                  Excluir
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal de Exclusão de Marcador (Admin) */}
      <Modal
        visible={!!marcadorParaExcluir}
        animationType="fade"
        transparent={true}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.5)",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <View
            style={{
              backgroundColor: "white",
              margin: 20,
              padding: 20,
              borderRadius: 12,
              width: "90%",
              maxWidth: 400,
            }}
          >
            <Text
              style={{
                fontSize: 18,
                fontWeight: "bold",
                marginBottom: 15,
                color: "#DC2626",
              }}
            >
              🗑️ Excluir Marcador
            </Text>

            <Text style={{ fontSize: 14, color: "#6B7280", marginBottom: 10 }}>
              Tem certeza que deseja excluir o marcador:
            </Text>

            <Text
              style={{
                fontSize: 16,
                fontWeight: "600",
                color: "#1F2937",
                marginBottom: 20,
              }}
            >
              "{marcadorParaExcluir?.nome}"
            </Text>

            <Text style={{ fontSize: 14, color: "#DC2626", marginBottom: 20 }}>
              ⚠️ Esta ação não pode ser desfeita!
            </Text>

            <View style={{ flexDirection: "row", justifyContent: "flex-end" }}>
              <TouchableOpacity
                style={{
                  backgroundColor: "#F3F4F6",
                  paddingHorizontal: 16,
                  paddingVertical: 8,
                  borderRadius: 8,
                  marginRight: 10,
                }}
                onPress={() => {
                  setMarcadorParaExcluir(null);
                }}
              >
                <Text style={{ color: "#6B7280", fontWeight: "600" }}>
                  Cancelar
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={{
                  backgroundColor: "#DC2626",
                  paddingHorizontal: 16,
                  paddingVertical: 8,
                  borderRadius: 8,
                }}
                onPress={confirmarExclusaoMarcador}
              >
                <Text
                  style={{
                    color: "white",
                    fontWeight: "600",
                  }}
                >
                  Excluir
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal de Denúncia */}
      <Modal
        visible={isDenunciaModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setIsDenunciaModalVisible(false)}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: "#FFFFFF",
          }}
        >
          {/* Header do Modal */}
          <View
            style={{
              backgroundColor: "#F8FAFC",
              paddingTop: Platform.OS === "web" ? 20 : 50,
              paddingHorizontal: 20,
              paddingBottom: 20,
              borderBottomWidth: 1,
              borderBottomColor: "#E2E8F0",
            }}
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <Text
                style={{
                  fontSize: 20,
                  fontWeight: "700",
                  color: "#1E293B",
                }}
              >
                🚨 Denunciar Marcador
              </Text>
              <TouchableOpacity
                onPress={() => setIsDenunciaModalVisible(false)}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 16,
                  backgroundColor: "#E2E8F0",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Text style={{ fontSize: 18, color: "#64748B" }}>✕</Text>
              </TouchableOpacity>
            </View>
          </View>

          <ScrollView style={{ flex: 1, padding: 20 }}>
            {/* Informações do marcador */}
            {marcadorParaDenunciar && (
              <View
                style={{
                  backgroundColor: "#F1F5F9",
                  borderRadius: 12,
                  padding: 16,
                  marginBottom: 24,
                  borderWidth: 1,
                  borderColor: "#E2E8F0",
                }}
              >
                <Text
                  style={{
                    fontSize: 16,
                    fontWeight: "600",
                    color: "#334155",
                    marginBottom: 8,
                  }}
                >
                  📍 Marcador a ser denunciado:
                </Text>
                <Text
                  style={{
                    fontSize: 14,
                    color: "#64748B",
                    marginBottom: 4,
                  }}
                >
                  <Text style={{ fontWeight: "600" }}>Nome:</Text>{" "}
                  {marcadorParaDenunciar.nome}
                </Text>
                <Text
                  style={{
                    fontSize: 14,
                    color: "#64748B",
                    marginBottom: 4,
                  }}
                >
                  <Text style={{ fontWeight: "600" }}>Tipo:</Text>{" "}
                  {PROBLEM_TYPES.find(
                    (t) => t.value === marcadorParaDenunciar.type
                  )?.label || marcadorParaDenunciar.type}
                </Text>
                <Text
                  style={{
                    fontSize: 14,
                    color: "#64748B",
                  }}
                >
                  <Text style={{ fontWeight: "600" }}>Descrição:</Text>{" "}
                  {marcadorParaDenunciar.description || "Sem descrição"}
                </Text>
              </View>
            )}

            {/* Motivo da denúncia */}
            <Text
              style={{
                fontSize: 16,
                fontWeight: "600",
                color: "#334155",
                marginBottom: 12,
              }}
            >
              Motivo da denúncia *
            </Text>

            {MOTIVOS_DENUNCIA.map((motivo) => (
              <TouchableOpacity
                key={motivo.value}
                onPress={() => setMotivoDenuncia(motivo.value)}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  paddingVertical: 12,
                  paddingHorizontal: 16,
                  borderRadius: 8,
                  marginBottom: 8,
                  backgroundColor:
                    motivoDenuncia === motivo.value ? "#EEF2FF" : "#F8FAFC",
                  borderWidth: 1,
                  borderColor:
                    motivoDenuncia === motivo.value ? "#3B82F6" : "#E2E8F0",
                }}
              >
                <View
                  style={{
                    width: 20,
                    height: 20,
                    borderRadius: 10,
                    backgroundColor:
                      motivoDenuncia === motivo.value
                        ? "#3B82F6"
                        : "transparent",
                    borderWidth: 2,
                    borderColor:
                      motivoDenuncia === motivo.value ? "#3B82F6" : "#CBD5E1",
                    alignItems: "center",
                    justifyContent: "center",
                    marginRight: 12,
                  }}
                >
                  {motivoDenuncia === motivo.value && (
                    <Text style={{ color: "#FFFFFF", fontSize: 12 }}>✓</Text>
                  )}
                </View>
                <Text
                  style={{
                    fontSize: 14,
                    color: "#334155",
                    fontWeight: motivoDenuncia === motivo.value ? "600" : "400",
                  }}
                >
                  {motivo.label}
                </Text>
              </TouchableOpacity>
            ))}

            {/* Descrição adicional */}
            <Text
              style={{
                fontSize: 16,
                fontWeight: "600",
                color: "#334155",
                marginTop: 24,
                marginBottom: 12,
              }}
            >
              Descrição adicional (opcional)
            </Text>
            <TextInput
              style={{
                borderWidth: 1,
                borderColor: "#E2E8F0",
                borderRadius: 8,
                padding: 12,
                fontSize: 14,
                backgroundColor: "#FFFFFF",
                minHeight: 80,
                textAlignVertical: "top",
              }}
              placeholder="Forneça mais detalhes sobre o problema..."
              placeholderTextColor="#94A3B8"
              multiline
              numberOfLines={4}
              value={descricaoDenuncia}
              onChangeText={setDescricaoDenuncia}
            />

            {/* Disclaimer */}
            <View
              style={{
                backgroundColor: "#FEF3C7",
                borderRadius: 8,
                padding: 12,
                marginTop: 20,
                borderWidth: 1,
                borderColor: "#F59E0B",
              }}
            >
              <Text
                style={{
                  fontSize: 13,
                  color: "#92400E",
                  lineHeight: 18,
                }}
              >
                ⚠️ <Text style={{ fontWeight: "600" }}>Importante:</Text>{" "}
                Denúncias falsas ou mal-intencionadas podem resultar em
                restrições à sua conta. Certifique-se de que sua denúncia é
                justificada.
              </Text>
            </View>
          </ScrollView>

          {/* Botões de ação */}
          <View
            style={{
              padding: 20,
              borderTopWidth: 1,
              borderTopColor: "#E2E8F0",
              backgroundColor: "#F8FAFC",
            }}
          >
            <TouchableOpacity
              onPress={enviarDenuncia}
              disabled={!motivoDenuncia}
              style={{
                backgroundColor: motivoDenuncia ? "#DC2626" : "#CBD5E1",
                borderRadius: 8,
                paddingVertical: 16,
                alignItems: "center",
                marginBottom: 12,
              }}
            >
              <Text
                style={{
                  color: "#FFFFFF",
                  fontSize: 16,
                  fontWeight: "600",
                }}
              >
                🚨 Enviar Denúncia
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setIsDenunciaModalVisible(false)}
              style={{
                backgroundColor: "transparent",
                borderRadius: 8,
                paddingVertical: 16,
                alignItems: "center",
              }}
            >
              <Text
                style={{
                  color: "#64748B",
                  fontSize: 16,
                  fontWeight: "500",
                }}
              >
                Cancelar
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      {/* Modal para motivo/descrição da área */}
      <Modal
        visible={modalMotivoVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalMotivoVisible(false)}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.4)",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <View
            style={{
              backgroundColor: "white",
              padding: 24,
              borderRadius: 12,
              width: "85%",
            }}
          >
            <Text
              style={{ fontSize: 18, fontWeight: "bold", marginBottom: 12 }}
            >
              Motivo/Descrição do pedido
            </Text>
            <TextInput
              style={{
                borderWidth: 1,
                borderColor: "#E5E7EB",
                borderRadius: 8,
                padding: 10,
                minHeight: 60,
                marginBottom: 16,
              }}
              placeholder="Descreva o motivo do pedido da área..."
              value={motivoArea}
              onChangeText={setMotivoArea}
              multiline
              editable={!finalizarAreaPending}
            />
            <View
              style={{
                flexDirection: "row",
                justifyContent: "flex-end",
                gap: 12,
              }}
            >
              <TouchableOpacity
                style={{
                  paddingVertical: 8,
                  paddingHorizontal: 18,
                  borderRadius: 8,
                  backgroundColor: "#F3F4F6",
                  marginRight: 8,
                }}
                onPress={() => {
                  setModalMotivoVisible(false);
                  setMotivoArea("");
                }}
                disabled={finalizarAreaPending}
              >
                <Text style={{ color: "#6B7280", fontWeight: "bold" }}>
                  Cancelar
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={{
                  paddingVertical: 8,
                  paddingHorizontal: 18,
                  borderRadius: 8,
                  backgroundColor: "#10B981",
                }}
                onPress={confirmarCadastroArea}
                disabled={finalizarAreaPending}
              >
                <Text style={{ color: "white", fontWeight: "bold" }}>
                  {finalizarAreaPending ? "Salvando..." : "Confirmar"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// Estilos
const styles = {
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  modalContainer: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
    backgroundColor: "#ffffff",
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
  },
  closeButtonText: {
    fontSize: 24,
    color: "#6B7280",
    fontWeight: "300",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#1F2937",
  },
  headerSpacer: {
    width: 32,
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  locationText: {
    fontSize: 14,
    color: "#6B7280",
    marginBottom: 24,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1F2937",
    marginBottom: 12,
  },
  pickerContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 24,
  },
  typeButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#E5E7EB",
    backgroundColor: "#ffffff",
    minWidth: 120,
  },
  typeButtonSelected: {
    borderColor: "#3B82F6",
    backgroundColor: "#EFF6FF",
  },
  typeEmoji: {
    fontSize: 20,
    marginRight: 8,
  },
  typeText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#6B7280",
  },
  typeTextSelected: {
    color: "#3B82F6",
  },
  textInput: {
    borderWidth: 2,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: "#1F2937",
    backgroundColor: "#ffffff",
    textAlignVertical: "top",
    marginBottom: 24,
    minHeight: 100,
  },
  imageButton: {
    borderWidth: 2,
    borderColor: "#D1D5DB",
    borderStyle: "dashed",
    borderRadius: 12,
    paddingVertical: 24,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F9FAFB",
    marginBottom: 24,
  },
  imageButtonText: {
    fontSize: 16,
    color: "#6B7280",
    fontWeight: "500",
  },
  submitButton: {
    backgroundColor: "#3B82F6",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 32,
  },
  submitButtonDisabled: {
    backgroundColor: "#D1D5DB",
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#ffffff",
  },
  problemTypeDisplay: {
    borderWidth: 2,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#F9FAFB",
    marginBottom: 24,
  },
  problemTypeText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1F2937",
  },
  descriptionDisplay: {
    borderWidth: 2,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#F9FAFB",
    marginBottom: 24,
    minHeight: 100,
  },
  descriptionText: {
    fontSize: 16,
    color: "#1F2937",
    lineHeight: 24,
  },
  imageContainer: {
    borderWidth: 2,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    overflow: "hidden",
    marginBottom: 24,
    backgroundColor: "#F9FAFB",
    padding: 8,
  },
  imageCarouselContainer: {
    marginBottom: 24,
  },
  resolvedStyle: {
    opacity: 0.6,
    borderColor: "#10B981",
    backgroundColor: "#ECFDF5",
  },
  resolvedBanner: {
    backgroundColor: "#ECFDF5",
    borderWidth: 2,
    borderColor: "#10B981",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 24,
    alignItems: "center",
  },
  resolvedBannerText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#059669",
    marginBottom: 4,
  },
  resolvedDate: {
    fontSize: 14,
    color: "#047857",
  },
  resolveButton: {
    backgroundColor: "#10B981",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 32,
  },
  resolveButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#ffffff",
  },
  deleteButton: {
    backgroundColor: "#EF4444",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 16,
    marginTop: 8,
  },
  deleteButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#ffffff",
  },
  warningBanner: {
    position: "absolute",
    top: 10,
    left: 10,
    right: 10,
    backgroundColor: "#FEF3C7",
    borderWidth: 1,
    borderColor: "#F59E0B",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    zIndex: 1000,
  },
  warningText: {
    fontSize: 12,
    color: "#92400E",
    textAlign: "center",
    fontWeight: "500",
  },
  // Estilos para interface ONG
  ongInterface: {
    position: "absolute",
    top: 60,
    left: 10,
    right: 10,
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    borderRadius: 12,
    padding: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    zIndex: 1000,
  },
  ongHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  ongTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1F2937",
    flex: 1,
  },
  ongActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  ongButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
    elevation: 3,
  },
  ongButtonText: {
    fontSize: 18,
  },
  notificationButton: {
    backgroundColor: "#3B82F6",
    position: "relative",
  },
  areaButton: {
    backgroundColor: "#10B981",
  },
  drawButton: {
    backgroundColor: "#F59E0B",
  },
  finishButton: {
    backgroundColor: "#059669",
  },
  cancelButton: {
    backgroundColor: "#EF4444",
  },
  drawingControls: {
    flexDirection: "row",
    gap: 8,
  },
  notificationBadge: {
    position: "absolute",
    top: -2,
    right: -2,
    backgroundColor: "#EF4444",
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 4,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  drawingStatus: {
    marginTop: 8,
    padding: 8,
    backgroundColor: "#FEF3C7",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#F59E0B",
  },
  drawingText: {
    fontSize: 12,
    color: "#92400E",
    textAlign: "center",
    fontWeight: "500",
  },
  // Estilos para modais de área e notificações
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  emptyStateText: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1F2937",
    marginBottom: 8,
  },
  emptyStateDescription: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 20,
  },
  areaItem: {
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  areaHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  areaName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1F2937",
    flex: 1,
  },
  areaDate: {
    fontSize: 12,
    color: "#6B7280",
  },
  areaPoints: {
    fontSize: 14,
    color: "#059669",
    marginBottom: 4,
  },
  areaDescription: {
    fontSize: 14,
    color: "#4B5563",
    lineHeight: 18,
  },
  notificationItem: {
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    position: "relative",
  },
  notificationUnread: {
    backgroundColor: "#EFF6FF",
    borderColor: "#3B82F6",
  },
  notificationHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1F2937",
    flex: 1,
  },
  notificationDate: {
    fontSize: 12,
    color: "#6B7280",
  },
  notificationMessage: {
    fontSize: 14,
    color: "#4B5563",
    lineHeight: 18,
  },
  unreadIndicator: {
    position: "absolute",
    top: 16,
    right: 16,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#3B82F6",
  },
  deleteAreaButton: {
    backgroundColor: "#DC2626",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginTop: 8,
    alignItems: "center",
  },
  deleteAreaButtonText: {
    color: "white",
    fontSize: 12,
    fontWeight: "600",
  },
  deleteButton: {
    backgroundColor: "#DC2626",
  },
  areaStatus: {
    marginTop: 8,
    marginBottom: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    fontSize: 12,
    fontWeight: "600",
    alignSelf: "flex-start",
  },
  userInterface: {
    position: "absolute",
    top: 20,
    right: 20,
    zIndex: 1000,
  },
  deleteAccountButton: {
    backgroundColor: "#DC2626",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  deleteAccountButtonText: {
    color: "white",
    fontSize: 12,
    fontWeight: "600",
  },
};
