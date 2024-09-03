// IntelligenciaDatosTemperatura.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import moment from 'moment';
import './IntelligenciaDatosTemperatura.css';
import Header from './Header';
import descargadatostemp from './assets/images/descargadatostemp.png';

const IntelligenciaDatosTemperatura = () => {
  const [devices, setDevices] = useState([]);
  const [selectedDevice, setSelectedDevice] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [showDevices, setShowDevices] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchDevices();
  }, []);

  const fetchDevices = async () => {
    try {
      const response = await axios.get('/api/temperature-devices');
      setDevices(response.data);
    } catch (error) {
      console.error('Error fetching devices:', error);
    }
  };

  const handleDeviceSelect = (device) => {
    setSelectedDevice(device);
    setShowDevices(false);
  };

  const handleDownload = async () => {
    try {
      // Formatear las fechas para la consulta
      const formattedStartDate = moment(startDate).format('YYYY-MM-DD HH:mm:ss');
      const formattedEndDate = moment(endDate).format('YYYY-MM-DD HH:mm:ss');

      const response = await axios.get('/api/temperature-data-download', {
        params: { 
          deviceId: selectedDevice.channel_id, 
          startDate: formattedStartDate, 
          endDate: formattedEndDate 
        },
        responseType: 'blob',
      });

      // Procesar el CSV recibido
      const text = await response.data.text();
      const rows = text.split('\n');
      const headers = rows[0];
      const processedRows = rows.slice(1).map(row => {
        const [insercion, temperature] = row.split(',');
        const formattedInsercion = moment(insercion).format('YYYY-MM-DD HH:mm:ss');
        return `${formattedInsercion},${temperature}`;
      });

      const processedCsv = [headers, ...processedRows].join('\n');

      // Crear y descargar el archivo
      const blob = new Blob([processedCsv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `temperature_data_${selectedDevice.name}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error downloading data:', error);
    }
  };
  return (
    <div className="inteligencia-datos-temperatura">
      <Header title="Inteligencia de Datos Temperatura" image={descargadatostemp} />
      <div className="content">
        <button onClick={() => setShowDevices(true)} className="select-device-btn">
          Seleccionar Dispositivo
        </button>
        {showDevices && (
          <div className="device-popup">
            <div className="device-list">
              {devices.map((device) => (
                <div key={device.channel_id} onClick={() => handleDeviceSelect(device)} className="device-item">
                  {device.name}
                </div>
              ))}
            </div>
          </div>
        )}
        {selectedDevice && <p className="selected-device">Dispositivo seleccionado: {selectedDevice.name}</p>}
        <div className="date-inputs">
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="date-input"
          />
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="date-input"
          />
        </div>
        <button onClick={handleDownload} disabled={!selectedDevice || !startDate || !endDate} className="download-btn">
          Descargar Datos
        </button>
      </div>
    </div>
  );
};

export default IntelligenciaDatosTemperatura;