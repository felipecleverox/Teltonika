import React from 'react';
import { useNavigate } from 'react-router-dom';
import './SelectRoutine.css'; // Crear este archivo CSS según sea necesario
import lastKnownPositionImage from './assets/images/last_known_position.jpg'; // Actualizar con la ruta correcta
import interiorLocationsImage from './assets/images/plano_super.jpg'; // Actualizar con la ruta correcta
import personSearchImage from './assets/images/person_search.webp'; // Actualizar con la ruta correcta
import historicalMovementsImage from './assets/images/historical_movements.webp'; // Actualizar con la ruta correcta

const SelectRoutine = () => {
    const navigate = useNavigate();
  
    return (
      <div className="select-routine">
        <h1>Dashboard Apps</h1>
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
      </div>
    );
  };
  
  export default SelectRoutine;