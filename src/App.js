import React, { useState } from 'react';
import axios from 'axios';
import MapView from './MapView';
import LastKnownPosition from './LastKnownPosition';
import MapWithQuadrants from './MapWithQuadrants';
import DataTable from './DataTable';
import Clock from './Clock';
import './App.css';
import logo from './assets/images/tns_logo_blanco.png';
import personal1 from './assets/images/Personal 1.png';
import personal2 from './assets/images/Personal 2.png';
import personal3 from './assets/images/Personal 3.png';

function App() {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedPerson, setSelectedPerson] = useState('');
  const [pathCoordinates, setPathCoordinates] = useState([]);
  const [exteriorData, setExteriorData] = useState([]);
  const [interiorData, setInteriorData] = useState([]);

  const fetchExteriorData = async () => {
    try {
      let startTimestamp = Math.floor(new Date(startDate).getTime() / 1000);
      let endTimestamp = Math.floor(new Date(endDate).getTime() / 1000);

      if (startTimestamp > endTimestamp) {
        [startTimestamp, endTimestamp] = [endTimestamp, startTimestamp];
      }

      const response = await axios.get('http://localhost:1337/api/get-gps-data', {
        params: {
          startDate: startTimestamp,
          endDate: endTimestamp
        }
      });

      console.log('Server Response:', response.data);

      if (response.data.length === 0) {
        console.log("No data available for the selected range.");
        setPathCoordinates([]);
        setExteriorData([]);
      } else {
        const newCoordinates = response.data.map(item => {
          if (item.latitude && item.longitude) {
            const latitude = parseFloat(item.latitude);
            const longitude = parseFloat(item.longitude);
            const timestamp = parseInt(item.unixTimestamp, 10);

            if (!isNaN(latitude) && !isNaN(longitude) && !isNaN(timestamp)) {
              return [latitude, longitude, timestamp];
            } else {
              console.error('Invalid data item after parsing:', item);
              return null;
            }
          } else {
            console.error('Invalid data item:', item);
            return null;
          }
        }).filter(coord => coord !== null);
        console.log('Parsed Coordinates:', newCoordinates);
        setPathCoordinates(newCoordinates);
        setExteriorData(response.data);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const fetchInteriorData = async () => {
    try {
      let startTimestamp = Math.floor(new Date(startDate).getTime() / 1000);
      let endTimestamp = Math.floor(new Date(endDate).getTime() / 1000);

      if (startTimestamp > endTimestamp) {
        [startTimestamp, endTimestamp] = [endTimestamp, startTimestamp];
      }

      const response = await axios.get('http://localhost:1337/api/get-interior-data', {
        params: {
          startDate: startTimestamp,
          endDate: endTimestamp,
          person: selectedPerson
        }
      });

      console.log('Server Response:', response.data);

      if (response.data.length === 0) {
        console.log("No data available for the selected range.");
        setInteriorData([]);
      } else {
        setInteriorData(response.data);
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
        <Clock />
      </header>
      <div className="map-container">
        <h2>Last Known Position</h2>
        <LastKnownPosition />
        <MapWithQuadrants />
      </div>
      <div className="icon-legend">
        <div className="icon-items">
          <div className="icon-item">
            <img src={personal1} alt="Personal 1" />
            <span>Personal 1</span>
          </div>
          <div className="icon-item">
            <img src={personal2} alt="Personal 2" />
            <span>Personal 2</span>
          </div>
          <div className="icon-item">
            <img src={personal3} alt="Personal 3" />
            <span>Personal 3</span>
          </div>
        </div>
      </div>
      <div className="query-section">
        <h2>Consulta Histórica de Movimientos en Exterior</h2>
        <h3>Ingrese parámetros de búsqueda</h3>
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
        <button onClick={fetchExteriorData}>Buscar</button>
      </div>
      <div className="map-container">
        <h2>Map View</h2>
        {pathCoordinates.length === 0 ? (
          <p>No data available for the selected range</p>
        ) : (
          <MapView pathCoordinates={pathCoordinates.map(([latitude, longitude]) => [
            parseFloat(latitude),
            parseFloat(longitude),
          ])} />
        )}
      </div>
      {pathCoordinates.length > 0 && (
        <div className="data-table-container">
          <h2>Tabla de Datos de Ubicaciones</h2>
          <DataTable data={exteriorData} />
        </div>
      )}
      <div className="query-section">
        <h2>Consulta Histórica de Entradas y Salidas</h2>
        <h3>Ingrese parámetros de búsqueda</h3>
        <select onChange={e => setSelectedPerson(e.target.value)}>
          <option value="">Seleccionar Persona</option>
          <option value="352592573522828 (autocreated)">Persona 3</option>
          <option value="persona1">Persona 1</option>
          <option value="persona2">Persona 2</option>
          <option value="persona4">Persona 4</option>
          <option value="persona5">Persona 5</option>
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
        <button onClick={fetchInteriorData}>Buscar</button>
      </div>
      <div className="data-table-container">
        <h2>Tabla de Datos de Entradas y Salidas</h2>
        <DataTable data={interiorData} />
      </div>
    </div>
  );
}

export default App;
