import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  Modal, 
  TextInput, 
  ScrollView, 
  Alert,
  Platform 
} from 'react-native';

// Token do MapTiler
const MAPTILER_TOKEN = 'GqjNOmkFJrYWGKbF0VKb';

// Coordenadas de São Paulo
const SAO_PAULO_COORDS = [-23.550520, -46.633308];

// Tipos de problemas disponíveis
const PROBLEM_TYPES = [
  { value: 'lixo', label: 'Lixo na Rua', emoji: '🗑️' },
  { value: 'buraco', label: 'Buraco', emoji: '🕳️' },
  { value: 'iluminacao', label: 'Iluminação', emoji: '💡' },
  { value: 'outro', label: 'Outro', emoji: '❗' }
];

// Componente do mapa para web
function WebMapView({ onMapClick, markers }) {
  const mapContainer = useRef(null);
  const mapInstance = useRef(null);
  const [isMapLoaded, setIsMapLoaded] = useState(false);

  // Inicializa o mapa apenas uma vez
  useEffect(() => {
    if (mapInstance.current || !mapContainer.current) return;

    const initMap = () => {
      if (mapInstance.current) return;

      console.log('Criando mapa...');
      
      const map = new window.maptilersdk.Map({
        container: mapContainer.current,
        style: `https://api.maptiler.com/maps/streets/style.json?key=${MAPTILER_TOKEN}`,
        center: [SAO_PAULO_COORDS[1], SAO_PAULO_COORDS[0]], 
        zoom: 13,
      });

      map.on('load', () => {
        console.log('Mapa carregado!');
        setIsMapLoaded(true);
      });

      // Sistema de clique
      let isDragging = false;

      map.on('dragstart', () => {
        isDragging = true;
      });

      map.on('dragend', () => {
        setTimeout(() => {
          isDragging = false;
        }, 100);
      });

      map.on('click', (e) => {
        if (!isDragging) {
          const { lng, lat } = e.lngLat;
          console.log('Clique válido:', lat, lng);
          onMapClick(lat, lng);
        }
      });

      mapInstance.current = map;
    };

    // Carrega o script se necessário
    if (!window.maptilersdk) {
      const script = document.createElement('script');
      script.src = 'https://cdn.maptiler.com/maptiler-sdk-js/v2.0.3/maptiler-sdk.umd.min.js';
      script.onload = initMap;
      
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://cdn.maptiler.com/maptiler-sdk-js/v2.0.3/maptiler-sdk.css';
      document.head.appendChild(link);
      document.head.appendChild(script);
    } else {
      initMap();
    }

    // Cleanup
    return () => {
      if (mapInstance.current) {
        console.log('Destruindo mapa...');
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, []);

  // Atualiza marcadores
  useEffect(() => {
    if (!mapInstance.current || !isMapLoaded) return;

    console.log('Atualizando marcadores:', markers.length);

    markers.forEach((marker) => {
      const markerId = `marker-${marker.id}`;
      
      // Verifica se já existe
      if (mapInstance.current.getLayer && mapInstance.current.getLayer(markerId)) {
        console.log('Marcador já existe:', markerId);
        return;
      }

      try {
        // Adiciona source
        mapInstance.current.addSource(markerId, {
          type: 'geojson',
          data: {
            type: 'Feature',
            geometry: {
              type: 'Point',
              coordinates: [marker.lng, marker.lat]
            }
          }
        });

        // Cores por tipo
        const colors = {
          'lixo': '#10B981',
          'buraco': '#F59E0B', 
          'iluminacao': '#3B82F6',
          'outro': '#EF4444'
        };

        // Adiciona layer
        mapInstance.current.addLayer({
          id: markerId,
          type: 'circle',
          source: markerId,
          paint: {
            'circle-radius': 20,
            'circle-color': colors[marker.type] || '#EF4444',
            'circle-stroke-color': '#FFFFFF',
            'circle-stroke-width': 4
          }
        });

        // Popup ao clicar
        mapInstance.current.on('click', markerId, () => {
          new window.maptilersdk.Popup()
            .setLngLat([marker.lng, marker.lat])
            .setHTML(`
              <div style="padding: 12px;">
                <h4>${PROBLEM_TYPES.find(t => t.value === marker.type)?.label || 'Problema'}</h4>
                <p>${marker.description}</p>
              </div>
            `)
            .addTo(mapInstance.current);
        });

        console.log('Marcador adicionado:', markerId, 'em', marker.lat, marker.lng);

      } catch (error) {
        console.error('Erro ao adicionar marcador:', error);
      }
    });
  }, [markers, isMapLoaded]);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <div 
        ref={mapContainer}
        style={{ 
          width: '100%', 
          height: '100vh', 
          backgroundColor: '#f0f0f0'
        }}
      />
      {!isMapLoaded && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          background: 'rgba(255,255,255,0.9)',
          padding: '16px 24px',
          borderRadius: '12px',
          fontSize: '16px',
          color: '#666',
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
        }}>
          Carregando mapa...
        </div>
      )}
    </div>
  );
}

// Componente principal
export default function MapCityMap() {
  const [markers, setMarkers] = useState([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [clickPosition, setClickPosition] = useState(null);
  const [problemType, setProblemType] = useState('');
  const [description, setDescription] = useState('');
  const [image, setImage] = useState(null);

  console.log('Renderizando componente. Marcadores:', markers.length);

  const handleMapClick = useCallback((lat, lng) => {
    console.log('Clique recebido:', lat, lng);
    setClickPosition({ lat, lng });
    setIsModalVisible(true);
  }, []);

  const handleSubmit = useCallback(() => {
    if (!problemType || !description || !clickPosition) {
      Alert.alert('Erro', 'Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    const newMarker = {
      id: Date.now(),
      lat: clickPosition.lat,
      lng: clickPosition.lng,
      type: problemType,
      description,
      image,
      timestamp: new Date().toISOString()
    };

    console.log('Adicionando novo marcador:', newMarker);
    setMarkers(prev => [...prev, newMarker]);
    
    // Reset
    setProblemType('');
    setDescription('');
    setImage(null);
    setIsModalVisible(false);
    setClickPosition(null);
    
    Alert.alert('Sucesso', 'Problema reportado com sucesso!');
  }, [problemType, description, clickPosition, image]);

  const closeModal = () => {
    setIsModalVisible(false);
    setProblemType('');
    setDescription('');
    setImage(null);
    setClickPosition(null);
  };

  return (
    <View style={styles.container}>
      <WebMapView 
        onMapClick={handleMapClick}
        markers={markers}
      />
      
      <Modal
        visible={isModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={closeModal}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity 
              style={styles.closeButton}
              onPress={closeModal}
            >
              <Text style={styles.closeButtonText}>×</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Reportar Problema</Text>
            <View style={styles.headerSpacer} />
          </View>
          
          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
            {clickPosition && (
              <Text style={styles.locationText}>
                📍 Localização: {clickPosition.lat.toFixed(6)}, {clickPosition.lng.toFixed(6)}
              </Text>
            )}
            
            <Text style={styles.label}>Tipo de Problema *</Text>
            <View style={styles.pickerContainer}>
              {PROBLEM_TYPES.map((type) => (
                <TouchableOpacity
                  key={type.value}
                  style={[
                    styles.typeButton,
                    problemType === type.value && styles.typeButtonSelected
                  ]}
                  onPress={() => setProblemType(type.value)}
                >
                  <Text style={styles.typeEmoji}>{type.emoji}</Text>
                  <Text style={[
                    styles.typeText,
                    problemType === type.value && styles.typeTextSelected
                  ]}>
                    {type.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>Descrição *</Text>
            <TextInput
              style={styles.textInput}
              multiline
              numberOfLines={4}
              placeholder="Descreva o problema encontrado..."
              placeholderTextColor="#9CA3AF"
              value={description}
              onChangeText={setDescription}
            />

            <Text style={styles.label}>Foto (Opcional)</Text>
            <TouchableOpacity style={styles.imageButton}>
              <Text style={styles.imageButtonText}>📷 Adicionar Foto</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.submitButton, (!problemType || !description) && styles.submitButtonDisabled]}
              onPress={handleSubmit}
              disabled={!problemType || !description}
            >
              <Text style={styles.submitButtonText}>Reportar Problema</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

// Estilos
const styles = {
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    backgroundColor: '#ffffff',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: {
    fontSize: 24,
    color: '#6B7280',
    fontWeight: '300',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
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
    color: '#6B7280',
    marginBottom: 24,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  pickerContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  typeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    backgroundColor: '#ffffff',
    minWidth: 120,
  },
  typeButtonSelected: {
    borderColor: '#3B82F6',
    backgroundColor: '#EFF6FF',
  },
  typeEmoji: {
    fontSize: 20,
    marginRight: 8,
  },
  typeText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  typeTextSelected: {
    color: '#3B82F6',
  },
  textInput: {
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1F2937',
    backgroundColor: '#ffffff',
    textAlignVertical: 'top',
    marginBottom: 24,
    minHeight: 100,
  },
  imageButton: {
    borderWidth: 2,
    borderColor: '#D1D5DB',
    borderStyle: 'dashed',
    borderRadius: 12,
    paddingVertical: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F9FAFB',
    marginBottom: 32,
  },
  imageButtonText: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '500',
  },
  submitButton: {
    backgroundColor: '#3B82F6',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 32,
  },
  submitButtonDisabled: {
    backgroundColor: '#D1D5DB',
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
};
