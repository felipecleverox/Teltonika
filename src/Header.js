import React from 'react';
import './Header.css';
import homeIcon from './assets/images/home_white.png';
import tnsTrackLogo from './assets/images/TNS Track White.png';
import { useNavigate, useLocation } from 'react-router-dom';

const Header = ({ title }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { state } = location;
  const routineTitle = state?.title || title;
  const routineImage = state?.image;

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
        {routineImage && <img src={routineImage} alt="Routine" className="header-icon" />}
        <h1 className="header-title">{routineTitle}</h1>
      </div>
      <div className="header-right">
        <button className="logout-button" onClick={handleLogoutClick}>Logout</button>
      </div>
    </header>
  );
};

export default Header;
