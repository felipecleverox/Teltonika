import 'mapbox-gl/dist/mapbox-gl.css';
import React, { useState, useEffect, useRef } from 'react';
import MapboxGL from 'mapbox-gl';
import axios from 'axios';
import Header from './Header'; // Assuming you have a Header component
import './LastKnownPosition.css'; // Your CSS file

MapboxGL.accessToken = 'pk.eyJ1IjoidGhlbmV4dHNlY3VyaXR5IiwiYSI6ImNsd3YxdmhkeDBqZDgybHB2OTh4dmo3Z2EifQ.bpZlTBTa56pF4cPhE3aSzg'; 

const defaultPosition = { lat: -33.4489, lng: -70.6693 };

function LastKnownPosition({ showHeader = true }) {
  const [position, setPosition] = useState(null);
  const [timestamp, setTimestamp] = useState(null);
  const [changeTimestamp, setChangeTimestamp] = useState(null);
  const [error, setError] = useState(null);
  const [timeElapsed, setTimeElapsed] = useState('');
  const mapRef = useRef(null);
  const markerRef = useRef(null);

  useEffect(() => {
    const fetchLastKnownPosition = async () => {
      setError(null); 
      try {
        const response = await axios.get('http://thenext.ddns.net:1337/api/last-known-position');
        if (response.data) {
          const { latitude, longitude, unixTimestamp, changeTimestamp } = response.data;
          setPosition({
            lat: latitude !== null ? parseFloat(latitude) : defaultPosition.lat,
            lng: longitude !== null ? parseFloat(longitude) : defaultPosition.lng,
          });
          setTimestamp(unixTimestamp);
          setChangeTimestamp(changeTimestamp);
        } else {
          setPosition(defaultPosition); 
          setTimestamp(null);
          setChangeTimestamp(null);
        }
      } catch (error) {
        console.error('Failed to fetch last known position:', error);
        setError(error.message);
        setPosition(defaultPosition); 
        setTimestamp(null);
        setChangeTimestamp(null);
      }
    };

    fetchLastKnownPosition();

    const intervalId = setInterval(fetchLastKnownPosition, 10000);
    return () => clearInterval(intervalId); 
  }, []);

  useEffect(() => {
    const intervalId = setInterval(() => {
      if (changeTimestamp) {
        const now = Date.now();
        const elapsed = now - changeTimestamp;
        const hours = Math.floor(elapsed / (1000 * 60 * 60))
          .toString()
          .padStart(2, '0');
        const minutes = Math.floor((elapsed % (1000 * 60 * 60)) / (1000 * 60))
          .toString()
          .padStart(2, '0');
        const seconds = Math.floor((elapsed % (1000 * 60)) / 1000)
          .toString()
          .padStart(2, '0');
        setTimeElapsed(`${hours}h ${minutes}m ${seconds}s`);
      }
    }, 1000);

    return () => clearInterval(intervalId); 
  }, [changeTimestamp]);

  const formattedTime = timestamp
    ? new Date(timestamp).toLocaleString('es-CL', { hour12: false })
    : 'N/A';

  useEffect(() => {
    if (!mapRef.current) {
      mapRef.current = new MapboxGL.Map({
        container: 'map',
        style: 'mapbox://styles/mapbox/streets-v11', 
        center: [defaultPosition.lng, defaultPosition.lat],
        zoom: 15,
      });
    }

    if (position && mapRef.current) {
      if (!markerRef.current) {
        markerRef.current = new MapboxGL.Marker({ draggable: false })
          .setLngLat([position.lng, position.lat])
          .addTo(mapRef.current);
      } else {
        markerRef.current.setLngLat([position.lng, position.lat]);
      }

      if (markerRef.current.getPopup()) {
        markerRef.current.getPopup().setHTML(
          `<strong>Time:</strong> ${formattedTime}<br/><strong>Lat:</strong> ${position.lat}<br/><strong>Lng:</strong> ${position.lng}`
        );
      } else {
        markerRef.current
          .setPopup(
            new MapboxGL.Popup().setHTML(
              `<strong>Time:</strong> ${formattedTime}<br/><strong>Lat:</strong> ${position.lat}<br/><strong>Lng:</strong> ${position.lng}`
            )
          )
          .addTo(mapRef.current);
      }

      mapRef.current.setCenter([position.lng, position.lat]);
    }
  }, [position, formattedTime]); 

  return (
    <div>
      {showHeader && <Header title="Ubicación Exteriores Tiempo Real" />} 
      {error && <div className="error-message">Error: {error}</div>}

      <div id="map" className="map-container"></div> {/* Ensure the map container has an ID */}
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
              <td>{formattedTime}</td>
            </tr>
            <tr>
              <td>Tiempo Transcurrido Desde el Último Cambio</td>
              <td>{timeElapsed}</td>
            </tr>
            {position && (
              <>
                <tr>
                  <td>Latitud</td>
                  <td>{position.lat.toFixed(6)}</td>
                </tr>
                <tr>
                  <td>Longitud</td>
                  <td>{position.lng.toFixed(6)}</td>
                </tr>
              </>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default LastKnownPosition;