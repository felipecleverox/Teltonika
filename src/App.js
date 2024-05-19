import React, { useState } from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import axios from 'axios';
import MapView from './MapView';
import LastKnownPosition from './LastKnownPosition';
import MapWithQuadrants from './MapWithQuadrants';
import DataTable from './DataTable';
import Clock from './Clock'; 
import PersonSearch from './PersonSearch'; 
import LandingPage from './LandingPage';
import SelectRoutine from './SelectRoutine'; // Importa el nuevo componente
import Header from './Header'; // Importa el nuevo encabezado
import './App.css';
import logo from './assets/images/tns_logo_blanco.png';
import personal1 from './assets/images/Personal 1.png';
import personal2 from './assets/images/Personal 2.png';
import personal3 from './assets/images/Personal 3.png';

function ActualApp() {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [pathCoordinates, setPathCoordinates] = useState([]);
  const [historicalDataError, setHistoricalDataError] = useState(null); 

  const fetchHistoricalData = async () => {
    setHistoricalDataError(null); // Clear any previous errors
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
      }
    } catch (error) {
      console.error('Error fetching historical data:', error);
      setHistoricalDataError(error.message); // Set the error state
    }
  };

  return (
    <div className="App">
      <Header title="Device Location Tracker" />
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
      <PersonSearch /> 
      <div className="query-section">
        <h2>Consulta Histórica de Movimientos en Exterior</h2>
        <h3>Ingrese parámetros de búsqueda</h3>
        <input
          type="datetime-local"
          value={startDate}
          onChange={e => setStartDate(e.target.value)}
          placeholder="Start Date and Time"
        />
        <input
          type="datetime-local"
          value={endDate}
          onChange={e => setEndDate(e.target.value)}
          placeholder="End Date and Time"
        />
        <button onClick={fetchHistoricalData}>Search</button>
        {historicalDataError && <div className="error-message">Error: {historicalDataError}</div>} 
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
          <DataTable data={pathCoordinates} />
        </div>
      )}
    </div>
  );
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/select-routine" element={<SelectRoutine />} />
        <Route path="/last-known-position" element={<LastKnownPosition />} />
        <Route path="/ubicaciones-interior" element={<MapWithQuadrants />} />
        <Route path="/busqueda-entradas-persona" element={<PersonSearch />} />
        <Route path="/consulta-historica-movimientos" element={<ActualApp />} />
      </Routes>
    </Router>
  );
}

export default App;
