// LandingPage.js

// LandingPage.js

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './LandingPage.css';
import mapImage from './assets/images/map-of-a-map.jpeg';
import centerImage from './assets/images/TNS Track White.png';
import rightImage from './assets/images/tns_logo_blanco.png';

const LandingPage = () => {
    const [currentTime, setCurrentTime] = useState(new Date());
    const navigate = useNavigate();

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="landing-page">
            <div className="image-container">
                <img src={mapImage} alt="Map Image" className="map-image" />
                <img src={centerImage} alt="Center Image" className="center-image" />
            </div>
            <div className="form-container">
                <h2>Welcome</h2>
                <button onClick={() => navigate('/select-routine')}>Go to Select Routine</button>
            </div>
            <div className="footer-images">
                <img src={rightImage} alt="Right Image" className="right-image" />
            </div>
            <footer className="footer">
                <div className="footer-left">Version 1.01</div>
                <div className="footer-right">{currentTime.toLocaleString()}</div>
            </footer>
        </div>
    );
};

export default LandingPage;
