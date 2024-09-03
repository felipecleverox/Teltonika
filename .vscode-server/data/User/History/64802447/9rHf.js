import React from 'react';
import { Link } from 'react-router-dom';
import './SideNav.css';

const SideNav = ({ userPermissions }) => {
  // Verificar si el dispositivo es móvil
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

  // Si es un dispositivo móvil, no renderizar el SideNav
  if (isMobile) {
    return null;
  }

  return (
    <nav className="side-nav">
      <ul>
        {userPermissions.includes('view_dashboard') && (
          <li><Link to="/dashboard">Dashboard</Link></li>
        )}
        {userPermissions.includes('view_temperature') && (
          <li><Link to="/temperatura">Temperatura</Link></li>
        )}
        {/* Añadir el nuevo enlace para DashboardTemperatura */}
        {userPermissions.includes('view_temperature_dashboard') && (
          <li><Link to="/dashboard-temperatura">Dashboard Temperatura</Link></li>
        )}
        {userPermissions.includes('view_blind_spot_intrusions') && (
          <li><Link to="/blind-spot-intrusions">Intrusiones Blind Spot</Link></li>
        )}
        {userPermissions.includes('view_interior') && (
          <li><Link to="/ubicaciones-interior">Interior Ubicación en Tiempo Real</Link></li>
        )}
        {userPermissions.includes('search_interior') && (
          <li><Link to="/busqueda-entradas-persona">Interior Búsqueda Histórica Ubicación</Link></li>
        )}
        {userPermissions.includes('view_exterior') && (
          <li><Link to="/last-known-position">Exterior Ubicación Tiempo Real</Link></li>
        )}
        {userPermissions.includes('search_exterior') && (
          <li><Link to="/consulta-historica-movimientos">Exterior Búsqueda Histórica Ubicación</Link></li>
        )}
        {userPermissions.includes('view_presence') && (
          <li><Link to="/presencia">Sectores Presencia Personal</Link></li>
        )}
        {userPermissions.includes('view_sms') && (
          <li><Link to="/sms-data">Mensajes SOS Visualización por Ubicación</Link></li>
        )}
        {userPermissions.includes('view_temperature_camaras') && (
          <li><Link to="/temperatura-camaras">Temperaturas Cámaras de Frío</Link></li>
        )}
        {userPermissions.includes('view_door_status') && (
          <li><Link to="/door-status-matrix">Puertas Status Cierre / Apertura</Link></li>
        )}
        {userPermissions.includes('view_data_intelligence') && (
          <li><Link to="/inteligencia-de-datos">Datos Análisis Forense</Link></li>
        )}
        {userPermissions.includes('view_configuration') && (
          <li><Link to="/configuracion">Parametrización</Link></li>
        )}
        {userPermissions.includes('create_users') && (
          <li><Link to="/register-user">Registrar Usuario</Link></li>
        )}
      </ul>
    </nav>
  );
};

export default SideNav;