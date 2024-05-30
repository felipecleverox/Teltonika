import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './LandingPage.css';
import mapImage from './assets/images/map-of-a-map.jpeg';
import leftImage from './assets/images/TNS track azul.jpg';
import rightImage from './assets/images/tns_logo_blanco.png';

const LandingPage = () => {
    const [isRegister, setIsRegister] = useState(false);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');
    const [currentTime, setCurrentTime] = useState(new Date());
    const navigate = useNavigate();

    const toggleForm = () => {
        setIsRegister(!isRegister);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            if (isRegister) {
                await axios.post('/api/register', { username, password, email });
                setMessage('Registration successful. Please log in.');
                setIsRegister(false);
            } else {
                const response = await axios.post('/api/login', { username, password });
                localStorage.setItem('token', response.data.token);
                navigate('/select-routine');
            }
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

    return (
        <div className="landing-page">
            <div className="image-container">
                <img src={mapImage} alt="Map Image" className="map-image" />
            </div>
            <div className="form-container">
                <h2>{isRegister ? 'Register' : 'Login'}</h2>
                <form onSubmit={handleSubmit}>
                    {isRegister && (
                        <div>
                            <label>Email:</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>
                    )}
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
                    <button type="submit">{isRegister ? 'Register' : 'Login'}</button>
                    <p onClick={toggleForm}>
                        {isRegister ? 'Already have an account? Login' : "Don't have an account? Register"}
                    </p>
                </form>
                {message && <p>{message}</p>}
            </div>
            <div className="footer-images">
                <img src={leftImage} alt="Left Image" className="side-image left-image" />
                <img src={rightImage} alt="Right Image" className="side-image right-image" />
            </div>
            <footer className="footer">
                <div className="footer-left">Version 1.01</div>
                <div className="footer-right">{currentTime.toLocaleString()}</div>
            </footer>
        </div>
    );
};

export default LandingPage;
