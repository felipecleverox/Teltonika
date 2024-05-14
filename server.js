'use strict';

const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');

const app = express();
const port = process.env.PORT || 1337;

// Create a MySQL connection pool
const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: 'admin',
    database: 'teltonika',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Middleware to allow CORS and parse the request body as JSON
app.use(cors());
app.use(express.json());

// Endpoint to receive GPS data
app.post('/gps-data', async (req, res) => {
    const gpsDatas = req.body;
    console.log('GPS Data Received:', gpsDatas);

    try {
        for (const gpsData of gpsDatas) {
            const result = await pool.query(
                'INSERT INTO gps_data (ble_beacons, channel_id, codec_id, device_id, device_name, device_type_id, event_enum, event_priority_enum, ident, peer, altitude, direction, latitude, longitude, satellites, speed, protocol_id, server_timestamp, timestamp) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
                [
                    JSON.stringify(gpsData['ble.beacons']),
                    gpsData['channel.id'],
                    gpsData['codec.id'],
                    gpsData['device.id'],
                    gpsData['device.name'],
                    gpsData['device.type.id'],
                    gpsData['event.enum'],
                    gpsData['event.priority.enum'],
                    gpsData.ident,
                    gpsData.peer,
                    gpsData['position.altitude'],
                    gpsData['position.direction'],
                    gpsData['position.latitude'],
                    gpsData['position.longitude'],
                    gpsData['position.satellites'],
                    gpsData['position.speed'],
                    gpsData['protocol.id'],
                    gpsData['server.timestamp'],
                    gpsData.timestamp
                ]
            );
            console.log('Data inserted successfully:', result);
        }
        res.sendStatus(200);
    } catch (error) {
        console.error('Error inserting data:', error);
        res.status(500).send('Server Error');
    }
});

// Endpoint for querying GPS data with filters
app.get('/api/get-gps-data', async (req, res) => {
    const { startDate, endDate } = req.query;

    const query = `
        SELECT latitude, longitude, timestamp AS unixTimestamp
        FROM gps_data
        WHERE timestamp BETWEEN ? AND ?
    `;

    const params = [parseInt(startDate), parseInt(endDate)];

    console.log('Query Params:', { startDate, endDate });
    console.log('SQL Query:', query);
    console.log('SQL Params:', params);

    try {
        const [results] = await pool.query(query, params);
        console.log('Query Results:', results);
        res.json(results);
    } catch (error) {
        console.error('Error fetching GPS data:', error);
        res.status(500).send('Server Error');
    }
});

// Endpoint para obtener la última posición conocida
app.get('/api/last-known-position', async (req, res) => {
    try {
        const [results] = await pool.query(`
            SELECT device_id, latitude, longitude, timestamp * 1000 AS unixTimestamp
            FROM gps_data
            ORDER BY timestamp DESC
            LIMIT 1
        `);

        console.log("Converted Timestamp to send:", results[0].unixTimestamp);

        if (results.length > 0) {
            res.json(results[0]);
        } else {
            res.status(404).send('No data available');
        }
    } catch (error) {
        console.error('Error fetching last known position:', error);
        res.status(500).send('Server Error');
    }
});

app.get('/api/active-beacons', async (req, res) => {
    try {
        const [latestRecord] = await pool.query(`
            SELECT ble_beacons FROM gps_data
            ORDER BY timestamp DESC
            LIMIT 1
        `);

        console.log('Latest Record:', latestRecord);

        if (latestRecord.length && latestRecord[0].ble_beacons && latestRecord[0].ble_beacons !== '[]') {
            const beaconsData = JSON.parse(latestRecord[0].ble_beacons);
            const activeBeaconIds = beaconsData.map(beacon => beacon.id);
            console.log('Active Beacon IDs:', activeBeaconIds);
            res.json({ activeBeaconIds });
        } else {
            console.log('No active beacons found.');
            res.json({ activeBeaconIds: [] });
        }
    } catch (error) {
        console.error('Error fetching active beacons:', error);
        res.status(500).send('Server Error');
    }
});

// Nuevo endpoint para consultar datos de interiores
app.get('/api/get-interior-data', async (req, res) => {
    const { startDate, endDate, person } = req.query;

    const query = `
        SELECT latitude, longitude, timestamp AS unixTimestamp
        FROM gps_data
        WHERE timestamp BETWEEN ? AND ? AND device_name = ?
    `;

    const params = [parseInt(startDate), parseInt(endDate), person];

    console.log('Query Params:', { startDate, endDate, person });
    console.log('SQL Query:', query);
    console.log('SQL Params:', params);

    try {
        const [results] = await pool.query(query, params);
        console.log('Query Results:', results);
        res.json(results);
    } catch (error) {
        console.error('Error fetching GPS data:', error);
        res.status(500).send('Server Error');
    }
});

// Start the server
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
