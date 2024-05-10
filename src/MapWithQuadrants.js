import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './MapWithQuadrants.css';
import planoOficina from 'C:/Users/cleve/source/repos/Teltonika/Teltonika/src/assets/images/plano_vf.jpg'; // Imagen predeterminada del plano
import planoIzq from 'C:/Users/cleve/source/repos/Teltonika/Teltonika/src/assets/images/plano_izq.jpg'; // Imagen del plano cuando se detecta el beacon

function MapWithQuadrants() {
    const [activeBeacons, setActiveBeacons] = useState([]);
    const [beaconLogs, setBeaconLogs] = useState({
        '0C403019-61C7-55AA-B7EA-DAC30C720055': { entrada: null, salida: null },
        'OTHER_BEACON_ID': { entrada: null, salida: null }
    });

    useEffect(() => {
        const fetchActiveBeacons = async () => {
            try {
                const response = await axios.get('http://localhost:1337/api/active-beacons');
                const activeBeaconIds = response.data.activeBeaconIds || [];

                setActiveBeacons(activeBeaconIds);
                updateBeaconLogs(activeBeaconIds);
            } catch (error) {
                console.error('Failed to fetch active beacons:', error);
            }
        };

        fetchActiveBeacons();
        const intervalId = setInterval(fetchActiveBeacons, 20000); // Actualiza cada 20 segundos

        return () => clearInterval(intervalId); // Limpieza al desmontar
    }, []);

    const updateBeaconLogs = (activeBeaconIds) => {
        const updatedLogs = { ...beaconLogs };

        for (const beaconId in updatedLogs) {
            if (activeBeaconIds.includes(beaconId)) {
                if (!updatedLogs[beaconId].entrada || updatedLogs[beaconId].salida) {
                    updatedLogs[beaconId] = { entrada: new Date(), salida: null };
                }
            } else {
                if (updatedLogs[beaconId].entrada && !updatedLogs[beaconId].salida) {
                    updatedLogs[beaconId].salida = new Date();
                }
            }
        }

        setBeaconLogs(updatedLogs);
    };

    const formatTimestamp = (timestamp) => {
        return timestamp ? new Date(timestamp).toLocaleString() : 'N/A';
    };

    return (
        <div className="map-with-quadrants">
            <h2>Ubicaciones en Interior</h2>
            <h3>Fecha y Hora de Ingreso por sector</h3>
            <table className="beacon-logs-table">
                <thead>
                    <tr>
                        <th>Sector</th>
                        <th>Entrada</th>
                        <th>Salida</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>Sector Oficina Seguridad (NOC)</td>
                        <td>{formatTimestamp(beaconLogs['0C403019-61C7-55AA-B7EA-DAC30C720055'].entrada)}</td>
                        <td>{formatTimestamp(beaconLogs['0C403019-61C7-55AA-B7EA-DAC30C720055'].salida)}</td>
                    </tr>
                    <tr>
                        <td>Sector Entrada Principal</td>
                        <td>{formatTimestamp(beaconLogs['OTHER_BEACON_ID'].entrada)}</td>
                        <td>{formatTimestamp(beaconLogs['OTHER_BEACON_ID'].salida)}</td>
                    </tr>
                </tbody>
            </table>
            <div className="plano-container">
                <img 
                    src={activeBeacons.includes('0C403019-61C7-55AA-B7EA-DAC30C720055') ? planoIzq : planoOficina} 
                    alt="Plano de la Oficina" 
                    className="plano-oficina" 
                />
            </div>
        </div>
    );
}

export default MapWithQuadrants;
