// UbicacionTiempoRealInteriores.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Header from './Header';
import './UbicacionTiempoRealInteriores.css';

// Import images statically
import personal1Image from './assets/images/Personal 1.png';
import personal2Image from './assets/images/Personal 2.png';
import personal3Image from './assets/images/Personal 3.png';
import defaultImage from './assets/images/default.png';

// Create a mapping of image filenames to imports
const imageMap = {
  'Personal 1.png': personal1Image,
  'Personal 2.png': personal2Image,
  'Personal 3.png': personal3Image,
  'default.png': defaultImage,
};

const UbicacionTiempoRealInteriores = () => {
  const [personnel, setPersonnel] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPersonnel = async () => {
      try {
        const response = await axios.get('/api/retrive_MapWithQuadrants_information');
        setPersonnel(response.data.personal);
      } catch (error) {
        console.error('Error fetching personnel data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchPersonnel();
  }, []);

  return (
    <div className="ubicacion-tiempo-real-interiores">
      <Header title="Ubicación en Tiempo Real Interiores" />
      {loading ? (
        <p>Loading...</p>
      ) : (
        <table className="personnel-table">
          <thead>
            <tr>
              <th>Personal</th>
              <th>Dispositivo Asignado</th>
              <th>Nombre Personal</th>
              <th>Sector</th>
              <th>Desde Detección</th>
              <th>Permanencia</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            {personnel.map(person => (
              <tr key={person.id_personal}>
                <td>
                  <img 
                    src={imageMap[person.imagen_asignado] || imageMap['default.png']} 
                    alt={person.Nombre_Personal} 
                    className="personal-image" 
                  />
                </td>
                <td>{person.device_asignado_personal}</td>
                <td>{person.Nombre_Personal}</td>
                <td>Pending</td>
                <td>Pending</td>
                <td>Pending</td>
                <td>Pending</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default UbicacionTiempoRealInteriores;
