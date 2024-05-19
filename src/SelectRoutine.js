import React from 'react';
import { useNavigate } from 'react-router-dom';
import './SelectRoutine.css';
import lastKnownPositionImage from './assets/images/last_known_position.webp';
import interiorLocationsImage from './assets/images/plano_super.webp';
import personSearchImage from './assets/images/person_search.webp';
import historicalMovementsImage from './assets/images/historical_movements.webp';
import Header from './Header'; // Importar el componente Header

const SelectRoutine = () => {
  const navigate = useNavigate();

  return (
    <div className="select-routine">
      <Header title="Dashboard TNS Track" /> {/* Agregar el Header */}
      <div className="routine-sectors">
        <div className="routine-row">
          <div className="routine-sector">
            <img src={lastKnownPositionImage} alt="Ubicación Exteriores Tiempo Real" className="routine-image" />
            <button onClick={() => navigate('/last-known-position')} className="routine-button">Ubicación Exteriores Tiempo Real</button>
          </div>
          <div className="routine-sector">
            <img src={interiorLocationsImage} alt="Ubicación Interiores Tiempo Real" className="routine-image" />
            <button onClick={() => navigate('/ubicaciones-interior')} className="routine-button">Ubicación Interiores Tiempo Real</button>
          </div>
        </div>
        <div className="routine-row">
          <div className="routine-sector">
            <img src={personSearchImage} alt="Busqueda Histórica Ubicación Interiores" className="routine-image" />
            <button onClick={() => navigate('/busqueda-entradas-persona')} className="routine-button">Busqueda Histórica Ubicación Interiores</button>
          </div>
          <div className="routine-sector">
            <img src={historicalMovementsImage} alt="Busqueda Histórica Ubicación Exteriores" className="routine-image" />
            <button onClick={() => navigate('/consulta-historica-movimientos')} className="routine-button">Busqueda Histórica Ubicación Exteriores</button>
          </div>
        </div>
      </div>
      <button className="back-button" onClick={() => navigate('/')}>Volver a la Página Principal</button> {/* Agregar botón para volver a la página de inicio */}
    </div>
  );
};

export default SelectRoutine;
