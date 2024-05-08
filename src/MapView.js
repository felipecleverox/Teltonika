import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Polyline, Marker, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import 'leaflet-draw/dist/leaflet.draw.css';
import { EditControl } from 'leaflet-draw';

// ... (locationIcon, polylineOptions, calculateMapCenter remain unchanged) ...

// Function to add EditControl to the map (unchanged)
function AddEditControl() {
  // ... (code remains the same) ...
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

const MapView = ({ pathCoordinates }) => {
  const center = calculateMapCenter(pathCoordinates);

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
      <Polyline pathOptions={polylineOptions} positions={pathCoordinates} />
      {pathCoordinates.map((position, idx) => (
        <Marker 
          key={idx} 
          position={position} 
          icon={locationIcon} 
        />
      ))}

      <AddEditControl />   {/* Add edit controls */}
      <CustomZoomControl /> {/* Add the custom zoom control */}
    </MapContainer>
  );
};

export default MapView;