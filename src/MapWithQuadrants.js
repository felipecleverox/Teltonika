import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './MapWithQuadrants.css';
import planoBase from './assets/images/plano_super.jpg';
import personal3Icon from './assets/images/Personal 3.png';
import Header from './Header';

const MapWithQuadrants = ({ selectedDeviceAsignado }) => {  // Asegúrate de pasar selectedDeviceAsignado como prop
  const [activeBeacons, setActiveBeacons] = useState([]);
  const [beaconLogs, setBeaconLogs] = useState({});
  const [config, setConfig] = useState({});
  const [configuracion, setUmbrales] = useState({});
  const [sectors, setSectors] = useState([]);
  const [noData, setNoData] = useState(false);
  const [devices, setDevices] = useState([]);  // Estado para almacenar la lista de dispositivos

  useEffect(() => {
    const fetchSectors = async () => {
      try {
        const response = await axios.get('/api/sectores');
        setSectors(response.data);
      } catch (error) {
        console.error('Error fetching sectors:', error);
      }
    };

    const fetchConfiguration = async () => {
      try {
        const response = await axios.get('/api/configuracion');
        const data = response.data.reduce((acc, cur) => {
          acc[cur.beacon_id] = {
            minTiempoPermanencia: cur.min_tiempo_permanencia,
            maxTiempoPermanencia: cur.max_tiempo_permanencia,
          };
          return acc;
        }, {});
        setConfig(data);
      } catch (error) {
        console.error('Error fetching configuration:', error);
      }
    };

    const fetchThresholds = async () => {
      try {
        const response = await axios.get('/api/umbrales');
        setUmbrales(response.data);
      } catch (error) {
        console.error('Error fetching thresholds:', error);
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
        } else {
          setNoData(true);
        }
      } catch (error) {
        console.error('Failed to fetch active beacons:', error);
        setNoData(true);
      }
    };

    const fetchDataForDevice = async (deviceId) => {
      try {
        const response = await axios.get('/api/get-gps-data', {
          params: { device_id: deviceId, startDate: '2024-06-14T09:00:00', endDate: '2024-06-14T10:00:00' }
        });
        const data = response.data;
        if (data.length === 0) {
          setNoData(true);
        } else {
          setNoData(false);
        }
      } catch (error) {
        if (error.response && error.response.status === 404) {
          setNoData(true);
        } else {
          console.error('Failed to fetch data for device:', error);
        }
      }
    };

    const fetchDevices = async () => {
      try {
        const response = await axios.get('/api/devices');
        setDevices(response.data);
      } catch (error) {
        console.error('Error fetching devices:', error);
      }
    };

    const handleDeviceSearch = async (deviceAsignado) => {
      const device = devices.find(d => d.device_asignado === deviceAsignado);
      if (device) {
        await fetchDataForDevice(device.id);
      } else {
        setNoData(true);
      }
    };

    fetchSectors();
    fetchConfiguration();
    fetchThresholds();
    fetchActiveBeacons();
    fetchDevices();  // Obtener la lista de dispositivos
    if (selectedDeviceAsignado) {
      handleDeviceSearch(selectedDeviceAsignado);  // Buscar el device_id basado en el device_asignado seleccionado
    }
    const intervalId = setInterval(fetchActiveBeacons, 20000);

    return () => clearInterval(intervalId);
  }, [selectedDeviceAsignado, devices]);  // Dependencias para asegurar que se actualice cuando los dispositivos estén disponibles y cuando el dispositivo asignado seleccionado cambie

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
        return { bottom: '10%', right: '72%', width: '2%' };
      case 'F7826DA6-BC5B-71E0-893E-6D424369696F':
        return { bottom: '41%', right: '28%' };
      case 'F7826DA6-BC5B-71E0-893E-54654370696F':
        return { bottom: '68%', right: '30%' };
      default:
        return {};
    }
  };

  const calculatePermanence = (timestamp, sector) => {
    const now = new Date();
    const start = new Date(timestamp);
    const duration = Math.floor((now - start) / (1000 * 60)); // Duración en minutos

    console.log(`Permanence in sector ${sector}: ${duration} minutes`);  // Log permanence in terminal

    const hours = Math.floor(duration / 60);
    const minutes = duration % 60;

    return `${hours}h ${minutes}m`;
  };

  const getSemaphoreClass = (beaconId, timestamp) => {
    const now = new Date();
    const start = new Date(timestamp);
    const duration = (now - start) / (1000 * 60); // Duración en minutos

    if (duration <= configuracion.umbral_verde) {
      return 'green';
    } else if (duration > configuracion.umbral_verde && duration <= configuracion.umbral_amarillo) {
      return 'yellow';
    } else if (duration > configuracion.umbral_amarillo) {
      return 'red';
    }

    return '';
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
                <th>Estado</th> {/* Nueva columna para el semáforo */}
              </tr>
            </thead>
            <tbody>
              {activeBeacons.map(beaconId => (
                <tr key={beaconId}>
                  <td><img src={personal3Icon} alt="Personal 3" style={{ width: '10px' }} /></td>
                  <td>{getSector(beaconId)}</td>
                  <td>{beaconLogs[beaconId] ? new Date(beaconLogs[beaconId].timestamp).toLocaleString([], { hour: '2-digit', minute: '2-digit' }) : 'N/A'}</td>
                  <td>{beaconLogs[beaconId] ? calculatePermanence(beaconLogs[beaconId].timestamp, getSector(beaconId)) : 'N/A'}</td>
                  <td className={beaconLogs[beaconId] ? getSemaphoreClass(beaconId, beaconLogs[beaconId].timestamp) : ''}>
                    {beaconLogs[beaconId] ? getSemaphoreClass(beaconId, beaconLogs[beaconId].timestamp).replace('green', 'On Time').replace('yellow', 'Over Time').replace('red', 'Past Deadline') : 'N/A'}
                  </td>
                </tr>
              ))}
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
