import React, { useState, useEffect } from 'react';
import './DataViewer.css'; // Importar la hoja de estilos CSS

function DataViewer() {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filter, setFilter] = useState({ deviceId: '', startDate: '', endDate: '' });

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFilter(prevFilter => ({ ...prevFilter, [name]: value }));
    };

    const fetchData = () => {
        let query = '/api/get-gps-data';
        const params = [];
        if (filter.deviceId) params.push(`deviceId=${filter.deviceId}`);
        if (filter.startDate) params.push(`startDate=${filter.startDate}`);
        if (filter.endDate) params.push(`endDate=${filter.endDate}`);
        if (params.length) query += '?' + params.join('&');

        fetch(query)
            .then(response => response.json())
            .then(data => {
                setData(data);
                setLoading(false);
            })
            .catch(error => {
                setError(error.message);
                setLoading(false);
            });
    };

    useEffect(fetchData, [filter]);

    if (loading) return <div className="message-state">Loading...</div>;
    if (error) return <div className="message-state">Error: {error}</div>;

    return (
        <div className="data-viewer-container">
            <h1>GPS Data Viewer</h1>
            <div className="filters-container">
                <div className="filter-item">
                    <label className="filter-label">Filter by Device ID</label>
                    <input
                        className="filter-input"
                        name="deviceId"
                        value={filter.deviceId}
                        onChange={handleInputChange}
                        placeholder="Device ID"
                    />
                </div>
                <div className="filter-item">
                    <label className="filter-label">Start Date</label>
                    <input
                        className="filter-input"
                        type="date"
                        name="startDate"
                        value={filter.startDate}
                        onChange={handleInputChange}
                    />
                </div>
                <div className="filter-item">
                    <label className="filter-label">End Date</label>
                    <input
                        className="filter-input"
                        type="date"
                        name="endDate"
                        value={filter.endDate}
                        onChange={handleInputChange}
                    />
                </div>
                <button className="apply-filters-button" onClick={fetchData}>Apply Filters</button>
            </div>
            <table className="data-table">
                <thead>
                    <tr>
                        <th>Device ID</th>
                        <th>Latitude</th>
                        <th>Longitude</th>
                        <th>Timestamp</th>
                    </tr>
                </thead>
                <tbody>
                    {data.map((item, index) => (
                        <tr key={index} className={index % 2 === 0 ? 'even-row' : 'odd-row'}>
                            <td>{item.device_id}</td>
                            <td>{item.position_latitude}</td>
                            <td>{item.position_longitude}</td>
                            <td>{item.timestamp}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

export default DataViewer;