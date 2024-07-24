import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import moment from 'moment';
import './UbicacionTiempoRealInteriores.css';
import Header from './Header';
import planoBase from './assets/images/storage_mapa.jpg';
import { obtenerEquivalenciaSector } from './utils/sectorEquivalencias';
import { obtenerEquivalenciaImagen } from './utils/imagenEquivalencias';

const UbicacionTiempoRealInteriores = () => {
  const [personal, setPersonal] = useState([]);
  const [sectors, setSectors] = useState([]);
  const [devices, setDevices] = useState([]);
  const [latestSectors, setLatestSectors] = useState({});
  const [umbrales, setUmbrales] = useState(null);
  const [currentTime, setCurrentTime] = useState(moment());
  const [activeBeacons, setActiveBeacons] = useState([]);

  useEffect(() => {
    fetchData();
    fetchActiveBeacons();
  }, []);

  const fetchData = async () => {
    try {
      const [mapInfo, sectorInfo, umbralesInfo] = await Promise.all([
        axios.get('/api/retrive_MapWithQuadrants_information', { withCredentials: true }),
        axios.get('/api/latest-sectors', { withCredentials: true }),
        axios.get('/api/umbrales', { withCredentials: true })
      ]);

      console.log('Map Info:', mapInfo.data);
      console.log('Sector Info:', sectorInfo.data);
      console.log('Umbrales Info:', umbralesInfo.data);
      
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

  const fetchActiveBeacons = async () => {
    try {
      const response = await axios.get('/api/active-beacons', { withCredentials: true });
      const activeBeaconIds = response.data.activeBeaconIds || [];
      console.log('Active Beacons:', activeBeaconIds);
      setActiveBeacons(activeBeaconIds);
    } catch (error) {
      console.error('Failed to fetch active beacons:', error);
    }
  };

  const handleRefresh = () => {
    fetchData();
    fetchActiveBeacons();
  };

  const getPersonalIcon = (imageName) => {
    return obtenerEquivalenciaImagen(imageName);
  };

  const calculatePermanencia = (timestamp) => {
    if (!timestamp) return '-';
    const oldestTime = moment(timestamp, 'YYYY-MM-DD HH:mm:ss');
    const duration = moment.duration(currentTime.diff(oldestTime));
    return `${duration.hours().toString().padStart(2, '0')}:${duration.minutes().toString().padStart(2, '0')}`;
  };

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

  const getSemaphoreText = (semaphoreClass) => {
    const texts = {
      green: 'On Time',
      yellow: 'Over Time',
      red: 'Past Deadline',
      '': 'N/A'
    };
    return texts[semaphoreClass];
  };

  const sectorPositions = {
    'Frio 1': { bottom: '78%', right: '58%', width: '2%' },
    'Maquila 1': { bottom: '65%', right: '45%', width: '4%' },
    'Entrada Principal': { bottom: '3%', right: '40%', width: '4%' },
    'Bodega 7': { bottom: '43%', right: '55%', width: '4%' },
    'Bodega 15': { bottom: '29%', right: '55%', width: '4%' }
  };

  const getSectorPosition = (sectorName, index) => {
    const basePosition = sectorPositions[sectorName] || { bottom: '0%', right: '0%', width: '2%' };
    const offset = 5 * index;
    return {
      ...basePosition,
      bottom: `calc(${basePosition.bottom} - ${offset}px)`,
      right: `calc(${basePosition.right} - ${offset}px)`
    };
  };

  const renderPersonnelIcons = () => {
    const sectorCounts = {};

    return personal.map((persona, index) => {
      const sectorInfo = latestSectors[persona.id_dispositivo_asignado] || {};
      const sectorName = obtenerEquivalenciaSector(sectorInfo.sector);
      if (!sectorCounts[sectorName]) {
        sectorCounts[sectorName] = 0;
      }
      const sectorPosition = getSectorPosition(sectorName, sectorCounts[sectorName]);
      sectorCounts[sectorName] += 1;
      console.log('Rendering persona:', persona.Nombre_Personal, 'Sector:', sectorName, 'Position:', sectorPosition);
      return (
        <img
          key={persona.id_personal}
          src={getPersonalIcon(persona.imagen_asignado)}
          alt={persona.Nombre_Personal}
          className="personal-icon"
          style={{ position: 'absolute', ...sectorPosition }}
        />
      );
    });
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
            <th>Permanencia (hh:mm)</th>
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
                <td>{obtenerEquivalenciaSector(sectorInfo.sector) || 'Cargando...'}</td>
                <td>{horaEntrada}</td>
                <td>{permanencia}</td>
                <td><span className={`semaphore ${semaphoreClass}`}>{semaphoreText}</span></td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <div className="plano-container" style={{ position: 'relative', width: '100%', height: 'auto' }}>
        <img src={planoBase} alt="Plano de la Oficina" className="plano-oficina" />
        {renderPersonnelIcons()}
      </div>
    </div>
  );
};

export default UbicacionTiempoRealInteriores;