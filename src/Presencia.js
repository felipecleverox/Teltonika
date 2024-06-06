import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Presencia.css';

const Presencia = () => {
  const [data, setData] = useState([]);
  const [beacons, setBeacons] = useState([]);

  useEffect(() => {
    // Obtener datos de beacons
    axios.get('http://localhost:3000/api/beacons')
      .then(response => {
        console.log('Beacons data:', response.data);  // Agregar log para ver datos de beacons
        setBeacons(response.data);
      })
      .catch(error => {
        console.error('Error fetching beacons:', error);
      });

    // Obtener estados de beacons
    axios.get('http://localhost:3000/api/beacons-detection-status')
      .then(response => {
        console.log('Detection status data:', response.data);  // Agregar log para ver datos de estados
        setData(response.data);
      })
      .catch(error => {
        console.error('Error fetching beacons detection status:', error);
      });
  }, []);

  // Función para obtener la ubicación por el beacon ID
  const getUbicacionById = (id) => {
    const beacon = beacons.find(beacon => beacon.id === id);
    return beacon ? beacon.ubicacion : 'Unknown';
  };

  return (
    <div className="presencia">
      <h1>Status de Presencia</h1>
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Sector</th>
              {data.length > 0 && data.map((entry, index) => (
                <th key={index}>{new Date(entry.status_timestamp).toLocaleTimeString()}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {beacons.map(beacon => (
              <tr key={beacon.id}>
                <td>{getUbicacionById(beacon.id)}</td>
                {data.map((entry, index) => (
                  <td key={index} className={entry[`Sector_${beacon.lugar.split(' ')[1]}`]}>
                    <div className="tooltip">
                      {entry[`Sector_${beacon.lugar.split(' ')[1]}`]}
                      <span className="tooltiptext">{entry.status_timestamp}</span>
                    </div>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Presencia;
