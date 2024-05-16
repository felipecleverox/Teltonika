import React, { useState } from 'react';
import axios from 'axios';
import './PersonSearch.css';
import personal1Icon from 'C:/Users/cleve/source/repos/Teltonika/Teltonika/src/assets/images/Personal 1.png';
import personal2Icon from 'C:/Users/cleve/source/repos/Teltonika/Teltonika/src/assets/images/Personal 2.png';
import personal3Icon from 'C:/Users/cleve/source/repos/Teltonika/Teltonika/src/assets/images/Personal 3.png';

function PersonSearch() {
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [selectedPerson, setSelectedPerson] = useState('');
    const [searchResults, setSearchResults] = useState([]);

    const fetchSearchResults = async () => {
        try {
            console.log('Sending search request:', { startDate, endDate, selectedPerson }); // Registro de depuración
            const response = await axios.get('http://localhost:1337/api/beacon-entries-exits', {
                params: {
                    startDate,
                    endDate,
                    person: selectedPerson
                }
            });
            console.log('Search results:', response.data); // Registro de depuración
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
        <div className="person-search">
            <h2>Búsqueda de Entradas y Salidas por Persona en Interior</h2>
            <div className="search-parameters">
                <select value={selectedPerson} onChange={e => setSelectedPerson(e.target.value)}>
                    <option value="">Seleccione Personal</option>
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
                            <td>
                                {result.beaconId === '0C403019-61C7-55AA-B7EA-DAC30C720055' && <img src={personal3Icon} alt="Personal 3" style={{ width: '10px' }} />}
                                {result.beaconId === 'E9EB8F18-61C7-55AA-9496-3AC30C720055' && <img src={personal2Icon} alt="Personal 2" style={{ width: '10px' }} />}
                            </td>
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

export default PersonSearch;
