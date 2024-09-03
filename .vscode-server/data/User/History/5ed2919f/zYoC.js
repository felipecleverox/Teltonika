import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './DashboardTemperatura.css'; // Asegúrate de tener los estilos en el archivo CSS

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
            <div className="temperature-value">
              {item.external_temperature !== null ? item.external_temperature.toFixed(1) : 'N/A'}°C
            </div>
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
