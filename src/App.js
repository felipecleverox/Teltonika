import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import LastKnownPosition from './LastKnownPosition';
import MapWithQuadrants from './MapWithQuadrants';
import PersonSearch from './PersonSearch'; 
import LandingPage from './LandingPage';
import SelectRoutine from './SelectRoutine'; 
import HistoricalMovementsSearch from './HistoricalMovementsSearch';
import DataIntelligence from './DataIntelligence'; // Import the DataIntelligence component
import Header from './Header'; // Import the Header component

function App() {
  return (
    <Router>
      {/* Use the Routes component to define the application's routes */}
      <Routes>
        {/* Define a route for the landing page */}
        <Route path="/" element={<LandingPage />} />

        {/* Define a route for the page where the user selects a routine */}
        <Route path="/select-routine" element={<SelectRoutine />} />

        {/* Define a route for the component that displays the last known position of a device */}
        <Route path="/last-known-position" element={<LastKnownPosition />} />

        {/* Define a route for the component that displays an interactive map with quadrants and active beacons */}
        <Route path="/ubicaciones-interior" element={<MapWithQuadrants />} />

        {/* Define a route for the component that allows searching for specific persons within the interior location data */}
        <Route path="/busqueda-entradas-persona" element={<PersonSearch />} />

        {/* Define a route for the component that allows searching and displaying historical GPS data on a map */}
        <Route path="/consulta-historica-movimientos" element={<HistoricalMovementsSearch />} />

        {/* Define a route for the component that provides a search interface for both interior and exterior data */}
        <Route path="/inteligencia-de-datos" element={<DataIntelligence />} /> {/* New route */}
      </Routes>
    </Router>
  );
}

export default App;