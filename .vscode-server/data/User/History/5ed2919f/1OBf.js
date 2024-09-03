import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Display } from 'react-7-segment-display';
import moment from 'moment';
import './DashboardTemperatura.css';

const DashboardTemperatura = () => {
  const [temperatureData, setTemperatureData] = useState([]);

  useEffect(() => {
    fetchTemperatureData();
    const intervalId = setInterval(fetchTemperatureData, 60000);
    return () => clearInterval(intervalId);
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
        {temperatureData.map((item) => (
          <div key={item.channel_id} className="temperature-display">
            <Display
              // Convertir a número antes de pasarlo a Display
              value={Number(item.external_temperature).toFixed(1) || '--.-'}
              color="red"
              backgroundColor="black"
              digitCount={4} 
            />
            <div className="temperature-channel">
              {item.name}
            </div>
            <div className="temperature-date">
              {item.insercion && (
                <span>Actualizado: {moment(item.insercion).format('DD/MM/YYYY HH:mm')}</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DashboardTemperatura;