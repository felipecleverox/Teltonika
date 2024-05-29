import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import axios from 'axios';
import Header from './Header'; // Import the Header component

// Define the default position for the map (Santiago de Chile)
const defaultPosition = { lat: -33.4489, lng: -70.6693 }; 

// Define the custom icon for the marker
const customIcon = L.icon({
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

// Function to center the map on a given position
function CenterMap({ position }) {
    const map = useMap();

    // Update the map's view when the position changes
    useEffect(() => {
        if (position) {
            map.setView([position.lat, position.lng], 25);
        }
    }, [position, map]);

    return null;
}

function LastKnownPosition({ showHeader = true }) {
    // State to store the last known position
    const [position, setPosition] = useState(null); 
    // State to store the timestamp of the last known position
    const [timestamp, setTimestamp] = useState(null);
    // State to handle errors
    const [error, setError] = useState(null); 

    useEffect(() => {
        // Function to fetch the last known position from the server
        const fetchLastKnownPosition = async () => {
            // Clear any previous errors
            setError(null); 
            try {
                const response = await axios.get('http://thenext.ddns.net:1337/api/last-known-position');
                // Check if the response contains valid latitude and longitude
                if (response.data && response.data.latitude && response.data.longitude) {
                    // Update the position and timestamp states
                    setPosition({ lat: response.data.latitude, lng: response.data.longitude });
                    setTimestamp(response.data.unixTimestamp); 
                } else {
                    // Set the position to the default position if no data is available
                    setPosition(defaultPosition);
                    setTimestamp(null);
                }
            } catch (error) {
                console.error('Failed to fetch last known position:', error);
                // Set the error state
                setError(error.message); 
                setPosition(defaultPosition);
                setTimestamp(null);
            }
        };

        // Fetch the last known position initially
        fetchLastKnownPosition();
        
        // Set up an interval to refresh the position every 10 seconds
        const intervalId = setInterval(fetchLastKnownPosition, 10000); 

        // Clear the interval when the component unmounts
        return () => clearInterval(intervalId); 
    }, []);

    // Format the timestamp for display
    const formattedTime = timestamp ? new Date(timestamp).toLocaleString() : 'N/A';

    return (
        <div> 
            {/* Optionally display the Header component */}
            {showHeader && <Header title="Ubicación Exteriores Tiempo Real" />}

            {/* Display an error message if an error occurred */}
            {error && <div className="error-message">Error: {error}</div>}

            {/* Display the MapContainer with a TileLayer for base map and a Marker for the last known position */}
            <MapContainer center={position || defaultPosition} zoom={13} style={{ height: '300px', width: '100%' }}>
                <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                />
                {/* Center the map on the position if it's available */}
                {position && <CenterMap position={position} />}
                {/* Display the marker if there's a position */}
                {position && (
                    <Marker position={[position.lat, position.lng]} icon={customIcon}>
                        <Popup>
                            <div>
                                <strong>Time:</strong> {formattedTime}<br />
                                <strong>Lat:</strong> {position.lat}<br />
                                <strong>Lng:</strong> {position.lng}
                            </div>
                        </Popup>
                    </Marker>
                )}
            </MapContainer>
        </div>
    );
}

export default LastKnownPosition;
/*
Explanation of Comments:
Default position and custom icon:
Defines a default position for the map in case data is not available.
Creates a custom icon for the marker to display on the map.
CenterMap component:
Centers the map on a given position when the position changes.
LastKnownPosition component:
State variables:
position: Holds the last known latitude and longitude.
timestamp: Holds the timestamp of the last known position.
error: Holds any error message during data fetching.
useEffect hook:
Fetches the last known position from the server API.
Sets up an interval to refresh the position data every 10 seconds.
Clears the interval when the component unmounts.
JSX rendering:
Displays the Header component (conditionally).
Displays an error message if an error occurred.
Uses the MapContainer component from react-leaflet to display the map.
Adds a TileLayer for the base map.
Renders a Marker with a Popup to show the position details if the data is available.
Uses the CenterMap component to center the map on the last known position.
Summary:
This component retrieves the latest known position data from the server, displays a map with the last known location, and provides a popup with the timestamp and coordinates. The component automatically refreshes the data periodically.
*/
