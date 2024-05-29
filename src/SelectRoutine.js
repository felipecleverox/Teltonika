// SelectRoutine.js
import React from 'react';
import { useNavigate } from 'react-router-dom';
import './SelectRoutine.css';
import lastKnownPositionImage from './assets/images/last_known_position.webp';
import interiorLocationsImage from './assets/images/plano_super.webp';
import personSearchImage from './assets/images/person_search.webp';
import historicalMovementsImage from './assets/images/historical_movements.webp';
import dataIntelligenceImage from './assets/images/data_intelligence.png'; 
import configurationImage from './assets/images/configuration.png'; // Add image for "Configuración"
import Header from './Header'; 

const SelectRoutine = () => {
  const navigate = useNavigate();

  return (
    <div className="select-routine">
      <Header title="Dashboard TN Track" /> 

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
        <div className="routine-row second-row"> 
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
        <div className="routine-row second-row"> {/* New row for Configuration */}
          <div className="routine-sector">
            <div className="routine-title">Configuración</div>
            <img 
              src={configurationImage} 
              alt="Configuración" 
              className="routine-image" 
              onClick={() => navigate('/configuracion')} 
            />
            <button onClick={() => navigate('/configuracion')} className="routine-button">Ir a la App</button>
          </div>
        </div>
      </div>
      <button className="back-button" onClick={() => navigate('/')}>Volver a la Página Principal</button> 
    </div>
  );
};

export default SelectRoutine;

/*
Explanation of Comments:
useNavigate hook:
The useNavigate hook is used to programmatically navigate to different routes within the application.
Header component:
The Header component is imported and displayed at the top of the page.
Routine options:
The SelectRoutine component displays a series of routine options, each with an image and a button.
Each option represents a different functionality of the application.
Image and button for each option:
Each option has an associated image that visually represents the routine.
Clicking on the image or the button will navigate to the corresponding route.
Back button:
A "Volver a la Página Principal" (Back to Main Page) button is provided to navigate back to the LandingPage.
Summary:
The SelectRoutine component acts as a dashboard for the user to choose different functionalities of the application. It displays the available routines in a visually appealing way with images and buttons. The component uses the useNavigate hook to direct the user to the appropriate route for each selected routine.
*/