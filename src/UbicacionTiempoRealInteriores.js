import React, { useState, useEffect, useCallback } from 'react';
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


// Función auxiliar para obtener el nombre del sector basado en el ID del beacon
const getSectorName = (beaconId) => {
  switch (beaconId) {
    case '0C403019-61C7-55AA-B7EA-DAC30C720055':
      return 'E/S Bodega';
    case 'E9EB8F18-61C7-55AA-9496-3AC30C720055':
      return 'Farmacia';
    case 'F7826DA6-BC5B-71E0-893E-4B484D67696F':
      return 'Entrada';
    case 'F7826DA6-BC5B-71E0-893E-6D424369696F':
      return 'Pasillo Central';
    case 'F7826DA6-BC5B-71E0-893E-54654370696F':
      return 'Electro';
    default:
      return 'Desconocido';
  }
};

const UbicacionTiempoRealInteriores = () => {
    const [personnel, setPersonnel] = useState([]);
    const [loading, setLoading] = useState(true);
    const [beaconLogs, setBeaconLogs] = useState({});
  
    const fetchPersonnel = async () => {
      setLoading(true);
      try {
        const response = await axios.get('/api/retrive_MapWithQuadrants_information');
        const personnelData = response.data.personal;
  
        // Fetch the most recent GPS data for each device
        const fetchSectorData = async (device) => {
          try {
            const gpsResponse = await axios.get('/api/get-latest-gps-data', { params: { device_name: device.id_dispositivo_asignado } });
            if (gpsResponse.data.data.length > 0) {
              const latestData = gpsResponse.data.data[0];
              const beacons = JSON.parse(latestData.ble_beacons || '[]');
              const latestTimestamp = latestData.timestamp * 1000;
              const currentDay = new Date().setHours(0, 0, 0, 0);
              const dataDay = new Date(latestTimestamp).setHours(0, 0, 0, 0);
  
              if (beacons.length > 0) {
                const sector = getSectorName(beacons[0].id);
                return {
                  ...device,
                  sector,
                  latestBeaconId: beacons[0].id,
                  latestTimestamp,
                  isCurrentDay: currentDay === dataDay,
                };
              }
            }
            return {
              ...device,
              sector: 'Sin datos para este día',
              latestBeaconId: null,
              latestTimestamp: null,
              isCurrentDay: false,
            };
          } catch (error) {
            console.error('Error fetching GPS data:', error);
            return { ...device, sector: 'Error', latestBeaconId: null, latestTimestamp: null, isCurrentDay: false };
          }
        };
  
        // Wait for all sector data to be fetched
        const updatedPersonnel = await Promise.all(personnelData.map(fetchSectorData));
  
        setPersonnel(updatedPersonnel);
      } catch (error) {
        console.error('Error fetching personnel data:', error);
      } finally {
        setLoading(false);
      }
    };
  
    const fetchOldestBeaconDetections = useCallback(async (activeBeaconId) => {
      try {
        const response = await axios.get('/api/oldest-active-beacon-detections', { params: { activeBeaconId } });
        return { [activeBeaconId]: response.data[activeBeaconId] };
      } catch (error) {
        console.error('Failed to fetch oldest beacon detections:', error);
        return { [activeBeaconId]: null };
      }
    }, []);
  
    const fetchActiveBeacons = useCallback(async () => {
      try {
        const response = await axios.get('/api/active-beacons');
        const activeBeaconIds = response.data.activeBeaconIds || [];
        if (activeBeaconIds.length > 0) {
          const beaconLogsData = await Promise.all(activeBeaconIds.map(fetchOldestBeaconDetections));
          setBeaconLogs(beaconLogsData.reduce((acc, data, idx) => {
            acc[activeBeaconIds[idx]] = data[activeBeaconIds[idx]];
            return acc;
          }, {}));
        }
      } catch (error) {
        console.error('Failed to fetch active beacons:', error);
      }
    }, [fetchOldestBeaconDetections]);
  
    useEffect(() => {
      fetchPersonnel();
      fetchActiveBeacons();
    }, [fetchActiveBeacons]);
  
    const getFormattedTimestamp = (timestamp) => {
      if (!timestamp) return 'N/A';
      const date = new Date(timestamp);
      return date.toLocaleString([], { hour: '2-digit', minute: '2-digit' });
    };
  
    const getDeviceTimestamp = (deviceName) => {
      const device = personnel.find(person => person.id_dispositivo_asignado === deviceName);
      const latestBeaconId = device?.latestBeaconId;
      if (device?.isCurrentDay) {
        if (latestBeaconId && beaconLogs[latestBeaconId]) {
          return getFormattedTimestamp(beaconLogs[latestBeaconId].timestamp);
        }
        return 'N/A';
      }
      return 'Sin datos para este día';
    };
  
    return (
      <div className="ubicacion-tiempo-real-interiores">
        <Header title="Ubicación en Tiempo Real Interiores" />
        {loading ? (
          <p>Loading...</p>
        ) : (
          <>
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
                    <td>{person.sector}</td>
                    <td>{getDeviceTimestamp(person.id_dispositivo_asignado)}</td>
                    <td>Pending</td>
                    <td>Pending</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <button onClick={fetchPersonnel} className="refresh-button">Refresh</button>
          </>
        )}
      </div>
    );
  };
  
  export default UbicacionTiempoRealInteriores;