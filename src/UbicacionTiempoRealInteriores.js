import React, { useState, useEffect } from 'react';
import axios from 'axios';
import moment from 'moment';
import './UbicacionTiempoRealInteriores.css';
import Header from './Header';

// Importa las imágenes
import personal1Icon from './assets/images/Personal 1.png';
import personal2Icon from './assets/images/Personal 2.png';
import personal3Icon from './assets/images/Personal 3.png';

const UbicacionTiempoRealInteriores = () => {
  const [personal, setPersonal] = useState([]);
  const [sectors, setSectors] = useState([]);
  const [devices, setDevices] = useState([]);
  const [latestSectors, setLatestSectors] = useState({});
  const [currentTime, setCurrentTime] = useState(moment());

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [mapInfo, sectorInfo] = await Promise.all([
        axios.get('/api/retrive_MapWithQuadrants_information'),
        axios.get('/api/latest-sectors')
      ]);
      
      setPersonal(mapInfo.data.personal);
      setSectors(mapInfo.data.sectors);
      setDevices(mapInfo.data.devices);
      
      const sectorMap = sectorInfo.data.reduce((acc, item) => {
        acc[item.device_id] = item;
        return acc;
      }, {});
      setLatestSectors(sectorMap);
      setCurrentTime(moment());
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const handleRefresh = () => {
    fetchData();
  };

  // Función para obtener la imagen correspondiente
  const getPersonalIcon = (imageName) => {
    switch(imageName) {
      case 'Personal 1.png':
        return personal1Icon;
      case 'Personal 2.png':
        return personal2Icon;
      case 'Personal 3.png':
        return personal3Icon;
      default:
        return null;
    }
  };

  // Función para calcular el tiempo de permanencia
  const calculatePermanencia = (timestamp) => {
    if (!timestamp) return '-';
    const oldestTime = moment(timestamp, 'YYYY-MM-DD HH:mm:ss');
    const duration = moment.duration(currentTime.diff(oldestTime));
    return `${duration.hours().toString().padStart(2, '0')}:${duration.minutes().toString().padStart(2, '0')}`;
  };

  return (
    <div className="ubicacion-tiempo-real-interiores">
      <Header title="Ubicación Tiempo Real Interiores" />
      <button onClick={handleRefresh} className="refresh-button">Actualizar Datos</button>
      <table>
        <thead>
          <tr>
            <th>Personal</th>
            <th>Nombre</th>
            <th>Sector</th>
            <th>Hora Entrada</th>
            <th>Permanencia</th>
            <th>Estado</th>
          </tr>
        </thead>
        <tbody>
          {personal.map((persona) => {
            const sectorInfo = latestSectors[persona.id_dispositivo_asignado] || {};
            const horaEntrada = sectorInfo.timestamp ? moment(sectorInfo.timestamp, 'YYYY-MM-DD HH:mm:ss').format('HH:mm') : '-';
            const permanencia = calculatePermanencia(sectorInfo.timestamp);
            return (
              <tr key={persona.id_personal}>
                <td>
                  <img 
                    src={getPersonalIcon(persona.imagen_asignado)}
                    alt={persona.Nombre_Personal} 
                    className="personal-icon"
                  />
                </td>
                <td>{persona.Nombre_Personal}</td>
                <td>{sectorInfo.sector || 'Cargando...'}</td>
                <td>{horaEntrada}</td>
                <td>{permanencia}</td>
                <td>-</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default UbicacionTiempoRealInteriores;