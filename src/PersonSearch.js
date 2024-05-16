// PersonSearch.js
import React, { useState } from 'react';
import axios from 'axios';
import './PersonSearch.css';
import personal3Icon from 'C:/Users/cleve/source/repos/Teltonika/Teltonika/src/assets/images/Personal 3.png';

function PersonSearch() {
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [searchResults, setSearchResults] = useState([]);

    const fetchSearchResults = async () => {
        try {
            const response = await axios.get('http://localhost:1337/api/beacon-entries-exits', {
                params: {
                    startDate,
                    endDate,
                    person: '352592573522828 (autocreated)' // Nombre del dispositivo
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
        if (beaconId === '0C403019-61C7-55AA-B7EA-DAC30C720055') {
            return <span style={{ color: '#6b9fd4' }}>E/S Bodega</span>;
        } else if (beaconId === 'E9EB8F18-61C7-55AA-9496-3AC30C720055') {
            return <span style={{ color: '#00ab41' }}>Farmacia</span>;
        }
        return 'Unknown';
    };

    return (
        <div className="person-search">
            <h2>Búsqueda de Entradas por Persona en Interior</h2>
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
            </div>
            <table className="search-results-table">
                <thead>
                    <tr>
                        <th>Personal</th>
                        <th>Sector</th>
                        <th>Entrada</th>
                    </tr>
                </thead>
                <tbody>
                    {searchResults.map((result, index) => (
                        <tr key={index}>
                            <td><img src={personal3Icon} alt="Personal 3" style={{ width: '10px' }} /></td>
                            <td>{getSector(result.beaconId)}</td>
                            <td>{formatDate(result.entrada)}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

export default PersonSearch;
