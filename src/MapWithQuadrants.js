import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './MapWithQuadrants.css';
import planoBase from './assets/images/plano_super.jpg';
import personal3Icon from './assets/images/Personal 3.png';
import Header from './Header';

function MapWithQuadrants() {
  // State to store the IDs of active beacons
  const [activeBeacons, setActiveBeacons] = useState([]);

  // State to store the last detection timestamp for each active beacon
  const [beaconLogs, setBeaconLogs] = useState({});

  useEffect(() => {
    // Function to fetch the oldest timestamp for a specific active beacon
    const fetchOldestBeaconDetections = async (activeBeaconId) => {
      try {
        const response = await axios.get('/api/oldest-active-beacon-detections', {
          params: { activeBeaconId }
        });
        const data = response.data;
        const logs = { [activeBeaconId]: data[activeBeaconId] };
        setBeaconLogs(logs);
      } catch (error) {
        console.error('Failed to fetch oldest beacon detections:', error);
      }
    };

    // Function to fetch the list of active beacons
    const fetchActiveBeacons = async () => {
      try {
        const response = await axios.get('/api/active-beacons');
        const activeBeaconIds = response.data.activeBeaconIds || [];
        setActiveBeacons(activeBeaconIds);
        if (activeBeaconIds.length > 0) {
          // Fetch the oldest timestamp for the first active beacon
          fetchOldestBeaconDetections(activeBeaconIds[0]); 
        }
      } catch (error) {
        console.error('Failed to fetch active beacons:', error);
      }
    };

    // Call fetchActiveBeacons initially to get the active beacons
    fetchActiveBeacons();

    // Set up an interval to refresh active beacons every 20 seconds
    const intervalId = setInterval(fetchActiveBeacons, 20000);

    // Clear the interval when the component unmounts
    return () => clearInterval(intervalId);
  }, []);

  // Function to get the sector name corresponding to a beacon ID
  const getSector = (beaconId) => {
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
        return 'Unknown';
    }
  };

  // Function to get the position (bottom, right, width) of the icon on the map based on the beacon ID
  const getIconPosition = (beaconId) => {
    switch (beaconId) {
      case '0C403019-61C7-55AA-B7EA-DAC30C720055':
        return { bottom: '70%', right: '55%', width: '2%' };
      case 'E9EB8F18-61C7-55AA-9496-3AC30C720055':
        return { bottom: '25%', right: '55%', width: '2%' };
      case 'F7826DA6-BC5B-71E0-893E-4B484D67696F':
        return { bottom: '10%', right: '72%', width: '2%' };
      case 'F7826DA6-BC5B-71E0-893E-6D424369696F':
        return { bottom: '41%', right: '28%', width: '2%' };
      case 'F7826DA6-BC5B-71E0-893E-54654370696F':
        return { bottom: '68%', right: '30%', width: '2%' };
      default:
        return {};
    }
  };

  // Function to calculate the time since the last beacon detection
  const calculatePermanence = (timestamp) => {
    const now = new Date();
    const start = new Date(timestamp);
    const duration = now - start;

    const hours = Math.floor(duration / (1000 * 60 * 60));
    const minutes = Math.floor((duration % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };

  return (
    <div className="map-with-quadrants">
      {/* Display the Header component with the title "Ubicaciones Interior Tiempo Real" */}
      <Header title="Ubicaciones Interior Tiempo Real" />

      {/* Display the map container with the floor plan and active beacon icons */}
      <div className="plano-container" style={{ position: 'relative', width: '100%', height: 'auto' }}>
        <img src={planoBase} alt="Plano de la Oficina" className="plano-oficina" style={{ width: '70%', height: 'auto' }} />
        {/* Iterate over active beacons and display icons based on their position */}
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

      {/* Display a table showing the active beacons, sectors, and permanence time */}
      <table className="beacon-logs-table">
        <thead>
          <tr>
            <th>Personal</th>
            <th>Sector</th>
            <th>Desde Detección</th>
            <th>Permanencia</th>
          </tr>
        </thead>
        <tbody>
          {/* Iterate over active beacons and display information for each beacon */}
          {activeBeacons.map(beaconId => (
            <tr key={beaconId}>
              <td><img src={personal3Icon} alt="Personal 3" style={{ width: '10px' }} /></td>
              <td>{getSector(beaconId)}</td>
              <td>{beaconLogs[beaconId] ? new Date(beaconLogs[beaconId].timestamp).toLocaleString([], { hour: '2-digit', minute: '2-digit' }) : 'N/A'}</td>
              <td>{beaconLogs[beaconId] ? calculatePermanence(beaconLogs[beaconId].timestamp) : 'N/A'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default MapWithQuadrants;


/*
Explanation of Comments:
State variables:
activeBeacons: Holds an array of active beacon IDs.
beaconLogs: Holds an object mapping active beacon IDs to their last detection timestamps.
useEffect hook:
Fetches active beacons and oldest detection timestamps for each beacon on initial render.
Sets up an interval to refresh the active beacons list every 20 seconds.
Helper functions:
getSector: Maps a beacon ID to a sector name.
getIconPosition: Returns the CSS styling (bottom, right, width) for the icon on the map based on the beacon ID.
calculatePermanence: Calculates the time since the last detection of a beacon.
JSX rendering:
Displays a floor plan image.
Dynamically renders icons for each active beacon using getIconPosition.
Creates a table with the active beacon information (sector, last detection timestamp, permanence time).
Summary:
This component fetches and updates active beacon data from the server, displays a map with the floor plan and beacon locations, and provides a table with the beacon information. This component is used to visualize real-time location information of personnel within a building or facility.
*/