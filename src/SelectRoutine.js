import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import jwt from 'jsonwebtoken'; // Importa jsonwebtoken
import './SelectRoutine.css';
import Header from './Header';

// Importación directa de las imágenes
import lastKnownPositionImage from './assets/images/last_known_position.png';
import personSearchImage from './assets/images/person_search.png';
import interiorLocationsImage from './assets/images/plano_super.png';
import historicalMovementsImage from './assets/images/historical_movements1.png';
import dataIntelligenceImage from './assets/images/data_intelligence.png';
import configurationImage from './assets/images/configuration.png';
import presenciaImage from './assets/images/presencia.png';
import smsDataImage from './assets/images/sms_data.png';
import doorStatusImage from './assets/images/door_status.png';
import userRegistrationImage from './assets/images/user_registration.png';

// Define las rutas y las propiedades de cada rutina
const routines = [
  { title: "Ubicación en Interiores Tiempo real", image: lastKnownPositionImage, route: "/ubicaciones-interior", permission: "view_interior" },
  { title: "Búsqueda Histórica Ubicación en Interiores", image: personSearchImage, route: "/busqueda-entradas-persona", permission: "search_interior" },
  { title: "Presencia Personal por Sectores", image: presenciaImage, route: "/Presencia", permission: "view_presence" },
  { title: "Ubicación Exteriores Tiempo real", image: interiorLocationsImage, route: "/last-known-position", permission: "view_exterior" },
  { title: "Búsqueda Histórica Ubicación en Exteriores", image: historicalMovementsImage, route: "/consulta-historica-movimientos", permission: "search_exterior" },
  { title: "Visualización Mensajes SMS", image: smsDataImage, route: "/sms-data", permission: "view_sms" },
  { title: "Estado de Puertas por Sector", image: doorStatusImage, route: "/door-status-matrix", permission: "view_door_status" },
  { title: "Inteligencia de Datos", image: dataIntelligenceImage, route: "/inteligencia-de-datos", permission: "view_data_intelligence" },
  { title: "Configuración", image: configurationImage, route: "/configuracion", permission: "view_configuration" },
  { title: "Registrar Usuario", image: userRegistrationImage, route: "/register-user", permission: "create_users" },
];

const SelectRoutine = () => {
  const navigate = useNavigate();
  const [userPermissions, setUserPermissions] = useState([]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      const decodedToken = jwt.decode(token);
      setUserPermissions(decodedToken.permissions.split(','));
    }
  }, []);

  const handleCardClick = (routine) => {
    if (userPermissions.includes(routine.permission)) {
      navigate(routine.route, { state: { title: routine.title, image: routine.image } });
    } else {
      alert("No tienes permiso para acceder a esta rutina");
    }
  };

  return (
    <div className="select-routine">
      <Header title="Dashboard TNS Track" />
      <div className="routine-cards">
        {routines.map((routine, index) => (
          <div className="routine-card" key={index} onClick={() => handleCardClick(routine)}>
            <img src={routine.image} alt={routine.title} className="routine-image" />
            <div className="routine-content">
              <h3 className="routine-title">{routine.title}</h3>
              <button className="routine-button">Ir a la App</button>
            </div>
          </div>
        ))}
      </div>
      <button className="back-button" onClick={() => navigate('/')}>Volver a la Página Principal</button>
    </div>
  );
};

export default SelectRoutine;
