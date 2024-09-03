// TemperaturaCamaras.js
import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, TimeScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
import 'chartjs-adapter-date-fns';
import { es } from 'date-fns/locale';
import DatePicker, { registerLocale } from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import './TemperaturaCamaras.css';
import Header from './Header';

registerLocale('es', es);

ChartJS.register(
  TimeScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const TemperaturaCamaras = () => {
  const [data, setData] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [error, setError] = useState(null);
  const today = useRef(new Date());

  useEffect(() => {
    fetchTemperatureData(selectedDate);
  }, [selectedDate]);

  const fetchTemperatureData = async (date) => {
    try {
      const formattedDate = date.toISOString().split('T')[0];
      console.log('Fetching data for date:', formattedDate);
      const response = await axios.get('/api/temperature-camaras-data', {
        params: { date: formattedDate }
      });
      console.log('Datos recibidos:', response.data);
      
      // Agrupar datos por channel_id
      const groupedData = response.data.reduce((acc, item) => {
        if (!acc[item.channel_id]) {
          acc[item.channel_id] = {
            name: item.name,
            data: []
          };
        }
        acc[item.channel_id].data.push(item);
        return acc;
      }, {});

      setData(groupedData);
      setLoading(false);
      setError(null);
    } catch (error) {
      console.error("Error fetching temperature data:", error);
      setLoading(false);
      setError('Error al cargar los datos. Por favor, intente nuevamente.');
    }
  };

  const handleDateChange = (date) => {
    if (date <= today.current) {
      setSelectedDate(date);
      setLoading(true);
    } else {
      alert("No se puede seleccionar una fecha futura.");
    }
  };

  const generateCSV = (deviceData) => {
    const headers = "Timestamp,External Temperature\n";
    const rows = deviceData.data.map(item => 
      `${item.timestamp},${item.external_temperature}`
    ).join("\n");
    return headers + rows;
  };

  const handleDownload = (channelId, deviceName) => {
    const deviceData = data[channelId];
    const csvContent = generateCSV(deviceData);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", `${deviceName}_external_temperatures.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  if (loading) {
    return <div>Cargando datos...</div>;
  }

  if (error) {
    return <div>{error}</div>;
  }

  if (Object.keys(data).length === 0) {
    return (
      <div className="temperatura-camaras">
        <Header />
        <h1>Temperaturas Externas Cámaras de Frío</h1>
        <DatePicker 
          selected={selectedDate} 
          onChange={handleDateChange} 
          dateFormat="dd-MM-yyyy"
          className="date-picker"
          locale="es"
          maxDate={today.current}
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
        title: {
          display: true,
          text: 'Temperatura Externa (°C)'
        },
        min: -25,
        max: 40,
        ticks: {
          stepSize: 1
        }
      }
    },
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        mode: 'index',
        intersect: false
      }
    }
  };

  return (
    <div className="temperatura-camaras">
      <Header />
      <h1>Temperaturas Externas Cámaras de Frío</h1>
      <DatePicker 
        selected={selectedDate} 
        onChange={handleDateChange} 
        dateFormat="dd-MM-yyyy"
        className="date-picker"
        locale="es"
        maxDate={today.current}
      />
      <div className="charts-grid">
        {Object.entries(data).map(([channelId, deviceData]) => {
          const chartData = {
            labels: deviceData.data.map(item => item.timestamp),
            datasets: [
              {
                label: 'Temperatura Externa',
                data: deviceData.data.map(item => item.external_temperature),
                fill: false,
                borderColor: 'rgba(75,192,192,1)',
                tension: 0.1
              }
            ]
          };

          return (
            <div key={channelId} className="chart-container">
              <h3>{`Cámara de Frío: ${deviceData.name}`}</h3>
              <div className="chart-wrapper">
                <Line data={chartData} options={chartOptions} />
              </div>
              <button onClick={() => handleDownload(channelId, deviceData.name)} className="download-button">
                Descarga de Datos
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default TemperaturaCamaras;