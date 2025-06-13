import React, { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './MapCityMap.css';

const MAPTILER_KEY = 'TeNnfZzs7w14Q89Kkzhv'; // Insira seu token real do MapTiler Cloud
const MAPTILER_STYLE = 'https://api.maptiler.com/maps/streets-v2/style.json?key=' + MAPTILER_KEY;
const INITIAL_CENTER = [-48.39218, -11.84109]; // [lng, lat] conforme link fornecido

function MapCityMap() {
  const mapContainer = useRef(null);
  const mapRef = useRef(null);
  const [markers, setMarkers] = useState([]);
  const [areas] = useState([
    {
      id: 1,
      name: 'Subprefeitura Centro',
      contact: '(11) 1234-5678',
      polygon: [
        [-46.64, -23.55],
        [-46.63, -23.54],
        [-46.62, -23.55],
        [-46.63, -23.56],
        [-46.64, -23.55],
      ],
    },
    {
      id: 2,
      name: 'Subprefeitura Leste',
      contact: '(11) 8765-4321',
      polygon: [
        [-46.62, -23.55],
        [-46.61, -23.54],
        [-46.60, -23.55],
        [-46.61, -23.56],
        [-46.62, -23.55],
      ],
    },
  ]);

  useEffect(() => {
    let maptilersdk;
    let map;

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
        zoom: 12,
        pitch: 45,
        bearing: -17.6,
        hash: true,
        terrain: true,
      });
      mapRef.current = map;
      map.on('click', onMapClick);
      map.on('load', () => {
        renderAreas(map);
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
    { value: 'lixo', label: 'Lixo' },
    { value: 'buraco', label: 'Buraco' },
    { value: 'iluminacao', label: 'Iluminação' },
    { value: 'outro', label: 'Outro' },
  ];

  // Função para adicionar marcador ao clicar no mapa
  const onMapClick = (e) => {
    const lngLat = e.lngLat || (e.lngLat ? e.lngLat : e.lngLatWrap());
    setMarkers((prev) => [
      ...prev,
      {
        id: Date.now(),
        lng: lngLat.lng,
        lat: lngLat.lat,
        type: '',
        description: '',
        image: null,
        isEditing: true,
      },
    ]);
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
      el.style.background = '#e67e22';
      el.style.width = '28px';
      el.style.height = '28px';
      el.style.borderRadius = '50%';
      el.style.border = '2px solid #fff';
      el.style.boxShadow = '0 2px 6px rgba(0,0,0,0.2)';
      el.style.cursor = 'pointer';
      const markerObj = new window.maptilersdk.Marker(el)
        .setLngLat([marker.lng, marker.lat])
        .addTo(map);
      el.onclick = () => openPopup(map, marker);
      map._markerObjects.push(markerObj);
    });
  };

  // Renderizar polígonos das áreas de responsabilidade
  const renderAreas = (map) => {
    if (!window.maptilersdk) return;
    // Remove camadas antigas
    if (map.getSource('areas')) {
      map.removeLayer('areas-fill');
      map.removeLayer('areas-outline');
      map.removeSource('areas');
    }
    const features = areas.map((area) => ({
      type: 'Feature',
      properties: { name: area.name, contact: area.contact },
      geometry: {
        type: 'Polygon',
        coordinates: [area.polygon],
      },
    }));
    map.addSource('areas', {
      type: 'geojson',
      data: { type: 'FeatureCollection', features },
    });
    map.addLayer({
      id: 'areas-fill',
      type: 'fill',
      source: 'areas',
      paint: {
        'fill-color': '#3498db',
        'fill-opacity': 0.15,
      },
    });
    map.addLayer({
      id: 'areas-outline',
      type: 'line',
      source: 'areas',
      paint: {
        'line-color': '#2980b9',
        'line-width': 2,
      },
    });
    // Popups ao clicar no polígono
    map.on('click', 'areas-fill', (e) => {
      const props = e.features[0].properties;
      new window.maptilersdk.Popup()
        .setLngLat(e.lngLat)
        .setHTML(`<div><b>${props.name}</b><br/>Contato: ${props.contact}</div>`)
        .addTo(map);
    });
    map.on('mouseenter', 'areas-fill', () => {
      map.getCanvas().style.cursor = 'pointer';
    });
    map.on('mouseleave', 'areas-fill', () => {
      map.getCanvas().style.cursor = '';
    });
  };

  // Abrir popup para editar ou visualizar marcador
  const openPopup = (map, marker) => {
    const popupNode = document.createElement('div');
    popupNode.className = 'mapcity-popup';
    if (marker.isEditing) {
      createRoot(popupNode).render(
        <MarkerForm
          marker={marker}
          onSave={handleSaveMarker}
          onRemove={handleRemoveMarker}
        />
      );
    } else {
      createRoot(popupNode).render(
        <MarkerPopup
          marker={marker}
          onEdit={() => handleEditMarker(marker.id)}
          onRemove={() => handleRemoveMarker(marker.id)}
        />
      );
    }
    new window.maptilersdk.Popup()
      .setLngLat([marker.lng, marker.lat])
      .setDOMContent(popupNode)
      .addTo(map);
  };

  // Salvar marcador
  const handleSaveMarker = (updatedMarker) => {
    setMarkers((prev) =>
      prev.map((m) => (m.id === updatedMarker.id ? { ...updatedMarker, isEditing: false } : m))
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

  // Atualizar marcadores e áreas ao mudar estado
  useEffect(() => {
    if (mapRef.current) {
      renderMarkers(mapRef.current);
      renderAreas(mapRef.current);
    }
    // eslint-disable-next-line
  }, [markers, areas]);

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
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>
        <label>Descrição</label>
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} maxLength={120} required />
        <label>Imagem (opcional)</label>
        <input type="file" accept="image/*" onChange={handleImage} />
        {image && <img src={image} alt="preview" />}
        <button type="submit" style={{marginTop:8}}>Salvar</button>
        <button type="button" className="remove-btn" onClick={() => onRemove(marker.id)}>Remover</button>
      </form>
    );
  }

  // Popup do marcador
  function MarkerPopup({ marker, onEdit, onRemove }) {
    return (
      <div>
        <b>{problemTypes.find((t) => t.value === marker.type)?.label || 'Problema'}</b>
        <p>{marker.description}</p>
        {marker.image && <img src={marker.image} alt="imagem do problema" />}
        <button onClick={onEdit}>Editar</button>
        <button className="remove-btn" onClick={onRemove}>Remover</button>
      </div>
    );
  }

  return (
    <div className="mapcity-map-container">
      <div ref={mapContainer} className="mapcity-map" />
      {/* UI para legendas, instruções, etc. */}
    </div>
  );
}

export default MapCityMap;
