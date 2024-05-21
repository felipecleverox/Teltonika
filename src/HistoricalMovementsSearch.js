import React, { useState } from 'react';
import axios from 'axios';
import MapView from './MapView';
import LastKnownPosition from './LastKnownPosition'; // Importar el componente LastKnownPosition
import DataTable from './DataTable';
import Header from './Header'; // Importar el encabezado
import './HistoricalMovementsSearch.css'; // Importar estilos

const HistoricalMovementsSearch = () => {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [pathCoordinates, setPathCoordinates] = useState([]);
  const [historicalDataError, setHistoricalDataError] = useState(null);

  const handleSearch = async () => {
    setHistoricalDataError(null);
    try {
      const startTimestamp = Math.floor(new Date(startDate).getTime() / 1000);
      const endTimestamp = Math.floor(new Date(endDate).getTime() / 1000);

      const response = await axios.get('http://201.189.67.111:1337/api/get-gps-data', {
        params: {
          startDate: startTimestamp,
          endDate: endTimestamp
        }
      });

      const newCoordinates = response.data.map(item => {
        const latitude = parseFloat(item.latitude);
        const longitude = parseFloat(item.longitude);
        return { latitude, longitude, timestamp: item.unixTimestamp };
      });

      setPathCoordinates(newCoordinates);
    } catch (error) {
      setHistoricalDataError(error.message);
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    const date = new Date(timestamp * 1000);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  return (
    <div>
      <Header title="Consulta Histórica de Movimientos en Exterior" />
      <LastKnownPosition showHeader={false} /> {/* Eliminar el header dentro de LastKnownPosition */}
      <div className="search-parameters">
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
        <button onClick={handleSearch}>Search</button>
        {historicalDataError && <div className="error-message">Error: {historicalDataError}</div>}
      </div>
      <div className="map-container">
        <h2>Map View</h2>
        {pathCoordinates.length === 0 ? (
          <p>No data available for the selected range</p>
        ) : (
          <MapView pathCoordinates={pathCoordinates.map(({ latitude, longitude }) => [latitude, longitude])} />
        )}
      </div>
      {pathCoordinates.length > 0 && (
        <div className="data-table-container">
          <h2>Tabla de Datos de Ubicaciones</h2>
          <table className="data-table">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Hora</th>
                <th>Latitud</th>
                <th>Longitud</th>
              </tr>
            </thead>
            <tbody>
              {pathCoordinates.map(({ latitude, longitude, timestamp }, index) => (
                <tr key={index}>
                  <td>{formatDate(timestamp).split(' ')[0]}</td>
                  <td>{formatDate(timestamp).split(' ')[1]}</td>
                  <td>{latitude}</td>
                  <td>{longitude}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default HistoricalMovementsSearch;
