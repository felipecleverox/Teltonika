import React, { useState } from 'react';
import axios from 'axios';
import MapView from './MapView';
import './App.css';

function App() {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [pathCoordinates, setPathCoordinates] = useState([]);

  const fetchData = async () => {
    try {
      const startTimestamp = Math.floor(new Date(startDate).getTime() / 1000);
      const endTimestamp = Math.floor(new Date(endDate).getTime() / 1000);

      const response = await axios.get('http://localhost:1337/api/get-gps-data', {
        params: {
          startDate: startTimestamp,
          endDate: endTimestamp
        }
      });

      if (response.data.length === 0) {
        setPathCoordinates([]);
      } else {
        const newCoordinates = response.data.map(item => [item.latitude, item.longitude]);
        setPathCoordinates(newCoordinates);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  return (
    <div className="App">
      <div className="header">
        <h1>Device Location</h1>
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
          <MapView pathCoordinates={pathCoordinates} />
        )}
      </div>
    </div>
  );
}

export default App;
