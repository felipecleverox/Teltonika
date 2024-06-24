import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import moment from 'moment-timezone';
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

  const fetchPersonnel = async () => {
    console.log('Iniciando fetchPersonnel');
    setLoading(true);
    try {
      const response = await axios.get('/api/retrive_MapWithQuadrants_information');
      console.log('Datos de personal recibidos:', response.data.personal);
      const personnelData = response.data.personal;

      // Fetch the most recent GPS data for each device
      const fetchSectorData = async (device) => {
        console.log(`Buscando datos para el dispositivo: ${device.id_dispositivo_asignado}`);
        try {
          const startOfDay = moment().startOf('day').unix();
          const endOfDay = moment().endOf('day').unix();
          
          const gpsResponse = await axios.get('/api/get-latest-gps-data', { 
            params: { 
              device_name: device.id_dispositivo_asignado,
              startTime: startOfDay,
              endTime: endOfDay
            } 
          });
          
          console.log(`Respuesta GPS para ${device.id_dispositivo_asignado}:`, gpsResponse.data);

          if (gpsResponse.data.data.length > 0) {
            const latestData = gpsResponse.data.data[0];
            console.log(`Datos más recientes para ${device.id_dispositivo_asignado}:`, latestData);
            const beacons = JSON.parse(latestData.ble_beacons || '[]');
            const latestTimestamp = latestData.timestamp * 1000; // Convertir a milisegundos
            
            if (beacons.length > 0) {
              const sector = getSectorName(beacons[0].id);
              return {
                ...device,
                sector,
                latestBeaconId: beacons[0].id,
                latestTimestamp,
                isCurrentDay: true, // Si tenemos datos, es del día actual
              };
            }
          }
          console.log(`No se encontraron datos para ${device.id_dispositivo_asignado} en el día actual`);
          return {
            ...device,
            sector: 'Sin datos para este día',
            latestBeaconId: null,
            latestTimestamp: null,
            isCurrentDay: false,
          };
        } catch (error) {
          console.error(`Error al obtener datos para ${device.id_dispositivo_asignado}:`, error);
          return { ...device, sector: 'Error', latestBeaconId: null, latestTimestamp: null, isCurrentDay: false };
        }
      };

      // Wait for all sector data to be fetched
      const updatedPersonnel = await Promise.all(personnelData.map(fetchSectorData));
      console.log('Personal actualizado:', updatedPersonnel);

      setPersonnel(updatedPersonnel);
    } catch (error) {
      console.error('Error al obtener datos de personal:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    console.log('Iniciando fetchPersonnel');
    fetchPersonnel();
  }, []);

  useEffect(() => {
    console.log('Estado final de personnel:', personnel);
  }, [personnel]);

  const getDeviceTimestamp = (deviceName) => {
    console.log(`Obteniendo timestamp para dispositivo: ${deviceName}`);
    const device = personnel.find(person => person.id_dispositivo_asignado === deviceName);
    console.log(`Datos del dispositivo:`, device);

    if (device?.isCurrentDay) {
      if (device.latestTimestamp) {
        const formattedTime = moment(device.latestTimestamp).format('HH:mm');
        console.log(`Timestamp formateado: ${formattedTime}`);
        return formattedTime;
      }
      console.log('latestTimestamp no disponible');
      return 'N/A';
    }
    console.log('No es el día actual');
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