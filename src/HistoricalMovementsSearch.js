import React, { useState, useEffect } from 'react';
import MapboxGL from 'mapbox-gl';
import axios from 'axios';
import Header from './Header'; // Import the Header component
import './HistoricalMovementsSearch.css'; // Import the CSS styles

MapboxGL.accessToken = 'pk.eyJ1IjoidGhlbmV4dHNlY3VyaXR5IiwiYSI6ImNsd3YxdmhkeDBqZDgybHB2OTh4dmo3Z2EifQ.bpZlTBTa56pF4cPhE3aSzg';

const HistoricalMovementsSearch = () => {
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [pathCoordinates, setPathCoordinates] = useState([]);
    const [historicalDataError, setHistoricalDataError] = useState(null);
    const [devices, setDevices] = useState([]);
    const [selectedDeviceId, setSelectedDeviceId] = useState('');
    const [isDataAvailable, setIsDataAvailable] = useState(false); // New state to track data availability

    useEffect(() => {
        const fetchDevices = async () => {
            try {
                const response = await axios.get('http://thenext.ddns.net:1337/api/devices');
                setDevices(response.data);
            } catch (error) {
                console.error('Error fetching devices:', error);
            }
        };

        fetchDevices();
    }, []);

    const handleSearch = async () => {
        setHistoricalDataError(null);
        setIsDataAvailable(false); // Reset data availability status
        try {
            const startTimestamp = Math.floor(new Date(startDate).getTime() / 1000);
            const endTimestamp = Math.floor(new Date(endDate).getTime() / 1000);

            const response = await axios.get('http://thenext.ddns.net:1337/api/get-gps-data', {
                params: {
                    startDate: startTimestamp,
                    endDate: endTimestamp,
                    device_id: selectedDeviceId
                }
            });

            const newCoordinates = response.data.map(item => {
                const latitude = parseFloat(item.latitude);
                const longitude = parseFloat(item.longitude);
                return { latitude, longitude, timestamp: item.unixTimestamp };
            });

            setPathCoordinates(newCoordinates);
            setIsDataAvailable(newCoordinates.length > 0); // Set data availability status based on results
        } catch (error) {
            setHistoricalDataError(error.message);
        }
    };

    const formatDate = (timestamp) => {
        if (!timestamp) return 'N/A';
        const date = new Date(timestamp * 1000);
        return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
    };

    const downloadCSV = () => {
        const headers = ['Fecha', 'Hora', 'Latitud', 'Longitud'];
        const rows = pathCoordinates.map(item => [
            formatDate(item.timestamp).split(' ')[0],
            formatDate(item.timestamp).split(' ')[1],
            item.latitude,
            item.longitude
        ]);

        const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", `historical_movements_${startDate}_${endDate}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    useEffect(() => {
        if (pathCoordinates.length > 0) {
            const map = new MapboxGL.Map({
                container: 'map',
                style: 'mapbox://styles/mapbox/streets-v11',
                center: [pathCoordinates[0].longitude, pathCoordinates[0].latitude],
                zoom: 13
            });

            const coordinates = pathCoordinates.map(({ latitude, longitude }) => [longitude, latitude]);

            map.on('load', () => {
                map.addSource('route', {
                    type: 'geojson',
                    data: {
                        type: 'Feature',
                        properties: {},
                        geometry: {
                            type: 'LineString',
                            coordinates: coordinates
                        }
                    }
                });

                map.addLayer({
                    id: 'route',
                    type: 'line',
                    source: 'route',
                    layout: {
                        'line-join': 'round',
                        'line-cap': 'round'
                    },
                    paint: {
                        'line-color': '#888',
                        'line-width': 6
                    }
                });

                coordinates.forEach(coord => {
                    new MapboxGL.Marker()
                        .setLngLat(coord)
                        .addTo(map);
                });
            });

            return () => map.remove();
        }
    }, [pathCoordinates]);

    return (
        <div>
            <Header title="Consulta Histórica de Movimientos en Exterior" />
            
            <div className="search-container">
                <div className="device-selection">
                    <h3>Seleccionar Dispositivo</h3>
                    <select onChange={(e) => {
                        setSelectedDeviceId(e.target.value);
                        setHistoricalDataError(null);
                    }}>
                        <option value="">Seleccionar...</option>
                        {devices.map(device => (
                            <option key={device.id} value={device.id}>{device.device_asignado}</option>
                        ))}
                    </select>
                </div>
                <div className="date-selection">
                    <input
                        type="datetime-local"
                        value={startDate}
                        onChange={e => setStartDate(e.target.value)}
                        placeholder="Start Date and Time"
                    />
                    <input
                        type="datetime-local"
                        value={endDate}
                        onChange={e => setEndDate(e.target.value)}
                        placeholder="End Date and Time"
                    />
                    <button onClick={handleSearch}>Buscar</button>
                    <button onClick={downloadCSV} disabled={!isDataAvailable}>Descargar Resultados</button>
                </div>
            </div>

            {historicalDataError && <div className="error-message">Error: {historicalDataError}</div>}

            <div id="map" className="map-container"></div>

            {pathCoordinates.length > 0 && (
                <div className="data-table-container">
                    <h2>Tabla de Datos de Ubicaciones</h2>
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Fecha</th>
                                <th>Hora</th>
                                <th>Latitud</th>
                                <th>Longitud</th>
                            </tr>
                        </thead>
                        <tbody>
                            {pathCoordinates.map(({ latitude, longitude, timestamp }, index) => (
                                <tr key={index}>
                                    <td>{formatDate(timestamp).split(' ')[0]}</td>
                                    <td>{formatDate(timestamp).split(' ')[1]}</td>
                                    <td>{latitude}</td>
                                    <td>{longitude}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default HistoricalMovementsSearch;
