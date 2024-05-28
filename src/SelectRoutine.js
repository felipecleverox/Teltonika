import React from 'react';
import { useNavigate } from 'react-router-dom';
import './SelectRoutine.css';
import lastKnownPositionImage from './assets/images/last_known_position.webp';
import interiorLocationsImage from './assets/images/plano_super.webp';
import personSearchImage from './assets/images/person_search.webp';
import historicalMovementsImage from './assets/images/historical_movements.webp';
import dataIntelligenceImage from './assets/images/data_intelligence.png'; // Añadir imagen para "Inteligencia de Datos"
import Header from './Header'; // Importar el componente Header

const SelectRoutine = () => {
  const navigate = useNavigate();

  return (
    <div className="select-routine">
      <Header title="Dashboard TN Track" /> {/* Agregar el Header */}
      <div className="routine-sectors">
        <div className="routine-row">
          <div className="routine-sector">
            <div className="routine-title">Ubicación Interiores Tiempo Real</div>
            <img 
              src={interiorLocationsImage} 
              alt="Ubicación Interiores Tiempo Real" 
              className="routine-image" 
              onClick={() => navigate('/ubicaciones-interior')} 
            />
            <button onClick={() => navigate('/ubicaciones-interior')} className="routine-button">Ir a la App</button>
          </div>
          <div className="routine-sector">
            <div className="routine-title">Busqueda  Ubicación Interiores</div>
            <img 
              src={personSearchImage} 
              alt="Busqueda Histórica Ubicación Interiores" 
              className="routine-image" 
              onClick={() => navigate('/busqueda-entradas-persona')} 
            />
            <button onClick={() => navigate('/busqueda-entradas-persona')} className="routine-button">Ir a la App</button>
          </div>
        </div>
        <div className="routine-row second-row">
          <div className="routine-sector">
            <div className="routine-title">Ubicación Exteriores Tiempo Real</div>
            <img 
              src={lastKnownPositionImage} 
              alt="Ubicación Exteriores Tiempo Real" 
              className="routine-image" 
              onClick={() => navigate('/last-known-position')} 
            />
            <button onClick={() => navigate('/last-known-position')} className="routine-button">Ir a la App</button>
          </div>
          <div className="routine-sector">
            <div className="routine-title">Busqueda  Ubicación Exteriores</div>
            <img 
              src={historicalMovementsImage} 
              alt="Busqueda Histórica Ubicación Exteriores" 
              className="routine-image" 
              onClick={() => navigate('/consulta-historica-movimientos')} 
            />
            <button onClick={() => navigate('/consulta-historica-movimientos')} className="routine-button">Ir a la App</button>
          </div>
        </div>
        <div className="routine-row second-row"> {/* Nueva fila para Inteligencia de Datos */}
          <div className="routine-sector">
            <div className="routine-title">Inteligencia de Datos</div>
            <img 
              src={dataIntelligenceImage} 
              alt="Inteligencia de Datos" 
              className="routine-image" 
              onClick={() => navigate('/inteligencia-de-datos')} 
            />
            <button onClick={() => navigate('/inteligencia-de-datos')} className="routine-button">Ir a la App</button>
          </div>
        </div>
      </div>
      <button className="back-button" onClick={() => navigate('/')}>Volver a la Página Principal</button> {/* Agregar botón para volver a la página de inicio */}
    </div>
  );
};

export default SelectRoutine;
