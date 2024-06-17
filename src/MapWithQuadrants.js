// MapWithQuadrants.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './MapWithQuadrants.css';
import planoBase from './assets/images/plano_super.jpg';
import personal3Icon from './assets/images/Personal 3.png';
import Header from './Header';

const MapWithQuadrants = ({ selectedDeviceAsignado }) => {
  
  const [activeBeacons, setActiveBeacons] = useState([]);
  const [beaconLogs, setBeaconLogs] = useState({});
  const [config, setConfig] = useState({});
  const [umbrales, setUmbrales] = useState({});
  const [sectors, setSectors] = useState([]);
  const [noData, setNoData] = useState(false);
  const [devices, setDevices] = useState([]);

  useEffect(() => {
    
    const fetchThresholds = (beaconID) => {
      // Utiliza los umbrales obtenidos de la respuesta combinada
      const thresholdData = umbrales[beaconID];
    
      if (thresholdData) {
        const parsedData = {
          ...thresholdData,
          umbral_verde: Number(thresholdData.umbral_verde),
          umbral_amarillo: Number(thresholdData.umbral_amarillo),
        };
        setUmbrales(parsedData);
        console.log('Umbrales actualizados:', parsedData);
      } else {
        console.error('Thresholds not found for beaconID:', beaconID);
      }
    };

    const fetchOldestBeaconDetections = async (activeBeaconId) => {
      try {
        const response = await axios.get('/api/oldest-active-beacon-detections', {
          params: { activeBeaconId }
        });
        const data = response.data;
        setBeaconLogs((logs) => ({ ...logs, [activeBeaconId]: data[activeBeaconId] }));
      } catch (error) {
        console.error('Failed to fetch oldest beacon detections:', error);
      }
    };

    const fetchActiveBeacons = async () => {
      try {
        const response = await axios.get('/api/active-beacons');
        const activeBeaconIds = response.data.activeBeaconIds || [];
        setActiveBeacons(activeBeaconIds);
        if (activeBeaconIds.length > 0) {
          activeBeaconIds.forEach(fetchOldestBeaconDetections);
          setNoData(false);
          return activeBeaconIds;
        } else {
          setNoData(true);
        }
      } catch (error) {
        console.error('Failed to fetch active beacons:', error);
        setNoData(true);
      }
    };

    const handleDeviceSearch = (deviceAsignado) => {
      const device = devices.find(d => d.device_asignado === deviceAsignado);
      if (device) {
        fetchDataForDevice(device.id);
      } else {
        setNoData(true);
      }
    };

    const fetchDataForDevice = async (deviceId) => {
      try {
        const response = await axios.get('/api/get-gps-data', {
          params: {
            device_id: deviceId
          }
        });
        // Línea modificada para manejar la nueva estructura de la respuesta
        if (response.data.data.length === 0) {
          setNoData(true);
        } else {
          setNoData(false);
        }
      } catch (error) {
        setNoData(true);
        console.error('Error fetching data for device:', error);
      }
    };

    const fetchData = async () => {
      try {
        const response = await axios.get('/api/retrive_MapWithQuadrants_information');
        const { sectors, configuration, thresholds, devices } = response.data;
    
        setSectors(sectors);
        setConfig(configuration);
        if (Object.keys(thresholds).length > 0) {
          setUmbrales(thresholds);
        }
        setDevices(devices);
    
        const activeBeaconIds = await fetchActiveBeacons();
        if (activeBeaconIds && activeBeaconIds.length > 0) {
          // Utiliza los umbrales obtenidos en lugar de hacer una nueva solicitud
          // fetchThresholds(activeBeaconIds[0]);
        }
    
        if (selectedDeviceAsignado) {
          handleDeviceSearch(selectedDeviceAsignado);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchData();
    const intervalId = setInterval(fetchActiveBeacons, 20000);

    return () => clearInterval(intervalId);
  }, [selectedDeviceAsignado, devices]);

  const getSector = (beaconId) => {
    const sector = sectors.find(sector => sector.id === beaconId);
    return sector ? sector.nombre : 'Unknown';
  };

  const getIconPosition = (beaconId) => {
    switch (beaconId) {
      case '0C403019-61C7-55AA-B7EA-DAC30C720055':
        return { bottom: '70%', right: '55%', width: '2%' };
      case 'E9EB8F18-61C7-55AA-9496-3AC30C720055':
        return { bottom: '25%', right: '55%', width: '2%' };
      case 'F7826DA6-BC5B-71E0-893E-4B484D67696F':
        return { bottom: '10%', right: '64%', width: '2%' };
      case 'F7826DA6-BC5B-71E0-893E-6D424369696F':
        return { bottom: '41%', right: '28%', width: '2%' };
      case 'F7826DA6-BC5B-71E0-893E-54654370696F':
        return { bottom: '68%', right: '30%', width: '2%' };
      default:
        return {};
    }
  };

  const calculatePermanence = (timestamp) => {
    const now = new Date();
    const start = new Date(timestamp);
    const duration = now - start;

    const hours = Math.floor(duration / (1000 * 60 * 60));
    const minutes = Math.floor((duration % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };

  const getSemaphoreClass = (beacon_id, timestamp) => {
    const now = new Date();
    const start = new Date(timestamp);
    const duration = (now - start) / (1000 * 60); // Duración en minutos
  
    // Buscar los umbrales específicos para el beacon_id
    const thresholdData = umbrales.find(threshold => threshold.beacon_id === beacon_id);
  
    if (thresholdData) {
      const { umbral_verde, umbral_amarillo } = thresholdData;
      if (duration <= umbral_verde) {
        return 'green';
      } else if (duration > umbral_verde && duration <= umbral_amarillo) {
        return 'yellow';
      } else if (duration > umbral_amarillo) {
        return 'red';
      }
    }
  
    return '';
  };

  const getSemaphoreText = (semaphoreClass) => {
    switch (semaphoreClass) {
      case 'green':
        return 'On Time';
      case 'yellow':
        return 'Over Time';
      case 'red':
        return 'Past Deadline';
      default:
        return 'N/A';
    }
  };

  return (
    <div className="map-with-quadrants">
      <Header title="Ubicaciones Interior Tiempo Real" />
      {noData ? (
        <p className="no-data-message">Sin datos para ese Dispositivo</p>
      ) : (
        <>
          <table className="beacon-logs-table">
            <thead>
              <tr>
                <th>Personal</th>
                <th>Sector</th>
                <th>Desde Detección</th>
                <th>Permanencia</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {activeBeacons.map(beaconId => {
                const semaphoreClass = beaconLogs[beaconId] ? getSemaphoreClass(beaconId, beaconLogs[beaconId].timestamp) : '';
                const semaphoreText = getSemaphoreText(semaphoreClass);
                return (
                  <tr key={beaconId}>
                    <td><img src={personal3Icon} alt="Personal 3" style={{ width: '10px' }} /></td>
                    <td>{getSector(beaconId)}</td>
                    <td>{beaconLogs[beaconId] ? new Date(beaconLogs[beaconId].timestamp).toLocaleString([], { hour: '2-digit', minute: '2-digit' }) : 'N/A'}</td>
                    <td>{beaconLogs[beaconId] ? calculatePermanence(beaconLogs[beaconId].timestamp) : 'N/A'}</td>
                    <td>
                      <span className={`semaphore ${semaphoreClass}`}>{semaphoreText}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <div className="plano-container" style={{ position: 'relative', width: '100%', height: 'auto' }}>
            <img src={planoBase} alt="Plano de la Oficina" className="plano-oficina" />
            {activeBeacons.map(beaconId => (
              <img 
                key={beaconId}
                src={personal3Icon} 
                alt="Personal 3" 
                className="personal-icon" 
                style={{ position: 'absolute', ...getIconPosition(beaconId) }} 
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default MapWithQuadrants;