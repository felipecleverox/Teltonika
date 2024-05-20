// Header.js
import React from 'react';
import { Link } from 'react-router-dom'; // Importa Link
import './Header.css';
import logo from './assets/images/tns_logo_blanco.png';
import Clock from './Clock'; // Suponiendo que el componente Clock.js ya está en la carpeta src

const Header = ({ title }) => {
  return (
    <header className="header">
      <div className="header-left">
        <Link to="/select-routine">
          <img src={logo} alt="Logo de la Empresa" className="header-logo" />
        </Link>
      </div>
      <div className="header-center">
        <h1 className="header-title">{title}</h1>
      </div>
      <div className="header-right">
        <Clock />
      </div>
    </header>
  );
};

export default Header;