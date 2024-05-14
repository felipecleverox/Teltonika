// Modificaciones en App.js
import React, { useState } from 'react';
import axios from 'axios';
import DataTable from './DataTable';
import './App.css';
import logo from './assets/images/tns_logo_blanco.png';
import personal1 from './assets/images/Personal 1.png';
import personal2 from './assets/images/Personal 2.png';
import personal3 from './assets/images/Personal 3.png';

function App() {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedPerson, setSelectedPerson] = useState('');
  const [data, setData] = useState([]);

  const fetchData = async () => {
    try {
      let startTimestamp = Math.floor(new Date(startDate).getTime() / 1000);
      let endTimestamp = Math.floor(new Date(endDate).getTime() / 1000);

      if (startTimestamp > endTimestamp) {
        [startTimestamp, endTimestamp] = [endTimestamp, startTimestamp];
      }

      const response = await axios.get('http://localhost:1337/api/get-gps-data', {
        params: {
          startDate: startTimestamp,
          endDate: endTimestamp,
          person: selectedPerson
        }
      });

      console.log('Server Response:', response.data);

      if (response.data.length === 0) {
        console.log("No data available for the selected range.");
        setData([]);
      } else {
        setData(response.data);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <h1>Device Location Tracker</h1>
      </header>
      <div className="query-section">
        <h2>Consulta Histórica de Movimientos</h2>
        <h3>Ingrese parámetros de búsqueda</h3>
        <select onChange={e => setSelectedPerson(e.target.value)}>
          <option value="">Seleccionar Persona</option>
          <option value="352592573522828 (autocreated)">Persona 3</option>
        </select>
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
        <button onClick={fetchData}>Buscar</button>
      </div>
      <div className="data-table-container">
        <h2>Tabla de Datos de Ubicaciones</h2>
        <DataTable data={data} />
      </div>
    </div>
  );
}

export default App;
