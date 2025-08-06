import React, { useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import "./MapCityMap.css";

const MAPTILER_KEY = "TeNnfZzs7w14Q89Kkzhv"; // Insira seu token real do MapTiler Cloud
const MAPTILER_STYLE =
  "https://api.maptiler.com/maps/streets-v2/style.json?key=" + MAPTILER_KEY;
const INITIAL_CENTER = [-51.3889, -22.1207]; // [lng, lat] Presidente Prudente - SP
const INITIAL_ZOOM = 15; // Zoom mais próximo

function MapCityMap() {
  const mapContainer = useRef(null);
  const mapRef = useRef(null);
  const [markers, setMarkers] = useState([]);
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
  const handleSaveFromModal = (data) => {
    setMarkers((prev) => [
      ...prev,
      {
        id: Date.now(),
        lng: formModal.lngLat.lng,
        lat: formModal.lngLat.lat,
        ...data,
        isEditing: false,
      },
    ]);
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
      el.style.background = marker.resolved ? '#27ae60' : '#e67e22';
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
              <label className="modal-label" style={{marginTop:12}}>Imagem:</label>
              <div className="modal-image-upload" style={{cursor:'default',border:'none',background:'#f5f5f5'}}>
                {marker.image ? (
                  <img src={marker.image} alt="imagem do problema" className="modal-image-preview" />
                ) : (
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

  // Formulário do marcador
  function MarkerForm({ marker, onSave, onRemove }) {
    const [type, setType] = useState(marker.type);
    const [description, setDescription] = useState(marker.description);
    const [image, setImage] = useState(marker.image);
    const handleImage = (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (ev) => setImage(ev.target.result);
        reader.readAsDataURL(file);
      }
    };
    return (
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSave({ ...marker, type, description, image });
        }}
      >
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
        <label>Imagem (opcional)</label>
        <input type="file" accept="image/*" onChange={handleImage} />
        {image && <img src={image} alt="preview" />}
        <button type="submit" style={{ marginTop: 8 }}>
          Salvar
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
    const [image, setImage] = useState(null);
    const fileInputRef = useRef();
    const handleImage = (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (ev) => setImage(ev.target.result);
        reader.readAsDataURL(file);
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
              {image ? (
                <img src={image} alt="preview" className="modal-image-preview" />
              ) : (
                <div className="modal-image-placeholder">
                  <span className="modal-image-plus">+</span>
                  <span className="modal-image-text">Clique para selecionar imagem</span>
                </div>
              )}
              <input
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                ref={fileInputRef}
                onChange={handleImage}
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
            onClick={() => onSave({ type, description, image })}
          >
            Salvar
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
