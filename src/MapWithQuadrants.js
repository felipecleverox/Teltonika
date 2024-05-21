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
        'E9EB8F18-61C7-55AA-9496-3AC30C720055': { entrada: null, detecciones: 0 },
        'F7826DA6-BC5B-71E0-893E-4B484D67696F': { entrada: null, detecciones: 0 }, // Nuevo beacon 1
        'F7826DA6-BC5B-71E0-893E-6D424369696F': { entrada: null, detecciones: 0 },  // Nuevo beacon 2
        'F7826DA6-BC5B-71E0-893E-54654370696F': { entrada: null, detecciones: 0 }  // Nuevo beacon 3
    });

    useEffect(() => {
        const fetchActiveBeacons = async () => {
            try {
                const response = await axios.get('http://thenext.ddns.net:1337/api/active-beacons');
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

        setBeaconLogs(updatedLogs);
    };

    const getSector = (beaconId) => {
        switch (beaconId) {
            case '0C403019-61C7-55AA-B7EA-DAC30C720055':
                return 'E/S Bodega';
            case 'E9EB8F18-61C7-55AA-9496-3AC30C720055':
                return 'Farmacia';
            case 'F7826DA6-BC5B-71E0-893E-4B484D67696F':
                return 'Entrada';
            case 'F7826DA6-BC5B-71E0-893E-6D424369696F':
                return 'Pasillo Central';
            case 'F7826DA6-BC5B-71E0-893E-54654370696F':
                return 'Electro';
            default:
                return 'Unknown';
        }
    };

    const getIconPosition = (beaconId) => {
        switch (beaconId) {
            case '0C403019-61C7-55AA-B7EA-DAC30C720055':
                return { bottom: '70%', right: '55%', width: '2%' };
            case 'E9EB8F18-61C7-55AA-9496-3AC30C720055':
                return { bottom: '25%', right: '55%', width: '2%' };
            case 'F7826DA6-BC5B-71E0-893E-4B484D67696F':
                return { bottom: '10%', right: '72%', width: '2%' };
            case 'F7826DA6-BC5B-71E0-893E-6D424369696F':
                return { bottom: '41%', right: '28%', width: '2%' };
            case 'F7826DA6-BC5B-71E0-893E-54654370696F':
                return { bottom: '68%', right: '30%', width: '2%' };
            default:
                return {};
        }
    };

    return (
        <div className="map-with-quadrants">
            <Header title="Ubicaciones Interior Tiempo Real" />
            <div className="plano-container" style={{ position: 'relative', width: '100%', height: 'auto' }}>
                <img src={planoBase} alt="Plano de la Oficina" className="plano-oficina" style={{ width: '70%', height: 'auto' }} />
                {activeBeacons.map(beaconId => (
                    <img 
                        key={beaconId}
                        src={personal3Icon} 
                        alt="Personal 3" 
                        className="personal-icon" 
                        style={{ position: 'absolute', ...getIconPosition(beaconId) }} 
                    />
                ))}
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
                            <td>{getSector(beaconId)}</td>
                            <td>{beaconLogs[beaconId].entrada ? beaconLogs[beaconId].entrada.toLocaleString() : 'N/A'}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

export default MapWithQuadrants;
