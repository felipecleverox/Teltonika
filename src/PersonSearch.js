import React, { useState } from 'react';
import axios from 'axios';
import './PersonSearch.css';
import personal3Icon from 'C:/Users/cleve/source/repos/Teltonika/Teltonika/src/assets/images/Personal 3.png';
import planoSectores from './assets/images/plano_sectores.jpg'; // Asegúrate de que esta ruta sea correcta
import Header from './Header'; // Importa el nuevo encabezado

function PersonSearch() {
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [searchResults, setSearchResults] = useState([]);

    const fetchSearchResults = async () => {
        try {
            const response = await axios.get('http://201.189.67.111:1337/api/beacon-entries-exits', {
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
