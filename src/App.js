import React, { useState } from 'react';
import axios from 'axios';
import MapView from './MapView';
import LastKnownPosition from './LastKnownPosition';
import MapWithQuadrants from './MapWithQuadrants';
import DataTable from './DataTable';
import './App.css';

function App() {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [pathCoordinates, setPathCoordinates] = useState([]);

  const fetchData = async () => {
    try {
      let startTimestamp = Math.floor(new Date(startDate).getTime() / 1000);
      let endTimestamp = Math.floor(new Date(endDate).getTime() / 1000);
  
      // Asegurarse de que startTimestamp sea siempre menor o igual que endTimestamp
      if (startTimestamp > endTimestamp) {
        [startTimestamp, endTimestamp] = [endTimestamp, startTimestamp];
      }
  
      const response = await axios.get('http://localhost:1337/api/get-gps-data', {
        params: {
          startDate: startTimestamp,
          endDate: endTimestamp
        }
      });
  
      if (response.data.length === 0) {
        console.log("No data available for the selected range.");
        setPathCoordinates([]);
      } else {
        const newCoordinates = response.data.map(item => ({
          timestamp: item.unixTimestamp, // Asumiendo que el backend envía 'unixTimestamp'
          longitude: item.longitude,
          latitude: item.latitude
        }));
        setPathCoordinates(newCoordinates);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };
  
  
  return (
    <div className="App">
      <div className="header">
        <h1>Device Location Tracker</h1>
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
        <button onClick={fetchData}>Search</button>
      </div>
      <div className="map-container">
        {pathCoordinates.length === 0 ? (
          <p>No data available for the selected range</p>
        ) : (
          <MapView pathCoordinates={pathCoordinates.map(p => [p.latitude, p.longitude])} />
        )}
      </div>
      <div className="last-position-container">
        <LastKnownPosition />
        <MapWithQuadrants />
      </div>
      {pathCoordinates.length > 0 && <DataTable data={pathCoordinates} />}
    </div>
  );
}

export default App;
