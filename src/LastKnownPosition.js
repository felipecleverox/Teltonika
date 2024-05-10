import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import axios from 'axios';

const defaultPosition = { lat: -33.4489, lng: -70.6693 }; // Santiago de Chile

// Definir el ícono personalizado para el marcador
const customIcon = L.icon({
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

function CenterMap({ position }) {
    const map = useMap();

    useEffect(() => {
        if (position) {
            map.setView([position.lat, position.lng], 13);
        }
    }, [position, map]);

    return null;
}

function LastKnownPosition() {
    const [position, setPosition] = useState(null); // Iniciar el estado como null
    const [timestamp, setTimestamp] = useState(null);

    useEffect(() => {
        const fetchLastKnownPosition = async () => {
            try {
                const response = await axios.get('http://localhost:1337/api/last-known-position');
                if (response.data && response.data.latitude && response.data.longitude) {
                    setPosition({ lat: response.data.latitude, lng: response.data.longitude });
                    setTimestamp(response.data.unixTimestamp); // Asignar el timestamp
                } else {
                    setPosition(defaultPosition);
                    setTimestamp(null);
                }
            } catch (error) {
                console.error('Failed to fetch last known position:', error);
                setPosition(defaultPosition);
                setTimestamp(null);
            }
        };

        fetchLastKnownPosition();
        const intervalId = setInterval(fetchLastKnownPosition, 10000); // Actualiza cada 10 segundos

        return () => clearInterval(intervalId); // Limpieza al desmontar
    }, []);

    const formattedTime = timestamp ? new Date(timestamp).toLocaleString() : 'N/A';

    return (
        <MapContainer center={position || defaultPosition} zoom={13} style={{ height: '300px', width: '100%' }}>
            <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />
            {position && <CenterMap position={position} />}
            {position && (
                <Marker position={[position.lat, position.lng]} icon={customIcon}>
                    <Popup>
                        <div>
                            <strong>Time:</strong> {formattedTime}<br />
                            <strong>Lat:</strong> {position.lat}<br />
                            <strong>Lng:</strong> {position.lng}
                        </div>
                    </Popup>
                </Marker>
            )}
        </MapContainer>
    );
}

export default LastKnownPosition;
