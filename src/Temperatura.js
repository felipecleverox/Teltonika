// Temperatura.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, TimeScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
import 'chartjs-adapter-date-fns';
import { es } from 'date-fns/locale';
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

  useEffect(() => {
    const fetchTemperatureData = async () => {
      try {
        const response = await axios.get('/api/temperature-data');
        console.log('Datos recibidos:', response.data); // Para debugging
        setData(response.data);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching temperature data:", error);
        setLoading(false);
      }
    };

    fetchTemperatureData();
  }, []);

  if (loading) {
    return <div>Loading...</div>;
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
        beginAtZero: true,
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
    }
  };

  return (
    <div className="temperatura">
      <Header />
      <h1>Temperatura</h1>
      <div className="charts-grid">
        {data.map((beaconData) => {
          const chartData = {
            labels: beaconData.timestamps.map(ts => new Date(ts)),
            datasets: [
              {
                label: 'Temperatura',
                data: beaconData.temperatures,
                fill: false,
                borderColor: 'rgba(75,192,192,1)',
                tension: 0.4,
              }
            ]
          };

          return (
            <div key={beaconData.beacon_id} className="chart-container">
              <h3>{` ${beaconData.location} - ${beaconData.ubicacion}`}</h3>
              <Line data={chartData} options={chartOptions} />
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Temperatura;