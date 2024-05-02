import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './MapWithQuadrants.css';

function MapWithQuadrants() {
    // Estado para almacenar los IDs de los beacons activos
    const [activeBeacons, setActiveBeacons] = useState([]);

    // Efecto para consultar los beacons activos desde el servidor
    useEffect(() => {
        const fetchActiveBeacons = async () => {
            try {
                const response = await axios.get('http://localhost:1337/api/active-beacons');
                setActiveBeacons(response.data.activeBeaconIds);
            } catch (error) {
                console.error('Failed to fetch active beacons:', error);
            }
        };

        fetchActiveBeacons();
        const intervalId = setInterval(fetchActiveBeacons, 10000); // Actualiza cada 10 segundos

        return () => clearInterval(intervalId); // Limpieza al desmontar
    }, []);

    // Función para verificar si un beacon está activo
    const isBeaconActive = (beaconId) => activeBeacons.includes(beaconId);

    return (
        <div className="map-with-quadrants">
            <h2>Ubicaciones en Interior</h2>
            <div className="quadrants-container">
                <div className={`quadrant ${isBeaconActive('0C403019-61C7-55AA-B7EA-DAC30C720055') ? 'active' : ''}`}>OFICINA 1</div>
                <div className="quadrant">OFICINA 2</div>
                <div className="quadrant">OFICINA 3</div>
                <div className="quadrant">OFICINA 4</div>
            </div>
        </div>
    );
}

export default MapWithQuadrants;  // Asegúrate de que esta línea está completamente fuera de cualquier función o bloque.
