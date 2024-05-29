import React from 'react';
import { useNavigate } from 'react-router-dom';
import './SelectRoutine.css';
import lastKnownPositionImage from './assets/images/last_known_position.webp';
import interiorLocationsImage from './assets/images/plano_super.webp';
import personSearchImage from './assets/images/person_search.webp';
import historicalMovementsImage from './assets/images/historical_movements.webp';
import dataIntelligenceImage from './assets/images/data_intelligence.png'; // Add image for "Inteligencia de Datos"
import Header from './Header'; // Import the Header component

const SelectRoutine = () => {
  // Use the useNavigate hook to navigate to different routes
  const navigate = useNavigate();

  return (
    <div className="select-routine">
      {/* Display the Header component with the title "Dashboard TN Track" */}
      <Header title="Dashboard TN Track" /> 

      {/* Display the different routine options */}
      <div className="routine-sectors">
        <div className="routine-row">
          {/* First row of routine options */}
          <div className="routine-sector">
            <div className="routine-title">Ubicación Interiores Tiempo Real</div>
            {/* Image for "Ubicación Interiores Tiempo Real" */}
            <img 
              src={interiorLocationsImage} 
              alt="Ubicación Interiores Tiempo Real" 
              className="routine-image" 
              onClick={() => navigate('/ubicaciones-interior')} 
            />
            {/* Button to navigate to the corresponding route */}
            <button onClick={() => navigate('/ubicaciones-interior')} className="routine-button">Ir a la App</button>
          </div>
          <div className="routine-sector">
            <div className="routine-title">Busqueda  Ubicación Interiores</div>
            {/* Image for "Busqueda Histórica Ubicación Interiores" */}
            <img 
              src={personSearchImage} 
              alt="Busqueda Histórica Ubicación Interiores" 
              className="routine-image" 
              onClick={() => navigate('/busqueda-entradas-persona')} 
            />
            {/* Button to navigate to the corresponding route */}
            <button onClick={() => navigate('/busqueda-entradas-persona')} className="routine-button">Ir a la App</button>
          </div>
        </div>
        <div className="routine-row second-row">
          {/* Second row of routine options */}
          <div className="routine-sector">
            <div className="routine-title">Ubicación Exteriores Tiempo Real</div>
            {/* Image for "Ubicación Exteriores Tiempo Real" */}
            <img 
              src={lastKnownPositionImage} 
              alt="Ubicación Exteriores Tiempo Real" 
              className="routine-image" 
              onClick={() => navigate('/last-known-position')} 
            />
            {/* Button to navigate to the corresponding route */}
            <button onClick={() => navigate('/last-known-position')} className="routine-button">Ir a la App</button>
          </div>
          <div className="routine-sector">
            <div className="routine-title">Busqueda  Ubicación Exteriores</div>
            {/* Image for "Busqueda Histórica Ubicación Exteriores" */}
            <img 
              src={historicalMovementsImage} 
              alt="Busqueda Histórica Ubicación Exteriores" 
              className="routine-image" 
              onClick={() => navigate('/consulta-historica-movimientos')} 
            />
            {/* Button to navigate to the corresponding route */}
            <button onClick={() => navigate('/consulta-historica-movimientos')} className="routine-button">Ir a la App</button>
          </div>
        </div>
        <div className="routine-row second-row"> {/* New row for Data Intelligence */}
          <div className="routine-sector">
            <div className="routine-title">Inteligencia de Datos</div>
            {/* Image for "Inteligencia de Datos" */}
            <img 
              src={dataIntelligenceImage} 
              alt="Inteligencia de Datos" 
              className="routine-image" 
              onClick={() => navigate('/inteligencia-de-datos')} 
            />
            {/* Button to navigate to the corresponding route */}
            <button onClick={() => navigate('/inteligencia-de-datos')} className="routine-button">Ir a la App</button>
          </div>
        </div>
      </div>
      {/* Button to go back to the LandingPage */}
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