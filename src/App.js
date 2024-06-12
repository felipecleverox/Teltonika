// App.js
import React from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import LastKnownPosition from './LastKnownPosition';
import MapWithQuadrants from './MapWithQuadrants';
import PersonSearch from './PersonSearch';
import LandingPage from './LandingPage';
import SelectRoutine from './SelectRoutine';
import HistoricalMovementsSearch from './HistoricalMovementsSearch';
import DataIntelligence from './DataIntelligence';
import Header from './Header';
import Configuration from './Configuration';
import Presencia from './Presencia';
import SmsData from './SmsData';
import DoorStatusMatrix from './DoorStatusMatrix';

const PrivateRoute = ({ children }) => {
    const token = localStorage.getItem('token');
    return token ? children : <Navigate to="/" />;
};

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/select-routine" element={<PrivateRoute><SelectRoutine /></PrivateRoute>} />
        <Route path="/last-known-position" element={<PrivateRoute><LastKnownPosition /></PrivateRoute>} />
        <Route path="/ubicaciones-interior" element={<PrivateRoute><MapWithQuadrants /></PrivateRoute>} />
        <Route path="/busqueda-entradas-persona" element={<PrivateRoute><PersonSearch /></PrivateRoute>} />
        <Route path="/consulta-historica-movimientos" element={<PrivateRoute><HistoricalMovementsSearch /></PrivateRoute>} />
        <Route path="/door-status-matrix" element={<PrivateRoute><DoorStatusMatrix /></PrivateRoute>} />
        <Route path="/inteligencia-de-datos" element={<PrivateRoute><DataIntelligence /></PrivateRoute>} />
        <Route path="/sms-data" element={<PrivateRoute><SmsData /></PrivateRoute>} />
        <Route path="/presencia" element={<PrivateRoute><Presencia /></PrivateRoute>} />
        <Route path="/configuracion" element={<PrivateRoute><Configuration /></PrivateRoute>} />
      </Routes>
    </Router>
  );
}

export default App;
