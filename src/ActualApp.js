import React from 'react';
import LastKnownPosition from './LastKnownPosition'; 
import MapWithQuadrants from './MapWithQuadrants'; 
import DataTable from './DataTable'; 
import Clock from './Clock'; 
import PersonSearch from './PersonSearch'; 
import './ActualApp.css';
import Header from './Header'; // Importa el nuevo encabezado

const ActualApp = () => {
  return (
    <div className="ActualApp">
      <Header title="Ubicacion Histotica Exterior" />
      
    </div>
  );
}

export default ActualApp;
