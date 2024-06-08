// Presencia.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import './Presencia.css';
import Header from './Header';
import dayjs from 'dayjs';

const Presencia = () => {
  const [data, setData] = useState([]);
  const [beacons, setBeacons] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date());

  useEffect(() => {
    console.log('Fetching beacon data...');
    // Obtener datos de beacons
    axios.get('http://localhost:3000/api/beacons')
      .then(response => {
        console.log('Beacons data:', response.data);
        setBeacons(response.data);
      })
      .catch(error => {
        console.error('Error fetching beacons:', error);
      });

    // Obtener estados de beacons para el día seleccionado
    fetchDataForSelectedDate(selectedDate);
  }, [selectedDate]);

  const fetchDataForSelectedDate = (date) => {
    const startDate = dayjs(date).set('hour', 8).set('minute', 0).set('second', 0).format('YYYY-MM-DD HH:mm:ss');
    const endDate = dayjs(date).set('hour', 23).set('minute', 0).set('second', 0).format('YYYY-MM-DD HH:mm:ss');

    console.log(`Fetching data for date range: ${startDate} - ${endDate}`);

    axios.get('http://localhost:3000/api/beacons-detection-status', {
      params: {
        startDate: startDate,
        endDate: endDate
      }
    })
    .then(response => {
      console.log('Beacon detection status data:', response.data);
      setData(response.data);
    })
    .catch(error => {
      console.error('Error fetching beacons detection status:', error);
    });
  };

  const handleDateChange = (date) => {
    console.log('Date selected:', date);
    setSelectedDate(date);
  };

  // Función para obtener la ubicación por el beacon ID
  const getUbicacionById = (id) => {
    const beacon = beacons.find(beacon => beacon.id === id);
    return beacon ? beacon.ubicacion : 'Unknown';
  };

  // Función para obtener la clase de color basado en el estado
  const getColorClass = (status) => {
    switch (status) {
      case 'Verde':
        return 'green';
      case 'Rojo':
        return 'red';
      case 'Amarillo':
        return 'yellow';
      case 'Negro':
        return 'black';
      default:
        return 'transparent';
    }
  };

  return (
    <div className="presencia">
      <Header />
      <h1>Status de Presencia</h1>
      <DatePicker 
        selected={selectedDate} 
        onChange={handleDateChange} 
        dateFormat="yyyy-MM-dd"
        className="date-picker"
      />
      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th className="col-sector">Sector</th>
              {data.length > 0 && data.map((entry, index) => (
                <th key={index} className="col-width">
                  <span className="rotate">{new Date(entry.status_timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {beacons.map(beacon => (
              <tr key={beacon.id}>
                <td>{getUbicacionById(beacon.id)}</td>
                {data.map((entry, index) => (
                  <td key={index}>
                    <div className="status-bar-wrapper">
                      <div
                        className={`status-bar ${getColorClass(entry[`Sector_${beacon.lugar.split(' ')[1]}`])}`}
                      ></div>
                      <div className="tooltip">
                        <span className="tooltiptext">{entry.status_timestamp}</span>
                      </div>
                    </div>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="color-legend">
        <div><span className="color-box black"></span> No hubo presencia</div>
        <div><span className="color-box red"></span> Presencia menor al esperado</div>
        <div><span className="color-box yellow"></span> Presencia baja</div>
        <div><span className="color-box green"></span> Presencia OK</div>
      </div>
    </div>
  );
};

export default Presencia;
