// src/App.js
import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import LastKnownPosition from './LastKnownPosition';
import MapWithQuadrants from './MapWithQuadrants';
import PersonSearch from './PersonSearch';
import LandingPage from './LandingPage';
import SelectRoutine from './SelectRoutine';
import HistoricalMovementsSearch from './HistoricalMovementsSearch';
import Header from './Header';
import Option1 from './Option1';
import Option2 from './Option2';
import Option3 from './Option3';
import Option4 from './Option4';
import Option5 from './Option5';
import Option6 from './Option6';
import './App.css'; // Asegúrate de importar los estilos

function App() {
  return (
    <Router>
      <div>
        <Header title="Teltonika Dashboard" /> {/* Renderiza el Header una vez */}
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/select-routine" element={<SelectRoutine />} />
          <Route path="/last-known-position" element={<LastKnownPosition />} />
          <Route path="/ubicaciones-interior" element={<MapWithQuadrants />} />
          <Route path="/busqueda-entradas-persona" element={<PersonSearch />} />
          <Route path="/consulta-historica-movimientos" element={<HistoricalMovementsSearch />} />
          <Route path="/option1" element={<Option1 />} />
          <Route path="/option2" element={<Option2 />} />
          <Route path="/option3" element={<Option3 />} />
          <Route path="/option4" element={<Option4 />} />
          <Route path="/option5" element={<Option5 />} />
          <Route path="/option6" element={<Option6 />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
