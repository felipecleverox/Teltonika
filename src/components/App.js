import React, { useEffect } from 'react';

import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { handleBackButton } from  '../utils/backButtonHandler.js'; // Importa el archivo backButtonHandler

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


const PrivateRoute = ({ children }) => {
    const token = localStorage.getItem('token');
    return token ? children : <Navigate to="/" />;
};

function App() {
  useEffect(() => {
    // Llamamos a handleBackButton y guardamos la función de limpieza
    const cleanup = handleBackButton();

    // Devolvemos la función de limpieza para que se ejecute al desmontar
    return cleanup;
  }, []);  // El arreglo de dependencias vacío asegura que se ejecute solo una vez al montar

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
        
        {/* Ruta para manejar rutas no encontradas */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

export default App;