// AdminDashboard.js
// Painel administrativo completo para admins e ONGs

import React, { useState, useEffect } from 'react';
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
  RefreshControl
} from 'react-native';
import { useAuth } from './AuthComponents';
import { adminAPI, denunciasAPI, lugaresAPI, areasAPI } from './api';

const { width, height } = Dimensions.get('window');

const AdminDashboard = ({ visible, onClose }) => {
  const { usuario } = useAuth();
  const [activeTab, setActiveTab] = useState('denuncias');
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  
  // Estados para denúncias
  const [denuncias, setDenuncias] = useState([]);
  const [denunciaSelected, setDenunciaSelected] = useState(null);
  const [observacoes, setObservacoes] = useState('');
  
  // Estados para áreas
  const [areasPendentes, setAreasPendentes] = useState([]);
  const [todasAreas, setTodasAreas] = useState([]);
  const [areaSelected, setAreaSelected] = useState(null);
  const [motivoRejeicao, setMotivoRejeicao] = useState('');
  
  // Estados para marcadores
  const [marcadores, setMarcadores] = useState([]);
  const [marcadorSelected, setMarcadorSelected] = useState(null);

  useEffect(() => {
    if (visible && usuario && (usuario.tipo === 'admin' || usuario.tipo === 'ong')) {
      carregarDados();
    }
  }, [visible, usuario, activeTab]);

  const carregarDados = async () => {
    setLoading(true);
    try {
      await Promise.all([
        carregarDenuncias(),
        carregarAreas(),
        carregarMarcadores()
      ]);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      Alert.alert('Erro', 'Falha ao carregar dados do painel');
    } finally {
      setLoading(false);
    }
  };

  const carregarDenuncias = async () => {
    try {
      const token = localStorage.getItem('mapcity_token');
      const response = await denunciasAPI.listarDenuncias(token);
      
      // Backend retorna um array diretamente, não um objeto com propriedade denuncias
      setDenuncias(Array.isArray(response) ? response : (response.denuncias || []));
    } catch (error) {
      console.error('Erro ao carregar denúncias:', error);
    }
  };

  const carregarAreas = async () => {
    try {
      if (usuario.tipo === 'admin') {
        const [pendentes, todas] = await Promise.all([
          adminAPI.buscarAreasPendentes(),
          adminAPI.buscarTodasAreas()
        ]);
        setAreasPendentes(pendentes.areas || []);
        setTodasAreas(todas.areas || []);
      } else if (usuario.tipo === 'ong') {
        const areas = await areasAPI.buscarAreas();
        setTodasAreas(areas.areas || []);
        setAreasPendentes(areas.areas?.filter(area => area.status === 'pendente') || []);
      }
    } catch (error) {
      console.error('Erro ao carregar áreas:', error);
    }
  };

  const carregarMarcadores = async () => {
    try {
      const response = await lugaresAPI.buscarTodos();
      
      // Normalizar coordenadas (converter strings para números se necessário)
      const marcadoresNormalizados = response.map(marcador => ({
        ...marcador,
        latitude: typeof marcador.latitude === 'string' ? parseFloat(marcador.latitude) : marcador.latitude,
        longitude: typeof marcador.longitude === 'string' ? parseFloat(marcador.longitude) : marcador.longitude
      }));
      
      if (usuario.tipo === 'ong') {
        // Para ONGs, filtrar apenas marcadores em suas áreas aprovadas
        const areasAprovadas = todasAreas.filter(area => area.status === 'aprovada');
        const marcadoresFiltrados = marcadoresNormalizados.filter(marcador => {
          // Verificar se as coordenadas são válidas
          if (typeof marcador.latitude !== 'number' || typeof marcador.longitude !== 'number' || 
              isNaN(marcador.latitude) || isNaN(marcador.longitude)) {
            return false;
          }
          
          return areasAprovadas.some(area => 
            pontoDentroDoPoligono(
              { lat: marcador.latitude, lng: marcador.longitude },
              area.coordenadas
            )
          );
        });
        setMarcadores(marcadoresFiltrados);
      } else {
        setMarcadores(marcadoresNormalizados);
      }
    } catch (error) {
      console.error('Erro ao carregar marcadores:', error);
    }
  };

  // Função auxiliar para verificar se um ponto está dentro de um polígono
  const pontoDentroDoPoligono = (ponto, coordenadas) => {
    try {
      const coords = Array.isArray(coordenadas) ? coordenadas : JSON.parse(coordenadas);
      const x = ponto.lat;
      const y = ponto.lng;
      let dentro = false;

      for (let i = 0, j = coords.length - 1; i < coords.length; j = i++) {
        const xi = coords[i].lat;
        const yi = coords[i].lng;
        const xj = coords[j].lat;
        const yj = coords[j].lng;

        if (((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi)) {
          dentro = !dentro;
        }
      }

      return dentro;
    } catch (error) {
      console.error('Erro ao verificar ponto no polígono:', error);
      return false;
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await carregarDados();
    setRefreshing(false);
  };

  // Funções para denúncias
  const processarDenuncia = async (denunciaId, acao) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('mapcity_token');
      await denunciasAPI.processarDenuncia(denunciaId, acao, observacoes, token);
      
      Alert.alert(
        'Sucesso', 
        `Denúncia ${acao === 'aceitar' ? 'aceita' : 'rejeitada'} com sucesso`
      );
      
      setDenunciaSelected(null);
      setObservacoes('');
      await carregarDenuncias();
    } catch (error) {
      Alert.alert('Erro', error.message);
    } finally {
      setLoading(false);
    }
  };

  // Funções para áreas
  const aprovarArea = async (areaId) => {
    try {
      setLoading(true);
      await adminAPI.aprovarArea(areaId);
      Alert.alert('Sucesso', 'Área aprovada com sucesso');
      await carregarAreas();
    } catch (error) {
      Alert.alert('Erro', error.message);
    } finally {
      setLoading(false);
    }
  };

  const rejeitarArea = async (areaId) => {
    if (!motivoRejeicao.trim()) {
      Alert.alert('Erro', 'Digite o motivo da rejeição');
      return;
    }

    try {
      setLoading(true);
      await adminAPI.rejeitarArea(areaId, motivoRejeicao.trim());
      Alert.alert('Sucesso', 'Área rejeitada com sucesso');
      setAreaSelected(null);
      setMotivoRejeicao('');
      await carregarAreas();
    } catch (error) {
      Alert.alert('Erro', error.message);
    } finally {
      setLoading(false);
    }
  };

  const excluirArea = async (areaId) => {
    Alert.alert(
      'Confirmar Exclusão',
      'Tem certeza que deseja excluir esta área? Esta ação não pode ser desfeita.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              await adminAPI.excluirArea(areaId);
              Alert.alert('Sucesso', 'Área excluída com sucesso');
              await carregarAreas();
            } catch (error) {
              Alert.alert('Erro', error.message);
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  // Funções para marcadores
  const excluirMarcador = async (marcadorId) => {
    Alert.alert(
      'Confirmar Exclusão',
      'Tem certeza que deseja excluir este marcador? Esta ação não pode ser desfeita.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              await lugaresAPI.deletar(marcadorId);
              Alert.alert('Sucesso', 'Marcador excluído com sucesso');
              await carregarMarcadores();
            } catch (error) {
              Alert.alert('Erro', error.message);
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  const marcarComoResolvido = async (marcadorId, resolvido) => {
    try {
      setLoading(true);
      await lugaresAPI.resolver(marcadorId, resolvido);
      Alert.alert('Sucesso', `Marcador ${resolvido ? 'resolvido' : 'reaberto'} com sucesso`);
      await carregarMarcadores();
    } catch (error) {
      Alert.alert('Erro', error.message);
    } finally {
      setLoading(false);
    }
  };

  const renderDenuncias = () => {
    const denunciasPendentes = denuncias.filter(d => d.status === 'pendente');
    
    return (
      <ScrollView 
        style={styles.tabContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Header com contador */}
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 16,
          padding: 16,
          backgroundColor: denunciasPendentes.length > 0 ? '#FEF3C7' : '#F0F9FF',
          borderRadius: 12,
          borderWidth: 1,
          borderColor: denunciasPendentes.length > 0 ? '#F59E0B' : '#0EA5E9',
        }}>
          <View>
            <Text style={[styles.sectionTitle, { marginBottom: 4 }]}>
              🚨 Denúncias Pendentes
            </Text>
            <Text style={{
              fontSize: 14,
              color: '#6B7280',
            }}>
              {denunciasPendentes.length === 0 
                ? 'Nenhuma denúncia pendente' 
                : `${denunciasPendentes.length} denúncia${denunciasPendentes.length > 1 ? 's' : ''} aguardando análise`
              }
            </Text>
          </View>
          
          {denunciasPendentes.length > 0 && (
            <View style={{
              backgroundColor: '#DC2626',
              borderRadius: 20,
              paddingHorizontal: 12,
              paddingVertical: 6,
              minWidth: 32,
              alignItems: 'center',
            }}>
              <Text style={{
                color: '#FFFFFF',
                fontSize: 14,
                fontWeight: '700',
              }}>
                {denunciasPendentes.length}
              </Text>
            </View>
          )}
        </View>

        {/* Lista de denúncias */}
        {denunciasPendentes.map(denuncia => (
          <View key={denuncia.id} style={{
            ...styles.card,
            borderLeftWidth: 4,
            borderLeftColor: '#DC2626',
            backgroundColor: '#FFFBEB',
          }}>
            <View style={styles.cardHeader}>
              <Text style={{
                ...styles.cardTitle,
                color: '#DC2626',
              }}>
                📍 {denuncia.marcador_titulo || denuncia.marcador_nome}
              </Text>
              <View style={[styles.badge, { backgroundColor: '#FEE2E2', borderColor: '#EF4444' }]}>
                <Text style={{ ...styles.badgeText, color: '#DC2626' }}>
                  🚨 Pendente
                </Text>
              </View>
            </View>
            
            {/* Informações da denúncia com ícones */}
            <View style={{ marginVertical: 8 }}>
              <Text style={{
                ...styles.cardText,
                fontWeight: '600',
                color: '#7C2D12',
                marginBottom: 6,
              }}>
                ⚠️ Motivo: {denuncia.motivo === 'conteudo_inadequado' ? 'Conteúdo inadequado' :
                           denuncia.motivo === 'informacao_incorreta' ? 'Informação incorreta' :
                           denuncia.motivo === 'spam' ? 'Spam ou duplicação' :
                           denuncia.motivo === 'local_incorreto' ? 'Localização incorreta' :
                           denuncia.motivo === 'ja_resolvido' ? 'Problema já foi resolvido' :
                           denuncia.motivo || 'Não especificado'}
              </Text>
              
              <Text style={styles.cardText}>
                👤 Denunciante: {denuncia.denunciante_nome} ({denuncia.denunciante_email})
              </Text>
              
              <Text style={styles.cardText}>
                📅 Data: {new Date(denuncia.criada_em).toLocaleDateString('pt-BR', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </Text>
              
              {denuncia.latitude && denuncia.longitude && (
                <Text style={styles.cardText}>
                  🌍 Localização: {parseFloat(denuncia.latitude).toFixed(6)}, {parseFloat(denuncia.longitude).toFixed(6)}
                </Text>
              )}
            </View>
            
            {/* Descrição da denúncia */}
            {denuncia.descricao && (
              <View style={{
                backgroundColor: '#FEF3C7',
                borderRadius: 8,
                padding: 12,
                marginVertical: 8,
                borderWidth: 1,
                borderColor: '#F59E0B',
              }}>
                <Text style={{
                  fontSize: 13,
                  fontWeight: '600',
                  color: '#92400E',
                  marginBottom: 4,
                }}>
                  💬 Descrição adicional:
                </Text>
                <Text style={{
                  fontSize: 13,
                  color: '#92400E',
                  lineHeight: 18,
                }}>
                  {denuncia.descricao}
                </Text>
              </View>
            )}

            {/* Informações do marcador denunciado */}
            {denuncia.marcador_descricao && (
              <View style={{
                backgroundColor: '#F1F5F9',
                borderRadius: 8,
                padding: 12,
                marginVertical: 8,
                borderWidth: 1,
                borderColor: '#E2E8F0',
              }}>
                <Text style={{
                  fontSize: 13,
                  fontWeight: '600',
                  color: '#334155',
                  marginBottom: 4,
                }}>
                  📝 Descrição do marcador:
                </Text>
                <Text style={{
                  fontSize: 13,
                  color: '#64748B',
                  lineHeight: 18,
                }}>
                  {denuncia.marcador_descricao}
                </Text>
              </View>
            )}
            
            {/* Botões de ação melhorados */}
            <View style={{
              ...styles.cardActions,
              marginTop: 16,
              paddingTop: 16,
              borderTopWidth: 1,
              borderTopColor: '#F3F4F6',
            }}>
              <TouchableOpacity 
                style={{
                  ...styles.button,
                  backgroundColor: '#059669',
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingHorizontal: 16,
                }}
                onPress={() => processarDenuncia(denuncia.id, 'aceitar')}
              >
                <Text style={{ ...styles.buttonText, marginRight: 6 }}>✅</Text>
                <Text style={styles.buttonText}>Aceitar</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={{
                  ...styles.button,
                  backgroundColor: '#DC2626',
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingHorizontal: 16,
                }}
                onPress={() => setDenunciaSelected(denuncia)}
              >
                <Text style={{ ...styles.buttonText, marginRight: 6 }}>❌</Text>
                <Text style={styles.buttonText}>Rejeitar</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
        
        {/* Estado vazio melhorado */}
        {denunciasPendentes.length === 0 && (
          <View style={{
            ...styles.emptyState,
            backgroundColor: '#F0FDF4',
            borderWidth: 1,
            borderColor: '#BBF7D0',
            borderRadius: 12,
            padding: 24,
            marginTop: 20,
          }}>
            <Text style={{
              fontSize: 48,
              marginBottom: 12,
            }}>
              ✅
            </Text>
            <Text style={{
              ...styles.emptyText,
              color: '#059669',
              fontWeight: '600',
              marginBottom: 8,
            }}>
              Tudo em ordem!
            </Text>
            <Text style={{
              ...styles.emptyText,
              color: '#065F46',
              fontSize: 14,
            }}>
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
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {usuario.tipo === 'admin' && (
        <>
          <Text style={styles.sectionTitle}>
            Áreas Pendentes de Aprovação ({areasPendentes.length})
          </Text>
          
          {areasPendentes.map(area => (
            <View key={area.id} style={styles.card}>
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
                <TouchableOpacity 
                  style={[styles.button, styles.buttonSuccess]}
                  onPress={() => aprovarArea(area.id)}
                >
                  <Text style={styles.buttonText}>Aprovar</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.button, styles.buttonDanger]}
                  onPress={() => setAreaSelected(area)}
                >
                  <Text style={styles.buttonText}>Rejeitar</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </>
      )}
      
      <Text style={styles.sectionTitle}>
        Todas as Áreas ({todasAreas.length})
      </Text>
      
      {todasAreas.map(area => (
        <View key={area.id} style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>{area.nome}</Text>
            <View style={[
              styles.badge, 
              area.status === 'aprovada' ? styles.badgeSuccess : 
              area.status === 'rejeitada' ? styles.badgeDanger : styles.badgePending
            ]}>
              <Text style={styles.badgeText}>
                {area.status === 'aprovada' ? 'Aprovada' : 
                 area.status === 'rejeitada' ? 'Rejeitada' : 'Pendente'}
              </Text>
            </View>
          </View>
          
          <Text style={styles.cardText}>ONG: {area.ong_nome}</Text>
          <Text style={styles.cardText}>Descrição: {area.descricao}</Text>
          
          {area.status === 'rejeitada' && area.motivo_rejeicao && (
            <Text style={styles.cardTextDanger}>
              Motivo da rejeição: {area.motivo_rejeicao}
            </Text>
          )}
          
          {(usuario.tipo === 'admin' || (usuario.tipo === 'ong' && area.ong_id === usuario.id)) && (
            <View style={styles.cardActions}>
              <TouchableOpacity 
                style={[styles.button, styles.buttonDanger]}
                onPress={() => excluirArea(area.id)}
              >
                <Text style={styles.buttonText}>Excluir</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      ))}
      
      {todasAreas.length === 0 && (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>Nenhuma área encontrada</Text>
        </View>
      )}
    </ScrollView>
  );

  const renderMarcadores = () => (
    <ScrollView 
      style={styles.tabContent}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <Text style={styles.sectionTitle}>
        Marcadores {usuario.tipo === 'ong' ? 'na sua área' : 'no sistema'} ({marcadores.length})
      </Text>
      
      {marcadores.map(marcador => (
        <View key={marcador.id} style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>{marcador.nome}</Text>
            <View style={[
              styles.badge, 
              marcador.resolvido ? styles.badgeSuccess : styles.badgeWarning
            ]}>
              <Text style={styles.badgeText}>
                {marcador.resolvido ? 'Resolvido' : 'Pendente'}
              </Text>
            </View>
          </View>
          
          <Text style={styles.cardText}>Tipo: {marcador.tipo}</Text>
          <Text style={styles.cardText}>Descrição: {marcador.descricao}</Text>
          <Text style={styles.cardText}>
            Localização: {
              typeof marcador.latitude === 'number' && typeof marcador.longitude === 'number'
                ? `${marcador.latitude.toFixed(6)}, ${marcador.longitude.toFixed(6)}`
                : `${marcador.latitude || 'N/A'}, ${marcador.longitude || 'N/A'}`
            }
          </Text>
          <Text style={styles.cardText}>
            Criado em: {new Date(marcador.criado_em).toLocaleDateString()}
          </Text>
          
          {marcador.resolvido && marcador.resolvido_em && (
            <Text style={styles.cardTextSuccess}>
              Resolvido em: {new Date(marcador.resolvido_em).toLocaleDateString()}
            </Text>
          )}
          
          <View style={styles.cardActions}>
            <TouchableOpacity 
              style={[styles.button, marcador.resolvido ? styles.buttonWarning : styles.buttonSuccess]}
              onPress={() => marcarComoResolvido(marcador.id, !marcador.resolvido)}
            >
              <Text style={styles.buttonText}>
                {marcador.resolvido ? 'Reabrir' : 'Resolver'}
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.button, styles.buttonDanger]}
              onPress={() => excluirMarcador(marcador.id)}
            >
              <Text style={styles.buttonText}>Excluir</Text>
            </TouchableOpacity>
          </View>
        </View>
      ))}
      
      {marcadores.length === 0 && (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>Nenhum marcador encontrado</Text>
        </View>
      )}
    </ScrollView>
  );

  const renderTabButtons = () => {
    const denunciasPendentes = denuncias.filter(d => d.status === 'pendente').length;
    
    return (
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'denuncias' && styles.activeTab]}
          onPress={() => setActiveTab('denuncias')}
        >
          <View style={{ 
            flexDirection: 'row', 
            alignItems: 'center',
            position: 'relative',
          }}>
            <Text style={[styles.tabText, activeTab === 'denuncias' && styles.activeTabText]}>
              Denúncias
            </Text>
            {denunciasPendentes > 0 && (
              <View style={{
                backgroundColor: '#DC2626',
                borderRadius: 10,
                paddingHorizontal: 6,
                paddingVertical: 2,
                marginLeft: 8,
                minWidth: 20,
                alignItems: 'center',
              }}>
                <Text style={{
                  color: '#FFFFFF',
                  fontSize: 11,
                  fontWeight: '700',
                }}>
                  {denunciasPendentes > 99 ? '99+' : denunciasPendentes}
                </Text>
              </View>
            )}
          </View>
        </TouchableOpacity>
      
      <TouchableOpacity
        style={[styles.tab, activeTab === 'areas' && styles.activeTab]}
        onPress={() => setActiveTab('areas')}
      >
        <Text style={[styles.tabText, activeTab === 'areas' && styles.activeTabText]}>
          Áreas
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity
        style={[styles.tab, activeTab === 'marcadores' && styles.activeTab]}
        onPress={() => setActiveTab('marcadores')}
      >
        <Text style={[styles.tabText, activeTab === 'marcadores' && styles.activeTabText]}>
          Marcadores
        </Text>
        </TouchableOpacity>
    </View>
    );
  };

  if (!usuario || (usuario.tipo !== 'admin' && usuario.tipo !== 'ong')) {
    return null;
  }  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>
            Painel {usuario.tipo === 'admin' ? 'Administrativo' : 'da ONG'}
          </Text>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
        </View>

        {renderTabButtons()}

        <View style={styles.content}>
          {activeTab === 'denuncias' && renderDenuncias()}
          {activeTab === 'areas' && renderAreas()}
          {activeTab === 'marcadores' && renderMarcadores()}
        </View>

        {/* Modal para rejeitar denúncia */}
        <Modal
          visible={denunciaSelected !== null}
          transparent
          animationType="fade"
          onRequestClose={() => setDenunciaSelected(null)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Rejeitar Denúncia</Text>
              
              <TextInput
                style={styles.textArea}
                placeholder="Observações (opcional)"
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
                    setObservacoes('');
                  }}
                >
                  <Text style={styles.buttonText}>Cancelar</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.button, styles.buttonDanger]}
                  onPress={() => processarDenuncia(denunciaSelected.id, 'rejeitar')}
                >
                  <Text style={styles.buttonText}>Rejeitar</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Modal para rejeitar área */}
        <Modal
          visible={areaSelected !== null}
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
                    setMotivoRejeicao('');
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

        {loading && (
          <View style={styles.loadingOverlay}>
            <View style={styles.loadingContent}>
              <Text style={styles.loadingText}>Carregando...</Text>
            </View>
          </View>
        )}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#2E7D32',
    paddingTop: 50,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  closeButton: {
    padding: 8,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 20,
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#2E7D32',
  },
  tabText: {
    fontSize: 16,
    color: '#6b7280',
  },
  activeTabText: {
    color: '#2E7D32',
    fontWeight: 'bold',
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
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 16,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
    flex: 1,
    marginRight: 8,
  },
  cardText: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 6,
  },
  cardTextSuccess: {
    fontSize: 14,
    color: '#10b981',
    marginBottom: 6,
  },
  cardTextDanger: {
    fontSize: 14,
    color: '#ef4444',
    marginBottom: 6,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgePending: {
    backgroundColor: '#fef3c7',
  },
  badgeSuccess: {
    backgroundColor: '#d1fae5',
  },
  badgeDanger: {
    backgroundColor: '#fecaca',
  },
  badgeWarning: {
    backgroundColor: '#fed7aa',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 12,
    gap: 8,
  },
  button: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  buttonSuccess: {
    backgroundColor: '#10b981',
  },
  buttonDanger: {
    backgroundColor: '#ef4444',
  },
  buttonWarning: {
    backgroundColor: '#f59e0b',
  },
  buttonSecondary: {
    backgroundColor: '#6b7280',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#6b7280',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    width: width * 0.9,
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 16,
  },
  textArea: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    textAlignVertical: 'top',
    minHeight: 100,
    marginBottom: 16,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingContent: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 20,
  },
  loadingText: {
    fontSize: 16,
    color: '#1f2937',
  },
});

export default AdminDashboard;
