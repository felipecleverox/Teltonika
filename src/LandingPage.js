import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import jwt from 'jsonwebtoken';
import './LandingPage.css';
import mapImage from './assets/images/map-of-a-map.jpg';
import centerImage from './assets/images/storage.png';
import bottomLeftImage from './assets/images/TNS Track White.png';
import rightImage from './assets/images/tns_logo_blanco.png';

const LandingPage = () => {
    const [currentTime, setCurrentTime] = useState(new Date());
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);
        return () => clearInterval(interval);
    }, []);

    const handleLogin = async (e) => {
        e.preventDefault();
        try {
            const response = await fetch('/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password }),
            });

            if (!response.ok) {
                throw new Error('Login failed');
            }

            const data = await response.json();
            localStorage.setItem('token', data.token);
            localStorage.setItem('permissions', data.permissions);
            navigate('/select-routine');
        } catch (error) {
            setError('Invalid username or password');
        }
    };

    return (
        <div className="landing-page">
            <div className="image-container">
                <img src={mapImage} alt="Map Image" className="map-image" />
                <img src={centerImage} alt="Center Image" className="center-image" />
            </div>
            <div className="content-wrapper">
                <img src={bottomLeftImage} alt="Bottom Left Image" className="bottom-left-image" />
                <div className="form-container">
                    <h2>Welcome</h2>
                    <form onSubmit={handleLogin}>
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            placeholder="Username"
                            required
                        />
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Password"
                            required
                        />
                        <button type="submit">Login</button>
                    </form>
                    {error && <p className="error">{error}</p>}
                    <Link to="/forgot-password">¿Olvidaste tu contraseña?</Link>
                </div>
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