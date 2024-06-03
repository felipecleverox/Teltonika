import React, { useState, useEffect } from 'react';
import MapboxGL from 'mapbox-gl';
import axios from 'axios';
import Header from './Header';
import './HistoricalMovementsSearch.css';

MapboxGL.accessToken = 'pk.eyJ1IjoidGhlbmV4dHNlY3VyaXR5IiwiYSI6ImNsd3YxdmhkeDBqZDgybHB2OTh4dmo3Z2EifQ.bpZlTBTa56pF4cPhE3aSzg';

const HistoricalMovementsSearch = () => {
    const [selectedDay, setSelectedDay] = useState('');
    const [startHour, setStartHour] = useState('');
    const [startMinute, setStartMinute] = useState('');
    const [endHour, setEndHour] = useState('');
    const [endMinute, setEndMinute] = useState('');
    const [pathCoordinates, setPathCoordinates] = useState([]);
    const [historicalDataError, setHistoricalDataError] = useState(null);
    const [devices, setDevices] = useState([]);
    const [selectedDeviceId, setSelectedDeviceId] = useState('');
    const [isDataAvailable, setIsDataAvailable] = useState(false);

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
        setIsDataAvailable(false);
        try {
            const startTimestamp = Math.floor(new Date(`${selectedDay}T${startHour.padStart(2, '0')}:${startMinute.padStart(2, '0')}:00`).getTime() / 1000);
            const endTimestamp = Math.floor(new Date(`${selectedDay}T${endHour.padStart(2, '0')}:${endMinute.padStart(2, '0')}:00`).getTime() / 1000);

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
                if (!isNaN(latitude) && !isNaN(longitude)) {
                    return { latitude, longitude, timestamp: item.unixTimestamp };
                }
                return null;
            }).filter(coord => coord !== null);

            setPathCoordinates(newCoordinates);
            setIsDataAvailable(newCoordinates.length > 0);
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
        link.setAttribute("download", `historical_movements_${selectedDay}.csv`);
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
                    <h3>Seleccionar Día</h3>
                    <input
                        type="date"
                        value={selectedDay}
                        onChange={e => setSelectedDay(e.target.value)}
                    />
                    <h3>Seleccionar Rango de Horas y Minutos</h3>
                    <div className="time-selection">
                        <label>Hora Inicio:</label>
                        <input
                            type="number"
                            value={startHour}
                            onChange={e => setStartHour(e.target.value)}
                            placeholder="HH"
                            min="0"
                            max="23"
                        />
                        <input
                            type="number"
                            value={startMinute}
                            onChange={e => setStartMinute(e.target.value)}
                            placeholder="MM"
                            min="0"
                            max="59"
                        />
                        <label>Hora Fin:</label>
                        <input
                            type="number"
                            value={endHour}
                            onChange={e => setEndHour(e.target.value)}
                            placeholder="HH"
                            min="0"
                            max="23"
                        />
                        <input
                            type="number"
                            value={endMinute}
                            onChange={e => setEndMinute(e.target.value)}
                            placeholder="MM"
                            min="0"
                            max="59"
                        />
                    </div>
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
