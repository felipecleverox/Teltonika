import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, TimeScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
import 'chartjs-adapter-date-fns';
import { es } from 'date-fns/locale';
import DatePicker, { registerLocale } from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import './IntelligenciaDatosTemperatura.css';
import Header from './Header';
import moment from 'moment-timezone';

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

const LINE_COLORS = [
  'rgba(75,192,192,1)',
  'rgba(255,99,132,1)',
  'rgba(54, 162, 235, 1)',
  'rgba(255, 206, 86, 1)',
  'rgba(153, 102, 255, 1)',
  'rgba(255, 159, 64, 1)'
];

const IntelligenciaDatosTemperatura = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [error, setError] = useState(null);
  const [devices, setDevices] = useState([]);
  const [selectedDevice, setSelectedDevice] = useState('');

  useEffect(() => {
    fetchDevices();
  }, []);

  const fetchDevices = async () => {
    try {
      const response = await axios.get('/api1/temperature-devices');
      setDevices(response.data);
    } catch (error) {
      console.error("Error fetching devices:", error);
      setError('Error al cargar los dispositivos. Por favor, intente nuevamente.');
    }
  };

  const fetchTemperatureData = async () => {
    if (!startDate || !endDate || !selectedDevice) {
      setError('Por favor, seleccione un dispositivo y un rango de fechas.');
      return;
    }

    try {
      setLoading(true);
      const startFormatted = moment(startDate).format('YYYY-MM-DD');
      const endFormatted = moment(endDate).format('YYYY-MM-DD');
      console.log('Fetching data for dates:', startFormatted, endFormatted, 'and device:', selectedDevice);
      const response = await axios.get('/api1/temperature-range-data', {
        params: { startDate: startFormatted, endDate: endFormatted, deviceId: selectedDevice }
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

  const handleStartDateChange = (date) => {
    setStartDate(date);
  };

  const handleEndDateChange = (date) => {
    setEndDate(date);
  };

  const handleDeviceChange = (event) => {
    setSelectedDevice(event.target.value);
  };

  const generateCSV = (deviceData) => {
    const headers = "Device Name,Timestamp,External Temperature\n";
    const rows = deviceData.data.map(item => 
      `"${deviceData.name}",${item.timestamp},${item.external_temperature}`
    ).join("\n");
    return headers + rows;
  };

  const handleDownload = (channelId, deviceName) => {
    const deviceData = data.find(item => item.channel_id === channelId);
    if (deviceData) {
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
    }
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        type: 'time',
        time: {
          unit: 'hour',
          stepSize: 3,
          displayFormats: {
            hour: 'dd/MM/yyyy HH:mm'
          }
        },
        adapters: {
          date: {
            locale: es,
          },
        },
        title: {
          display: true,
          text: 'Fecha y Hora'
        }
      },
      y: {
        title: {
          display: true,
          text: 'Temperatura Externa (°C)'
        },
        ticks: {
          callback: function(value) {
            return value.toFixed(1);
          }
        }
      }
    },
    plugins: {
      legend: {
        position: 'top',
      },
      tooltip: {
        mode: 'index',
        intersect: false,
        callbacks: {
          title: function(tooltipItems) {
            return moment(tooltipItems[0].parsed.x).format('DD/MM/YYYY HH:mm:ss');
          },
          label: function(context) {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            if (context.parsed.y !== null) {
              label += context.parsed.y.toFixed(2) + '°C';
            }
            return label;
          }
        }
      }
    }
  };

  return (
    <div className="inteligencia-datos-temperatura">
      <Header />
      <div className="content">
        <h1>Inteligencia de Datos de Temperatura</h1>
        <div className="controls">
          <select 
            value={selectedDevice} 
            onChange={handleDeviceChange}
            className="device-select"
          >
            <option value="">Seleccione un dispositivo</option>
            {devices.map(device => (
              <option key={device.channel_id} value={device.channel_id}>
                {device.name}
              </option>
            ))}
          </select>
          <div className="date-pickers">
            <DatePicker 
              selected={startDate} 
              onChange={handleStartDateChange} 
              selectsStart
              startDate={startDate}
              endDate={endDate}
              dateFormat="dd-MM-yyyy"
              placeholderText="Fecha de inicio"
              className="date-picker"
              locale="es"
            />
            <DatePicker 
              selected={endDate} 
              onChange={handleEndDateChange} 
              selectsEnd
              startDate={startDate}
              endDate={endDate}
              minDate={startDate}
              dateFormat="dd-MM-yyyy"
              placeholderText="Fecha de fin"
              className="date-picker"
              locale="es"
            />
          </div>
          <button onClick={fetchTemperatureData} className="fetch-btn">
            Buscar Datos
          </button>
        </div>
        {error && <div className="error-message">{error}</div>}
        {loading && <div>Cargando datos...</div>}
        {!loading && data.length > 0 && (
          <div className="charts-grid">
            {data.map((deviceData, index) => {
              const chartData = {
                labels: deviceData.data.map(item => new Date(item.timestamp)),
                datasets: [
                  {
                    label: deviceData.name,
                    data: deviceData.data.map(item => ({
                      x: new Date(item.timestamp),
                      y: item.external_temperature
                    })),
                    fill: false,
                    borderColor: LINE_COLORS[index % LINE_COLORS.length],
                    tension: 0.1
                  }
                ]
              };

              return (
                <div key={deviceData.channel_id} className="chart-container">
                  <h3>
                    Cámara de Frío: <span style={{ color: LINE_COLORS[index % LINE_COLORS.length] }}>{deviceData.name}</span>
                  </h3>
                  <div className="chart-wrapper">
                    <Line data={chartData} options={chartOptions} />
                  </div>
                  <button onClick={() => handleDownload(deviceData.channel_id, deviceData.name)} className="download-button">
                    Descarga de Datos
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default IntelligenciaDatosTemperatura;