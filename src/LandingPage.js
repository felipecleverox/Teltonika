import React from 'react';
import { useNavigate } from 'react-router-dom';
import './LandingPage.css';
import logo from './assets/images/tns_logo_blanco.png'; // Asegúrate de que esta ruta sea correcta
import productImage from './assets/images/producto.webp'; // Asegúrate de que esta ruta sea correcta
import newLogo from './assets/images/TNS track azul.jpg'; // Importar el nuevo logo
import Clock from './Clock'; // Importar el componente Clock

const LandingPage = () => {
  const navigate = useNavigate();

  const handleEnterClick = () => {
    navigate('/select-routine'); // Redirige a la nueva página de selección de rutina
  };

  return (
    <div className="landing-page">
      <header className="landing-header">
        <img src={logo} alt="Logo de la Empresa" className="landing-logo" />
      </header>
      <main className="landing-content">
        <div className="image-container">
          <img src={newLogo} alt="Nuevo Logo" className="new-logo" />
          <img src={productImage} alt="Producto" className="landing-product-image" />
        </div>
        <button onClick={handleEnterClick} className="enter-button">Enter</button>
      </main>
      <footer className="landing-footer">
        <div className="software-version">Ver. 1.0.1</div>
        <Clock />
      </footer>
    </div>
  );
};

export default LandingPage;
