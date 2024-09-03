import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Display } from 'react-7-segment-display';
import moment from 'moment';
import './DashboardTemperatura.css';

const DashboardTemperatura = () => {
  const [temperatureData, setTemperatureData] = useState([]);

  useEffect(() => {
    fetchTemperatureData();
    const intervalId = setInterval(fetchTemperatureData, 60000); // Refrescar cada 60 segundos
    return () => clearInterval(intervalId);
  }, []);

  const fetchTemperatureData = async () => {
    try {
      const response = await axios.get('/api/temperature-dashboard-data');
      console.log(response.data); // <-- Agrega este log para verificar los datos
      setTemperatureData(response.data);
    } catch (error) {
      console.error('Error fetching temperature data:', error);
    }
  };

  const formatTemperature = (temp) => {
    return temp !== null && !isNaN(temp) ? Number(temp).toFixed(1) : '--.-';
  };

  return (
    <div className="dashboard-container">
      <h1>Temperatura Actual</h1>
      <div className="temperature-display-grid">
        {temperatureData.map((item) => (
          <div key={item.channel_id} className="temperature-display">
            <Display
              value={formatTemperature(item.external_temperature)} // Usar la función de formato
              color="red"
              backgroundColor="black"
              digitCount={5} 
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
