'use strict';

const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');

const app = express();
const port = process.env.PORT || 1337;

const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: 'admin',
    database: 'teltonika',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

app.use(cors());
app.use(express.json());

// Logging middleware
app.use((req, res, next) => {
    console.log(`${req.method} ${req.url}`);
    next();
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something broke!');
});

app.post('/gps-data', async (req, res) => {
    let gpsDatas = req.body;
    if (!Array.isArray(gpsDatas)) {
        gpsDatas = [gpsDatas]; // Envuelve en un array si no lo es
    }
    console.log('GPS Data Received:', gpsDatas);

    try {
        for (const gpsData of gpsDatas) {
            const result = await pool.query(
                `INSERT INTO gps_data (ble_beacons, channel_id, codec_id, device_id, device_name, device_type_id, event_enum, event_priority_enum, ident, peer, altitude, direction, latitude, longitude, satellites, speed, protocol_id, server_timestamp, timestamp) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
