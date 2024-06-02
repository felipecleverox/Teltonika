import 'mapbox-gl/dist/mapbox-gl.css';
import React, { useState, useEffect, useRef } from 'react';
import MapboxGL from 'mapbox-gl';
import axios from 'axios';
import Header from './Header'; // Assuming you have a Header component
import './LastKnownPosition.css'; // Your CSS file

MapboxGL.accessToken = 'pk.eyJ1IjoidGhlbmV4dHNlY3VyaXR5IiwiYSI6ImNsd3YxdmhkeDBqZDgybHB2OTh4dmo3Z2EifQ.bpZlTBTa56pF4cPhE3aSzg'; 

const defaultPosition = { lat: -33.4489, lng: -70.6693 };

function LastKnownPosition({ showHeader = true }) {
  const [devices, setDevices] = useState([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState('');
  const [positions, setPositions] = useState([]);
  const [selectedPosition, setSelectedPosition] = useState(null); // Estado para almacenar la posición seleccionada
  const [error, setError] = useState(null);
  const mapRef = useRef(null);

  useEffect(() => {
    const fetchDevices = async () => {
      try {
        const response = await axios.get('http://thenext.ddns.net:1337/api/devices');
        console.log('Fetched devices:', response.data);
        setDevices(response.data);
      } catch (error) {
        console.error('Error fetching devices:', error);
      }
    };

    fetchDevices();
  }, []);

  useEffect(() => {
    if (selectedDeviceId) {
      const fetchLastKnownPosition = async () => {
        setError(null); 
        try {
          console.log('Selected device_id:', selectedDeviceId); // Registro del device_id seleccionado
          const response = await axios.get('http://thenext.ddns.net:1337/api/last-known-position', {
            params: { device_id: selectedDeviceId }
          });

          if (response.data) {
            console.log('Response data:', response.data); // Registro de la respuesta del servidor
            setPositions(Array.isArray(response.data) ? response.data : [response.data]);
          } else {
            setPositions([]);
          }
        } catch (error) {
          if (error.response && error.response.status === 404) {
            console.log('Error: No data available');
            setError('No data available');
          } else {
            console.error('Failed to fetch last known position:', error);
            setError('Server Error');
          }
          setPositions([]);
        }
      };

      fetchLastKnownPosition();
      const intervalId = setInterval(fetchLastKnownPosition, 10000);
      return () => clearInterval(intervalId); 
    }
  }, [selectedDeviceId]);

  useEffect(() => {
    if (positions.length > 0 && mapRef.current) {
      positions.forEach(position => {
        const lat = parseFloat(position.latitude);
        const lng = parseFloat(position.longitude);

        if (isNaN(lat) || isNaN(lng)) {
          console.error('Invalid coordinates:', { lat, lng });
          return;
        }

        const marker = new MapboxGL.Marker({ draggable: false })
          .setLngLat([lng, lat])
          .addTo(mapRef.current);

        const formattedTime = new Date(position.unixTimestamp).toLocaleString('es-CL', { hour12: false });

        marker.setPopup(new MapboxGL.Popup().setHTML(
          `<strong>Time:</strong> ${formattedTime}<br/><strong>Lat:</strong> ${lat}<br/><strong>Lng:</strong> ${lng}`
        )).addTo(mapRef.current);

        marker.getElement().addEventListener('click', () => {
          setSelectedPosition({
            time: formattedTime,
            lat,
            lng
          });
        });
      });

      const firstPosition = positions[0];
      if (firstPosition) {
        const centerLat = parseFloat(firstPosition.latitude);
        const centerLng = parseFloat(firstPosition.longitude);

        if (!isNaN(centerLat) && !isNaN(centerLng)) {
          mapRef.current.setCenter([centerLng, centerLat]);
        }
      }
    }
  }, [positions]);

  useEffect(() => {
    if (!mapRef.current && positions.length > 0) {
      mapRef.current = new MapboxGL.Map({
        container: 'map',
        style: 'mapbox://styles/mapbox/streets-v11', 
        center: [defaultPosition.lng, defaultPosition.lat],
        zoom: 15,
      });
    }
  }, [positions]);

  return (
    <div>
      {showHeader && <Header title="Ubicación Exteriores Tiempo Real" />} 
      {error && <div className="error-message">Error: {error}</div>}

      <div className="device-selection-popup">
        <h3>Seleccionar Dispositivo</h3>
        <select onChange={(e) => {
          setSelectedDeviceId(e.target.value);
          setError(null); // Resetear mensaje de error al seleccionar un nuevo dispositivo
        }}>
          <option value="">Seleccionar...</option>
          {devices.map(device => (
            <option key={device.id} value={device.id}>{device.device_asignado}</option>
          ))}
          <option value="all">Mostrar Todos</option>
        </select>
      </div>

      <div id="map" className="map-container" style={{ marginTop: showHeader ? '150px' : '0px' }}></div>

      {selectedDeviceId && positions.length === 0 && !error && (
        <div className="no-data-message">Sin datos disponibles para el dispositivo seleccionado.</div>
      )}

      {selectedPosition && (
        <div className="last-known-info">
          <table className="info-table">
            <thead>
              <tr>
                <th>Información</th>
                <th>Valor</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Última Actualización</td>
                <td>{selectedPosition.time}</td>
              </tr>
              <tr>
                <td>Latitud</td>
                <td>{selectedPosition.lat.toFixed(6)}</td>
              </tr>
              <tr>
                <td>Longitud</td>
                <td>{selectedPosition.lng.toFixed(6)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default LastKnownPosition;
