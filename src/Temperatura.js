// Temperatura.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, TimeScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
import 'chartjs-adapter-date-fns';
import { es } from 'date-fns/locale';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import './Temperatura.css';
import Header from './Header';

ChartJS.register(
  TimeScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const Temperatura = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchTemperatureData(selectedDate);
  }, [selectedDate]);

  const fetchTemperatureData = async (date) => {
    try {
      const formattedDate = date.toISOString().split('T')[0];
      console.log('Fetching data for date:', formattedDate);
      const response = await axios.get('/api/temperature-data', {
        params: { date: formattedDate }
      });
      console.log('Datos recibidos:', response.data);
      setData(response.data);
      setLoading(false);
      setError(null);
    } catch (error) {
      console.error("Error fetching temperature data:", error);
      setLoading(false);
      setError('Error al cargar los datos. Por favor, intente nuevamente.');
    }
  };

  const handleDateChange = (date) => {
    setSelectedDate(date);
    setLoading(true);
  };

  if (loading) {
    return <div>Cargando datos...</div>;
  }

  if (error) {
    return <div>{error}</div>;
  }

  if (data.length === 0) {
    return (
      <div className="temperatura">
        <Header />
        <h1>Temperatura</h1>
        <DatePicker 
          selected={selectedDate} 
          onChange={handleDateChange} 
          dateFormat="yyyy-MM-dd"
          className="date-picker"
        />
        <p>No hay datos disponibles para la fecha seleccionada.</p>
      </div>
    );
  }

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        type: 'time',
        time: {
          unit: 'hour',
          displayFormats: {
            hour: 'HH:mm'
          }
        },
        adapters: {
          date: {
            locale: es,
          },
        },
        title: {
          display: true,
          text: 'Hora'
        }
      },
      y: {
        min: 0,
        max: 50,
        title: {
          display: true,
          text: 'Temperatura (°C)'
        }
      }
    },
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        callbacks: {
          title: (context) => {
            return new Date(context[0].parsed.x).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
          }
        }
      }
    },
    elements: {
      line: {
        tension: 0.4
      },
      point: {
        radius: 0
      }
    }
  };

  return (
    <div className="temperatura">
      <Header />
      <h1>Temperatura</h1>
      <DatePicker 
        selected={selectedDate} 
        onChange={handleDateChange} 
        dateFormat="yyyy-MM-dd"
        className="date-picker"
      />
      <div className="charts-grid">
        {data.map((beaconData) => {
          const validData = beaconData.temperatures.map((temp, index) => ({
            x: new Date(beaconData.timestamps[index]),
            y: temp !== null ? Number(temp) : null
          })).filter(point => point.y !== null);

          const temperatures = validData.map(point => point.y);
          const maxTemp = Math.max(...temperatures);
          const minTemp = Math.min(...temperatures);
          
          const chartData = {
            datasets: [
              {
                label: 'Temperatura',
                data: validData,
                fill: false,
                borderColor: 'rgba(75,192,192,1)',
                tension: 0.4,
              }
            ]
          };

          return (
            <div key={beaconData.beacon_id} className="chart-container">
              <h3>{`${beaconData.location} - ${beaconData.ubicacion}`}</h3>
              <div className="temp-legend">
                <span className="max-temp">Max: {maxTemp.toFixed(1)}°C</span>
                <span className="min-temp">Min: {minTemp.toFixed(1)}°C</span>
              </div>
              <Line data={chartData} options={chartOptions} />
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Temperatura;