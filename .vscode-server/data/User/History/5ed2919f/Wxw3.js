import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Header from './Header';
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
    <div className="dashboard-temperatura">
      <Header title="Dashboard de Temperatura" />
      <div className="temperature-grid">
        {temperatureData.map((item) => (
          <div key={item.channel_id} className="temperature-card">
            <div className="temperature-display">
                <div className="temperature-column">
                    <div className="temperature-container"> {/* Nuevo contenedor */}
                        <span className="temperature-value">
                            {item.external_temperature != null && !isNaN(parseFloat(item.external_temperature))
                                ? parseFloat(item.external_temperature).toFixed(1)
                                : 'N/A'}
                        </span>
                        <span className="temperature-unit">°C</span>
                    </div>
                </div>
            </div>

            <div className="temperature-info">
              <span className="camera-name">{item.name}</span>
              <span className="timestamp">
                {item.insercion ? new Date(item.insercion).toLocaleString() : 'Fecha no disponible'}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DashboardTemperatura;