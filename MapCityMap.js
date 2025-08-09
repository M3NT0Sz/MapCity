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
import { useAuth } from './AuthComponents';
import { lugaresAPI, uploadAPI } from './apiUtils';
import { areasAPI } from './AreasAPI';

// Tipos de problemas disponíveis
const PROBLEM_TYPES = [
  { value: 'lixo', label: 'Lixo na Rua', emoji: '🗑️' },
  { value: 'buraco', label: 'Buraco', emoji: '🕳️' },
  { value: 'iluminacao', label: 'Iluminação', emoji: '💡' },
  { value: 'outro', label: 'Outro', emoji: '❗' }
];

// Componente simples do mapa usando Leaflet
function SimpleMapView({ onMapClick, onMarkerClick, markers, areas = [], areaPoints = [], areaDrawingMode = false }) {
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

  // Desenhar áreas das ONGs
  React.useEffect(() => {
    if (!mapLoaded || !window.mapInstance) return;

    console.log('Atualizando áreas:', areas.length);

    // Limpar áreas existentes
    window.mapInstance.eachLayer((layer) => {
      if (layer.options && layer.options.isAreaLayer) {
        window.mapInstance.removeLayer(layer);
      }
    });

    // Desenhar áreas
    areas.forEach(area => {
      try {
        if (area.coordenadas && area.coordenadas.length >= 3) {
          const latlngs = area.coordenadas.map(coord => [coord.lat, coord.lng]);
          
          const polygon = window.L.polygon(latlngs, {
            color: '#3B82F6',
            fillColor: '#3B82F6',
            fillOpacity: 0.2,
            weight: 2,
            isAreaLayer: true
          }).addTo(window.mapInstance);

          polygon.bindPopup(`
            <div class="custom-popup">
              <h3>${area.nome}</h3>
              <p><strong>ONG:</strong> ${area.ong_nome || 'Não informado'}</p>
              <p><strong>Criada em:</strong> ${new Date(area.criado_em).toLocaleDateString()}</p>
              ${area.descricao ? `<p><strong>Descrição:</strong> ${area.descricao}</p>` : ''}
            </div>
          `);
        }
      } catch (error) {
        console.error('Erro ao desenhar área:', error);
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
      console.log('Desenhando pontos da área:', areaPoints.length);

      // Desenhar pontos
      areaPoints.forEach((point, index) => {
        window.L.circleMarker([point.lat, point.lng], {
          radius: 6,
          color: '#F59E0B',
          fillColor: '#F59E0B',
          fillOpacity: 0.8,
          weight: 2,
          isDrawingPoint: true
        }).addTo(window.mapInstance).bindPopup(`Ponto ${index + 1}`);
      });

      // Desenhar linha conectando os pontos se tiver mais de 1
      if (areaPoints.length > 1) {
        const latlngs = areaPoints.map(point => [point.lat, point.lng]);
        
        window.L.polyline(latlngs, {
          color: '#F59E0B',
          weight: 3,
          opacity: 0.8,
          isDrawingPoint: true
        }).addTo(window.mapInstance);

        // Se tiver 3 ou mais pontos, mostrar prévia do polígono
        if (areaPoints.length >= 3) {
          window.L.polygon(latlngs, {
            color: '#F59E0B',
            fillColor: '#F59E0B',
            fillOpacity: 0.2,
            weight: 2,
            dashArray: '5, 5',
            isDrawingPoint: true
          }).addTo(window.mapInstance);
        }
      }
    }
  }, [areaPoints, areaDrawingMode, mapLoaded]);

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
  const { usuario, token, estaLogado } = useAuth();
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
  const [addressServiceFailed, setAddressServiceFailed] = useState(false);
  const [clickAddress, setClickAddress] = useState('');
  
  // Estados para áreas de responsabilidade (ONGs)
  const [areas, setAreas] = useState([]);
  const [isAreaModalVisible, setIsAreaModalVisible] = useState(false);
  const [areaDrawingMode, setAreaDrawingMode] = useState(false);
  const [areaPoints, setAreaPoints] = useState([]);
  const [areaName, setAreaName] = useState('');
  const [areaDescription, setAreaDescription] = useState('');
  const [notificacoes, setNotificacoes] = useState([]);
  const [showNotificacoes, setShowNotificacoes] = useState(false);
  const [isNotificationModalVisible, setIsNotificationModalVisible] = useState(false);

  // Verificar se o usuário está logado
  if (!estaLogado) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
        <Text style={{ fontSize: 18, textAlign: 'center', marginBottom: 20 }}>
          Você precisa estar logado para acessar o mapa
        </Text>
        <Text style={{ fontSize: 14, color: '#666', textAlign: 'center' }}>
          Volte para a tela inicial e faça o login
        </Text>
      </View>
    );
  }

  // Função auxiliar para gerar endereço de fallback
  const generateFallbackAddress = (lat, lng) => {
    // Determina região aproximada baseada nas coordenadas
    let region = 'Localização Desconhecida';
    
    // Coordenadas aproximadas do Brasil
    if (lat >= -35 && lat <= 5 && lng >= -75 && lng <= -30) {
      region = 'Brasil';
      
      // Regiões aproximadas
      if (lat >= -15 && lng >= -50) {
        region = 'Região Central do Brasil';
      } else if (lat >= -25 && lat <= -15) {
        region = 'Região Sudeste do Brasil';
      } else if (lat <= -25) {
        region = 'Região Sul do Brasil';
      } else if (lat >= -10) {
        region = 'Região Norte/Nordeste do Brasil';
      }
    }
    
    return `${region} (${lat.toFixed(4)}, ${lng.toFixed(4)})`;
  };

  // Função para buscar endereço baseado nas coordenadas
  const getAddressFromCoords = async (lat, lng, retryCount = 0) => {
    // Validar parâmetros de entrada
    if (typeof lat !== 'number' || typeof lng !== 'number' || isNaN(lat) || isNaN(lng)) {
      console.warn('Coordenadas inválidas:', { lat, lng });
      return 'Coordenadas inválidas';
    }

    // Se o serviço já falhou antes, usar fallback imediatamente
    if (addressServiceFailed) {
      console.log('Serviço de endereços desabilitado, usando fallback');
      return generateFallbackAddress(lat, lng);
    }

    // Se já tentou 2 vezes, usar fallback e marcar serviço como falho
    if (retryCount >= 2) {
      console.warn('Limite de tentativas excedido, desabilitando serviço de endereços');
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
            'User-Agent': 'MapCity/1.0',
            'Accept': 'application/json',
          },
          mode: 'cors', // Explicitly set CORS mode
        }
      );
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`Erro HTTP: ${response.status}`);
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
      console.error(`Erro ao buscar endereço (tentativa ${retryCount + 1}):`, error);
      
      // Tratamento específico para diferentes tipos de erro
      if (error.name === 'AbortError') {
        console.warn('Busca de endereço cancelada por timeout - tentando novamente');
        return getAddressFromCoords(lat, lng, retryCount + 1);
      } else if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
        console.warn('Problema de rede ao buscar endereço - tentando novamente');
        // Esperar um pouco antes de tentar novamente
        await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1)));
        return getAddressFromCoords(lat, lng, retryCount + 1);
      } else {
        // Para outros erros, usar fallback imediatamente
        console.warn('Erro desconhecido, usando fallback');
        return generateFallbackAddress(lat, lng);
      }
    }
  };

  // Busca endereço quando um marcador é selecionado
  React.useEffect(() => {
    if (selectedMarker && 
        typeof selectedMarker.lat === 'number' && 
        typeof selectedMarker.lng === 'number' &&
        !isNaN(selectedMarker.lat) && 
        !isNaN(selectedMarker.lng)) {
      getAddressFromCoords(selectedMarker.lat, selectedMarker.lng)
        .then(address => setMarkerAddress(address));
    } else if (selectedMarker) {
      console.warn('Marcador selecionado com coordenadas inválidas:', selectedMarker);
      setMarkerAddress('Coordenadas inválidas');
    }
  }, [selectedMarker]);

  // Busca endereço quando uma posição é clicada para novo marcador
  React.useEffect(() => {
    if (clickPosition && 
        typeof clickPosition.lat === 'number' && 
        typeof clickPosition.lng === 'number' &&
        !isNaN(clickPosition.lat) && 
        !isNaN(clickPosition.lng)) {
      getAddressFromCoords(clickPosition.lat, clickPosition.lng)
        .then(address => setClickAddress(address));
    } else if (clickPosition) {
      console.warn('Posição clicada com coordenadas inválidas:', clickPosition);
      setClickAddress('Coordenadas inválidas');
    }
  }, [clickPosition]);

  // Buscar marcadores do backend ao carregar
  React.useEffect(() => {
    const carregarLugares = async () => {
      try {
        console.log('🔄 Carregando lugares para usuário:', usuario.email);
        const data = await lugaresAPI.buscarTodos();
        console.log('📍 Dados recebidos do backend:', data);
        
        const adaptados = data.map(lugar => {
          console.log('Processando lugar:', lugar.id, 'Coordenadas:', {
            latitude: lugar.latitude, 
            longitude: lugar.longitude,
            tipos: {
              lat: typeof lugar.latitude,
              lng: typeof lugar.longitude
            }
          });
          
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
          
          // Validar coordenadas antes de criar o objeto
          const lat = parseFloat(lugar.latitude);
          const lng = parseFloat(lugar.longitude);
          
          if (isNaN(lat) || isNaN(lng)) {
            console.error('Coordenadas inválidas para lugar', lugar.id, ':', {
              latitude: lugar.latitude,
              longitude: lugar.longitude,
              parsedLat: lat,
              parsedLng: lng
            });
            return null; // Retorna null para filtrar depois
          }
          
          return {
            id: lugar.id,
            lat: lat,
            lng: lng,
            type: lugar.tipo || 'outro',
            description: lugar.descricao || lugar.nome,
            images: images,
            resolved: lugar.resolvido || false,
            resolvedAt: lugar.resolvido_em || null
          };
        }).filter(lugar => lugar !== null); // Remove objetos com coordenadas inválidas
        
        console.log('✅ Marcadores adaptados:', adaptados);
        setMarkers(adaptados);
      } catch (error) {
        console.error('❌ Erro ao buscar lugares:', error);
        Alert.alert('Erro', 'Não foi possível carregar os marcadores');
      }
    };

    if (estaLogado) {
      carregarLugares();
      
      // Carregar áreas e notificações se for ONG
      if (usuario.tipo === 'ong') {
        carregarAreas();
        carregarNotificacoes();
      }
    }
  }, [estaLogado]);

  // Carregar áreas de responsabilidade para ONGs
  const carregarAreas = useCallback(async () => {
    if (!usuario || usuario.tipo !== 'ong') return;
    
    try {
      console.log('🗺️ Carregando áreas para ONG:', usuario.id);
      const data = await areasAPI.buscarAreas();
      console.log('✅ Áreas carregadas:', data.length);
      setAreas(data);
    } catch (error) {
      console.error('❌ Erro ao carregar áreas:', error);
    }
  }, [usuario]);

  // Carregar notificações para ONGs
  const carregarNotificacoes = useCallback(async () => {
    if (!usuario || usuario.tipo !== 'ong') return;
    
    try {
      console.log('🔔 Carregando notificações para ONG:', usuario.id);
      const data = await areasAPI.buscarNotificacoes();
      console.log('✅ Notificações carregadas:', data.length);
      setNotificacoes(data);
    } catch (error) {
      console.error('❌ Erro ao carregar notificações:', error);
    }
  }, [usuario]);

  // ========= FUNÇÕES DE ÁREA PARA ONGS =========
  
  // Iniciar criação de área
  const iniciarCriacaoArea = () => {
    setAreaDrawingMode(true);
    setAreaPoints([]);
    Alert.alert(
      'Marcar Área de Responsabilidade',
      'Clique no mapa para marcar os pontos da sua área de responsabilidade. Clique no primeiro ponto novamente para finalizar.'
    );
  };

  // Cancelar criação de área
  const cancelarCriacaoArea = () => {
    setAreaDrawingMode(false);
    setAreaPoints([]);
  };

  // Finalizar criação de área
  const finalizarCriacaoArea = async () => {
    if (areaPoints.length < 3) {
      Alert.alert('Erro', 'É necessário marcar pelo menos 3 pontos para criar uma área.');
      return;
    }

    try {
      const novaArea = {
        nome: `Área ${new Date().toLocaleDateString()}`,
        coordenadas: areaPoints
      };

      console.log('📍 Criando nova área:', novaArea);
      await areasAPI.criarArea(novaArea);
      
      Alert.alert('Sucesso', 'Área de responsabilidade criada com sucesso!');
      
      // Resetar estado e recarregar áreas
      setAreaDrawingMode(false);
      setAreaPoints([]);
      await carregarAreas();
      
    } catch (error) {
      console.error('❌ Erro ao criar área:', error);
      Alert.alert('Erro', 'Não foi possível criar a área de responsabilidade.');
    }
  };

  console.log('Renderizando componente. Marcadores:', markers.length);

  const handleMapClick = useCallback((lat, lng) => {
    console.log('Clique recebido:', lat, lng);
    
    // Se estiver no modo de desenho de área, adicionar ponto
    if (areaDrawingMode && usuario && usuario.tipo === 'ong') {
      const newPoint = { lat, lng };
      
      // Verificar se é o primeiro ponto sendo clicado novamente (fechar área)
      if (areaPoints.length >= 3) {
        const firstPoint = areaPoints[0];
        const distance = Math.sqrt(
          Math.pow(lat - firstPoint.lat, 2) + Math.pow(lng - firstPoint.lng, 2)
        );
        
        // Se clicar próximo ao primeiro ponto (tolerância de 0.001)
        if (distance < 0.001) {
          finalizarCriacaoArea();
          return;
        }
      }
      
      // Adicionar novo ponto
      setAreaPoints(prev => [...prev, newPoint]);
      console.log('📍 Ponto adicionado à área:', newPoint, 'Total:', areaPoints.length + 1);
      return;
    }
    
    // Verificar se o usuário pode adicionar marcadores normais
    if (usuario.tipo === 'admin') {
      Alert.alert(
        'Modo Administrador',
        'Como administrador, você pode visualizar e excluir marcadores, mas não criar novos.',
        [{ text: 'OK' }]
      );
      return;
    }
    
    if (usuario.tipo === 'usuario' || usuario.tipo === 'ong') {
      setClickPosition({ lat, lng });
      setIsModalVisible(true);
    }
  }, [usuario, areaDrawingMode, areaPoints, finalizarCriacaoArea]);

  // Função para fazer upload das imagens
  const uploadImages = async (images) => {
    console.log(' Iniciando upload de', images?.length || 0, 'imagens');
    
    if (!images || images.length === 0) {
      console.log('⚠️ Nenhuma imagem fornecida para upload');
      return [];
    }
    
    try {
      // Converter imagens para File objects
      const files = [];
      
      for (let i = 0; i < images.length; i++) {
        const image = images[i];
        console.log(`📁 Processando imagem ${i + 1}/${images.length}:`, image.id);
        
        try {
          // Determinar a URI da imagem
          let imageUri;
          if (image.uri) {
            imageUri = image.uri;
          } else if (image.data) {
            imageUri = image.data;
          } else {
            console.error('❌ Objeto image não tem uri nem data:', image);
            continue;
          }
          
          // Verificar se é data URL válida
          if (!imageUri.startsWith('data:')) {
            console.error('❌ URI não é data URL válida:', imageUri.substring(0, 100));
            continue;
          }
          
          // Separar o header do base64
          const [header, base64Data] = imageUri.split(',');
          if (!base64Data) {
            console.error('❌ Não foi possível separar base64');
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
          const mimeMatch = header.match(/data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+)/);
          const mimeType = mimeMatch ? mimeMatch[1] : 'image/jpeg';
          
          // Criar File object
          const blob = new Blob([byteArray], { type: mimeType });
          const file = new File([blob], `image_${image.id}.jpg`, { type: mimeType });
          
          files.push(file);
          console.log('✅ File criado:', file.name, file.size, 'bytes');
          
        } catch (error) {
          console.error('❌ Erro ao processar imagem', image.id, ':', error);
        }
      }
      
      if (files.length === 0) {
        console.log('⚠️ Nenhum arquivo válido para upload');
        return [];
      }
      
      // Usar a API autenticada para upload
      console.log('🌐 Enviando', files.length, 'arquivos...');
      const result = await uploadAPI.enviarImagens(files);
      
      console.log('✅ Upload concluído:', result);
      return result.images || [];
      
    } catch (error) {
      console.error('❌ Erro no upload:', error);
      Alert.alert('Erro', 'Falha no upload das imagens');
      return [];
    }
  };

  const handleSubmit = useCallback(async () => {
    if (!problemType || !description || !clickPosition) {
      Alert.alert('Erro', 'Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    console.log('🔐 Enviando marcador como:', usuario.email, '(', usuario.tipo, ')');
    
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
      console.log('🔍 Verificando imagens selecionadas:', selectedImages.length);
      
      if (selectedImages.length > 0) {
        console.log('📤 Fazendo upload de', selectedImages.length, 'imagem(s)...');
        imagePaths = await uploadImages(selectedImages);
        console.log('✅ Upload concluído. Caminhos recebidos:', imagePaths);
      }

      // Usar API autenticada para criar lugar
      const dadosLugar = {
        nome: nomeProblema,
        descricao: description,
        tipo: problemType,
        latitude: clickPosition.lat,
        longitude: clickPosition.lng,
        imagem: imagePaths
      };
      
      console.log('📝 Dados do lugar:', dadosLugar);
      const novoLugar = await lugaresAPI.criar(dadosLugar);
      
      console.log('✅ Lugar criado:', novoLugar);
      
      // Adicionar à lista local
      setMarkers(prev => [
        ...prev,
        {
          id: novoLugar.id,
          lat: clickPosition.lat,
          lng: clickPosition.lng,
          type: problemType,
          description: description,
          images: imagePaths,
          resolved: false
        }
      ]);
      
      Alert.alert('Sucesso', 'Problema reportado com sucesso!');
      
    } catch (err) {
      console.error('❌ Erro ao salvar marcador:', err);
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
    
    console.log('🔐 Marcando como resolvido:', selectedMarker.id, 'por', usuario.email);
    
    try {
      // Usar API autenticada para resolver
      await lugaresAPI.resolver(selectedMarker.id, true);

      // Atualizar no frontend
      setMarkers(prev => {
        const updated = prev.map(marker => 
          marker.id === selectedMarker.id 
            ? { ...marker, resolved: true, resolvedAt: new Date().toISOString() }
            : marker
        );
        console.log('✅ Marcadores atualizados');
        return updated;
      });
      
      setIsViewModalVisible(false);
      setSelectedMarker(null);
      Alert.alert('Sucesso', 'Problema marcado como resolvido!');
      
    } catch (error) {
      console.error('❌ Erro ao marcar como resolvido:', error);
      Alert.alert('Erro', 'Não foi possível marcar como resolvido');
    }
  }, [selectedMarker, usuario]);

  // Função para deletar marcador (apenas admin)
  const handleDeleteMarker = useCallback(async () => {
    if (!selectedMarker) {
      console.log('Nenhum marcador selecionado');
      return;
    }
    
    if (usuario.tipo !== 'admin') {
      Alert.alert('Erro', 'Apenas administradores podem deletar marcadores');
      return;
    }
    
    Alert.alert(
      'Confirmar Exclusão',
      'Tem certeza que deseja deletar este marcador? Esta ação não pode ser desfeita.',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Deletar', 
          style: 'destructive',
          onPress: async () => {
            try {
              console.log('🗑️ Admin deletando marcador:', selectedMarker.id);
              await lugaresAPI.deletar(selectedMarker.id);
              
              // Remover do frontend
              setMarkers(prev => prev.filter(marker => marker.id !== selectedMarker.id));
              
              setIsViewModalVisible(false);
              setSelectedMarker(null);
              Alert.alert('Sucesso', 'Marcador deletado com sucesso!');
              
            } catch (error) {
              console.error('❌ Erro ao deletar marcador:', error);
              Alert.alert('Erro', 'Não foi possível deletar o marcador');
            }
          }
        }
      ]
    );
  }, [selectedMarker, usuario]);

  // Deletar marcador (admin ou ONG responsável pela área)
  const handleDeleteMarkerWithArea = useCallback(async (markerId) => {
    if (!usuario) return;

    try {
      // Admin pode deletar qualquer marcador
      if (usuario.tipo === 'admin') {
        console.log('🗑️ Admin deletando marcador:', markerId);
        await lugaresAPI.deletar(markerId);
        setMarkers(prev => prev.filter(marker => marker.id !== markerId));
        Alert.alert('Sucesso', 'Marcador deletado com sucesso!');
        return;
      }

      // ONG pode deletar apenas marcadores em sua área
      if (usuario.tipo === 'ong') {
        console.log('🗑️ ONG tentando deletar marcador:', markerId);
        const resultado = await areasAPI.deletarMarcadorEmArea(markerId);
        
        if (resultado.sucesso) {
          setMarkers(prev => prev.filter(marker => marker.id !== markerId));
          Alert.alert('Sucesso', 'Marcador deletado com sucesso!');
        } else {
          Alert.alert('Erro', resultado.message || 'Este marcador não está na sua área de responsabilidade.');
        }
        return;
      }

      Alert.alert('Erro', 'Você não tem permissão para deletar marcadores.');
      
    } catch (error) {
      console.error('❌ Erro ao deletar marcador:', error);
      Alert.alert('Erro', 'Não foi possível deletar o marcador.');
    }
  }, [usuario]);

  // Marcar notificação como lida
  const marcarNotificacaoLida = useCallback(async (notificacaoId) => {
    try {
      await areasAPI.marcarNotificacaoLida(notificacaoId);
      setNotificacoes(prev => 
        prev.map(notif => 
          notif.id === notificacaoId 
            ? { ...notif, lida: true }
            : notif
        )
      );
    } catch (error) {
      console.error('❌ Erro ao marcar notificação como lida:', error);
    }
  }, []);

  return (
    <View style={styles.container}>
      <SimpleMapView 
        onMapClick={handleMapClick}
        onMarkerClick={handleMarkerClick}
        markers={markers}
        areas={areas}
        areaPoints={areaPoints}
        areaDrawingMode={areaDrawingMode}
      />
      
      {addressServiceFailed && (
        <View style={styles.warningBanner}>
          <Text style={styles.warningText}>
            ⚠️ Serviço de endereços indisponível. Mostrando coordenadas.
          </Text>
        </View>
      )}

      {/* Interface para ONGs */}
      {usuario && usuario.tipo === 'ong' && (
        <View style={styles.ongInterface}>
          <View style={styles.ongHeader}>
            <Text style={styles.ongTitle}>🏢 {usuario.nome || usuario.email}</Text>
            <View style={styles.ongActions}>
              {/* Botão de notificações */}
              <TouchableOpacity 
                style={[styles.ongButton, styles.notificationButton]}
                onPress={() => setIsNotificationModalVisible(true)}
              >
                <Text style={styles.ongButtonText}>🔔</Text>
                {notificacoes.filter(n => !n.lida).length > 0 && (
                  <View style={styles.notificationBadge}>
                    <Text style={styles.badgeText}>
                      {notificacoes.filter(n => !n.lida).length}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>

              {/* Botão para gerenciar áreas */}
              <TouchableOpacity 
                style={[styles.ongButton, styles.areaButton]}
                onPress={() => setIsAreaModalVisible(true)}
              >
                <Text style={styles.ongButtonText}>📍</Text>
              </TouchableOpacity>

              {/* Botão para iniciar marcação de área */}
              {!areaDrawingMode ? (
                <TouchableOpacity 
                  style={[styles.ongButton, styles.drawButton]}
                  onPress={iniciarCriacaoArea}
                >
                  <Text style={styles.ongButtonText}>✏️</Text>
                </TouchableOpacity>
              ) : (
                <View style={styles.drawingControls}>
                  <TouchableOpacity 
                    style={[styles.ongButton, styles.finishButton]}
                    onPress={finalizarCriacaoArea}
                  >
                    <Text style={styles.ongButtonText}>✅</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.ongButton, styles.cancelButton]}
                    onPress={cancelarCriacaoArea}
                  >
                    <Text style={styles.ongButtonText}>❌</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>

          {/* Modo de desenho ativo */}
          {areaDrawingMode && (
            <View style={styles.drawingStatus}>
              <Text style={styles.drawingText}>
                📍 Clique no mapa para marcar pontos da área ({areaPoints.length} pontos)
              </Text>
            </View>
          )}
        </View>
      )}
      
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

                {/* Botão de deletar para administradores e ONGs */}
                {(usuario.tipo === 'admin' || usuario.tipo === 'ong') && (
                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => handleDeleteMarkerWithArea(selectedMarker.id)}
                  >
                    <Text style={styles.deleteButtonText}>
                      🗑️ Deletar Marcador {usuario.tipo === 'admin' ? '(Admin)' : '(ONG)'}
                    </Text>
                  </TouchableOpacity>
                )}
              </>
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
                <Text style={styles.emptyStateTitle}>Nenhuma área definida</Text>
                <Text style={styles.emptyStateDescription}>
                  Use o botão ✏️ no mapa para marcar sua área de responsabilidade
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
                    📍 {area.coordenadas?.length || 0} pontos
                  </Text>
                  {area.descricao && (
                    <Text style={styles.areaDescription}>{area.descricao}</Text>
                  )}
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
                  Você receberá notificações quando novos problemas forem reportados em suas áreas
                </Text>
              </View>
            ) : (
              notificacoes.map((notificacao) => (
                <TouchableOpacity
                  key={notificacao.id}
                  style={[
                    styles.notificationItem,
                    !notificacao.lida && styles.notificationUnread
                  ]}
                  onPress={() => marcarNotificacaoLida(notificacao.id)}
                >
                  <View style={styles.notificationHeader}>
                    <Text style={styles.notificationTitle}>
                      {notificacao.titulo}
                    </Text>
                    <Text style={styles.notificationDate}>
                      {new Date(notificacao.criado_em).toLocaleDateString()}
                    </Text>
                  </View>
                  <Text style={styles.notificationMessage}>
                    {notificacao.mensagem}
                  </Text>
                  {!notificacao.lida && (
                    <View style={styles.unreadIndicator} />
                  )}
                </TouchableOpacity>
              ))
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
  deleteButton: {
    backgroundColor: '#EF4444',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 16,
    marginTop: 8,
  },
  deleteButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  warningBanner: {
    position: 'absolute',
    top: 10,
    left: 10,
    right: 10,
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#F59E0B',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    zIndex: 1000,
  },
  warningText: {
    fontSize: 12,
    color: '#92400E',
    textAlign: 'center',
    fontWeight: '500',
  },
  // Estilos para interface ONG
  ongInterface: {
    position: 'absolute',
    top: 60,
    left: 10,
    right: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 12,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    zIndex: 1000,
  },
  ongHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  ongTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    flex: 1,
  },
  ongActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  ongButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
    elevation: 3,
  },
  ongButtonText: {
    fontSize: 18,
  },
  notificationButton: {
    backgroundColor: '#3B82F6',
    position: 'relative',
  },
  areaButton: {
    backgroundColor: '#10B981',
  },
  drawButton: {
    backgroundColor: '#F59E0B',
  },
  finishButton: {
    backgroundColor: '#059669',
  },
  cancelButton: {
    backgroundColor: '#EF4444',
  },
  drawingControls: {
    flexDirection: 'row',
    gap: 8,
  },
  notificationBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: '#EF4444',
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  drawingStatus: {
    marginTop: 8,
    padding: 8,
    backgroundColor: '#FEF3C7',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#F59E0B',
  },
  drawingText: {
    fontSize: 12,
    color: '#92400E',
    textAlign: 'center',
    fontWeight: '500',
  },
  // Estilos para modais de área e notificações
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  emptyStateText: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  emptyStateDescription: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  areaItem: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  areaHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  areaName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    flex: 1,
  },
  areaDate: {
    fontSize: 12,
    color: '#6B7280',
  },
  areaPoints: {
    fontSize: 14,
    color: '#059669',
    marginBottom: 4,
  },
  areaDescription: {
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 18,
  },
  notificationItem: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    position: 'relative',
  },
  notificationUnread: {
    backgroundColor: '#EFF6FF',
    borderColor: '#3B82F6',
  },
  notificationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    flex: 1,
  },
  notificationDate: {
    fontSize: 12,
    color: '#6B7280',
  },
  notificationMessage: {
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 18,
  },
  unreadIndicator: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#3B82F6',
  },
};
