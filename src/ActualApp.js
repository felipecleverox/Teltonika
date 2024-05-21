// ActualApp.js
import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import MapView from './MapView';
import LastKnownPosition from './LastKnownPosition';
import MapWithQuadrants from './MapWithQuadrants';
import DataTable from './DataTable';
import PersonSearch from './PersonSearch';
import HistoricalMovementsSearch from './HistoricalMovementsSearch'; // Nuevo componente para la búsqueda histórica de movimientos

function ActualApp() {
  const location = useLocation();
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [pathCoordinates, setPathCoordinates] = useState([]);
  const [historicalDataError, setHistoricalDataError] = useState(null);

  return (
    <div className="App">
      {location.pathname === '/consulta-historica-movimientos' ? (
        <HistoricalMovementsSearch
          startDate={startDate}
          endDate={endDate}
          setStartDate={setStartDate}
          setEndDate={setEndDate}
          pathCoordinates={pathCoordinates}
          setPathCoordinates={setPathCoordinates}
          historicalDataError={historicalDataError}
        />
      ) : (
        <>
          <div className="map-container">
            <h2>Last Known Position</h2>
            <LastKnownPosition />
            <MapWithQuadrants />
          </div>
        </>
      )}
    </div>
  );
}

export default ActualApp;
