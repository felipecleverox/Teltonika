import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import LastKnownPosition from './LastKnownPosition';
import MapWithQuadrants from './MapWithQuadrants';
import PersonSearch from './PersonSearch'; 
import LandingPage from './LandingPage';
import SelectRoutine from './SelectRoutine'; 
import HistoricalMovementsSearch from './HistoricalMovementsSearch';

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
      </Routes>
    </Router>
  );
}

export default App;
