import React from 'react';
import { useNavigate } from 'react-router-dom';
import './SelectRoutine.css'; // Crear este archivo CSS según sea necesario

const SelectRoutine = () => {
  const navigate = useNavigate();

  return (
    <div className="select-routine">
      <h1>Seleccionar Rutina</h1>
      <div className="routine-buttons">
        <button onClick={() => navigate('/last-known-position')}>Last Known Position</button>
        <button onClick={() => navigate('/ubicaciones-interior')}>Ubicaciones en Interior</button>
        <button onClick={() => navigate('/busqueda-entradas-persona')}>Búsqueda de Entradas por Persona en Interior</button>
        <button onClick={() => navigate('/consulta-historica-movimientos')}>Consulta Histórica de Movimientos en Exterior</button>
      </div>
    </div>
  );
};

export default SelectRoutine;
