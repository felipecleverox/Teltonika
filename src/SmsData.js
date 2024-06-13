// SmsData.js

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import moment from 'moment-timezone';
import Header from './Header';
import pinIcon from './assets/images/pngkit.png'; // Importar la imagen del ícono
import MapModal from './MapModal'; // Importar el componente MapModal

const SmsData = () => {
  const [smsData, setSmsData] = useState([]);
  const [selectedPosition, setSelectedPosition] = useState(null); // Estado para almacenar la posición seleccionada
  const [isModalOpen, setIsModalOpen] = useState(false); // Estado para controlar la apertura del modal

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get('http://thenext.ddns.net:1337/api/sms-data');
        const sortedData = response.data.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        setSmsData(sortedData);
      } catch (error) {
        console.error('Error fetching SMS data:', error);
      }
    };

    fetchData();
  }, []);

  const formatTimestamp = (timestamp) => {
    return moment(timestamp).tz('America/Santiago').format('YYYY-MM-DD HH:mm:ss');
  };

  const handleIconClick = (latitud, longitud) => {
    setSelectedPosition({ latitud, longitud });
    setIsModalOpen(true);
  };

  return (
    <div>
      <Header title="Base de Mensajes Recibidos" />
      <div className="content">
        <h1>SMS Data</h1>
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Device ID</th>
              <th>Sector</th>
              <th>Latitud</th>
              <th>Longitud</th>
              <th>Timestamp</th>
              <th>Mapa</th> {/* Columna para el ícono del mapa */}
            </tr>
          </thead>
          <tbody>
            {smsData.map((sms) => (
              <tr key={sms.id}>
                <td>{sms.id}</td>
                <td>{sms.device_id}</td>
                <td>{sms.sector}</td>
                <td>{sms.latitud}</td>
                <td>{sms.longitud}</td>
                <td>{formatTimestamp(sms.timestamp)}</td>
                <td>
                  <img
                    src={pinIcon}
                    alt="Mapa"
                    style={{ cursor: 'pointer', width: '14px', height: '24px' }} // Ajustar el tamaño del ícono
                    onClick={() => handleIconClick(sms.latitud, sms.longitud)}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {isModalOpen && selectedPosition && (
          <MapModal
            latitud={selectedPosition.latitud}
            longitud={selectedPosition.longitud}
            onClose={() => setIsModalOpen(false)}
          />
        )}
      </div>
    </div>
  );
};

export default SmsData;
