// LandingPage.js

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './LandingPage.css';
import mapImage from './assets/images/map-of-a-map.jpeg';
import centerImage from './assets/images/TNS Track White.png';
import rightImage from './assets/images/tns_logo_blanco.png';

const LandingPage = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [message, setMessage] = useState('');
    const [currentTime, setCurrentTime] = useState(new Date());
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            const response = await axios.post('/api/login', { username, password });
            localStorage.setItem('token', response.data.token);
            navigate('/select-routine');
        } catch (error) {
            setMessage('Error: ' + (error.response?.data || error.message));
        }
    };

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);
        return () => clearInterval(interval);
    }, []);

    const handleForgotPassword = () => {
        // Lógica para recuperación de contraseña
        navigate('/forgot-password');
    };

    return (
        <div className="landing-page">
            <div className="image-container">
                <img src={mapImage} alt="Map Image" className="map-image" />
                <img src={centerImage} alt="Center Image" className="center-image" />
            </div>
            <div className="form-container">
                <h2>Login</h2>
                <form onSubmit={handleSubmit}>
                    <div>
                        <label>Username:</label>
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                        />
                    </div>
                    <div>
                        <label>Password:</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>
                    <button type="submit">Login</button>
                    <p onClick={handleForgotPassword}>Forgot password?</p>
                </form>
                {message && <p>{message}</p>}
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
