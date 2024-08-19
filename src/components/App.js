// App.js
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate, useLocation } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
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
import TemperaturaCamaras from '../TemperaturaCamaras';
import GlobalStyle from '../GlobalStyle';
import SideNav from '../SideNav';
import 'core-js/stable';
import 'regenerator-runtime/runtime';
import './App.css';
import BlindSpotIntrusions from '../BlindSpotIntrusions';

const PrivateRoute = ({ children, userPermissions }) => {
  const token = localStorage.getItem('token');
  if (!token) {
    return <Navigate to="/" />;
  }
  return React.cloneElement(children, { userPermissions });
};

function AppContent() {
  const [userPermissions, setUserPermissions] = useState([]);
  const [isNavExpanded, setIsNavExpanded] = useState(false);
  const [backgroundColor, setBackgroundColor] = useState('#E1E9F2'); // Default light gray
  const location = useLocation();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const decodedToken = jwtDecode(token);
        if (decodedToken && decodedToken.permissions) {
          setUserPermissions(decodedToken.permissions.split(','));
        }
      } catch (error) {
        console.error('Error decoding token:', error);
      }
    }

    // Load background color from localStorage or use default
    const savedColor = localStorage.getItem('appBackgroundColor');
    if (savedColor) {
      setBackgroundColor(savedColor);
    }
  }, []);

  const routesWithoutSideNav = ['/'];
  const shouldShowSideNav = !routesWithoutSideNav.includes(location.pathname) && userPermissions.length > 0;

  const handleNavExpand = (expanded) => {
    setIsNavExpanded(expanded);
  };

  const changeBackgroundColor = (color) => {
    setBackgroundColor(color);
    localStorage.setItem('appBackgroundColor', color);
  };

  return (
    <div className="app-container" style={{ backgroundColor }}>
      {shouldShowSideNav && <SideNav userPermissions={userPermissions} onExpandChange={handleNavExpand} />}
      <div className={`main-content ${shouldShowSideNav ? (isNavExpanded ? 'with-expanded-nav' : 'with-side-nav') : ''}`}>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />
          <Route path="/select-routine" element={
            <PrivateRoute userPermissions={userPermissions}>
              <SelectRoutine />
            </PrivateRoute>
          } />
          <Route path="/last-known-position" element={
            <PrivateRoute userPermissions={userPermissions}>
              <LastKnownPosition />
            </PrivateRoute>
          } />
          <Route path="/ubicaciones-interior" element={
            <PrivateRoute userPermissions={userPermissions}>
              <UbicacionTiempoRealInteriores />
            </PrivateRoute>
          } />
          <Route path="/busqueda-entradas-persona" element={
            <PrivateRoute userPermissions={userPermissions}>
              <PersonSearch />
            </PrivateRoute>
          } />
          <Route path="/consulta-historica-movimientos" element={
            <PrivateRoute userPermissions={userPermissions}>
              <HistoricalMovementsSearch />
            </PrivateRoute>
          } />
          <Route path="/door-status-matrix" element={
            <PrivateRoute userPermissions={userPermissions}>
              <DoorStatusMatrix />
            </PrivateRoute>
          } />
          <Route path="/inteligencia-de-datos" element={
            <PrivateRoute userPermissions={userPermissions}>
              <DataIntelligence />
            </PrivateRoute>
          } />
          <Route path="/sms-data" element={
            <PrivateRoute userPermissions={userPermissions}>
              <SmsData />
            </PrivateRoute>
          } />
          <Route path="/presencia" element={
            <PrivateRoute userPermissions={userPermissions}>
              <Presencia />
            </PrivateRoute>
          } />
          <Route path="/configuracion" element={
            <PrivateRoute userPermissions={userPermissions}>
              <Configuration />
            </PrivateRoute>
          } />
          <Route path="/register-user" element={
            <PrivateRoute userPermissions={userPermissions}>
              <UserRegistration />
            </PrivateRoute>
          } />
          <Route path="/dashboard" element={
            <PrivateRoute userPermissions={userPermissions}>
              <Dashboard />
            </PrivateRoute>
          } />
          <Route path="/temperatura" element={
            <PrivateRoute userPermissions={userPermissions}>
              <Temperatura />
            </PrivateRoute>
          } />
          <Route path="/temperatura-camaras" element={
            <PrivateRoute userPermissions={userPermissions}>
            <TemperaturaCamaras />
          </PrivateRoute>
          } />
          <Route path="/blind-spot-intrusions" element={
            <PrivateRoute userPermissions={userPermissions}>
              <BlindSpotIntrusions />
            </PrivateRoute>
          } />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </div>
    </div>
  );
}

function App() {
  return (
    <Router>
      <GlobalStyle />
      <AppContent />
    </Router>
  );
}

export default App;