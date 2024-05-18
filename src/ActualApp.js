import React from 'react';
import LastKnownPosition from './LastKnownPosition'; 
import MapWithQuadrants from './MapWithQuadrants'; 
import DataTable from './DataTable'; 
import Clock from './Clock'; 
import PersonSearch from './PersonSearch'; 
import './ActualApp.css';

const ActualApp = () => {
  return (
    <div className="ActualApp">
      <header className="ActualApp-header">
        <img src={logo} className="ActualApp-logo" alt="logo" />
        <h1>Device Location Tracker</h1>
        <Clock /> 
      </header>
      <div className="map-container">
        <h2>Last Known Position</h2>
        <LastKnownPosition />
        <MapWithQuadrants />
      </div>
      <PersonSearch /> 
    </div>
  );
}

export default ActualApp;
