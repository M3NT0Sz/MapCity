import React, { useState, useEffect, useRef } from 'react';
import './MapCityMap.css';

const MapCityMap = () => {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const [markers, setMarkers] = useState([]);
  const [formModal, setFormModal] = useState({ open: false, lngLat: null });
  const [viewModal, setViewModal] = useState({ open: false, marker: null });

  // Buscar lugares do backend
  useEffect(() => {
    fetch('http://localhost:3001/lugares')
      .then(res => res.json())
      .then(data => {
        console.log('🗺️ Lugares carregados:', data.length);
        setMarkers(data);
      })
      .catch(err => console.error('❌ Erro ao buscar lugares:', err));
  }, []);

  // Inicializar mapa
  useEffect(() => {
    let maptilersdk;
    let mapInstance;

    const loadMap = async () => {
      if (!window.maptilersdk) {
        await new Promise((resolve, reject) => {
          const script = document.createElement('script');
          script.src = 'https://cdn.maptiler.com/maptiler-sdk-js/v1.1.1/maptiler-sdk.umd.min.js';
          script.onload = resolve;
          script.onerror = reject;
          document.body.appendChild(script);
        });

        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'https://cdn.maptiler.com/maptiler-sdk-js/v1.1.1/maptiler-sdk.css';
        document.head.appendChild(link);
      }

      maptilersdk = window.maptilersdk;
      maptilersdk.config.apiKey = 'SjbPh8qo41Aue8KEt2lm';

      if (map.current) return;

      mapInstance = new maptilersdk.Map({
        container: mapContainer.current,
        style: maptilersdk.MapStyle.STREETS,
        center: [-51.38, -22.13],
        zoom: 14
      });

      map.current = mapInstance;

      // Adicionar listener para cliques no mapa
      mapInstance.on('click', (e) => {
        const { lng, lat } = e.lngLat;
        setFormModal({ open: true, lngLat: [lng, lat] });
      });

      // Adicionar marcadores existentes
      updateMapMarkers();
    };

    loadMap();

    return () => {
      if (mapInstance) {
        mapInstance.remove();
        map.current = null;
      }
    };
  }, []);

  // Atualizar marcadores no mapa
  const updateMapMarkers = () => {
    if (!map.current) return;

    markers.forEach(marker => {
      const el = document.createElement('div');
      el.className = 'marker';
      el.style.cssText = `
        background-color: ${getMarkerColor(marker.tipo)};
        width: 20px;
        height: 20px;
        border-radius: 50%;
        border: 2px solid white;
        cursor: pointer;
        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
      `;

      el.addEventListener('click', () => {
        setViewModal({ open: true, marker });
      });

      new window.maptilersdk.Marker(el)
        .setLngLat([parseFloat(marker.longitude), parseFloat(marker.latitude)])
        .addTo(map.current);
    });
  };

  // Atualizar marcadores quando a lista mudar
  useEffect(() => {
    updateMapMarkers();
  }, [markers]);

  // Cores dos marcadores por tipo
  const getMarkerColor = (tipo) => {
    const cores = {
      buraco: '#FF4444',
      semaforo: '#FFA500',
      lixo: '#8B4513',
      iluminacao: '#FFD700',
      sinalizacao: '#4169E1',
      outro: '#666666'
    };
    return cores[tipo] || cores.outro;
  };

  // Upload de imagens
  const uploadImages = async (files) => {
    if (!files || files.length === 0) return [];
    
    const uploadedPaths = [];
    
    for (const file of files) {
      try {
        const formData = new FormData();
        formData.append('image', file);
        
        console.log('📤 Enviando arquivo:', file.name);
        
        const response = await fetch('http://localhost:3001/upload', {
          method: 'POST',
          body: formData
        });
        
        if (response.ok) {
          const result = await response.json();
          uploadedPaths.push(result.imagePath);
          console.log('✅ Upload concluído:', result.imagePath);
        } else {
          console.error('❌ Erro no upload:', await response.text());
        }
      } catch (error) {
        console.error('❌ Erro no upload:', error);
      }
    }
    
    return uploadedPaths;
  };

  // Componente do formulário
  const MarkerFormModal = () => {
    const [formData, setFormData] = useState({
      nome: '',
      descricao: '',
      tipo: 'buraco'
    });
    const [selectedFiles, setSelectedFiles] = useState([]);
    const [previews, setPreviews] = useState([]);
    const [loading, setLoading] = useState(false);

    const handleFileChange = (e) => {
      const files = Array.from(e.target.files);
      setSelectedFiles(files);
      
      // Criar previews
      const newPreviews = files.map(file => URL.createObjectURL(file));
      setPreviews(newPreviews);
    };

    const handleSubmit = async (e) => {
      e.preventDefault();
      setLoading(true);

      try {
        // Upload das imagens
        const imagePaths = await uploadImages(selectedFiles);
        
        // Dados do novo lugar
        const newPlace = {
          nome: formData.nome,
          descricao: formData.descricao,
          tipo: formData.tipo,
          latitude: formModal.lngLat[1],
          longitude: formModal.lngLat[0],
          imagePaths: imagePaths
        };

        console.log('📍 Criando lugar:', newPlace);

        // Salvar no backend
        const response = await fetch('http://localhost:3001/lugares', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(newPlace)
        });

        if (response.ok) {
          const createdPlace = await response.json();
          console.log('✅ Lugar criado:', createdPlace);
          
          // Atualizar lista de marcadores
          setMarkers(prev => [...prev, createdPlace]);
          
          // Fechar modal
          setFormModal({ open: false, lngLat: null });
          
          // Limpar formulário
          setFormData({ nome: '', descricao: '', tipo: 'buraco' });
          setSelectedFiles([]);
          setPreviews([]);
        } else {
          const error = await response.json();
          console.error('❌ Erro ao criar lugar:', error);
          alert('Erro ao salvar lugar: ' + error.error);
        }
      } catch (error) {
        console.error('❌ Erro:', error);
        alert('Erro ao salvar lugar');
      } finally {
        setLoading(false);
      }
    };

    if (!formModal.open) return null;

    return (
      <div className="modal-overlay">
        <div className="modal-content">
          <h3>🆕 Novo Problema</h3>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Nome do Problema:</label>
              <input
                type="text"
                value={formData.nome}
                onChange={(e) => setFormData({...formData, nome: e.target.value})}
                required
              />
            </div>

            <div className="form-group">
              <label>Descrição:</label>
              <textarea
                value={formData.descricao}
                onChange={(e) => setFormData({...formData, descricao: e.target.value})}
                rows="3"
              />
            </div>

            <div className="form-group">
              <label>Tipo:</label>
              <select
                value={formData.tipo}
                onChange={(e) => setFormData({...formData, tipo: e.target.value})}
              >
                <option value="buraco">🕳️ Buraco na via</option>
                <option value="semaforo">🚦 Semáforo</option>
                <option value="lixo">🗑️ Lixo acumulado</option>
                <option value="iluminacao">💡 Iluminação</option>
                <option value="sinalizacao">🚧 Sinalização</option>
                <option value="outro">❓ Outro</option>
              </select>
            </div>

            <div className="form-group">
              <label>Fotos:</label>
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleFileChange}
              />
              
              {previews.length > 0 && (
                <div className="image-previews">
                  {previews.map((preview, index) => (
                    <img
                      key={index}
                      src={preview}
                      alt={`Preview ${index + 1}`}
                      className="preview-image"
                    />
                  ))}
                </div>
              )}
            </div>

            <div className="modal-buttons">
              <button type="submit" disabled={loading}>
                {loading ? 'Salvando...' : '💾 Salvar'}
              </button>
              <button
                type="button"
                onClick={() => setFormModal({ open: false, lngLat: null })}
                disabled={loading}
              >
                ❌ Cancelar
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  // Componente de visualização
  const MarkerViewModal = () => {
    if (!viewModal.open || !viewModal.marker) return null;

    const marker = viewModal.marker;

    return (
      <div className="modal-overlay">
        <div className="modal-content">
          <h3>📍 {marker.nome}</h3>
          
          <div className="marker-info">
            <p><strong>Tipo:</strong> {marker.tipo}</p>
            <p><strong>Descrição:</strong> {marker.descricao}</p>
            <p><strong>Status:</strong> {marker.resolvido ? '✅ Resolvido' : '⏳ Pendente'}</p>
          </div>

          {marker.imagem && marker.imagem.length > 0 && (
            <div className="marker-images">
              <h4>📷 Fotos:</h4>
              <div className="image-gallery">
                {marker.imagem.map((imagePath, index) => (
                  <img
                    key={index}
                    src={`http://localhost:3001${imagePath}`}
                    alt={`Foto ${index + 1}`}
                    className="gallery-image"
                    onError={(e) => {
                      console.error('❌ Erro ao carregar imagem:', imagePath);
                      e.target.style.display = 'none';
                    }}
                  />
                ))}
              </div>
            </div>
          )}

          <div className="modal-buttons">
            {!marker.resolvido && (
              <button
                onClick={async () => {
                  try {
                    await fetch(`http://localhost:3001/lugares/${marker.id}/resolver`, {
                      method: 'PUT'
                    });
                    
                    // Atualizar marcador localmente
                    setMarkers(prev => prev.map(m => 
                      m.id === marker.id ? {...m, resolvido: true} : m
                    ));
                    
                    setViewModal({ open: false, marker: null });
                  } catch (error) {
                    console.error('❌ Erro ao resolver:', error);
                  }
                }}
              >
                ✅ Marcar como Resolvido
              </button>
            )}
            
            <button onClick={() => setViewModal({ open: false, marker: null })}>
              ❌ Fechar
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="map-container">
      <div ref={mapContainer} className="map" />
      <MarkerFormModal />
      <MarkerViewModal />
      
      <div className="map-legend">
        <h4>🗺️ Legenda</h4>
        <div className="legend-item">
          <span className="legend-color" style={{backgroundColor: '#FF4444'}}></span>
          🕳️ Buraco na via
        </div>
        <div className="legend-item">
          <span className="legend-color" style={{backgroundColor: '#FFA500'}}></span>
          🚦 Semáforo
        </div>
        <div className="legend-item">
          <span className="legend-color" style={{backgroundColor: '#8B4513'}}></span>
          🗑️ Lixo acumulado
        </div>
        <div className="legend-item">
          <span className="legend-color" style={{backgroundColor: '#FFD700'}}></span>
          💡 Iluminação
        </div>
        <div className="legend-item">
          <span className="legend-color" style={{backgroundColor: '#4169E1'}}></span>
          🚧 Sinalização
        </div>
        <div className="legend-item">
          <span className="legend-color" style={{backgroundColor: '#666666'}}></span>
          ❓ Outro
        </div>
      </div>
    </div>
  );
};

export default MapCityMap;
