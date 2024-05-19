// MapWithQuadrants.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './MapWithQuadrants.css';
import planoBase from 'C:/Users/cleve/source/repos/Teltonika/Teltonika/src/assets/images/plano_super.jpg';
import personal3Icon from 'C:/Users/cleve/source/repos/Teltonika/Teltonika/src/assets/images/Personal 3.png';
import Header from './Header'; // Importa el nuevo encabezado


function MapWithQuadrants() {
    const [activeBeacons, setActiveBeacons] = useState([]);
    const [bothBeaconsDetected, setBothBeaconsDetected] = useState(false);
    const [beaconLogs, setBeaconLogs] = useState({
        '0C403019-61C7-55AA-B7EA-DAC30C720055': { entrada: null, detecciones: 0 },
        'E9EB8F18-61C7-55AA-9496-3AC30C720055': { entrada: null, detecciones: 0 }
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
        const bothDetected = activeBeaconIds.includes('0C403019-61C7-55AA-B7EA-DAC30C720055') && activeBeaconIds.includes('E9EB8F18-61C7-55AA-9496-3AC30C720055');

        for (const beaconId in updatedLogs) {
            if (activeBeaconIds.includes(beaconId)) {
                if (updatedLogs[beaconId].detecciones === 0) {
                    updatedLogs[beaconId].entrada = new Date();
                }
                updatedLogs[beaconId].detecciones += 1;
            }
        }

        setBothBeaconsDetected(bothDetected);

        if (bothDetected) {
            console.log("DOS Beacons JUNTOS");
        }

        setBeaconLogs(updatedLogs);
    };

    return (
        <div className="map-with-quadrants">
            <Header title="Ubicaciones Interior Tiempo Real" />
            <div className="plano-container" style={{ position: 'relative', width: '100%', height: 'auto' }}>
                <img src={planoBase} alt="Plano de la Oficina" className="plano-oficina" style={{ width: '70%', height: 'auto' }} />
                {!bothBeaconsDetected && activeBeacons.includes('0C403019-61C7-55AA-B7EA-DAC30C720055') && (
                    <img 
                        src={personal3Icon} 
                        alt="Personal 3" 
                        className="personal-icon" 
                        style={{ 
                            position: 'absolute', 
                            bottom: '70%', 
                            right: '55%', 
                            width: '2%' 
                        }} 
                    />
                )}
                {!bothBeaconsDetected && activeBeacons.includes('E9EB8F18-61C7-55AA-9496-3AC30C720055') && (
                    <img 
                        src={personal3Icon} 
                        alt="Personal 3" 
                        className="personal-icon" 
                        style={{ 
                            position: 'absolute', 
                            bottom: '25%', 
                            right: '55%', 
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
                    </tr>
                </thead>
                <tbody>
                    {Object.keys(beaconLogs).map(beaconId => (
                        <tr key={beaconId}>
                            <td><img src={personal3Icon} alt="Personal 3" style={{ width: '10px' }} /></td>
                            <td>
                                {beaconId === '0C403019-61C7-55AA-B7EA-DAC30C720055' && 'E/S Bodega'}
                                {beaconId === 'E9EB8F18-61C7-55AA-9496-3AC30C720055' && 'Farmacia'}
                            </td>
                            <td>{beaconLogs[beaconId].entrada ? beaconLogs[beaconId].entrada.toLocaleString() : 'N/A'}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

export default MapWithQuadrants;
