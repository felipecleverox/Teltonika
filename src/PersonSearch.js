// PersonSearch.js
import React, { useState } from 'react';
import axios from 'axios';
import './PersonSearch.css';
import PersonPopup from './PersonPopup';
import PersonDataTable from './PersonDataTable';

const PersonSearch = () => {
    const [selectedPerson, setSelectedPerson] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [data, setData] = useState([]);

    const handleSearch = async () => {
        if (selectedPerson === 'Personal 3') {
            try {
                const response = await axios.get('http://localhost:1337/api/beacon-entries-exits', {
                    params: {
                        startDate: new Date(startDate).getTime() / 1000,
                        endDate: new Date(endDate).getTime() / 1000
                    }
                });
                setData(response.data);
            } catch (error) {
                console.error('Error fetching data:', error);
            }
        } else {
            alert('Solo Personal 3 tiene datos disponibles.');
        }
    };

    return (
        <div className="person-search">
            <h2>Buscar Entradas y Salidas por Persona</h2>
            <PersonPopup selectedPerson={selectedPerson} setSelectedPerson={setSelectedPerson} />
            <input
                type="datetime-local"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                placeholder="Fecha de Inicio"
            />
            <input
                type="datetime-local"
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
                placeholder="Fecha de Término"
            />
            <button onClick={handleSearch}>Buscar</button>
            {data.length > 0 && <PersonDataTable data={data} />}
        </div>
    );
};

export default PersonSearch;
