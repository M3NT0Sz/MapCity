import React, { useState, useCallback } from 'react';
import './map-style.css';
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
    console.log('Iniciando carregamento do mapa...');
    
    // Carrega CSS do Leaflet primeiro
    if (!document.querySelector('link[href*="leaflet"]')) {
      const cssLink = document.createElement('link');
      cssLink.rel = 'stylesheet';
      cssLink.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(cssLink);
      console.log('CSS do Leaflet carregado');
    }
    
    // JS do Leaflet
    if (!mapRef.current) {
      console.error('mapRef.current não existe!');
      return;
    }
    if (window.L) {
      console.log('Leaflet já carregado:', window.L);
      initMap();
    } else {
      console.log('Carregando script do Leaflet...');
      const script = document.createElement('script');
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      script.onload = () => {
        console.log('Script do Leaflet carregado:', window.L);
        initMap();
      };
      script.onerror = () => console.error('Erro ao carregar Leaflet');
      document.head.appendChild(script);
      return;
    }
    function initMap() {
      if (!mapRef.current) {
        console.error('mapRef.current não existe na inicialização!');
        return;
      }
      if (!window.L) {
        console.error('Leaflet não está disponível!');
        return;
      }
      console.log('Inicializando mapa Leaflet...');
      try {
        const map = window.L.map(mapRef.current).setView([-22.1207, -51.3889], 13);
        window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap contributors'
        }).addTo(map);
        map.on('click', function(e) {
          if (e.originalEvent && e.originalEvent.target && 
              (e.originalEvent.target.closest('.leaflet-marker-icon') || 
               e.originalEvent.target.closest('path'))) {
            console.log('Clique foi em um marcador, ignorando clique do mapa');
            return;
          }
          const { lat, lng } = e.latlng;
          console.log('Clique no mapa:', lat, lng);
          onMapClick(lat, lng);
        });
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
        window.mapInstance = map;
        window.markersAdded = new Set();
      } catch (error) {
        console.error('Erro ao criar mapa:', error);
      }
    }
    // Se o Leaflet já está carregado, inicializa o mapa
    if (window.L) {
      initMap();
    }
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
        'lixo': '#27ae60',     // Verde - Lixo
        'buraco': '#f39c12',   // Laranja - Buraco
        'iluminacao': '#3498db', // Azul - Iluminação
        'outro': '#9b59b6'     // Roxo - Outro
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
          
          // Adiciona clique ao ícone de check também
          checkMarker.on('click', (e) => {
            e.originalEvent.stopPropagation();
            console.log('Clique no ícone de resolvido:', marker.id);
            onMarkerClick(marker);
          });
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
    <div style={{ width: '100vw', height: '100vh', position: 'fixed', top: 0, left: 0, zIndex: 1000, backgroundColor: '#f0f0f0' }}>
      <div 
        ref={mapRef}
        style={{ 
          width: '100%', 
          height: '100%',
          backgroundColor: '#e0e0e0',
          border: '2px solid red'
        }}
      />
      <div style={{
        position: 'absolute',
        top: 10,
        left: 10,
        background: 'white',
        padding: '10px',
        borderRadius: '5px',
        fontSize: '14px',
        zIndex: 1001
      }}>
        Status: {mapLoaded ? 'Mapa Carregado' : 'Carregando...'}
        <br />
        Leaflet: {typeof window.L !== 'undefined' ? 'OK' : 'Não carregado'}
        <br />
        MapRef: {mapRef.current ? 'OK' : 'Null'}
      </div>
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
  const [markerAddress, setMarkerAddress] = useState('');
  const [clickAddress, setClickAddress] = useState('');

  // Função para buscar endereço baseado nas coordenadas
  const getAddressFromCoords = async (lat, lng) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&accept-language=pt-BR&zoom=18`
      );
      
      if (!response.ok) {
        throw new Error('Erro na requisição');
      }
      
      const data = await response.json();
      
      if (data && data.address) {
        const address = data.address;
        let formattedAddress = '';
        
        // Prioriza: Rua + Número, depois Bairro, depois Cidade
        const road = address.road || address.pedestrian || address.footway || address.cycleway;
        const houseNumber = address.house_number;
        const suburb = address.suburb || address.neighbourhood || address.city_district || address.quarter;
        const city = address.city || address.town || address.village || address.municipality;
        
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
          const parts = data.display_name.split(',');
          formattedAddress = parts[0] || 'Local não identificado';
        }
        
        return formattedAddress.trim() || 'Endereço não encontrado';
      }
      
      return 'Endereço não encontrado';
    } catch (error) {
      console.error('Erro ao buscar endereço:', error);
      return 'Endereço não disponível';
    }
  };

  // Busca endereço quando um marcador é selecionado
  React.useEffect(() => {
    if (selectedMarker) {
      getAddressFromCoords(selectedMarker.lat, selectedMarker.lng)
        .then(address => setMarkerAddress(address));
    }
  }, [selectedMarker]);

  // Busca endereço quando uma posição é clicada para novo marcador
  React.useEffect(() => {
    if (clickPosition) {
      getAddressFromCoords(clickPosition.lat, clickPosition.lng)
        .then(address => setClickAddress(address));
    }
  }, [clickPosition]);

  // Buscar marcadores do backend ao carregar
  React.useEffect(() => {
    fetch('http://localhost:3001/lugares')
      .then(res => res.json())
      .then(data => {
        console.log('Dados recebidos do backend:', data);
        const adaptados = data.map(lugar => {
          console.log('Processando lugar:', lugar.id, 'Imagem:', lugar.imagem, 'Tipo:', typeof lugar.imagem);
          let images = [];
          
          if (lugar.imagem) {
            try {
              // Verificar se é string antes de chamar trim
              if (typeof lugar.imagem === 'string') {
                const imagemTrimmed = lugar.imagem.trim();
                if (imagemTrimmed === '') {
                  console.log('Campo imagem vazio para lugar', lugar.id);
                  images = [];
                } else {
                  const parsed = JSON.parse(imagemTrimmed);
                  console.log('Imagens parseadas para lugar', lugar.id, ':', parsed);
                  images = Array.isArray(parsed) ? parsed : [];
                }
              } else if (Array.isArray(lugar.imagem)) {
                // Se já é um array, usar diretamente
                console.log('Imagem já é array para lugar', lugar.id, ':', lugar.imagem);
                images = lugar.imagem;
              } else {
                // Se é outro tipo, tentar converter para string e depois parsear
                console.log('Tentando converter tipo', typeof lugar.imagem, 'para string');
                const imagemString = String(lugar.imagem);
                const parsed = JSON.parse(imagemString);
                images = Array.isArray(parsed) ? parsed : [];
              }
            } catch (e) {
              console.error('Erro ao parsear imagem para lugar', lugar.id, ':', e);
              console.error('Conteúdo do campo imagem:', lugar.imagem);
              console.error('Tipo do conteúdo:', typeof lugar.imagem);
              images = [];
            }
          } else {
            console.log('Campo imagem null/undefined para lugar', lugar.id);
            images = [];
          }
          
          return {
            id: lugar.id,
            lat: lugar.latitude,
            lng: lugar.longitude,
            type: lugar.tipo || 'outro', // Usa o campo tipo da tabela
            description: lugar.descricao || lugar.nome,
            images: images,
            resolved: lugar.resolvido || false,
            resolvedAt: lugar.resolvido_em || null
          };
        });
        console.log('Marcadores adaptados:', adaptados);
        setMarkers(adaptados);
      })
      .catch(err => console.error('Erro ao buscar lugares:', err));
  }, []);

  console.log('Renderizando componente. Marcadores:', markers.length);

  const handleMapClick = useCallback((lat, lng) => {
    console.log('Clique recebido:', lat, lng);
    setClickPosition({ lat, lng });
    setIsModalVisible(true);
  }, []);

  // Função para fazer upload das imagens
  const uploadImages = async (images) => {
    console.log('🚨🚨🚨 ATENÇÃO: uploadImages CHAMADA!');
    console.log('🚨 TIPO DE IMAGES:', typeof images);
    console.log('🚨 É ARRAY?:', Array.isArray(images));
    console.log('🚨 IMAGES:', images);
    console.log('📤 Iniciando upload de', images?.length || 0, 'imagens');
    
    if (!images || images.length === 0) {
      console.log('⚠️ AVISO: Nenhuma imagem foi fornecida para upload');
      return [];
    }
    
    const uploadedPaths = [];

    // Upload cada imagem individualmente
    for (let i = 0; i < images.length; i++) {
      const image = images[i];
      console.log(`📁 Processando imagem ${i + 1}/${images.length}:`, image.id);
      
      try {
        // Primeiro vamos verificar a estrutura do objeto image
        console.log('🔍 ESTRUTURA DA IMAGEM:', image);
        console.log('🔍 PROPRIEDADES:', Object.keys(image));
        console.log('🔍 image.uri:', image.uri);
        console.log('🔍 image.data:', image.data);
        
        // Determinar qual propriedade contém a URI da imagem
        let imageUri;
        if (image.uri) {
          imageUri = image.uri;
        } else if (image.data) {
          imageUri = image.data;
        } else {
          console.error('❌ Objeto image não tem uri nem data:', image);
          continue;
        }
        
        // Converter base64 para Blob de forma mais robusta
        console.log('📝 URI da imagem:', imageUri.substring(0, 50) + '...');
        
        // Verificar se é data URL válida
        if (!imageUri.startsWith('data:')) {
          console.error('❌ URI não é data URL válida:', imageUri.substring(0, 100));
          continue;
        }
        
        // Separar o header do base64
        const [header, base64Data] = imageUri.split(',');
        if (!base64Data) {
          console.error('❌ Não foi possível separar base64:', imageUri.substring(0, 100));
          continue;
        }
        
        console.log('📝 Header:', header);
        console.log('📝 Tamanho do base64:', base64Data.length);
        
        // Converter base64 para bytes
        const byteCharacters = atob(base64Data);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        
        // Criar Blob com tipo correto
        const mimeMatch = header.match(/data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+)/);
        const mimeType = mimeMatch ? mimeMatch[1] : 'image/jpeg';
        
        console.log('📝 MIME type detectado:', mimeType);
        console.log('📝 Tamanho do arquivo:', byteArray.length, 'bytes');
        
        const blob = new Blob([byteArray], { type: mimeType });
        
        // Criar File object a partir do Blob
        const file = new File([blob], `image_${image.id}.jpg`, { type: mimeType });
        
        console.log('📝 File criado:', file.name, file.size, 'bytes');
        
        const formData = new FormData();
        formData.append('image', file);

        console.log('🌐 Enviando para http://localhost:3001/upload...');
        const uploadResponse = await fetch('http://localhost:3001/upload', {
          method: 'POST',
          body: formData,
        });

        console.log('📡 Response status:', uploadResponse.status);
        console.log('📡 Response ok:', uploadResponse.ok);

        if (!uploadResponse.ok) {
          const errorText = await uploadResponse.text();
          console.error('❌ Erro no upload da imagem:', image.id, '- Status:', uploadResponse.status, '- Erro:', errorText);
          continue; // Pula para a próxima imagem
        }

        const result = await uploadResponse.json();
        console.log('✅ Upload concluído para', image.id, ':', result);
        
        if (result.imagePath) {
          uploadedPaths.push(result.imagePath);
          console.log('📂 Caminho adicionado:', result.imagePath);
        } else {
          console.error('⚠️ Response não contém imagePath:', result);
        }
        
      } catch (error) {
        console.error('❌ Erro no upload de', image.id, ':', error);
      }
    }

    console.log('📤 Upload finalizado. Total de caminhos:', uploadedPaths.length);
    console.log('📂 Caminhos finais:', uploadedPaths);
    return uploadedPaths;
  };

  const handleSubmit = useCallback(async () => {
    if (!problemType || !description || !clickPosition) {
      Alert.alert('Erro', 'Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    // Envia para o backend
    console.log('Enviando marcador com tipo:', problemType);
    
    // Mapeia o tipo para um nome mais descritivo
    const nomesPorTipo = {
      'lixo': 'Problema de Lixo',
      'buraco': 'Buraco na Rua',
      'iluminacao': 'Problema de Iluminação',
      'outro': 'Outro Problema'
    };
    
    const nomeProblema = nomesPorTipo[problemType] || 'Problema Reportado';
    
    try {
      // Primeiro, fazer upload das imagens se houver
      let imagePaths = [];
      console.log('🔍 VERIFICAÇÃO: selectedImages length =', selectedImages.length);
      console.log('🔍 VERIFICAÇÃO: selectedImages =', selectedImages);
      
      if (selectedImages.length > 0) {
        console.log('📤 Fazendo upload de', selectedImages.length, 'imagem(s)...');
        imagePaths = await uploadImages(selectedImages);
        console.log('✅ Upload concluído. Caminhos recebidos:', imagePaths);
      } else {
        console.log('ℹ️ Nenhuma imagem selecionada - imagePaths ficará vazio');
      }

      const response = await fetch('http://localhost:3001/lugares', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome: nomeProblema,
          descricao: description,
          tipo: problemType,
          latitude: clickPosition.lat,
          longitude: clickPosition.lng,
          imagePaths: imagePaths // Enviar os caminhos das imagens uploadadas
        })
      });

      if (!response.ok) {
        if (response.status === 413) {
          throw new Error('Imagens muito grandes. Tente com imagens menores.');
        }
        throw new Error(`Erro do servidor: ${response.status}`);
      }

      const novoLugar = await response.json();
      console.log('Resposta do backend:', novoLugar);
      console.log('imagePaths enviados:', imagePaths);
      setMarkers(prev => [
        ...prev,
        {
          id: novoLugar.id,
          lat: novoLugar.latitude,
          lng: novoLugar.longitude,
          type: novoLugar.tipo || problemType,
          description: description,
          images: novoLugar.imagem || [], // Usar dados do backend
          resolved: false
        }
      ]);
      Alert.alert('Sucesso', 'Problema reportado com sucesso!');
    } catch (err) {
      console.error('Erro ao salvar marcador:', err);
      Alert.alert('Erro', err.message || 'Não foi possível salvar o marcador!');
    }

    // Reset
    setProblemType('');
    setDescription('');
    setSelectedImages([]);
    setIsModalVisible(false);
    setClickPosition(null);
    setClickAddress('');
  }, [problemType, description, clickPosition, selectedImages]);

  const closeModal = () => {
    setIsModalVisible(false);
    setProblemType('');
    setDescription('');
    setSelectedImages([]);
    setClickPosition(null);
    setClickAddress('');
  };

  // Função para redimensionar imagem
  const resizeImage = (file, maxWidth = 800, maxHeight = 600, quality = 0.8) => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
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
        const resizedDataUrl = canvas.toDataURL('image/jpeg', quality);
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
      Alert.alert('Limite de imagens', 'Máximo de 5 imagens por problema.');
      return;
    }

    for (const file of files) {
      try {
        // Redimensiona a imagem antes de adicionar
        const resizedImage = await resizeImage(file);
        
        setSelectedImages(prev => [...prev, {
          id: Date.now() + Math.random(),
          data: resizedImage,
          name: file.name
        }]);
      } catch (error) {
        console.error('Erro ao redimensionar imagem:', error);
        Alert.alert('Erro', 'Não foi possível processar a imagem.');
      }
    }
  };

  const removeImage = (imageId) => {
    setSelectedImages(prev => prev.filter(img => img.id !== imageId));
  };

  const handleMarkerClick = useCallback((marker) => {
    console.log('Marcador clicado:', marker);
    console.log('Imagens do marcador:', marker.images);
    console.log('Tipo das imagens:', typeof marker.images);
    console.log('Length das imagens:', marker.images?.length);
    setSelectedMarker(marker);
    setCurrentImageIndex(0); // Reset do índice da imagem
    setIsViewModalVisible(true);
  }, []);

  const handleMarkResolved = useCallback(async () => {
    if (!selectedMarker) {
      console.log('Nenhum marcador selecionado');
      return;
    }
    
    console.log('Marcando como resolvido:', selectedMarker.id);
    
    try {
      // Atualiza no backend
      const response = await fetch(`http://localhost:3001/lugares/${selectedMarker.id}/resolver`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' }
      });

      if (!response.ok) {
        throw new Error('Erro ao atualizar no servidor');
      }

      // Atualiza no frontend
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
    } catch (error) {
      console.error('Erro ao marcar como resolvido:', error);
      Alert.alert('Erro', 'Não foi possível marcar como resolvido. Tente novamente.');
    }
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
                📍 {clickAddress || 'Carregando endereço...'}
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
                  📍 {markerAddress || 'Carregando endereço...'}
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
                        border: '2px solid #e9ecef',
                        minHeight: 200, // Altura mínima em vez de fixa
                        maxHeight: 400, // Altura máxima para limitar
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <img 
                          src={
                            selectedMarker.images[currentImageIndex]?.data || 
                            (selectedMarker.images[currentImageIndex]?.startsWith('/uploads/') 
                              ? `http://localhost:3001${selectedMarker.images[currentImageIndex]}`
                              : selectedMarker.images[currentImageIndex])
                          }
                          alt={`Problema - Imagem ${currentImageIndex + 1}`}
                          style={{
                            width: '100%',
                            maxHeight: '400px',
                            height: 'auto', // Altura automática para manter proporção
                            objectFit: 'contain', // Volta para contain para não cortar a imagem
                            backgroundColor: '#f8f9fa',
                            borderRadius: 8,
                            display: 'block'
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
                                src={
                                  image.data || 
                                  (image?.startsWith('/uploads/') 
                                    ? `http://localhost:3001${image}`
                                    : image)
                                }
                                alt={`Miniatura ${index + 1}`}
                                style={{
                                  width: 60,
                                  height: 60,
                                  objectFit: 'cover', // Mantém proporção das miniaturas
                                  borderRadius: 8
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
                      Resolvido em: {selectedMarker.resolvedAt 
                        ? new Date(selectedMarker.resolvedAt).toLocaleString('pt-BR', {
                            day: '2-digit',
                            month: '2-digit', 
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })
                        : 'Data não disponível'
                      }
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
