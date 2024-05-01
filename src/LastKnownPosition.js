import React, { useState, useEffect } from 'react';
import axios from 'axios';

function LastKnownPosition() {
    const [position, setPosition] = useState(null);

    useEffect(() => {
        const fetchLastKnownPosition = async () => {
            try {
                const { data } = await axios.get('http://localhost:1337/api/last-known-position')
                ;
                setPosition(data);
            } catch (error) {
                console.error('Failed to fetch last known position:', error);
            }
        };

        fetchLastKnownPosition();
    }, []);

    return (
        <div>
            {position ? (
                <div>
                    <h2>Last Known Position</h2>
                    <p>Device ID: {position.device_id}</p>
                    <p>Latitude: {position.latitude}</p>
                    <p>Longitude: {position.longitude}</p>
                    <p>Timestamp: {new Date(position.unixTimestamp * 1000).toLocaleString()}</p>
                </div>
            ) : (
                <p>Loading last known position...</p>
            )}
        </div>
    );
}

export default LastKnownPosition;
