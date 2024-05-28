import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import LastKnownPosition from './LastKnownPosition';
import MapWithQuadrants from './MapWithQuadrants';
import PersonSearch from './PersonSearch'; 
import LandingPage from './LandingPage';
import SelectRoutine from './SelectRoutine'; 
import HistoricalMovementsSearch from './HistoricalMovementsSearch';
import DataIntelligence from './DataIntelligence'; // Importar el nuevo componente
import Header from './Header'; // Importar el componente Header

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
        <Route path="/inteligencia-de-datos" element={<DataIntelligence />} /> {/* Nueva ruta */}
      </Routes>
    </Router>
  );
}

export default App;
