import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Polyline, Marker, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-draw/dist/leaflet.draw.css';
import './MapView.css';
import 'leaflet-draw';

const customIcon = L.icon({
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  shadowSize: [41, 41]
});

const CenterMap = ({ mapCenter }) => {
  const map = useMap();

  useEffect(() => {
    if (mapCenter[0] !== 0 && mapCenter[1] !== 0) {
      map.setView(mapCenter, 16);
    }
  }, [mapCenter, map]);

  return null;
};

const DrawControl = () => {
  const map = useMap();

  useEffect(() => {
    const drawnItems = new L.FeatureGroup();
    map.addLayer(drawnItems);

    const drawControl = new L.Control.Draw({
      position: 'topright',
      draw: {
        polygon: {
          allowIntersection: false,
          showArea: true
        },
        polyline: true,
        rectangle: true,
        circle: true,
        marker: true
      },
      edit: {
        featureGroup: drawnItems
      }
    });
    map.addControl(drawControl);

    map.on(L.Draw.Event.CREATED, (event) => {
      const { layer } = event;
      drawnItems.addLayer(layer);
    });

    return () => {
      map.removeControl(drawControl);
      map.removeLayer(drawnItems);
    };
  }, [map]);

  return null;
};

const MapView = ({ pathCoordinates }) => {
  const [mapCenter, setMapCenter] = useState([0, 0]);

  useEffect(() => {
    if (pathCoordinates.length > 0) {
      const centerCoordinates = pathCoordinates.reduce(
        (acc, coord) => [acc[0] + coord[0], acc[1] + coord[1]], [0, 0]);
      setMapCenter([
        centerCoordinates[0] / pathCoordinates.length,
        centerCoordinates[1] / pathCoordinates.length,
      ]);
    }
  }, [pathCoordinates]);

  return (
    <div className="map-view-container">
      <MapContainer center={mapCenter} zoom={20} style={{ height: "500px", width: "100%" }} zoomControl={true}>
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        <Polyline pathOptions={{ color: 'var(--light-blue)', weight: 5 }} positions={pathCoordinates} />
        {pathCoordinates.map((position, idx) => (
          <Marker key={idx} position={position} icon={customIcon} />
        ))}
        <CenterMap mapCenter={mapCenter} />
        <DrawControl />
      </MapContainer>
    </div>
  );
};

export default MapView;
