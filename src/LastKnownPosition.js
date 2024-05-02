import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';  // Asegúrate de que esta línea está aquí

const locationIcon = new L.Icon({
  iconUrl: 'https://upload.wikimedia.org/wikipedia/commons/8/88/Map_marker.svg',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34]
});

function LastKnownPosition() {
    const [position, setPosition] = useState(null);

    useEffect(() => {
        const fetchLastKnownPosition = async () => {
            try {
                const { data } = await axios.get('http://localhost:1337/api/last-known-position');
                setPosition(data);
            } catch (error) {
                console.error('Failed to fetch last known position:', error);
            }
        };

        fetchLastKnownPosition();
    }, []);

    if (!position) {
        return <p>Loading last known position...</p>;
    }

    return (
        <div>
            <h2>Last Known Position</h2>
            <MapContainer center={[position.latitude, position.longitude]} zoom={13} style={{ height: '300px', width: '100%' }}>
                <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                />
                <Marker
                    position={[position.latitude, position.longitude]}
                    icon={locationIcon}
                />
            </MapContainer>
        </div>
    );
}

export default LastKnownPosition;
