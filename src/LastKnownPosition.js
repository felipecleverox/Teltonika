import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import axios from 'axios';
import Header from './Header';
import './LastKnownPosition.css';

const defaultPosition = { lat: -33.4489, lng: -70.6693 };

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
            map.setView([position.lat, position.lng], 25);
        }
    }, [position, map]);
    return null;
}

function LastKnownPosition({ showHeader = true }) {
    const [position, setPosition] = useState(null); 
    const [timestamp, setTimestamp] = useState(null);
    const [changeTimestamp, setChangeTimestamp] = useState(null);
    const [error, setError] = useState(null); 
    const [timeElapsed, setTimeElapsed] = useState('');

    useEffect(() => {
        const fetchLastKnownPosition = async () => {
            setError(null); 
            try {
                const response = await axios.get('http://thenext.ddns.net:1337/api/last-known-position');
                if (response.data && response.data.latitude && response.data.longitude) {
                    setPosition({ lat: parseFloat(response.data.latitude), lng: parseFloat(response.data.longitude) });
                    setTimestamp(response.data.unixTimestamp);
                    setChangeTimestamp(response.data.changeTimestamp);
                } else {
                    setPosition(defaultPosition);
                    setTimestamp(null);
                    setChangeTimestamp(null);
                }
            } catch (error) {
                console.error('Failed to fetch last known position:', error);
                setError(error.message); 
                setPosition(defaultPosition);
                setTimestamp(null);
                setChangeTimestamp(null);
            }
        };

        fetchLastKnownPosition();
        const intervalId = setInterval(fetchLastKnownPosition, 10000); 
        return () => clearInterval(intervalId); 
    }, []);

    useEffect(() => {
        const intervalId = setInterval(() => {
            if (changeTimestamp) {
                const now = Date.now();
                const elapsed = now - changeTimestamp;
                const hours = Math.floor(elapsed / (1000 * 60 * 60)).toString().padStart(2, '0');
                const minutes = Math.floor((elapsed % (1000 * 60 * 60)) / (1000 * 60)).toString().padStart(2, '0');
                const seconds = Math.floor((elapsed % (1000 * 60)) / 1000).toString().padStart(2, '0');
                setTimeElapsed(`${hours}h ${minutes}m ${seconds}s`);
            }
        }, 1000);

        return () => clearInterval(intervalId);
    }, [changeTimestamp]);

    const formattedTime = timestamp ? new Date(timestamp).toLocaleString('es-CL', { hour12: false }) : 'N/A';

    return (
        <div> 
            {showHeader && <Header title="Ubicación Exteriores Tiempo Real" />}
            {error && <div className="error-message">Error: {error}</div>}

            <MapContainer center={position || defaultPosition} zoom={13} className="map-container">
                <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
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
            <div className="last-known-info">
                <table className="info-table">
                    <thead>
                        <tr>
                            <th>Información</th>
                            <th>Valor</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>Última Actualización</td>
                            <td>{formattedTime}</td>
                        </tr>
                        <tr>
                            <td>Tiempo Transcurrido Desde el Último Cambio</td>
                            <td>{timeElapsed}</td>
                        </tr>
                        {position && (
                            <>
                                <tr>
                                    <td>Latitud</td>
                                    <td>{position.lat.toFixed(6)}</td>
                                </tr>
                                <tr>
                                    <td>Longitud</td>
                                    <td>{position.lng.toFixed(6)}</td>
                                </tr>
                            </>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export default LastKnownPosition;