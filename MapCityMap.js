import React, { useState, useCallback } from 'react';
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

// Tipos de problemas disponíveis
const PROBLEM_TYPES = [
  { value: 'lixo', label: 'Lixo na Rua', emoji: '🗑️' },
  { value: 'buraco', label: 'Buraco', emoji: '🕳️' },
  { value: 'iluminacao', label: 'Iluminação', emoji: '💡' },
  { value: 'outro', label: 'Outro', emoji: '❗' }
];

// Componente simples do mapa usando Leaflet
function SimpleMapView({ onMapClick, onMarkerClick, markers }) {
  const mapRef = React.useRef(null);
  const [mapLoaded, setMapLoaded] = React.useState(false);

  React.useEffect(() => {
    // Verifica se está na web
    if (Platform.OS !== 'web') return;

    // Carrega Leaflet via CDN
    const loadLeaflet = () => {
      if (window.L) {
        initMap();
        return;
      }

      console.log('Carregando Leaflet...');

      // CSS do Leaflet
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);

      // JS do Leaflet
      const script = document.createElement('script');
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      script.onload = initMap;
      script.onerror = () => console.error('Erro ao carregar Leaflet');
      document.head.appendChild(script);
    };

    const initMap = () => {
      if (!mapRef.current || !window.L) return;

      console.log('Inicializando mapa Leaflet...');

      try {
        // Cria o mapa
        const map = window.L.map(mapRef.current).setView([-23.550520, -46.633308], 13);

        // Adiciona tiles do OpenStreetMap
        window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap contributors'
        }).addTo(map);

      // Clique no mapa
      map.on('click', function(e) {
        // Verifica se o clique foi em um marcador
        if (e.originalEvent && e.originalEvent.target && 
            (e.originalEvent.target.closest('.leaflet-marker-icon') || 
             e.originalEvent.target.closest('path'))) {
          console.log('Clique foi em um marcador, ignorando clique do mapa');
          return;
        }
        
        const { lat, lng } = e.latlng;
        console.log('Clique no mapa:', lat, lng);
        onMapClick(lat, lng);
      });        // CSS personalizado para popups
      const style = document.createElement('style');
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
        console.log('Mapa carregado com sucesso!');

        // Salva referência para adicionar marcadores
        window.mapInstance = map;
        window.markersAdded = new Set(); // Para evitar duplicatas

      } catch (error) {
        console.error('Erro ao criar mapa:', error);
      }
    };

    loadLeaflet();
  }, [onMapClick]);

  // Adiciona marcadores
  React.useEffect(() => {
    if (!mapLoaded || !window.mapInstance) return;

    console.log('Atualizando marcadores:', markers.length);

    // Limpa todos os marcadores existentes
    window.mapInstance.eachLayer((layer) => {
      if (layer instanceof window.L.CircleMarker || layer instanceof window.L.Marker) {
        if (layer.options.isCustomMarker) {
          window.mapInstance.removeLayer(layer);
        }
      }
    });

    // Reseta o conjunto de marcadores adicionados
    window.markersAdded = new Set();

    markers.forEach(marker => {
      // Cores por tipo
      const colors = {
        'lixo': 'green',
        'buraco': 'orange', 
        'iluminacao': 'blue',
        'outro': 'red'
      };

      try {
        // Cria marcador base
        const leafletMarker = window.L.circleMarker([marker.lat, marker.lng], {
          color: 'white',
          fillColor: colors[marker.type] || 'red',
          fillOpacity: marker.resolved ? 0.4 : 0.8,
          weight: 3,
          radius: 15,
          isCustomMarker: true // Flag para identificar nossos marcadores
        }).addTo(window.mapInstance);

        // Adiciona símbolo de check se resolvido
        if (marker.resolved) {
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
            className: 'resolved-marker',
            iconSize: [20, 20],
            iconAnchor: [10, 10]
          });
          
          const checkMarker = window.L.marker([marker.lat, marker.lng], { 
            icon: checkIcon,
            isCustomMarker: true
          }).addTo(window.mapInstance);
        }

        // Clique no marcador abre modal (sem interferir com clique no mapa)
        leafletMarker.on('click', (e) => {
          e.originalEvent.stopPropagation(); // Evita trigger do clique no mapa
          console.log('Clique no marcador:', marker.id);
          onMarkerClick(marker);
        });

        window.markersAdded.add(marker.id);
        console.log('Marcador adicionado/atualizado:', marker.id, 'Resolvido:', marker.resolved);

      } catch (error) {
        console.error('Erro ao adicionar marcador:', error);
      }
    });
  }, [markers, mapLoaded, onMarkerClick]);

  if (Platform.OS !== 'web') {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Mapa disponível apenas na web</Text>
      </View>
    );
  }

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <div 
        ref={mapRef}
        style={{ 
          width: '100%', 
          height: '100vh',
          backgroundColor: '#f0f0f0'
        }}
      />
      {!mapLoaded && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          background: 'rgba(255,255,255,0.95)',
          padding: '20px 30px',
          borderRadius: '10px',
          fontSize: '18px',
          color: '#333',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          textAlign: 'center'
        }}>
          <div>🗺️</div>
          <div>Carregando mapa...</div>
        </div>
      )}
    </div>
  );
}

// Componente principal
export default function MapCityMap() {
  const [markers, setMarkers] = useState([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isViewModalVisible, setIsViewModalVisible] = useState(false);
  const [clickPosition, setClickPosition] = useState(null);
  const [selectedMarker, setSelectedMarker] = useState(null);
  const [problemType, setProblemType] = useState('');
  const [description, setDescription] = useState('');
  const [selectedImages, setSelectedImages] = useState([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

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
      images: selectedImages, // Array de imagens
      timestamp: new Date().toISOString()
    };

    console.log('Adicionando novo marcador:', newMarker);
    setMarkers(prev => [...prev, newMarker]);
    
    // Reset
    setProblemType('');
    setDescription('');
    setSelectedImages([]);
    setIsModalVisible(false);
    setClickPosition(null);
    
    Alert.alert('Sucesso', 'Problema reportado com sucesso!');
  }, [problemType, description, clickPosition, selectedImages]);

  const closeModal = () => {
    setIsModalVisible(false);
    setProblemType('');
    setDescription('');
    setSelectedImages([]);
    setClickPosition(null);
  };

  const handleImageUpload = (event) => {
    const files = Array.from(event.target.files);
    
    if (files.length === 0) return;
    
    // Limita a 5 imagens
    if (selectedImages.length + files.length > 5) {
      Alert.alert('Limite de imagens', 'Máximo de 5 imagens por problema.');
      return;
    }

    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        setSelectedImages(prev => [...prev, {
          id: Date.now() + Math.random(),
          data: e.target.result,
          name: file.name
        }]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (imageId) => {
    setSelectedImages(prev => prev.filter(img => img.id !== imageId));
  };

  const handleMarkerClick = useCallback((marker) => {
    console.log('Marcador clicado:', marker);
    setSelectedMarker(marker);
    setCurrentImageIndex(0); // Reset do índice da imagem
    setIsViewModalVisible(true);
  }, []);

  const handleMarkResolved = useCallback(() => {
    if (!selectedMarker) {
      console.log('Nenhum marcador selecionado');
      return;
    }
    
    console.log('Marcando como resolvido:', selectedMarker.id);
    
    setMarkers(prev => {
      const updated = prev.map(marker => 
        marker.id === selectedMarker.id 
          ? { ...marker, resolved: true, resolvedAt: new Date().toISOString() }
          : marker
      );
      console.log('Marcadores atualizados:', updated);
      return updated;
    });
    
    setIsViewModalVisible(false);
    setSelectedMarker(null);
    Alert.alert('Sucesso', 'Problema marcado como resolvido!');
  }, [selectedMarker]);

  return (
    <View style={styles.container}>
      <SimpleMapView 
        onMapClick={handleMapClick}
        onMarkerClick={handleMarkerClick}
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

            <Text style={styles.label}>Fotos (Opcional - até 5)</Text>
            {Platform.OS === 'web' ? (
              <div style={{
                borderWidth: 2,
                borderColor: '#D1D5DB',
                borderStyle: 'dashed',
                borderRadius: 12,
                padding: 24,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: '#F9FAFB',
                marginBottom: 24,
                textAlign: 'center'
              }}>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageUpload}
                  style={{ display: 'none' }}
                  id="image-upload"
                />
                <label 
                  htmlFor="image-upload" 
                  style={{
                    cursor: 'pointer',
                    fontSize: 16,
                    color: '#6B7280',
                    fontWeight: 500
                  }}
                >
                  📷 Clique para adicionar fotos
                </label>
                <div style={{ marginTop: 8, fontSize: 12, color: '#9CA3AF' }}>
                  {selectedImages.length}/5 fotos selecionadas
                </div>
                
                {selectedImages.length > 0 && (
                  <div style={{ 
                    marginTop: 16, 
                    display: 'flex', 
                    flexWrap: 'wrap', 
                    gap: 12,
                    justifyContent: 'center'
                  }}>
                    {selectedImages.map((image) => (
                      <div key={image.id} style={{ position: 'relative' }}>
                        <img 
                          src={image.data} 
                          alt="Preview" 
                          style={{
                            width: 80,
                            height: 80,
                            objectFit: 'cover',
                            borderRadius: 8,
                            border: '2px solid #E5E7EB'
                          }}
                        />
                        <button
                          onClick={() => removeImage(image.id)}
                          style={{
                            position: 'absolute',
                            top: -8,
                            right: -8,
                            width: 20,
                            height: 20,
                            borderRadius: '50%',
                            backgroundColor: '#EF4444',
                            color: 'white',
                            border: 'none',
                            fontSize: 12,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <TouchableOpacity style={styles.imageButton}>
                <Text style={styles.imageButtonText}>📷 Adicionar Fotos</Text>
              </TouchableOpacity>
            )}
            
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

      {/* Modal de Visualização do Problema */}
      <Modal
        visible={isViewModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setIsViewModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity 
              style={styles.closeButton}
              onPress={() => setIsViewModalVisible(false)}
            >
              <Text style={styles.closeButtonText}>×</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>
              {selectedMarker?.resolved ? '✅ Problema Resolvido' : 'Informações do Problema'}
            </Text>
            <View style={styles.headerSpacer} />
          </View>
          
          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
            {selectedMarker && (
              <>
                <Text style={styles.locationText}>
                  📍 Localização: {selectedMarker.lat.toFixed(6)}, {selectedMarker.lng.toFixed(6)}
                </Text>
                
                <Text style={styles.label}>Problema</Text>
                <View style={[styles.problemTypeDisplay, selectedMarker.resolved && styles.resolvedStyle]}>
                  <Text style={styles.problemTypeText}>
                    {PROBLEM_TYPES.find(t => t.value === selectedMarker.type)?.emoji} {' '}
                    {PROBLEM_TYPES.find(t => t.value === selectedMarker.type)?.label || 'Problema'}
                  </Text>
                </View>

                {selectedMarker.images && selectedMarker.images.length > 0 && (
                  <>
                    <Text style={styles.label}>Imagens do Problema ({selectedMarker.images.length})</Text>
                    <View style={styles.imageCarouselContainer}>
                      {/* Carrossel de imagens */}
                      <div style={{
                        position: 'relative',
                        width: '100%',
                        borderRadius: 12,
                        overflow: 'hidden',
                        backgroundColor: '#f8f9fa',
                        border: '2px solid #e9ecef'
                      }}>
                        <img 
                          src={selectedMarker.images[currentImageIndex]?.data || selectedMarker.images[currentImageIndex]}
                          alt={`Problema - Imagem ${currentImageIndex + 1}`}
                          style={{
                            width: '100%',
                            height: 250,
                            objectFit: 'cover'
                          }}
                        />
                        
                        {/* Navegação do carrossel */}
                        {selectedMarker.images.length > 1 && (
                          <>
                            {/* Botão anterior */}
                            <button
                              onClick={() => setCurrentImageIndex(prev => 
                                prev === 0 ? selectedMarker.images.length - 1 : prev - 1
                              )}
                              style={{
                                position: 'absolute',
                                left: 10,
                                top: '50%',
                                transform: 'translateY(-50%)',
                                backgroundColor: 'rgba(0,0,0,0.7)',
                                color: 'white',
                                border: 'none',
                                borderRadius: '50%',
                                width: 40,
                                height: 40,
                                fontSize: 18,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                              }}
                            >
                              ‹
                            </button>
                            
                            {/* Botão próximo */}
                            <button
                              onClick={() => setCurrentImageIndex(prev => 
                                prev === selectedMarker.images.length - 1 ? 0 : prev + 1
                              )}
                              style={{
                                position: 'absolute',
                                right: 10,
                                top: '50%',
                                transform: 'translateY(-50%)',
                                backgroundColor: 'rgba(0,0,0,0.7)',
                                color: 'white',
                                border: 'none',
                                borderRadius: '50%',
                                width: 40,
                                height: 40,
                                fontSize: 18,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                              }}
                            >
                              ›
                            </button>
                            
                            {/* Indicadores */}
                            <div style={{
                              position: 'absolute',
                              bottom: 15,
                              left: '50%',
                              transform: 'translateX(-50%)',
                              display: 'flex',
                              gap: 8
                            }}>
                              {selectedMarker.images.map((_, index) => (
                                <button
                                  key={index}
                                  onClick={() => setCurrentImageIndex(index)}
                                  style={{
                                    width: 10,
                                    height: 10,
                                    borderRadius: '50%',
                                    border: 'none',
                                    backgroundColor: index === currentImageIndex 
                                      ? 'white' 
                                      : 'rgba(255,255,255,0.5)',
                                    cursor: 'pointer'
                                  }}
                                />
                              ))}
                            </div>
                            
                            {/* Contador */}
                            <div style={{
                              position: 'absolute',
                              top: 15,
                              right: 15,
                              backgroundColor: 'rgba(0,0,0,0.7)',
                              color: 'white',
                              padding: '4px 8px',
                              borderRadius: 12,
                              fontSize: 12
                            }}>
                              {currentImageIndex + 1}/{selectedMarker.images.length}
                            </div>
                          </>
                        )}
                      </div>
                      
                      {/* Miniaturas */}
                      {selectedMarker.images.length > 1 && (
                        <div style={{
                          display: 'flex',
                          gap: 8,
                          marginTop: 12,
                          justifyContent: 'center',
                          flexWrap: 'wrap'
                        }}>
                          {selectedMarker.images.map((image, index) => (
                            <button
                              key={index}
                              onClick={() => setCurrentImageIndex(index)}
                              style={{
                                border: index === currentImageIndex ? '2px solid #3B82F6' : '2px solid #E5E7EB',
                                borderRadius: 8,
                                padding: 2,
                                backgroundColor: 'transparent',
                                cursor: 'pointer'
                              }}
                            >
                              <img
                                src={image.data || image}
                                alt={`Miniatura ${index + 1}`}
                                style={{
                                  width: 50,
                                  height: 50,
                                  objectFit: 'cover',
                                  borderRadius: 6
                                }}
                              />
                            </button>
                          ))}
                        </div>
                      )}
                    </View>
                  </>
                )}

                <Text style={styles.label}>Descrição do Problema</Text>
                <View style={[styles.descriptionDisplay, selectedMarker.resolved && styles.resolvedStyle]}>
                  <Text style={styles.descriptionText}>{selectedMarker.description}</Text>
                </View>

                {selectedMarker.resolved && (
                  <View style={styles.resolvedBanner}>
                    <Text style={styles.resolvedBannerText}>
                      ✅ Este problema foi marcado como resolvido
                    </Text>
                    <Text style={styles.resolvedDate}>
                      Resolvido em: {new Date(selectedMarker.resolvedAt).toLocaleDateString('pt-BR')}
                    </Text>
                  </View>
                )}

                {!selectedMarker.resolved && (
                  <TouchableOpacity
                    style={styles.resolveButton}
                    onPress={handleMarkResolved}
                  >
                    <Text style={styles.resolveButtonText}>✓ Marcar como Resolvido</Text>
                  </TouchableOpacity>
                )}
              </>
            )}
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
    marginBottom: 24,
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
  problemTypeDisplay: {
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#F9FAFB',
    marginBottom: 24,
  },
  problemTypeText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  descriptionDisplay: {
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#F9FAFB',
    marginBottom: 24,
    minHeight: 100,
  },
  descriptionText: {
    fontSize: 16,
    color: '#1F2937',
    lineHeight: 24,
  },
  imageContainer: {
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 24,
    backgroundColor: '#F9FAFB',
    padding: 8,
  },
  imageCarouselContainer: {
    marginBottom: 24,
  },
  resolvedStyle: {
    opacity: 0.6,
    borderColor: '#10B981',
    backgroundColor: '#ECFDF5',
  },
  resolvedBanner: {
    backgroundColor: '#ECFDF5',
    borderWidth: 2,
    borderColor: '#10B981',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 24,
    alignItems: 'center',
  },
  resolvedBannerText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#059669',
    marginBottom: 4,
  },
  resolvedDate: {
    fontSize: 14,
    color: '#047857',
  },
  resolveButton: {
    backgroundColor: '#10B981',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 32,
  },
  resolveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
};
