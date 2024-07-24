import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './PersonSearch.css';
import Header from './Header';

import planoSectores from './assets/images/storage_mapa_1.jpg';
import { obtenerEquivalenciaSector } from './utils/sectorEquivalencias';
import { obtenerEquivalenciaImagen } from './utils/imagenEquivalencias';

function PersonSearch() {
    const [selectedDay, setSelectedDay] = useState('');
    const [startTime, setStartTime] = useState('');
    const [endTime, setEndTime] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [umbrales, setUmbrales] = useState({});
    const [devices, setDevices] = useState([]);
    const [personal, setPersonal] = useState([]);
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
                const response = await axios.get('/api/devices');
                setDevices(response.data);
            } catch (error) {
                console.error('Error fetching devices:', error);
            }
        };
        fetchDevices();

        const fetchPersonal = async () => {
            try {
                const response = await axios.get('/api/personal');
                setPersonal(response.data);
            } catch (error) {
                console.error('Error fetching personal:', error);
            }
        };
        fetchPersonal();
    }, []);

    const fetchSearchResults = async () => {
        const startDateTime = `${selectedDay}T${startTime}:00`;
        const endDateTime = `${selectedDay}T${endTime}:00`;

        try {
            const response = await axios.get('/api/beacon-entries-exits', {
                params: {
                    startDate: startDateTime,
                    endDate: endDateTime,
                    device_id: selectedDeviceId
                },
                withCredentials: true
            });
            console.log('Data received:', response.data);
            setSearchResults(response.data);
        } catch (error) {
            console.error('Error fetching search results:', error);
        }
    };

    const clearSearchResults = () => {
        setSearchResults([]);
    };

    const handleDeviceChange = (e) => {
        setSelectedDeviceId(e.target.value);
        clearSearchResults();
    };

    const handleSearch = () => {
        fetchSearchResults();
    };

    const formatDate = (timestamp) => {
        if (!timestamp) return 'N/A';
        const date = new Date(timestamp);
        return date.toLocaleString();
    };

    const getSector = (beaconId) => {
        let sectorInfo = { text: 'Unknown', className: '' };
        switch (beaconId) {
            case '0C403019-61C7-55AA-B7EA-DAC30C720055':
                sectorInfo = { text: 'E/S Bodega', className: 'sector-bodega' };
                break;
            case 'E9EB8F18-61C7-55AA-9496-3AC30C720055':
                sectorInfo = { text: 'Farmacia', className: 'sector-farmacia' };
                break;
            case 'F7826DA6-BC5B-71E0-893E-4B484D67696F':
                sectorInfo = { text: 'Entrada', className: 'sector-entrada' };
                break;
            case 'F7826DA6-BC5B-71E0-893E-6D424369696F':
                sectorInfo = { text: 'Pasillo Central', className: 'sector-pasillo' };
                break;
            case 'F7826DA6-BC5B-71E0-893E-54654370696F':
                sectorInfo = { text: 'Electro', className: 'sector-electro' };
                break;
        }
        sectorInfo.text = obtenerEquivalenciaSector(sectorInfo.text);
        return sectorInfo;
    };

    const calculatePermanence = (entrada, salida) => {
        const start = new Date(entrada);
        const end = salida ? new Date(salida) : new Date();
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

    const getPersonalIcon = (imageName) => {
        return obtenerEquivalenciaImagen(imageName);
    };

    const getPersonalInfo = (deviceId) => {
        const person = personal.find(p => p.id_dispositivo_asignado === deviceId);
        if (person) {
            return {
                name: person.Nombre_Personal,
                image: getPersonalIcon(person.imagen_asignado)
            };
        }
        return {
            name: 'Unknown',
            image: null
        };
    };

    return (
        <div className="person-search">
            <Header title="Busqueda Histórica Ubicación Interiores" />
            <div className="image-container">
                <img src={planoSectores} alt="Plano Sectores" className="plano-sectores" />
            </div>
            <div className="search-container">
                <div className="device-selection">
                    <select onChange={handleDeviceChange}>
                        <option value="">Seleccionar Dispositivo...</option>
                        {devices.map(device => (
                            <option key={device.id} value={device.id}>{device.device_asignado}</option>
                        ))}
                    </select>
                </div>
                <div className="date-time-selection">
                    <div className="date-time-inputs">
                        <div className="date-time-input">
                            <label>Seleccionar Día:</label>
                            <input
                                type="date"
                                value={selectedDay}
                                onChange={e => setSelectedDay(e.target.value)}
                            />
                        </div>
                        <div className="date-time-input">
                            <label>Hora Inicio:</label>
                            <input
                                type="time"
                                value={startTime}
                                onChange={e => setStartTime(e.target.value)}
                            />
                        </div>
                        <div className="date-time-input">
                            <label>Hora Fin:</label>
                            <input
                                type="time"
                                value={endTime}
                                onChange={e => setEndTime(e.target.value)}
                            />
                        </div>
                    </div>
                </div>
                <button onClick={handleSearch}>Buscar</button>
            </div>
            <table className="search-results-table">
                <thead>
                    <tr>
                        <th>Imagen</th>
                        <th>Nombre</th>
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
                        const personalInfo = getPersonalInfo(selectedDeviceId);
                        return (
                            <tr key={index}>
                                <td className="image-cell">
                                    {personalInfo.image && (
                                        <img src={personalInfo.image} alt={personalInfo.name} className="personal-image" />
                                    )}
                                </td>
                                <td>{personalInfo.name}</td>
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