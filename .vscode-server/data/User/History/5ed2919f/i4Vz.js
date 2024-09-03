import React, { useState, useEffect } from 'react';
import axios from 'axios';
import SevenSegmentDisplay from 'react-7-segment-display';
import './DashboardTemperatura.css';

const DashboardTemperatura = () => {
  const [temperatureData, setTemperatureData] = useState([]);

  useEffect(() => {
    fetchTemperatureData();
  }, []);

  const fetchTemperatureData = async () => {
    try {
      const response = await axios.get('/api/temperature-dashboard-data');
      setTemperatureData(response.data);
    } catch (error) {
      console.error('Error fetching temperature data:', error);
    }
  };

  return (
    <div className="dashboard-container">
      <h1>Temperatura Actual</h1>
      <div className="temperature-display-grid">
        {temperatureData.map((item, index) => (
          <div key={index} className="temperature-display">
            <SevenSegmentDisplay
              value={item.external_temperature !== null ? item.external_temperature.toFixed(1) : 'N/A'}
              color="red"
              backgroundColor="black"
              digitCount={5}  // Asegura que se vea un formato como "-14.2"
            />
            <div className="temperature-channel">
              {item.name}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DashboardTemperatura;
