import React, { useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polygon, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

const MAPTILER_TOKEN = 'TeNnfZzs7w14Q89Kkzhv'; // Substitua por seu token se quiser usar MapTiler
const SAO_PAULO_COORDS = [-23.5505, -46.6333];
const RESPONSIBILITY_AREAS = [
  {
    name: 'Subprefeitura Sé',
    contact: '(11) 1234-5678',
    polygon: [
      [
        [-23.545, -46.646],
        [-23.545, -46.626],
        [-23.555, -46.626],
        [-23.555, -46.646],
        [-23.545, -46.646],
      ],
    ],
  },
  {
    name: 'Subprefeitura Pinheiros',
    contact: '(11) 8765-4321',
    polygon: [
      [
        [-23.560, -46.700],
        [-23.560, -46.680],
        [-23.570, -46.680],
        [-23.570, -46.700],
        [-23.560, -46.700],
      ],
    ],
  },
];

const PROBLEM_TYPES = [
  { value: 'lixo', label: 'Lixo' },
  { value: 'buraco', label: 'Buraco' },
  { value: 'iluminacao', label: 'Iluminação' },
  { value: 'outro', label: 'Outro' },
];

function AddMarker({ onAdd }) {
  useMapEvents({
    click(e) {
      onAdd({
        id: Date.now(),
        lng: e.latlng.lng,
        lat: e.latlng.lat,
        type: '',
        description: '',
        image: null,
      });
    },
  });
  return null;
}

export default function MapCityMap() {
  const [markers, setMarkers] = useState([]);
  const [selectedMarker, setSelectedMarker] = useState(null);

  const handleMarkerChange = (id, field, value) => {
    setMarkers((prev) =>
      prev.map((m) => (m.id === id ? { ...m, [field]: value } : m))
    );
  };

  const handleImageChange = (id, file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      handleMarkerChange(id, 'image', e.target.result);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveMarker = (id) => {
    setMarkers((prev) => prev.filter((m) => m.id !== id));
    setSelectedMarker(null);
  };

  return (
    <div style={{ position: 'relative', width: '100%', height: '80vh' }}>
      <MapContainer
        center={SAO_PAULO_COORDS}
        zoom={13}
        style={{ width: '100%', height: '100%', borderRadius: 12 }}
      >
        {/* Use MapTiler tiles se quiser, ou OpenStreetMap */}
        <TileLayer
          url={`https://api.maptiler.com/maps/streets/{z}/{x}/{y}.png?key=${MAPTILER_TOKEN}`}
          attribution='&copy; <a href="https://www.maptiler.com/copyright/">MapTiler</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        {/* Áreas de responsabilidade */}
        {RESPONSIBILITY_AREAS.map((area, idx) => (
          <Polygon
            key={area.name}
            positions={area.polygon}
            pathOptions={{
              color: idx === 0 ? '#0080ff' : '#ff8000',
              fillOpacity: 0.2,
            }}
          />
        ))}
        {/* Marcadores */}
        {markers.map((marker) => (
          <Marker
            key={marker.id}
            position={[marker.lat, marker.lng]}
            eventHandlers={{
              click: () => setSelectedMarker(marker.id),
            }}
          >
            {selectedMarker === marker.id && (
              <Popup
                position={[marker.lat, marker.lng]}
                onClose={() => setSelectedMarker(null)}
              >
                <div style={{ minWidth: 220, maxWidth: 300 }}>
                  <h4>Registrar Problema Urbano</h4>
                  <label>
                    Tipo:
                    <select
                      value={marker.type}
                      onChange={(e) =>
                        handleMarkerChange(marker.id, 'type', e.target.value)
                      }
                      style={{ width: '100%', marginBottom: 8 }}
                    >
                      <option value="">Selecione</option>
                      {PROBLEM_TYPES.map((t) => (
                        <option key={t.value} value={t.value}>
                          {t.label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Descrição:
                    <textarea
                      value={marker.description}
                      onChange={(e) =>
                        handleMarkerChange(marker.id, 'description', e.target.value)
                      }
                      style={{ width: '100%', marginBottom: 8 }}
                      rows={2}
                      maxLength={120}
                    />
                  </label>
                  <label>
                    Imagem (opcional):
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) =>
                        handleImageChange(marker.id, e.target.files[0])
                      }
                      style={{ width: '100%', marginBottom: 8 }}
                    />
                  </label>
                  {marker.image && (
                    <img
                      src={marker.image}
                      alt="Problema"
                      style={{
                        width: '100%',
                        maxHeight: 120,
                        objectFit: 'cover',
                        marginBottom: 8,
                      }}
                    />
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <button
                      onClick={() => setSelectedMarker(null)}
                      style={{ flex: 1, marginRight: 8 }}
                    >
                      Fechar
                    </button>
                    <button
                      onClick={() => handleRemoveMarker(marker.id)}
                      style={{
                        flex: 1,
                        background: '#e74c3c',
                        color: '#fff',
                        border: 'none',
                        borderRadius: 4,
                        padding: '4px 8px',
                      }}
                    >
                      Remover
                    </button>
                  </div>
                </div>
              </Popup>
            )}
          </Marker>
        ))}
        {/* Clique para adicionar marcador */}
        <AddMarker
          onAdd={(marker) => setMarkers((prev) => [...prev, marker])}
        />
      </MapContainer>
      {/* Legenda das áreas de responsabilidade */}
      <div
        style={{
          position: 'absolute',
          bottom: 16,
          left: 16,
          background: '#fff',
          borderRadius: 8,
          boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
          padding: 12,
          zIndex: 5,
          maxWidth: 320,
        }}
      >
        <b>Áreas de Responsabilidade</b>
        <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
          {RESPONSIBILITY_AREAS.map((area, idx) => (
            <li key={area.name} style={{ marginBottom: 4 }}>
              <span
                style={{
                  display: 'inline-block',
                  width: 12,
                  height: 12,
                  background: idx === 0 ? '#0080ff' : '#ff8000',
                  borderRadius: 2,
                  marginRight: 6,
                }}
              />
              <b>{area.name}</b> — {area.contact}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
