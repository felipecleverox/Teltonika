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
    console.log('GPS Data Received:', JSON.stringify(gpsDatas, null, 2));  // Log detallado de los datos recibidos

    try {
        for (const gpsData of gpsDatas) {
            console.log('Processing GPS Data:', JSON.stringify(gpsData, null, 2));  // Añadir log para ver los datos individuales
            const beacons = gpsData['ble.beacons'] || [];
            console.log('Beacons:', JSON.stringify(beacons, null, 2));  // Añadir log para ver los beacons

            const beaconExists = beacons.some(beacon => beacon.id === "0C403019-61C7-55AA-B7EA-DAC30C720055");
            if (beaconExists) {
                console.log('Beacon 0C403019-61C7-55AA-B7EA-DAC30C720055 found!');
            } else {
                console.log('Beacon 0C403019-61C7-55AA-B7EA-DAC30C720055 not found!');
            }

            const result = await pool.query(
                'INSERT INTO gps_data (ble_beacons, channel_id, codec_id, device_id, device_name, device_type_id, event_enum, event_priority_enum, ident, peer, altitude, direction, latitude, longitude, satellites, speed, protocol_id, server_timestamp, timestamp) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
                [
                    JSON.stringify(beacons),
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
            console.log('Data inserted successfully:', JSON.stringify(result, null, 2));
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
        SELECT device_id, latitude, longitude, timestamp AS unixTimestamp
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

// Endpoint para obtener beacons activos
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

// Nuevo endpoint para buscar entradas y salidas de beacons para "Personal 3"
app.get('/api/beacon-entries-exits', async (req, res) => {
    const { startDate, endDate, person } = req.query;

    console.log('Received search request:', { startDate, endDate, person }); // Registro de depuración

    let beaconId;
    let sector;

    switch (person) {
        case 'Personal 1':
            beaconId = 'ID_BEACON_PERSONAL_1'; // Asegúrate de usar el ID correcto
            sector = 'Sector Personal 1';
            break;
        case 'Personal 2':
            beaconId = 'E9EB8F18-61C7-55AA-9496-3AC30C720055';
            sector = 'E/S Bodega';
            break;
        case 'Personal 3':
            beaconId = '0C403019-61C7-55AA-B7EA-DAC30C720055';
            sector = 'Oficina Seguridad (NOC)';
            break;
        // Agrega más casos si es necesario
        default:
            return res.status(400).json({ error: 'Invalid person selected' });
    }

    const query = `
        SELECT timestamp, ble_beacons
        FROM gps_data
        WHERE device_name = '352592573522828 (autocreated)'
          AND timestamp BETWEEN ? AND ?
        ORDER BY timestamp ASC
    `;

    const startTimestamp = new Date(startDate).getTime() / 1000; // Convertir a UNIX timestamp
    const endTimestamp = new Date(endDate).getTime() / 1000; // Convertir a UNIX timestamp

    console.log('Converted Timestamps:', { startTimestamp, endTimestamp }); // Registro de depuración

    const params = [startTimestamp, endTimestamp];

    try {
        const [results] = await pool.query(query, params);
        console.log('Query results:', results); // Registro de depuración

        let entriesExits = [];
        let inSector = false;
        let entryTime = null;
        let noDetectCount = 0;

        results.forEach((record, index) => {
            const beacons = JSON.parse(record.ble_beacons || '[]');
            const detected = beacons.some(beacon => beacon.id === beaconId);

            if (detected) {
                noDetectCount = 0;

                if (!inSector) {
                    inSector = true;
                    entryTime = record.timestamp * 1000; // Convertir a milisegundos para Date
                }
            } else {
                noDetectCount++;

                if (inSector && noDetectCount >= 2) {
                    inSector = false;
                    entriesExits.push({ beaconId, sector, entrada: entryTime, salida: record.timestamp * 1000 });
                }
            }
        });

        if (inSector && entryTime) {
            entriesExits.push({ beaconId, sector, entrada: entryTime, salida: null });
        }

        console.log('Entries and Exits:', entriesExits); // Registro de depuración
        res.json(entriesExits);
    } catch (error) {
        console.error('Error processing beacon entries and exits:', error);
        res.status(500).send('Server Error');
    }
});


// Start the server
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
