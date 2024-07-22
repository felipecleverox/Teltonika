// Header.js
import React, { useState, useEffect } from 'react';
import './Header.css';
import homeIcon from './assets/images/home_white.png';
import tnsTrackLogo from './assets/images/TNS Track White.png';
import alertGif from './assets/alert.gif';
import { useNavigate, useLocation } from 'react-router-dom';
import { io } from 'socket.io-client';

const Header = ({ title }) => {
  const [newSms, setNewSms] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { state } = location;
  const routineTitle = state?.title || title;
  const routineImage = state?.image;

  useEffect(() => {
    const socket = io('http://thenext.ddns.net:1337');
    socket.on('new_sms', (data) => {
      console.log("Nuevo SMS recibido:", data);
      setNewSms(true);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const handleHomeClick = () => {
    navigate('/select-routine');
  };

  const handleLogoutClick = () => {
    localStorage.removeItem('token');
    navigate('/');
  };

  const handleSmsClick = () => {
    setNewSms(false);
    navigate('/sms-data');
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
        {newSms && <img src={alertGif} alt="New SMS" className="header-icon" onClick={handleSmsClick} />}
        <button className="logout-button" onClick={handleLogoutClick}>Logout</button>
      </div>
    </header>
  );
};

export default Header;