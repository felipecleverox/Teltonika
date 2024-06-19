import React, { useState, useEffect } from 'react';

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

    if (loading) return <div>Loading...</div>;
    if (error) return <div>Error: {error}</div>;

    return (
        <div>
            <h1>GPS Data Viewer</h1>
            <input name="deviceId" value={filter.deviceId} onChange={handleInputChange} placeholder="Filter by Device ID" />
            <input type="date" name="startDate" value={filter.startDate} onChange={handleInputChange} />
            <input type="date" name="endDate" value={filter.endDate} onChange={handleInputChange} />
            <button onClick={fetchData}>Apply Filters</button>
            <table>
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
                        <tr key={index}>
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

npm 