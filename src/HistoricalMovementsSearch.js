import React, { useState, useEffect } from 'react';
import axios from 'axios';
import mapboxgl from 'mapbox-gl';
import './HistoricalMovementsSearch.css';
import markerIcon from './assets/images/pinazul.png';
import Header from './Header';

mapboxgl.accessToken = 'pk.eyJ1IjoidGhlbmV4dHNlY3VyaXR5IiwiYSI6ImNsd3YxdmhkeDBqZDgybHB2OTh4dmo3Z2EifQ.bpZlTBTa56pF4cPhE3aSzg';

const HistoricalMovementsSearch = () => {
  const [devices, setDevices] = useState([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState('');
  const [selectedDay, setSelectedDay] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [data, setData] = useState([]);
  const [map, setMap] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const fetchDevices = async () => {
      try {
        const result = await axios.get('/api/devices');
        setDevices(result.data);
      } catch (error) {
        console.error('Error fetching devices:', error);
      }
    };

    fetchDevices();
  }, []);

  const handleSubmit = async () => {
    try {
      const result = await axios.get('/api/historical-gps-data', {
        params: {
          device_id: selectedDeviceId,
          date: selectedDay,
          startHour: startTime,
          endHour: endTime,
        },
      });
      const validData = result.data.filter(d => d.latitude !== null && d.longitude !== null);
      setData(validData);
      if (validData.length > 0) {
        setErrorMessage('');
        plotRoute(validData);
      } else {
        setErrorMessage('Sin Datos para esa Búsqueda');
      }
    } catch (error) {
      console.error('Error fetching historical GPS data:', error);
      setErrorMessage('Error al buscar los datos GPS históricos');
    }
  };

  // ... (mantener el resto del código igual, incluyendo plotRoute y createCustomMarker)

  return (
    <div className="historical-movements-search">
      <Header title="Búsqueda Histórica Ubicación Exteriores" />
      <div className="search-container">
        <div className="device-selection">
          <select 
            value={selectedDeviceId} 
            onChange={(e) => setSelectedDeviceId(e.target.value)}
          >
            <option value="">Seleccionar Dispositivo...</option>
            {devices.map(device => (
              <option key={device.id} value={device.id}>{device.device_asignado}</option>
            ))}
          </select>
        </div>
        <div className="date-time-selection">
          <div className="date-input">
            <label>Seleccionar Día:</label>
            <input
              type="date"
              value={selectedDay}
              onChange={e => setSelectedDay(e.target.value)}
            />
          </div>
          <div className="time-inputs">
            <div className="time-input">
              <label>Hora Inicio:</label>
              <input
                type="time"
                value={startTime}
                onChange={e => setStartTime(e.target.value)}
              />
            </div>
            <div className="time-input">
              <label>Hora Fin:</label>
              <input
                type="time"
                value={endTime}
                onChange={e => setEndTime(e.target.value)}
              />
            </div>
          </div>
        </div>
        <button onClick={handleSubmit}>Buscar</button>
      </div>
      {errorMessage && <p className="error-message">{errorMessage}</p>}
      <div id="map" className="map"></div>
      {data.length > 0 && (
        <table className="search-results-table">
          <thead>
            <tr>
              <th>Hora</th>
              <th>Latitud</th>
              <th>Longitud</th>
            </tr>
          </thead>
          <tbody>
            {data.map((item, index) => (
              <tr key={index}>
                <td>{item.timestamp}</td>
                <td>{item.latitude}</td>
                <td>{item.longitude}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default HistoricalMovementsSearch;