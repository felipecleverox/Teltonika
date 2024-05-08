import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Polyline, Marker, FeatureGroup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import 'leaflet-draw/dist/leaflet.draw.css';
import { EditControl } from 'react-leaflet-draw';

// Definir los íconos y las opciones de la polilínea (puedes mantener estas partes igual)
const locationIcon = L.icon({
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const polylineOptions = { color: 'blue' };

// Definir la función calculateMapCenter
function calculateMapCenter(pathCoordinates) {
  if (!pathCoordinates || pathCoordinates.length === 0) return [0, 0];

  const sum = pathCoordinates.reduce((acc, coord) => {
    acc[0] += coord[0];
    acc[1] += coord[1];
    return acc;
  }, [0, 0]);

  return [sum[0] / pathCoordinates.length, sum[1] / pathCoordinates.length];
}

// Custom Zoom Control
function CustomZoomControl() {
  const map = useMap();

  useEffect(() => {
    const zoomControl = new L.Control.Zoom({ position: 'topleft' }); 
    zoomControl.addTo(map);

    return () => {
      zoomControl.remove(); 
    };
  }, [map]);

  return null;
}

// Definir el componente MapView
const MapView = ({ pathCoordinates }) => {
  // Validar y filtrar las coordenadas
  const validCoordinates = pathCoordinates.filter(coord => {
    const isValid = Array.isArray(coord) && 
      coord.length === 2 && 
      !isNaN(coord[0]) && 
      !isNaN(coord[1]);
      
    if (!isValid) {
      console.error('Invalid coordinate detected:', coord);
    }
    return isValid;
  });

  console.log('Valid Coordinates:', validCoordinates);

  const center = calculateMapCenter(validCoordinates);

  if (isNaN(center[0]) || isNaN(center[1])) {
    console.error('Invalid map center calculated:', center);
    return <div>Error: Invalid map center</div>;
  }

  return (
    <MapContainer 
      center={center} 
      zoom={13} 
      style={{ height: '100vh', width: '100%' }}
      zoomControl={false} // Disable default zoom control
      dragging={true}    // Ensure dragging is enabled
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />
      <Polyline pathOptions={polylineOptions} positions={validCoordinates} />
      {validCoordinates.map((position, idx) => (
        <Marker 
          key={idx} 
          position={position} 
          icon={locationIcon} 
        />
      ))}
      
      <FeatureGroup>
        <EditControl
          position='topleft'
          onEdited={e => {
            console.log('onEdited', e);
          }}
          onCreated={e => {
            console.log('onCreated', e);
          }}
          onDeleted={e => {
            console.log('onDeleted', e);
          }}
          draw={{
            rectangle: true,
            polyline: true,
            circle: false,
            polygon: true,
            marker: true
          }}
        />
      </FeatureGroup>

      <CustomZoomControl /> {/* Add the custom zoom control */}
    </MapContainer>
  );
};

export default MapView;
