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
  { title: "Interior : Ubicación en Tiempo Real", image: lastKnownPositionImage, route: "/ubicaciones-interior", permission: "view_interior" },
  { title: "Interior : Búsqueda Histórica Ubicación", image: personSearchImage, route: "/busqueda-entradas-persona", permission: "search_interior" },
  { title: "Exterior : Ubicación Tiempo Real", image: interiorLocationsImage, route: "/last-known-position", permission: "view_exterior" },
  { title: "Exterior : Búsqueda Histórica Ubicación", image: historicalMovementsImage, route: "/consulta-historica-movimientos", permission: "search_exterior" },
  { title: "Sectores : Presencia Personal", image: presenciaImage, route: "/Presencia", permission: "view_presence" },
  { title: "Mensajes SOS : Visualización por Ubicación", image: smsDataImage, route: "/sms-data", permission: "view_sms" },
  { title: "Puertas : Status Cierre / Apertura", image: doorStatusImage, route: "/door-status-matrix", permission: "view_door_status" },
  { title: "Datos : Análisis Forense", image: dataIntelligenceImage, route: "/inteligencia-de-datos", permission: "view_data_intelligence" },
  { title: "Configuración", image: configurationImage, route: "/configuracion", permission: "view_configuration" },
  { title: "Registrar Usuario", image: userRegistrationImage, route: "/register-user", permission: "create_users" },
];

const SelectRoutine = () => {
  const navigate = useNavigate();
  const [userPermissions, setUserPermissions] = useState([]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        // Utiliza jwt.verify() para validar y decodificar el token
        const decodedToken = jwt.verify(token, 'your_jwt_secret'); 
        setUserPermissions(decodedToken.permissions.split(','));
      } catch (error) {
        console.error('Error decoding token:', error);
        // ... Maneja el error de token inválido
      }
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
              <h3 className="routine-title">
                {routine.title.split(":")[0]}<br />
                {routine.title.split(":")[1]}
              </h3>
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
