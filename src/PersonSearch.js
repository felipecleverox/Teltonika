import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './PersonSearch.css';
import personal3Icon from './assets/images/Personal 3.png';
import planoSectores from './assets/images/plano_sectores.jpg'; // Ensure this path is correct
import Header from './Header'; // Import the new header component

function PersonSearch() {
    const [selectedDay, setSelectedDay] = useState('');
    const [startTime, setStartTime] = useState('');
    const [endTime, setEndTime] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [umbrales, setUmbrales] = useState({});
    const [devices, setDevices] = useState([]);
    const [selectedDeviceId, setSelectedDeviceId] = useState('');

    useEffect(() => {
        const fetchThresholds = async () => {
            try {
                const response = await axios.get('/api/umbrales');
                setUmbrales(response.data);
            } catch (error) {
                console.error('Error fetching thresholds:', error);
            }
        };
        fetchThresholds();
        
        const fetchDevices = async () => {
            try {
                const response = await axios.get('http://thenext.ddns.net:1337/api/devices');
                setDevices(response.data);
            } catch (error) {
                console.error('Error fetching devices:', error);
            }
        };
        fetchDevices();
    }, []);

    const fetchSearchResults = async () => {
        const startDateTime = `${selectedDay}T${startTime}:00`;
        const endDateTime = `${selectedDay}T${endTime}:00`;

        try {
            const response = await axios.get('http://thenext.ddns.net:1337/api/beacon-entries-exits', {
                params: {
                    startDate: startDateTime,
                    endDate: endDateTime,
                    device_id: selectedDeviceId // Use device ID
                }
            });
            console.log('Data received:', response.data);
            setSearchResults(response.data);
        } catch (error) {
            console.error('Error fetching search results:', error);
        }
    };

    const formatDate = (timestamp) => {
        if (!timestamp) return 'N/A';
        const date = new Date(timestamp);
        return date.toLocaleString();
    };

    const getSector = (beaconId) => {
        switch (beaconId) {
            case '0C403019-61C7-55AA-B7EA-DAC30C720055':
                return { text: 'E/S Bodega', className: 'sector-bodega' };
            case 'E9EB8F18-61C7-55AA-9496-3AC30C720055':
                return { text: 'Farmacia', className: 'sector-farmacia' };
            case 'F7826DA6-BC5B-71E0-893E-4B484D67696F':
                return { text: 'Entrada', className: 'sector-entrada' };
            case 'F7826DA6-BC5B-71E0-893E-6D424369696F':
                return { text: 'Pasillo Central', className: 'sector-pasillo' };
            case 'F7826DA6-BC5B-71E0-893E-54654370696F':
                return { text: 'Electro', className: 'sector-electro' };
            default:
                return { text: 'Unknown', className: '' };
        }
    };

    const calculatePermanence = (entrada, salida) => {
        const start = new Date(entrada);
        const end = salida ? new Date(salida) : new Date(); // Usa la fecha actual si no hay salida
        const duration = end - start;

        const hours = Math.floor(duration / (1000 * 60 * 60));
        const minutes = Math.floor((duration % (1000 * 60 * 60)) / (1000 * 60));
        return `${hours}h ${minutes}m`;
    };

    const getSemaphoreClass = (permanenceMinutes) => {
        if (permanenceMinutes <= umbrales.umbral_verde) {
            return 'green';
        } else if (permanenceMinutes > umbrales.umbral_verde && permanenceMinutes <= umbrales.umbral_amarillo) {
            return 'yellow';
        } else if (permanenceMinutes > umbrales.umbral_amarillo) {
            return 'red';
        }

        return '';
    };

    const downloadCSV = () => {
        const headers = ['Personal', 'Sector', 'Desde Detección', 'Permanencia', 'Estado'];
        const rows = searchResults.map(result => {
            const sector = getSector(result.beaconId);
            const permanence = calculatePermanence(result.entrada, result.salida);
            const permanenceMinutes = (new Date(result.salida ? result.salida : new Date()) - new Date(result.entrada)) / (1000 * 60);
            const semaphoreClass = getSemaphoreClass(permanenceMinutes);
            return [
                'Personal 3', // Assuming the icon represents "Personal 3"
                sector.text,
                formatDate(result.entrada),
                permanence,
                semaphoreClass
            ];
        });

        const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", `historical_movements_${selectedDay}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="person-search">
            <Header title="Busqueda Histórica Ubicación Interiores" />
            <div className="image-container">
                <img src={planoSectores} alt="Plano Sectores" className="plano-sectores" />
            </div>
            <div className="search-container">
                <div className="device-selection">
                    <select onChange={(e) => setSelectedDeviceId(e.target.value)}>
                        <option value="">Seleccionar Dispositivo...</option>
                        {devices.map(device => (
                            <option key={device.id} value={device.id}>{device.device_asignado}</option>
                        ))}
                    </select>
                </div>
                <div className="date-time-selection">
                    <h3>Seleccionar Día y Hora</h3>
                    <div className="date-time-inputs">
                        <div className="date-input">
                            <label>Seleccionar Día:</label>
                            <input
                                type="date"
                                value={selectedDay}
                                onChange={e => setSelectedDay(e.target.value)}
                            />
                        </div>
                        <div className="time-input">
                            <label>Hora Inicio:</label>
                            <input
                                type="time"
                                value={startTime}
                                onChange={e => setStartTime(e.target.value)}
                            />
                        </div>
                        <div className="time-input">
                            <label>Hora Fin:</label>
                            <input
                                type="time"
                                value={endTime}
                                onChange={e => setEndTime(e.target.value)}
                            />
                        </div>
                    </div>
                </div>
                <button onClick={fetchSearchResults}>Buscar</button>
                <button onClick={downloadCSV}>Descargar Resultados</button>
            </div>
            <table className="search-results-table">
                <thead>
                    <tr>
                        <th>Personal</th>
                        <th>Sector</th>
                        <th>Desde Detección</th>
                        <th>Permanencia</th>
                        <th>Estado</th>
                    </tr>
                </thead>
                <tbody>
                    {searchResults.map((result, index) => {
                        const sector = getSector(result.beaconId);
                        const permanence = calculatePermanence(result.entrada, result.salida);
                        const permanenceMinutes = (new Date(result.salida ? result.salida : new Date()) - new Date(result.entrada)) / (1000 * 60);
                        const semaphoreClass = getSemaphoreClass(permanenceMinutes);
                        return (
                            <tr key={index}>
                                <td><img src={personal3Icon} alt="Personal 3" style={{ width: '10px' }} /></td>
                                <td className={sector.className}>{sector.text}</td>
                                <td>{formatDate(result.entrada)}</td>
                                <td>{permanence}</td>
                                <td className={semaphoreClass}>
                                    {semaphoreClass.replace('green', 'On Time').replace('yellow', 'Over Time').replace('red', 'Past Deadline')}
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}

export default PersonSearch;
