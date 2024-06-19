import React from 'react';
import { MapContainer, TileLayer, Polyline, Marker } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';

const locationIcon = new L.Icon({
  iconUrl: 'https://upload.wikimedia.org/wikipedia/commons/8/88/Map_marker.svg',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34]
});

const polylineOptions = {
  color: 'blue', // El color de la polilínea
  weight: 5,     // El peso de la polilínea
};

const calculateMapCenter = (coordinates) => {
  if (coordinates.length === 0) {
    return [50.5, 30.5]; // Coordenadas por defecto si no hay datos
  }

  const latitudes = coordinates.map(([lat]) => lat);
  const longitudes = coordinates.map(([, lon]) => lon);

  const centerLat = (Math.max(...latitudes) + Math.min(...latitudes)) / 2;
  const centerLon = (Math.max(...longitudes) + Math.min(...longitudes)) / 2;

  return [centerLat, centerLon];
};

const MapView = ({ pathCoordinates }) => {
  const center = calculateMapCenter(pathCoordinates);

  return (
    <MapContainer center={center} zoom={13} style={{ height: '100vh', width: '100%' }}>
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />
      <Polyline pathOptions={polylineOptions} positions={pathCoordinates} />
      {pathCoordinates.map((position, idx) => (
        <Marker 
          key={idx} 
          position={position} 
          icon={locationIcon}
        />
      ))}
    </MapContainer>
  );
};

export default MapView;
