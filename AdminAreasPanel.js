import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Modal, ScrollView, Alert, TextInput } from 'react-native';
import { useAuth } from './AuthComponents';
import { adminAreasAPI } from './AdminAreasAPI';

const AdminAreasPanel = ({ visible, onClose, onAreaUpdate }) => {
  const { usuario } = useAuth();
  const [areasPendentes, setAreasPendentes] = useState([]);
  const [todasAreas, setTodasAreas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('pendentes');
  const [motivoRejeicao, setMotivoRejeicao] = useState('');
  const [areaParaRejeitar, setAreaParaRejeitar] = useState(null);
  const [areaParaAprovar, setAreaParaAprovar] = useState(null);

  useEffect(() => {
    if (visible && usuario?.tipo === 'admin') {
      carregarDados();
    }
  }, [visible, usuario]);

  const carregarDados = async () => {
    setLoading(true);
    try {
  // Buscar áreas pendentes diretamente da API correta
  const pendentes = await adminAreasAPI.buscarAreasPendentes();
  setAreasPendentes(pendentes);
  // Buscar todas as áreas (caso necessário para outra aba)
  const todas = await adminAreasAPI.listarAreas ? await adminAreasAPI.listarAreas() : [];
  setTodasAreas(todas);
    } catch (error) {
      Alert.alert('Erro', 'Erro ao carregar áreas: ' + error.message);
    } finally {
      setLoading(false);
    }
  const confirmarRejeicao = async () => {
    if (!motivoRejeicao.trim()) {
      Alert.alert('Erro', 'Por favor, informe o motivo da rejeição');
      return;
    }

    try {
      setLoading(true);
      await adminAreasAPI.rejeitarArea(areaParaRejeitar.id, motivoRejeicao.trim());
      Alert.alert('Sucesso', 'Área rejeitada com sucesso!');
      setAreaParaRejeitar(null);
      setMotivoRejeicao('');
      carregarDados();
      onAreaUpdate?.();
    } catch (error) {
      console.error('Erro ao rejeitar área:', error);
      Alert.alert('Erro', error.message);
    } finally {
      setLoading(false);
    }
  };

  const excluirArea = (areaId, areaNome) => {
    Alert.alert(
      'Confirmar Exclusão',
      `Tem certeza que deseja excluir permanentemente a área "${areaNome}"? Esta ação não pode ser desfeita.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              console.log('📤 Chamando API para excluir área:', areaId);
              await adminAreasAPI.excluirArea(areaId);
              Alert.alert('Sucesso', 'Área excluída com sucesso!');
              carregarDados();
              onAreaUpdate?.();
            } catch (error) {
              console.error('❌ Erro ao excluir área:', error);
              Alert.alert('Erro', error.message);
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  const renderAreaCard = (area, showActions = true) => (
    <View key={area.id} style={{
      backgroundColor: 'white',
      margin: 10,
      padding: 15,
      borderRadius: 12,
      borderLeftWidth: 4,
      borderLeftColor: area.status === 'pendente' ? '#F59E0B' : 
                      area.status === 'aprovada' ? '#10B981' : '#EF4444',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3
    }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#1F2937', marginBottom: 5 }}>
            {area.nome}
          </Text>
          <Text style={{ fontSize: 14, color: '#6B7280', marginBottom: 3 }}>
            <Text style={{ fontWeight: '600' }}>ONG:</Text> {area.ong_nome}
          </Text>
          <Text style={{ fontSize: 14, color: '#6B7280', marginBottom: 3 }}>
            <Text style={{ fontWeight: '600' }}>Email:</Text> {area.ong_email}
          </Text>
          <Text style={{ fontSize: 14, color: '#6B7280', marginBottom: 3 }}>
            <Text style={{ fontWeight: '600' }}>Criada em:</Text> {new Date(area.criada_em).toLocaleDateString()}
          </Text>
          {area.descricao && (
            <Text style={{ fontSize: 14, color: '#6B7280', marginBottom: 8 }}>
              <Text style={{ fontWeight: '600' }}>Descrição:</Text> {area.descricao}
            </Text>
          )}
          {area.status === 'aprovada' && area.data_aprovacao && (
            <Text style={{ fontSize: 14, color: '#10B981', marginBottom: 3 }}>
              <Text style={{ fontWeight: '600' }}>Aprovada em:</Text> {new Date(area.data_aprovacao).toLocaleDateString()}
            </Text>
          )}
          {area.status === 'rejeitada' && area.motivo_rejeicao && (
            <Text style={{ fontSize: 14, color: '#EF4444', marginBottom: 3 }}>
              <Text style={{ fontWeight: '600' }}>Motivo da rejeição:</Text> {area.motivo_rejeicao}
            </Text>
          )}
          <View style={{ 
            alignSelf: 'flex-start',
            backgroundColor: area.status === 'pendente' ? '#FEF3C7' : 
                           area.status === 'aprovada' ? '#D1FAE5' : '#FEE2E2',
            paddingHorizontal: 8,
            paddingVertical: 4,
            borderRadius: 12,
            marginTop: 8
          }}>
            <Text style={{ 
              fontSize: 12, 
              fontWeight: '600',
              color: area.status === 'pendente' ? '#92400E' : 
                     area.status === 'aprovada' ? '#065F46' : '#991B1B'
            }}>
              {area.status === 'pendente' ? '⏳ Pendente' : 
               area.status === 'aprovada' ? '✅ Aprovada' : '❌ Rejeitada'}
            </Text>
          </View>
        </View>
        
        {showActions && area.status === 'pendente' && (
          <View style={{ marginLeft: 15 }}>
            <TouchableOpacity
              style={{
                backgroundColor: '#10B981',
                paddingHorizontal: 12,
                paddingVertical: 8,
                borderRadius: 8,
                marginBottom: 8
              }}
              onPress={() => aprovarArea(area.id)}
              disabled={loading}
            >
              <Text style={{ color: 'white', fontSize: 12, fontWeight: '600' }}>
                ✅ Aprovar
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={{
                backgroundColor: '#EF4444',
                paddingHorizontal: 12,
                paddingVertical: 8,
                borderRadius: 8
              }}
              onPress={() => iniciarRejeicao(area)}
              disabled={loading}
            >
              <Text style={{ color: 'white', fontSize: 12, fontWeight: '600' }}>
                ❌ Rejeitar
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={{
                backgroundColor: '#DC2626',
                paddingHorizontal: 12,
                paddingVertical: 8,
                borderRadius: 8,
                marginTop: 8
              }}
              onPress={() => excluirArea(area.id, area.nome)}
              disabled={loading}
            >
              <Text style={{ color: 'white', fontSize: 12, fontWeight: '600' }}>
                🗑️ Excluir
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );

  if (usuario?.tipo !== 'admin') {
    return null;
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={{ flex: 1, backgroundColor: '#F9FAFB' }}>
        {/* Header */}
        <View style={{
          backgroundColor: 'white',
          paddingTop: 60,
          paddingBottom: 20,
          paddingHorizontal: 20,
          borderBottomWidth: 1,
          borderBottomColor: '#E5E7EB'
        }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#1F2937' }}>
              Painel de Áreas
            </Text>
            <TouchableOpacity
              onPress={onClose}
              style={{
                backgroundColor: '#F3F4F6',
                padding: 8,
                borderRadius: 20
              }}
            >
              <Text style={{ fontSize: 18, color: '#6B7280' }}>✕</Text>
            </TouchableOpacity>
          </View>
          {/* Tabs */}
          <View style={{ flexDirection: 'row', marginTop: 20 }}>
            <TouchableOpacity
              style={{
                flex: 1,
                paddingVertical: 12,
                backgroundColor: activeTab === 'pendentes' ? '#3B82F6' : '#F3F4F6',
                borderRadius: 8,
                marginRight: 8
              }}
              onPress={() => setActiveTab('pendentes')}
            >
              <Text style={{
                textAlign: 'center',
                color: activeTab === 'pendentes' ? 'white' : '#6B7280',
                fontWeight: '600'
              }}>
                Pendentes ({areasPendentes.length})
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={{
                flex: 1,
                paddingVertical: 12,
                backgroundColor: activeTab === 'todas' ? '#3B82F6' : '#F3F4F6',
                borderRadius: 8,
                marginLeft: 8
              }}
              onPress={() => setActiveTab('todas')}
            >
              <Text style={{
                textAlign: 'center',
                color: activeTab === 'todas' ? 'white' : '#6B7280',
                fontWeight: '600'
              }}>
                Todas ({todasAreas.length})
              </Text>
            </TouchableOpacity>
          </View>
        </View>
        {/* Content */}
        <ScrollView style={{ flex: 1 }}>
          {loading ? (
            <View style={{ padding: 20, alignItems: 'center' }}>
              <Text style={{ color: '#6B7280' }}>Carregando...</Text>
            </View>
          ) : (
            <>
              {activeTab === 'pendentes' ? (
                areasPendentes.length === 0 ? (
                  <View style={{ padding: 20, alignItems: 'center' }}>
                    <Text style={{ color: '#6B7280', fontSize: 16 }}>
                      Nenhuma área pendente de aprovação
                    </Text>
                  </View>
                ) : (
                  areasPendentes.map(area => renderAreaCard(area, true))
                )
              ) : (
                todasAreas.length === 0 ? (
                  <View style={{ padding: 20, alignItems: 'center' }}>
                    <Text style={{ color: '#6B7280', fontSize: 16 }}>
                      Nenhuma área cadastrada
                    </Text>
                  </View>
                ) : (
                  todasAreas.map(area => renderAreaCard(area, false))
                )
              )}
            </>
          )}
        </ScrollView>
        {/* Modal de Rejeição */}
        <Modal 
          visible={!!areaParaRejeitar} 
          animationType="fade" 
          transparent={true}
        >
          <View style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.5)',
            justifyContent: 'center',
            alignItems: 'center'
          }}>
            <View style={{
              backgroundColor: 'white',
              margin: 20,
              padding: 20,
              borderRadius: 12,
              width: '90%',
              maxWidth: 400
            }}>
              <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 15 }}>
                Rejeitar Área: {areaParaRejeitar?.nome}
              </Text>
              <Text style={{ fontSize: 14, color: '#6B7280', marginBottom: 10 }}>
                Por favor, informe o motivo da rejeição:
              </Text>
              <TextInput
                style={{
                  borderWidth: 1,
                  borderColor: '#D1D5DB',
                  borderRadius: 8,
                  padding: 12,
                  minHeight: 80,
                  textAlignVertical: 'top',
                  marginBottom: 20
                }}
                multiline
                placeholder="Digite o motivo da rejeição..."
                value={motivoRejeicao}
                onChangeText={setMotivoRejeicao}
              />
              <View style={{ flexDirection: 'row', justifyContent: 'flex-end' }}>
                <TouchableOpacity
                  style={{
                    backgroundColor: '#F3F4F6',
                    paddingHorizontal: 16,
                    paddingVertical: 8,
                    borderRadius: 8,
                    marginRight: 10
                  }}
                  onPress={() => {
                    setAreaParaRejeitar(null);
                    setMotivoRejeicao('');
                  }}
                >
                  <Text style={{ color: '#6B7280', fontWeight: '600' }}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={{
                    backgroundColor: '#EF4444',
                    paddingHorizontal: 16,
                    paddingVertical: 8,
                    borderRadius: 8
                  }}
                  onPress={confirmarRejeicao}
                  disabled={loading || !motivoRejeicao.trim()}
                >
                  <Text style={{ 
                    color: 'white', 
                    fontWeight: '600',
                    opacity: (!motivoRejeicao.trim() || loading) ? 0.5 : 1
                  }}>
                    Rejeitar
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    </Modal>
  );
};

}
export default AdminAreasPanel;
