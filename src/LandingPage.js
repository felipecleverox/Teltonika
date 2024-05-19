import React from 'react';
import { useNavigate } from 'react-router-dom';
import './LandingPage.css';
import logo from './assets/images/tns_logo_blanco.png'; // Asegúrate de que esta ruta sea correcta
import productImage from './assets/images/producto.webp'; // Asegúrate de que esta ruta sea correcta

const LandingPage = () => {
  const navigate = useNavigate();

  const handleEnterClick = () => {
    navigate('/app'); // Cambia esta ruta según sea necesario
  };

  return (
    <div className="landing-page">
      <header className="landing-header">
        <img src={logo} alt="Logo de la Empresa" className="landing-logo" />
      </header>
      <main className="landing-content">
        <img src={productImage} alt="Producto" className="landing-product-image" />
        <button onClick={handleEnterClick} className="enter-button">Entrar</button>
      </main>
    </div>
  );
};

export default LandingPage;
