import React, { useState, useEffect } from 'react';
import axios from 'axios';
import moment from 'moment';
import { Display } from 'react-7-segment-display';
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
      console.log('Raw temperature data:', response.data);
      if (Array.isArray(response.data) && response.data.length > 0) {
        const formattedData = response.data.map(item => ({
          ...item,
          external_temperature: parseFloat(item.external_temperature)
        }));
        console.log('Formatted temperature data:', formattedData);
        setTemperatureData(formattedData);
      } else {
        console.error('Invalid data structure received from API');
      }
    } catch (error) {
      console.error('Error fetching temperature data:', error);
    }
  };

  const formatTemperature = (temp) => {
    return temp.toFixed(1).padStart(5, ' ');
  };

  return (
    <div className="dashboard-container">
      <h1>Temperatura Actual</h1>
      <div className="temperature-display-grid">
        {temperatureData.map((item) => (
          <div key={item.channel_id} className="temperature-display">
            <Display 
              value={formatTemperature(item.external_temperature)}
              color="red"
              backgroundColor="black"
              digitCount={5}
              decimals={1}
              thickness={0.15}
              skew={2}
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