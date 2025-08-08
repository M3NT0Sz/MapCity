import React, { useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import "./MapCityMap.css";

const MAPTILER_KEY = "TeNnfZzs7w14Q89Kkzhv"; // Insira seu token real do MapTiler Cloud
const MAPTILER_STYLE =
  "https://api.maptiler.com/maps/streets-v2/style.json?key=" + MAPTILER_KEY;
const INITIAL_CENTER = [-51.3889, -22.1207]; // [lng, lat] Presidente Prudente - SP
const INITIAL_ZOOM = 13; // Zoom para ver bem a cidade

function MapCityMap() {
  const mapContainer = useRef(null);
  const mapRef = useRef(null);
  const [markers, setMarkers] = useState([]);
  // Função para obter cor baseada no tipo
  const getMarkerColor = (type, resolved) => {
    if (resolved) return '#27ae60'; // Verde para resolvido
    
    const colors = {
      'lixo': '#27ae60',     // Verde
      'buraco': '#f39c12',   // Laranja  
      'iluminacao': '#3498db', // Azul
      'outro': '#9b59b6'     // Roxo
    };
    
    return colors[type] || '#9b59b6'; // Roxo como padrão
  };

  // Buscar lugares do backend ao carregar
  useEffect(() => {
    fetch('http://localhost:3001/lugares')
      .then(res => res.json())
      .then(data => {
        console.log('=== DADOS DO BACKEND ===');
        console.log('Dados recebidos do backend:', data);
        console.log('Primeiro item completo:', data[0]);
        
        // Adapta os dados do backend para o formato dos marcadores do frontend
        const adaptados = data.map(lugar => {
          console.log(`=== PROCESSANDO LUGAR ID ${lugar.id} ===`);
          console.log('Campo imagem original:', lugar.imagem);
          console.log('Tipo do campo imagem:', typeof lugar.imagem);
          
          const marcador = {
            id: lugar.id,
            lng: lugar.longitude,
            lat: lugar.latitude,
            type: lugar.tipo || 'outro', // Usa o tipo do backend
            description: lugar.descricao || lugar.nome,
            image: lugar.imagem, // Mapeia corretamente o campo imagem do banco
            resolved: lugar.resolvido || false
          };
          
          console.log('Marcador final:', marcador);
          console.log('=== FIM PROCESSAMENTO ===');
          return marcador;
        });
        
        console.log('=== MARCADORES ADAPTADOS ===');
        console.log('Total de marcadores:', adaptados.length);
        console.log('Todos os marcadores:', adaptados);
        console.log('=== FIM ADAPTAÇÃO ===');
        
        setMarkers(adaptados);
      })
      .catch(err => console.error('Erro ao buscar lugares:', err));
  }, []);
  const [modal, setModal] = useState({ open: false, lngLat: null });
  const [formModal, setFormModal] = useState({ open: false, lngLat: null });
  // Estado para exibir modal de visualização
  const [viewModal, setViewModal] = useState({ open: false, marker: null });

  useEffect(() => {
    let maptilersdk;
    let map;
    let clickHandler;

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
      map = new maptilersdk.Map({
        container: mapContainer.current,
        style: MAPTILER_STYLE,
        center: INITIAL_CENTER,
        zoom: INITIAL_ZOOM,
        pitch: 45,
        bearing: -17.6,
        hash: false,
        terrain: true,
      });
      mapRef.current = map;
      clickHandler = (e) => {
        // Verifica se clicou em um marcador
        if (e.originalEvent.target.classList.contains('marker')) return;
        onMapClick(e);
      };
      map.on('click', clickHandler);
      map.on('load', () => {
        renderMarkers(map);
      });
    };

    loadMap();

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
      }
    };
    // eslint-disable-next-line
  }, []);

  // Tipos de problemas urbanos
  const problemTypes = [
    { value: "lixo", label: "Lixo" },
    { value: "buraco", label: "Buraco" },
    { value: "iluminacao", label: "Iluminação" },
    { value: "outro", label: "Outro" },
  ];

  // Função para adicionar marcador ao clicar no mapa
  const onMapClick = (e) => {
    const lngLat = e.lngLat || (e.lngLat ? e.lngLat : e.lngLatWrap());
    setModal({ open: true, lngLat });
  };

  // Função para confirmar adição do marcador
  const handleConfirmAdd = () => {
    setModal({ open: false, lngLat: null });
    setFormModal({ open: true, lngLat: modal.lngLat });
  };

  // Função para cancelar adição do marcador
  const handleCancelAdd = () => {
    setModal({ open: false, lngLat: null });
  };

  // Função para salvar marcador do modal
  const handleSaveFromModal = async (data) => {
    console.log('Dados do formulário:', data);
    
    // Mapeia os tipos para nomes descritivos mas mantém o tipo para persistência
    const typeToNameMap = {
      'lixo': 'Problema de Lixo',
      'buraco': 'Buraco na Rua', 
      'iluminacao': 'Problema de Iluminação',
      'outro': 'Outro Problema'
    };

    const payloadData = {
      nome: typeToNameMap[data.type] || 'Problema',
      descricao: data.description,
      tipo: data.type, // Mantém o tipo original para cores
      latitude: formModal.lngLat.lat,
      longitude: formModal.lngLat.lng,
      imagePaths: data.imagePaths || [] // Usa apenas caminhos de arquivo
    };

    console.log('Enviando para backend:', payloadData);

    try {
      // Envia para o backend
      const response = await fetch('http://localhost:3001/lugares', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payloadData)
      });
      
      const novoLugar = await response.json();
      console.log('Resposta do backend:', novoLugar);
      
      setMarkers((prev) => [
        ...prev,
        {
          id: novoLugar.id,
          lng: novoLugar.longitude,
          lat: novoLugar.latitude,
          type: data.type, // Usa o tipo do formulário para as cores
          description: data.description,
          image: novoLugar.imagem, // Usa os dados do backend
          resolved: false,
          isEditing: false
        },
      ]);
    } catch (err) {
      console.error('Erro ao salvar marcador:', err);
      alert('Erro ao salvar marcador!');
    }
    
    setFormModal({ open: false, lngLat: null });
  };

  // Renderizar marcadores no mapa
  const renderMarkers = (map) => {
    if (!window.maptilersdk) return;
    // Remove marcadores antigos
    if (map._markerObjects) {
      map._markerObjects.forEach((m) => m.remove());
    }
    map._markerObjects = [];
    markers.forEach((marker) => {
      const el = document.createElement('div');
      el.className = 'marker';
      el.style.background = getMarkerColor(marker.type, marker.resolved);
      el.style.width = '28px';
      el.style.height = '28px';
      el.style.borderRadius = '50%';
      el.style.border = '2px solid #fff';
      el.style.boxShadow = '0 2px 6px rgba(0,0,0,0.2)';
      el.style.cursor = 'pointer';
      el.addEventListener('click', (evt) => {
        evt.stopPropagation();
        setViewModal({ open: true, marker });
      });
      const markerObj = new window.maptilersdk.Marker(el)
        .setLngLat([marker.lng, marker.lat])
        .addTo(map);
      map._markerObjects.push(markerObj);
    });
  };

  // Modal de visualização do marcador
  function MarkerViewModal({ marker, onResolve, onClose }) {
    if (!marker) return null;
    
    console.log('=== MODAL DE VISUALIZAÇÃO ===');
    console.log('Marcador completo:', marker);
    console.log('Tipo de marker.image:', typeof marker.image);
    console.log('marker.image:', marker.image);
    console.log('===============================');
    
    return (
      <div className="mapcity-modal-bg">
        <div className="mapcity-modal-content custom-modal" style={{minWidth:320, maxWidth:420}}>
          <h2 className="modal-title">Informações do problema</h2>
          <div className="modal-grid" style={{flexDirection:'column',gap:0}}>
            <div className="modal-left" style={{width:'100%'}}>
              <label className="modal-label">Tipo do problema:</label>
              <div className="modal-select" style={{background:'#f5f5f5',border:'none',fontWeight:600}}>
                {problemTypes.find((t) => t.value === marker.type)?.label || 'Problema'}
              </div>
              <label className="modal-label" style={{marginTop:12}}>Descrição:</label>
              <div className="modal-textarea" style={{background:'#f5f5f5',border:'none',minHeight:80}}>
                {marker.description}
              </div>
              <label className="modal-label" style={{marginTop:12}}>Imagens:</label>
              <div className="modal-image-upload" style={{cursor:'default',border:'none',background:'#f5f5f5'}}>
                {marker.image && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {(() => {
                      try {
                        // Primeiro, tentar parsear como JSON (novo sistema)
                        let imagePaths = [];
                        
                        if (typeof marker.image === 'string') {
                          try {
                            const parsed = JSON.parse(marker.image);
                            if (Array.isArray(parsed)) {
                              // Se for array de strings (caminhos), usar diretamente
                              if (parsed.length > 0 && typeof parsed[0] === 'string') {
                                imagePaths = parsed;
                                console.log('✅ Array de caminhos encontrado:', imagePaths);
                              } else {
                                // Se for array de objetos com data (sistema antigo), extrair data
                                imagePaths = parsed.map(item => item.data).filter(Boolean);
                                console.log('📦 Convertendo objetos para dados:', imagePaths.length);
                              }
                            }
                          } catch (e) {
                            // Se não conseguir parsear, pode ser base64 direto
                            if (marker.image.startsWith('data:image/')) {
                              imagePaths = [marker.image];
                              console.log('📸 Base64 direto detectado');
                            }
                          }
                        } else if (Array.isArray(marker.image)) {
                          imagePaths = marker.image;
                          console.log('📚 Array direto detectado:', imagePaths);
                        }
                        
                        return imagePaths.map((imagePath, index) => {
                          // Determinar a URL da imagem
                          let imageUrl;
                          if (imagePath.startsWith('/uploads/')) {
                            // Sistema de arquivos
                            imageUrl = `http://localhost:3001${imagePath}`;
                            console.log(`🗂️ Imagem ${index + 1} (arquivo):`, imageUrl);
                          } else if (imagePath.startsWith('data:image/')) {
                            // Base64
                            imageUrl = imagePath;
                            console.log(`📸 Imagem ${index + 1} (base64):`, imagePath.substring(0, 50) + '...');
                          } else {
                            console.warn(`⚠️ Formato não reconhecido para imagem ${index + 1}:`, imagePath);
                            return null;
                          }
                          
                          return (
                            <img 
                              key={index} 
                              src={imageUrl} 
                              alt={`imagem do problema ${index + 1}`} 
                              className="modal-image-preview" 
                              style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '4px' }}
                              onError={(e) => {
                                console.error(`❌ Erro ao carregar imagem ${index + 1}:`, imageUrl);
                                e.target.style.border = '2px solid red';
                                e.target.alt = '❌ ERRO';
                              }}
                              onLoad={() => console.log(`✅ Imagem ${index + 1} carregada com sucesso`)}
                            />
                          );
                        }).filter(Boolean);
                        
                      } catch (error) {
                        console.error('❌ Erro ao processar imagens:', error);
                        return <div style={{color: 'red', fontSize: '12px'}}>Erro ao carregar imagens</div>;
                      }
                    })()}
                  </div>
                )}
                {!marker.image && (
                  <div className="modal-image-placeholder" style={{color:'#bbb'}}>Nenhuma imagem enviada</div>
                )}
              </div>
            </div>
          </div>
          <div className="modal-btn-row">
            {!marker.resolved && (
              <button className="modal-btn-save" onClick={() => onResolve(marker.id)} style={{marginRight:8}}>Resolvido</button>
            )}
            <button className="modal-btn-cancel" onClick={onClose}>Fechar</button>
            {marker.resolved && <div style={{color:'#27ae60',marginTop:8,fontWeight:600}}>Problema resolvido!</div>}
          </div>
        </div>
      </div>
    );
  }

  // Salvar marcador
  const handleSaveMarker = (updatedMarker) => {
    setMarkers((prev) =>
      prev.map((m) =>
        m.id === updatedMarker.id ? { ...updatedMarker, isEditing: false } : m
      )
    );
    if (mapRef.current) {
      renderMarkers(mapRef.current);
    }
  };

  // Editar marcador
  const handleEditMarker = (id) => {
    setMarkers((prev) =>
      prev.map((m) => (m.id === id ? { ...m, isEditing: true } : m))
    );
    if (mapRef.current) {
      renderMarkers(mapRef.current);
    }
  };

  // Remover marcador
  const handleRemoveMarker = (id) => {
    setMarkers((prev) => prev.filter((m) => m.id !== id));
    if (mapRef.current) {
      renderMarkers(mapRef.current);
    }
  };

  // Marcar como resolvido
  const handleResolveMarker = (id) => {
    setMarkers((prev) => prev.map((m) => m.id === id ? { ...m, resolved: true } : m));
    if (mapRef.current) {
      renderMarkers(mapRef.current);
    }
  };

  // Atualizar marcadores ao mudar estado
  useEffect(() => {
    if (mapRef.current) {
      renderMarkers(mapRef.current);
    }
    // eslint-disable-next-line
  }, [markers]);

  // Função para fazer upload de imagens
  const uploadImages = async (files) => {
    console.log('� ATENÇÃO: uploadImages CHAMADA!');
    console.log('�📤 UPLOAD FRONTEND - Iniciando upload de', files.length, 'arquivos');
    console.log('📁 Arquivos recebidos:', files);
    console.log('📁 Tipo de files:', typeof files);
    console.log('📁 files é array?', Array.isArray(files));
    
    if (!files || files.length === 0) {
      console.log('⚠️ AVISO: Nenhum arquivo foi fornecido para upload');
      return [];
    }
    
    const uploadedPaths = [];

    // Upload cada arquivo individualmente
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      console.log(`📁 Processando arquivo ${i + 1}/${files.length}:`, file.name, '(', file.size, 'bytes )');
      
      const formData = new FormData();
      formData.append('image', file); // Backend espera 'image', não 'images'

      try {
        console.log('🌐 Enviando para http://localhost:3001/upload...');
        const response = await fetch('http://localhost:3001/upload', {
          method: 'POST',
          body: formData,
        });

        console.log('📡 Response status:', response.status);
        console.log('📡 Response ok:', response.ok);

        if (!response.ok) {
          const errorText = await response.text();
          console.error('❌ Erro no upload do arquivo:', file.name, '- Status:', response.status, '- Erro:', errorText);
          continue; // Pula para o próximo arquivo
        }

        const result = await response.json();
        console.log('✅ Upload concluído para', file.name, ':', result);
        
        if (result.imagePath) {
          uploadedPaths.push(result.imagePath);
          console.log('📂 Caminho adicionado:', result.imagePath);
        } else {
          console.error('⚠️ Response não contém imagePath:', result);
        }
        
      } catch (error) {
        console.error('❌ Erro no upload de', file.name, ':', error);
      }
    }

    console.log('📤 Upload finalizado. Total de caminhos:', uploadedPaths.length);
    console.log('📂 Caminhos finais:', uploadedPaths);
    return uploadedPaths;
  };

  // Formulário do marcador
  function MarkerForm({ marker, onSave, onRemove }) {
    const [type, setType] = useState(marker.type);
    const [description, setDescription] = useState(marker.description);
    const [selectedFiles, setSelectedFiles] = useState([]);
    const [previewImages, setPreviewImages] = useState(marker.image || []);
    const [isUploading, setIsUploading] = useState(false);

    const handleFileSelect = (e) => {
      console.log('🎯 handleFileSelect DISPARADO');
      console.log('📁 Evento files:', e.target.files);
      console.log('📁 Quantidade de arquivos:', e.target.files.length);
      
      const files = Array.from(e.target.files);
      console.log('📁 Files convertido para array:', files);
      console.log('📁 Detalhes dos arquivos:', files.map(f => ({ name: f.name, size: f.size, type: f.type })));
      
      setSelectedFiles(files);
      console.log('📁 setSelectedFiles chamado com:', files.length, 'arquivos');

      // Criar previews das imagens selecionadas
      const previews = files.map(file => {
        return new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = (ev) => resolve(ev.target.result);
          reader.readAsDataURL(file);
        });
      });

      Promise.all(previews).then((previewUrls) => {
        console.log('🖼️ Previews criados:', previewUrls.length);
        setPreviewImages(previewUrls);
      });
    };

    const handleSubmit = async (e) => {
      e.preventDefault();
      setIsUploading(true);

      try {
        let imagePaths = marker.image || [];

        // Fazer upload das novas imagens se houver
        if (selectedFiles.length > 0) {
          imagePaths = await uploadImages(selectedFiles);
        }

        onSave({ ...marker, type, description, imagePaths });
      } catch (error) {
        console.error('Erro ao salvar:', error);
        alert('Erro ao fazer upload das imagens');
      } finally {
        setIsUploading(false);
      }
    };
    return (
      <form onSubmit={handleSubmit}>
        <label>Tipo do problema</label>
        <select value={type} onChange={(e) => setType(e.target.value)} required>
          <option value="">Selecione...</option>
          {problemTypes.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
        <label>Descrição</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          maxLength={120}
          required
        />
        <label>Imagens (opcional)</label>
        <input 
          type="file" 
          accept="image/*" 
          multiple 
          onChange={handleFileSelect} 
          disabled={isUploading}
        />
        
        {/* Preview das imagens */}
        {previewImages.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '8px' }}>
            {previewImages.map((img, index) => (
              <img 
                key={index} 
                src={typeof img === 'string' && img.startsWith('/uploads/') 
                  ? `http://localhost:3001${img}` 
                  : img
                } 
                alt={`preview ${index}`} 
                style={{ 
                  width: '60px', 
                  height: '60px', 
                  objectFit: 'cover', 
                  borderRadius: '4px' 
                }} 
              />
            ))}
          </div>
        )}
        
        <button type="submit" style={{ marginTop: 8 }} disabled={isUploading}>
          {isUploading ? 'Salvando...' : 'Salvar'}
        </button>
        <button
          type="button"
          className="remove-btn"
          onClick={() => onRemove(marker.id)}
        >
          Remover
        </button>
      </form>
    );
  }

  // Formulário do marcador (usado no modal)
  function MarkerFormModal({ onSave, onCancel }) {
    const [type, setType] = useState("");
    const [description, setDescription] = useState("");
    const [selectedFiles, setSelectedFiles] = useState([]);
    const [previewImages, setPreviewImages] = useState([]);
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef();

    const handleFileSelect = (e) => {
      const files = Array.from(e.target.files);
      setSelectedFiles(files);

      // Criar previews das imagens selecionadas (apenas para visualização)
      const previews = files.map(file => {
        return new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = (ev) => resolve(ev.target.result);
          reader.readAsDataURL(file);
        });
      });

      Promise.all(previews).then(setPreviewImages);
    };

    const handleSave = async () => {
      console.log('🚀 INÍCIO handleSave');
      console.log('📝 Tipo:', type);
      console.log('📝 Descrição:', description);
      console.log('📁 Arquivos selecionados:', selectedFiles);
      console.log('📁 Quantidade de arquivos:', selectedFiles.length);
      
      if (!type || !description) {
        alert('Por favor, preencha todos os campos obrigatórios');
        return;
      }

      setIsUploading(true);

      try {
        let imagePaths = [];

        // Fazer upload das imagens se houver
        if (selectedFiles.length > 0) {
          console.log('📤 Fazendo upload de', selectedFiles.length, 'arquivo(s)...');
          imagePaths = await uploadImages(selectedFiles);
          console.log('✅ Upload concluído. Caminhos recebidos:', imagePaths);
        } else {
          console.log('ℹ️ Nenhuma imagem selecionada - imagePaths ficará vazio');
        }

        console.log('💾 Chamando onSave com imagePaths:', imagePaths);
        onSave({ type, description, imagePaths });
      } catch (error) {
        console.error('❌ Erro ao salvar:', error);
        alert('Erro ao fazer upload das imagens: ' + error.message);
      } finally {
        setIsUploading(false);
      }
    };
    return (
      <div className="mapcity-modal-content custom-modal">
        <h2 className="modal-title">Fale um pouco sobre seu problema</h2>
        <div className="modal-grid">
          <div className="modal-left">
            <label className="modal-label">Selecione seu problema:</label>
            <select
              className="modal-select"
              value={type}
              onChange={(e) => setType(e.target.value)}
              required
            >
              <option value="">Problema...</option>
              {problemTypes.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
            <label className="modal-label">Descreva seu problema:</label>
            <textarea
              className="modal-textarea"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={120}
              placeholder="Fale um pouco sobre seu problema..."
              required
            />
          </div>
          <div className="modal-right">
            <label className="modal-label">Coloque imagens do seu problema:</label>
            <div
              className="modal-image-upload"
              onClick={() => fileInputRef.current.click()}
            >
              {previewImages.length > 0 ? (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {previewImages.map((img, index) => (
                    <img 
                      key={index} 
                      src={img} 
                      alt={`preview ${index}`} 
                      className="modal-image-preview" 
                      style={{ width: '60px', height: '60px', objectFit: 'cover' }}
                    />
                  ))}
                </div>
              ) : (
                <div className="modal-image-placeholder">
                  <span className="modal-image-plus">+</span>
                  <span className="modal-image-text">Clique para selecionar imagens</span>
                </div>
              )}
              <input
                type="file"
                accept="image/*"
                multiple
                style={{ display: 'none' }}
                ref={fileInputRef}
                onChange={handleFileSelect}
                disabled={isUploading}
              />
            </div>
          </div>
        </div>
        <div className="modal-btn-row">
          <button type="button" className="modal-btn-cancel" onClick={onCancel}>
            Fechar
          </button>
          <button
            type="button"
            className="modal-btn-save"
            onClick={handleSave}
            disabled={isUploading}
          >
            {isUploading ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mapcity-map-container">
      <div ref={mapContainer} className="mapcity-map" />
      {/* Modal de confirmação */}
      {modal.open && (
        <div className="mapcity-modal-bg">
          <div className="mapcity-modal-content">
            <p>Deseja adicionar um marcador neste local?</p>
            <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
              <button onClick={handleConfirmAdd}>Sim</button>
              <button className="remove-btn" onClick={handleCancelAdd}>
                Não
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Modal do formulário */}
      {formModal.open && (
        <div className="mapcity-modal-bg">
          <MarkerFormModal
            onSave={handleSaveFromModal}
            onCancel={() => setFormModal({ open: false, lngLat: null })}
          />
        </div>
      )}
      {/* Modal de visualização do marcador */}
      {viewModal.open && (
        <MarkerViewModal
          marker={viewModal.marker}
          onResolve={(id) => { handleResolveMarker(id); setViewModal(vm => ({...vm, open: false})); }}
          onClose={() => setViewModal({ open: false, marker: null })}
        />
      )}
    </div>
  );
}

export default MapCityMap;
