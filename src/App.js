// App.js
import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import LastKnownPosition from './LastKnownPosition';
import MapWithQuadrants from './MapWithQuadrants';
import PersonSearch from './PersonSearch'; 
import LandingPage from './LandingPage';
import SelectRoutine from './SelectRoutine'; 
import HistoricalMovementsSearch from './HistoricalMovementsSearch';
import DataIntelligence from './DataIntelligence'; 
import Header from './Header'; 
import Configuration from './Configuration'; // Import the new Configuration component

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/select-routine" element={<SelectRoutine />} />
        <Route path="/last-known-position" element={<LastKnownPosition />} />
        <Route path="/ubicaciones-interior" element={<MapWithQuadrants />} />
        <Route path="/busqueda-entradas-persona" element={<PersonSearch />} />
        <Route path="/consulta-historica-movimientos" element={<HistoricalMovementsSearch />} />
        <Route path="/inteligencia-de-datos" element={<DataIntelligence />} />
        <Route path="/configuracion" element={<Configuration />} /> {/* New route */}
      </Routes>
    </Router>
  );
}

export default App;

/*
Explanation of Comments:
Each Route component defines a path and the corresponding component that should be rendered when that path is visited.
The comments provide a brief explanation of the purpose of each route and the corresponding component.
The DataIntelligence component is imported and assigned a route to allow accessing the data intelligence features.
The Header component is imported but not used directly within App.js. It's likely being used in other components to display a common header across the application.
Summary:
This App.js file sets up the basic routing structure for the application, defining paths for each of the main functionalities:
Landing page: /
Select routine: /select-routine
Last known position: /last-known-position
Interior locations: /ubicaciones-interior
Person search: /busqueda-entradas-persona
Historical movements: /consulta-historica-movimientos
Data intelligence: /inteligencia-de-datos
This file ensures that the correct components are rendered based on the URL path visited by the user.
*/