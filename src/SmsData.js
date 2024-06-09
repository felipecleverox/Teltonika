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

  return (
    <div>
      <Header title="Base de Mesanjes Recibidos" /> {/* Incluir el header aquí */}
      <div className="content">
        <h1>SMS Data</h1>
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Device ID</th>
              <th>Message</th>
              <th>Timestamp</th>
            </tr>
          </thead>
          <tbody>
            {smsData.map((sms) => (
              <tr key={sms.id}>
                <td>{sms.id}</td>
                <td>{sms.device_id}</td>
                <td>{sms.message}</td>
                <td>{sms.timestamp}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default SmsData;
