import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './MapWithQuadrants.css';
import planoBase from 'C:/Users/cleve/source/repos/Teltonika/Teltonika/src/assets/images/plano_base_vf.jpg'; // Imagen base del plano
import planoConBeacon from 'C:/Users/cleve/source/repos/Teltonika/Teltonika/src/assets/images/plano_base_B1_a.jpg'; // Imagen del plano cuando se detecta el beacon

function MapWithQuadrants() {
    const [activeBeacons, setActiveBeacons] = useState([]);
    const [beaconLogs, setBeaconLogs] = useState({
        '0C403019-61C7-55AA-B7EA-DAC30C720055': { entrada: null, salida: null, detecciones: 0, noDetectCount: 0, noDetectStart: null }
    });
    const [currentPlano, setCurrentPlano] = useState(planoBase);
    const [lastRefreshTime, setLastRefreshTime] = useState(new Date());

    useEffect(() => {
        const fetchActiveBeacons = async () => {
            try {
                const response = await axios.get('http://localhost:1337/api/active-beacons');
                const activeBeaconIds = response.data.activeBeaconIds || [];
                setActiveBeacons(activeBeaconIds);
                updateBeaconLogs(activeBeaconIds);
                setLastRefreshTime(new Date());
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
                if (updatedLogs[beaconId].detecciones === 0) {
                    updatedLogs[beaconId].entrada = new Date();
                }
                updatedLogs[beaconId].detecciones += 1;
                updatedLogs[beaconId].noDetectCount = 0;
                updatedLogs[beaconId].noDetectStart = null;
                setCurrentPlano(planoConBeacon);
            } else {
                if (updatedLogs[beaconId].noDetectCount === 0) {
                    updatedLogs[beaconId].noDetectStart = new Date();
                }
                updatedLogs[beaconId].noDetectCount += 1;

                if (updatedLogs[beaconId].noDetectCount >= 10) {
                    setCurrentPlano(planoBase);
                    if (updatedLogs[beaconId].salida === null) {
                        updatedLogs[beaconId].salida = updatedLogs[beaconId].noDetectStart;
                    }
                }
            }
        }

        setBeaconLogs(updatedLogs);
    };

    const formatTimestamp = (timestamp) => {
        return timestamp ? new Date(timestamp).toLocaleString() : 'N/A';
    };

    const formatMinus45Minutes = (timestamp) => {
        const date = new Date(timestamp);
        date.setMinutes(date.getMinutes() - 45);
        return date.toLocaleString();
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
                        <td>Puerta Principal</td>
                        <td>{formatMinus45Minutes(lastRefreshTime)}</td>
                        <td></td>
                    </tr>
                    <tr>
                        <td>Sector Oficina Seguridad (NOC)</td>
                        <td>{formatTimestamp(beaconLogs['0C403019-61C7-55AA-B7EA-DAC30C720055'].entrada)}</td>
                        <td>{formatTimestamp(beaconLogs['0C403019-61C7-55AA-B7EA-DAC30C720055'].salida)}</td>
                    </tr>
                    <tr>
                        <td>Sala Directorio</td>
                        <td></td>
                        <td></td>
                    </tr>
                    <tr>
                        <td>Puerta Lateral</td>
                        <td></td>
                        <td></td>
                    </tr>
                    <tr>
                        <td>Oficina Gerencia Informática</td>
                        <td></td>
                        <td></td>
                    </tr>
                </tbody>
            </table>
            <div className="plano-container">
                <img 
                    src={currentPlano} 
                    alt="Plano de la Oficina" 
                    className="plano-oficina" 
                />
            </div>
        </div>
    );
}

export default MapWithQuadrants;
