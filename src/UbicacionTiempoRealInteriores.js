import React, { useState, useEffect, useCallback } from 'react';
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
  const [umbrales, setUmbrales] = useState(null);
  const [currentTime, setCurrentTime] = useState(moment());

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [mapInfo, sectorInfo, umbralesInfo] = await Promise.all([
        axios.get('/api/retrive_MapWithQuadrants_information'),
        axios.get('/api/latest-sectors'),
        axios.get('/api/umbrales')
      ]);
      
      setPersonal(mapInfo.data.personal);
      setSectors(mapInfo.data.sectors);
      setDevices(mapInfo.data.devices);
      setUmbrales(umbralesInfo.data);
      
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

  // Función para obtener la clase del semáforo
  const getSemaphoreClass = useCallback((beacon_id, timestamp) => {
    if (!timestamp || !umbrales) return '';
    const start = moment(timestamp, 'YYYY-MM-DD HH:mm:ss');
    const duration = moment.duration(currentTime.diff(start)).asMinutes();
    const { umbral_verde, umbral_amarillo } = umbrales;
    if (duration <= umbral_verde) {
      return 'green';
    } else if (duration > umbral_verde && duration <= umbral_amarillo) {
      return 'yellow';
    } else if (duration > umbral_amarillo) {
      return 'red';
    }
    return '';
  }, [umbrales, currentTime]);

  // Función para obtener el texto del semáforo
  const getSemaphoreText = (semaphoreClass) => {
    const texts = {
      green: 'On Time',
      yellow: 'Over Time',
      red: 'Past Deadline',
      '': 'N/A'
    };
    return texts[semaphoreClass];
  };

  return (
    <div className="ubicacion-tiempo-real-interiores">
      <Header title="Ubicación Tiempo Real Interiores" />
      <button onClick={handleRefresh} className="refresh-button">Actualizar Datos</button>
      <table className="personnel-table">
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
            const semaphoreClass = getSemaphoreClass(sectorInfo.beacon_id, sectorInfo.timestamp);
            const semaphoreText = getSemaphoreText(semaphoreClass);
            return (
              <tr key={persona.id_personal}>
                <td>
                  <img 
                    src={getPersonalIcon(persona.imagen_asignado)}
                    alt={persona.Nombre_Personal} 
                    className="personal-image"
                  />
                </td>
                <td>{persona.Nombre_Personal}</td>
                <td>{sectorInfo.sector || 'Cargando...'}</td>
                <td>{horaEntrada}</td>
                <td>{permanencia}</td>
                <td><span className={`semaphore ${semaphoreClass}`}>{semaphoreText}</span></td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default UbicacionTiempoRealInteriores;