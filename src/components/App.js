// App.js
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
import Dashboard from '../Dashboard';
import Temperatura from '../Temperatura';
import GlobalStyle from '../GlobalStyle';
import './App.css';

const PrivateRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  return token ? children : <Navigate to="/" />;
};

function App() {
  return (
    <Router>
      <GlobalStyle />
      <Routes>
        <Route key="landing" path="/" element={<LandingPage />} />
        <Route key="forgot-password" path="/forgot-password" element={<ForgotPassword />} />
        <Route key="reset-password" path="/reset-password/:token" element={<ResetPassword />} />
        <Route key="select-routine" path="/select-routine" element={<PrivateRoute><SelectRoutine /></PrivateRoute>} />
        <Route key="last-known-position" path="/last-known-position" element={<PrivateRoute><LastKnownPosition /></PrivateRoute>} />
        <Route key="ubicaciones-interior" path="/ubicaciones-interior" element={<PrivateRoute><UbicacionTiempoRealInteriores /></PrivateRoute>} />
        <Route key="busqueda-entradas-persona" path="/busqueda-entradas-persona" element={<PrivateRoute><PersonSearch /></PrivateRoute>} />
        <Route key="consulta-historica-movimientos" path="/consulta-historica-movimientos" element={<PrivateRoute><HistoricalMovementsSearch /></PrivateRoute>} />
        <Route key="door-status-matrix" path="/door-status-matrix" element={<PrivateRoute><DoorStatusMatrix /></PrivateRoute>} />
        <Route key="inteligencia-de-datos" path="/inteligencia-de-datos" element={<PrivateRoute><DataIntelligence /></PrivateRoute>} />
        <Route key="sms-data" path="/sms-data" element={<PrivateRoute><SmsData /></PrivateRoute>} />
        <Route key="presencia" path="/presencia" element={<PrivateRoute><Presencia /></PrivateRoute>} />
        <Route key="configuracion" path="/configuracion" element={<PrivateRoute><Configuration /></PrivateRoute>} />
        <Route key="register-user" path="/register-user" element={<PrivateRoute><UserRegistration /></PrivateRoute>} />
        <Route key="dashboard" path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
        <Route key="temperatura" path="/temperatura" element={<PrivateRoute><Temperatura /></PrivateRoute>} />
        <Route key="catch-all" path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

export default App;