import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './MapWithQuadrants.css';
import planoOficina from 'C:/Users/cleve/source/repos/Teltonika/Teltonika/src/assets/images/plano.jpg'; // Imagen predeterminada del plano
import planoIzq from 'C:/Users/cleve/source/repos/Teltonika/Teltonika/src/assets/images/plano_izq.jpg'; // Imagen del plano cuando se detecta el beacon

function MapWithQuadrants() {
    const [isBeaconDetected, setIsBeaconDetected] = useState(false);

    useEffect(() => {
        const fetchActiveBeacons = async () => {
            try {
                const response = await axios.get('http://localhost:1337/api/active-beacons');
                const activeBeaconIds = response.data.activeBeaconIds || [];

                console.log('Fetched Active Beacon IDs:', activeBeaconIds);

                // Actualizar el estado para el beacon específico
                const beaconDetected = activeBeaconIds.includes('0C403019-61C7-55AA-B7EA-DAC30C720055');
                console.log('Is Beacon Detected:', beaconDetected);
                setIsBeaconDetected(beaconDetected);
            } catch (error) {
                console.error('Failed to fetch active beacons:', error);
                setIsBeaconDetected(false);
            }
        };

        fetchActiveBeacons();
        const intervalId = setInterval(fetchActiveBeacons, 10000); // Actualiza cada 10 segundos

        return () => clearInterval(intervalId); // Limpieza al desmontar
    }, []);

    useEffect(() => {
        console.log('Rendering Image. Is Beacon Detected:', isBeaconDetected);
    }, [isBeaconDetected]);

    return (
        <div className="map-with-quadrants">
            <h2>Ubicaciones en Interior</h2>
            <div className="plano-container">
                <img 
                    src={isBeaconDetected ? planoIzq : planoOficina} 
                    alt="Plano de la Oficina" 
                    className="plano-oficina" 
                />
            </div>
        </div>
    );
}

export default MapWithQuadrants;
