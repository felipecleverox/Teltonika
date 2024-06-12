// SmsData.js

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Header from './Header'; // Importar el componente Header

const SmsData = () => {
  const [smsData, setSmsData] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get('http://localhost:1337/api/sms-data');
        // Ordenar los datos en orden inverso
        const sortedData = response.data.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        setSmsData(sortedData);
      } catch (error) {
        console.error('Error fetching SMS data:', error);
      }
    };

    fetchData();
  }, []);

  // Función para formatear el timestamp a la hora local
  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
    const yyyy = localDate.getFullYear();
    const mm = String(localDate.getMonth() + 1).padStart(2, '0');
    const dd = String(localDate.getDate()).padStart(2, '0');
    const hh = String(localDate.getHours()).padStart(2, '0');
    const min = String(localDate.getMinutes()).padStart(2, '0');
    const ss = String(localDate.getSeconds()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd} ${hh}:${min}:${ss}`;
  };

  return (
    <div>
      <Header title="Base de Mensajes Recibidos" /> {/* Incluir el header aquí */}
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
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default SmsData;
