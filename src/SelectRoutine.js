import React from 'react';
import { useNavigate } from 'react-router-dom';
import './SelectRoutine.css';
import Header from './Header';

// Importación directa de las imágenes
import lastKnownPositionImage from './assets/images/last_known_position.webp';
import personSearchImage from './assets/images/person_search.webp';
import interiorLocationsImage from './assets/images/plano_super.webp';
import historicalMovementsImage from './assets/images/historical_movements1.jpg';
import dataIntelligenceImage from './assets/images/data_intelligence.png';
import configurationImage from './assets/images/configuration.png';

// Define las rutas y las propiedades de cada rutina
const routines = [
  { title: "Ubicación Interiores On-line", image: lastKnownPositionImage, route: "/ubicaciones-interior" },
  { title: "Búsqueda Ubicación Interiores", image: personSearchImage, route: "/busqueda-entradas-persona" },
  { title: "Ubicación Exteriores On-line", image: interiorLocationsImage, route: "/last-known-position" },
  { title: "Búsqueda Ubicación Exteriores", image: historicalMovementsImage, route: "/consulta-historica-movimientos" },
  { title: "Inteligencia de Datos", image: dataIntelligenceImage, route: "/inteligencia-de-datos" },
  { title: "Configuración", image: configurationImage, route: "/configuracion" },
];

const SelectRoutine = () => {
  const navigate = useNavigate();

  return (
    <div className="select-routine">
      <Header title="Dashboard TN Track" />
      <div className="routine-cards">
        {routines.map((routine, index) => (
          <div className="routine-card" key={index} onClick={() => navigate(routine.route)}>
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
