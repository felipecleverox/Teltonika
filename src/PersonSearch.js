import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './PersonSearch.css';
import personal3Icon from 'C:/Users/cleve/source/repos/Teltonika/Teltonika/src/assets/images/Personal 3.png';
import planoSectores from './assets/images/plano_sectores.jpg'; // Ensure this path is correct
import Header from './Header'; // Import the new header component

function PersonSearch() {
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [umbrales, setUmbrales] = useState({});

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
    }, []);

    const fetchSearchResults = async () => {
        try {
            const response = await axios.get('http://thenext.ddns.net:1337/api/beacon-entries-exits', {
                params: {
                    startDate,
                    endDate,
                    person: '352592573522828 (autocreated)' // Name of the device
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
                return <span style={{ color: '#c1ff72' }}>E/S Bodega</span>;
            case 'E9EB8F18-61C7-55AA-9496-3AC30C720055':
                return <span style={{ color: '#8c52ff' }}>Farmacia</span>;
            case 'F7826DA6-BC5B-71E0-893E-4B484D67696F':
                return <span style={{ color: '#ffbd59' }}>Entrada</span>;
            case 'F7826DA6-BC5B-71E0-893E-6D424369696F':
                return <span style={{ color: '#5ce16e' }}>Pasillo Central</span>;
            case 'F7826DA6-BC5B-71E0-893E-54654370696F':
                return <span style={{ color: '#ffde59' }}>Electro</span>;
            default:
                return 'Unknown';
        }
    };

    const calculatePermanence = (entrada, salida) => {
        const start = new Date(entrada);
        const end = salida ? new Date(salida) : new Date(endDate); // Usa endDate si no hay salida
        const duration = end - start;

        const hours = Math.floor(duration / (1000 * 60 * 60));
        const minutes = Math.floor((duration % (1000 * 60 * 60)) / (1000 * 60));
        return `${hours}h ${minutes}m`;
    };

    const getSemaphoreColor = (permanenceMinutes) => {
        if (permanenceMinutes <= umbrales.umbral_verde) {
            return { color: 'green', label: 'On Time' };
        } else if (permanenceMinutes > umbrales.umbral_verde && permanenceMinutes <= umbrales.umbral_amarillo) {
            return { color: 'yellow', label: 'Over Time' };
        } else if (permanenceMinutes > umbrales.umbral_amarillo) {
            return { color: 'red', label: 'Past Deadline' };
        }

        return { color: 'transparent', label: 'N/A' };
    };

    const downloadCSV = () => {
        const headers = ['Personal', 'Sector', 'Desde Detección', 'Permanencia', 'Estado'];
        const rows = searchResults.map(result => {
            const permanence = calculatePermanence(result.entrada, result.salida);
            const permanenceMinutes = (new Date(result.salida ? result.salida : endDate) - new Date(result.entrada)) / (1000 * 60);
            const semaphore = getSemaphoreColor(permanenceMinutes);
            return [
                'Personal 3', // Assuming the icon represents "Personal 3"
                getSector(result.beaconId).props.children, // Extract the sector text
                formatDate(result.entrada),
                permanence,
                semaphore.label
            ];
        });

        const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", `historical_movements_${startDate}_${endDate}.csv`);
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
            <div className="search-parameters">
                <input
                    type="datetime-local"
                    value={startDate}
                    onChange={e => setStartDate(e.target.value)}
                    placeholder="Fecha y hora de inicio"
                />
                <input
                    type="datetime-local"
                    value={endDate}
                    onChange={e => setEndDate(e.target.value)}
                    placeholder="Fecha y hora de fin"
                />
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
                        const permanence = calculatePermanence(result.entrada, result.salida);
                        const permanenceMinutes = (new Date(result.salida ? result.salida : endDate) - new Date(result.entrada)) / (1000 * 60);
                        const semaphore = getSemaphoreColor(permanenceMinutes);
                        return (
                            <tr key={index}>
                                <td><img src={personal3Icon} alt="Personal 3" style={{ width: '10px' }} /></td>
                                <td>{getSector(result.beaconId)}</td>
                                <td>{formatDate(result.entrada)}</td>
                                <td>{permanence}</td>
                                <td style={{ backgroundColor: semaphore.color }}>
                                    {semaphore.label}
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
