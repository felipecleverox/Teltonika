import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './MapWithQuadrants.css';
import planoBase from 'C:/Users/cleve/source/repos/Teltonika/Teltonika/src/assets/images/plano_base_vf.jpg'; // Asegúrate de que el path es correcto
import personal3Icon from 'C:/Users/cleve/source/repos/Teltonika/Teltonika/src/assets/images/Personal 3.png'; // Asegúrate de que el path es correcto
import personal1Icon from 'C:/Users/cleve/source/repos/Teltonika/Teltonika/src/assets/images/Personal 1.png'; // Asegúrate de que el path es correcto
function MapWithQuadrants() {
    const [activeBeacons, setActiveBeacons] = useState([]);
    const [beaconLogs, setBeaconLogs] = useState({
        '0C403019-61C7-55AA-B7EA-DAC30C720055': { entrada: new Date(), salida: null, detecciones: 0, noDetectCount: 0, noDetectStart: null }
    });
    const [showPersonal3, setShowPersonal3] = useState(false);

    useEffect(() => {
        const fetchActiveBeacons = async () => {
            try {
                const response = await axios.get('http://localhost:1337/api/active-beacons');
                const activeBeaconIds = response.data.activeBeaconIds || [];
                setActiveBeacons(activeBeaconIds);
                updateBeaconLogs(activeBeaconIds);
                setShowPersonal3(activeBeaconIds.includes('0C403019-61C7-55AA-B7EA-DAC30C720055'));
            } catch (error) {
                console.error('Failed to fetch active beacons:', error);
            }
        };

        fetchActiveBeacons();
        const intervalId = setInterval(fetchActiveBeacons, 20000); // Actualiza cada 20 segundos

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
            } else {
                if (updatedLogs[beaconId].noDetectCount === 0) {
                    updatedLogs[beaconId].noDetectStart = new Date();
                }
                updatedLogs[beaconId].noDetectCount += 1;

                if (updatedLogs[beaconId].noDetectCount >= 10) {
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
                <img src={planoBase} alt="Plano de la Oficina" className="plano-oficina" style={{ width: '100%', height: 'auto' }}/>
                {showPersonal3 && (
                    <img 
                        src={personal3Icon} 
                        alt="Personal 3" 
                        className="personal-icon" 
                        style={{ 
                            position: 'absolute', 
                            bottom: '25%', // Ajuste de la posición
                            right: '72%', // Ajuste de la posición
                            width: '2%' // Tamaño del ícono
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
                            <td><img src={personal3Icon} alt="Personal 3" style={{ width: '10px' }} /></td>
                            <td>Oficina Seguridad (NOC)</td>
                            <td>{beaconLogs[beaconId].entrada.toLocaleString()}</td>
                            <td>{beaconLogs[beaconId].salida ? beaconLogs[beaconId].salida.toLocaleString() : 'N/A'}</td>
                        </tr>
                    ))}
                    <tr>
                        <td><img src={personal1Icon} alt="Personal 3" style={{ width: '10px' }} /></td>
                        <td>Puerta Principal</td>
                        <td>{formattedTimeMinus45.toLocaleString()}</td>
                        <td>N/A</td>
                    </tr>
                </tbody>
            </table>
        </div>
    );
}

export default MapWithQuadrants;
