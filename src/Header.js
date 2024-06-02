import React from 'react';
import './Header.css';
import homeIcon from './assets/images/home_white.png';
import tnsTrackLogo from './assets/images/TNS Track White.png';
import { useNavigate } from 'react-router-dom';

const Header = () => {
  const navigate = useNavigate();

  const handleHomeClick = () => {
    navigate('/select-routine');
  };

  const handleLogoutClick = () => {
    // Clear the token or any other user session data
    localStorage.removeItem('token');
    // Navigate to the landing page
    navigate('/');
  };

  return (
    <header className="header">
      <div className="header-left">
        <img src={homeIcon} alt="Home" className="header-icon" onClick={handleHomeClick} />
        <img src={tnsTrackLogo} alt="TNS Track" className="header-logo" />
      </div>
      <div className="header-center">
        <h1 className="header-title">TNS Track</h1>
      </div>
      <div className="header-right">
        <button className="logout-button" onClick={handleLogoutClick}>Logout</button>
      </div>
    </header>
  );
};

export default Header;
