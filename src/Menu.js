// src/Menu.js
import React from 'react';
import { Link } from 'react-router-dom';
import './Menu.css';

function Menu() {
  return (
    <nav className="menu">
      <ul>
        <li><Link to="/option1">Opción 1</Link></li>
        <li><Link to="/option2">Opción 2</Link></li>
        <li><Link to="/option3">Opción 3</Link></li>
        <li><Link to="/option4">Opción 4</Link></li>
        <li><Link to="/option5">Opción 5</Link></li>
        <li><Link to="/option6">Opción 6</Link></li>
      </ul>
    </nav>
  );
}

export default Menu;
