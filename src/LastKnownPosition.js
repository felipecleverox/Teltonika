import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import L from 'leaflet';
import axios from 'axios';

const defaultPosition = { lat: -33.4489, lng: -70.6693 }; // Santiago de Chile

function LastKnownPosition() {
    const [position, setPosition] = useState(defaultPosition);

    useEffect(() => {
        const fetchLastKnownPosition = async () => {
            try {
                const response = await axios.get('http://localhost:1337/api/last-known-position');
                if (response.data && response.data.latitude && response.data.longitude) {
                    setPosition({ lat: response.data.latitude, lng: response.data.longitude });
                } else {
                    setPosition(defaultPosition);
                }
            } catch (error) {
                console.error('Failed to fetch last known position:', error);
                setPosition(defaultPosition);
            }
        };

        fetchLastKnownPosition();
        const intervalId = setInterval(fetchLastKnownPosition, 10000); // Actualiza cada 10 segundos

        return () => clearInterval(intervalId); // Limpieza al desmontar
    }, []);

    return (
        <MapContainer center={[position.lat, position.lng]} zoom={13} style={{ height: '300px', width: '100%' }}>
            <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />
            <Marker position={[position.lat, position.lng]} />
        </MapContainer>
    );
}

export default LastKnownPosition;
