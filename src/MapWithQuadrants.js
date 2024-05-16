// MapWithQuadrants.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './MapWithQuadrants.css';
import planoBase from 'C:/Users/cleve/source/repos/Teltonika/Teltonika/src/assets/images/plano_super.jpg';
import personal3Icon from 'C:/Users/cleve/source/repos/Teltonika/Teltonika/src/assets/images/Personal 3.png';
import personal2Icon from 'C:/Users/cleve/source/repos/Teltonika/Teltonika/src/assets/images/Personal 2.png';
import personal1Icon from 'C:/Users/cleve/source/repos/Teltonika/Teltonika/src/assets/images/Personal 1.png';

function MapWithQuadrants() {
    const [activeBeacons, setActiveBeacons] = useState([]);
    const [beaconLogs, setBeaconLogs] = useState({
        '0C403019-61C7-55AA-B7EA-DAC30C720055': { entrada: null, salida: null, detecciones: 0, noDetectCount: 0, noDetectStart: null },
        'E9EB8F18-61C7-55AA-9496-3AC30C720055': { entrada: null, salida: null, detecciones: 0, noDetectCount: 0, noDetectStart: null }
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
        const intervalId = setInterval(fetchActiveBeacons, 20000);

        return () => clearInterval(intervalId);
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
                updatedLogs[beaconId].salida = null;
            } else {
                if (updatedLogs[beaconId].noDetectCount === 0) {
                    updatedLogs[beaconId].noDetectStart = new Date();
                }
                updatedLogs[beaconId].noDetectCount += 1;

                if (updatedLogs[beaconId].noDetectCount >= 2) {
                    if (updatedLogs[beaconId].salida === null) {
                        updatedLogs[beaconId].salida = updatedLogs[beaconId].noDetectStart;
                    }
                }
            }
        }

        setBeaconLogs(updatedLogs);
    };

    const formattedTimeMinus45 = new Date();
    formattedTimeMinus45.setMinutes(formattedTimeMinus45.getMinutes() - 45);

    return (
        <div className="map-with-quadrants">
            <h2>Ubicaciones en Interior</h2>
            <div className="plano-container" style={{ position: 'relative', width: '100%', height: 'auto' }}>
                <img src={planoBase} alt="Plano de la Oficina" className="plano-oficina" style={{ width: '70%', height: 'auto' }} />
                {activeBeacons.includes('0C403019-61C7-55AA-B7EA-DAC30C720055') && (
                    <img 
                        src={personal3Icon} 
                        alt="Personal 3" 
                        className="personal-icon" 
                        style={{ 
                            position: 'absolute', 
                            bottom: '26%', 
                            right: '55.5%', 
                            width: '2%' 
                        }} 
                    />
                )}
                {activeBeacons.includes('E9EB8F18-61C7-55AA-9496-3AC30C720055') && (
                    <img 
                        src={personal2Icon} 
                        alt="Personal 2" 
                        className="personal-icon" 
                        style={{ 
                            position: 'absolute', 
                            bottom: '72%', 
                            right: '57%', 
                            width: '2%' 
                        }} 
                    />
                )}
            </div>
            <table className="beacon-logs-table">
                <thead>
                    <tr>
                        <th>Personal</th>
                        <th>Sector</th>
                        <th>Entrada</th>
                        <th>Salida</th>
                    </tr>
                </thead>
                <tbody>
                    {Object.keys(beaconLogs).map(beaconId => (
                        <tr key={beaconId}>
                            <td>
                                {beaconId === '0C403019-61C7-55AA-B7EA-DAC30C720055' && <img src={personal3Icon} alt="Personal 3" style={{ width: '10px' }} />}
                                {beaconId === 'E9EB8F18-61C7-55AA-9496-3AC30C720055' && <img src={personal2Icon} alt="Personal 2" style={{ width: '10px' }} />}
                            </td>
                            <td>
                                {beaconId === '0C403019-61C7-55AA-B7EA-DAC30C720055' && 'Oficina Seguridad (NOC)'}
                                {beaconId === 'E9EB8F18-61C7-55AA-9496-3AC30C720055' && 'E/S Bodega'}
                            </td>
                            <td>{beaconLogs[beaconId].entrada ? beaconLogs[beaconId].entrada.toLocaleString() : 'N/A'}</td>
                            <td>{beaconLogs[beaconId].salida ? beaconLogs[beaconId].salida.toLocaleString() : 'N/A'}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

export default MapWithQuadrants;
