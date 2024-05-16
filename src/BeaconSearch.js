// BeaconSearch.js
import React, { useState } from 'react';
import axios from 'axios';
import './BeaconSearch.css'; // Crear este archivo CSS según sea necesario

function BeaconSearch() {
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [selectedPerson, setSelectedPerson] = useState('Personal 3');
    const [searchResults, setSearchResults] = useState([]);

    const fetchSearchResults = async () => {
        try {
            const response = await axios.get('http://localhost:1337/api/beacon-entries-exits', {
                params: {
                    startDate,
                    endDate,
                    person: selectedPerson
                }
            });
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

    return (
        <div className="beacon-search">
            <h2>Búsqueda de Entradas y Salidas de Beacons</h2>
            <div className="search-parameters">
                <select value={selectedPerson} onChange={e => setSelectedPerson(e.target.value)}>
                    <option value="Personal 1">Personal 1</option>
                    <option value="Personal 2">Personal 2</option>
                    <option value="Personal 3">Personal 3</option>
                    <option value="Personal 4">Personal 4</option>
                    <option value="Personal 5">Personal 5</option>
                </select>
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
                        <th>Salida</th>
                    </tr>
                </thead>
                <tbody>
                    {searchResults.map((result, index) => (
                        <tr key={index}>
                            <td>{result.beaconId}</td>
                            <td>{result.sector}</td>
                            <td>{formatDate(result.entrada)}</td>
                            <td>{formatDate(result.salida)}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

export default BeaconSearch;
