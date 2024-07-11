import React from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import LastKnownPosition from '../LastKnownPosition';
import UbicacionTiempoRealInteriores from '../UbicacionTiempoRealInteriores';
import PersonSearch from '../PersonSearch';
import LandingPage from '../LandingPage';
import SelectRoutine from '../SelectRoutine';
import HistoricalMovementsSearch from '../HistoricalMovementsSearch';
import DataIntelligence from '../DataIntelligence';
import Configuration from '../Configuration';
import Presencia from '../Presencia';
import SmsData from '../SmsData';
import DoorStatusMatrix from '../DoorStatusMatrix';
import UserRegistration from '../UserRegistration';
import ForgotPassword from '../ForgotPassword';
import ResetPassword from '../ResetPassword';
import Dashboard from '../Dashboard'; // Importar el nuevo componente Dashboard

const PrivateRoute = ({ children }) => {
    const token = localStorage.getItem('token');
    return token ? children : <Navigate to="/" />;
};

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />
        <Route path="/select-routine" element={<PrivateRoute><SelectRoutine /></PrivateRoute>} />
        <Route path="/last-known-position" element={<PrivateRoute><LastKnownPosition /></PrivateRoute>} />
        <Route path="/ubicaciones-interior" element={<PrivateRoute><UbicacionTiempoRealInteriores /></PrivateRoute>} />
        <Route path="/busqueda-entradas-persona" element={<PrivateRoute><PersonSearch /></PrivateRoute>} />
        <Route path="/consulta-historica-movimientos" element={<PrivateRoute><HistoricalMovementsSearch /></PrivateRoute>} />
        <Route path="/door-status-matrix" element={<PrivateRoute><DoorStatusMatrix /></PrivateRoute>} />
        <Route path="/inteligencia-de-datos" element={<PrivateRoute><DataIntelligence /></PrivateRoute>} />
        <Route path="/sms-data" element={<PrivateRoute><SmsData /></PrivateRoute>} />
        <Route path="/presencia" element={<PrivateRoute><Presencia /></PrivateRoute>} />
        <Route path="/configuracion" element={<PrivateRoute><Configuration /></PrivateRoute>} />
        <Route path="/register-user" element={<PrivateRoute><UserRegistration /></PrivateRoute>} />
        <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} /> {/* Nueva ruta para Dashboard */}
        
        {/* Ruta para manejar rutas no encontradas */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

export default App;