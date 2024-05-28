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
            where ble_beacons != '[]'
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

// Endpoint para buscar entradas y salidas de beacons para "Personal 3"
app.get('/api/beacon-entries-exits', async (req, res) => {
    const { startDate, endDate, person } = req.query;

    console.log("Received search request:", { startDate, endDate, person });

    const startTimestamp = new Date(startDate).getTime() / 1000;
    const endTimestamp = new Date(endDate).getTime() / 1000;

    console.log("Converted timestamps:", { startTimestamp, endTimestamp });

    const query = `
        SELECT timestamp, ble_beacons
        FROM gps_data
        WHERE device_name = ? AND timestamp BETWEEN ? AND ? AND ble_beacons != "[]"
        ORDER BY timestamp ASC
    `;

    try {
        const [results] = await pool.query(query, [person, startTimestamp, endTimestamp]);
        console.log("Query results:", results);

        // Procesar resultados para derivar entradas y salidas
        const processedResults = [];
        let currentBeacon = null;
        let entryTimestamp = null;

        results.forEach(record => {
            const beacons = JSON.parse(record.ble_beacons || '[]');
            if (beacons.length > 0) {
                const beacon = beacons[0]; // Asumimos un solo beacon por simplicidad
                if (currentBeacon === null || beacon.id !== currentBeacon.id) {
                    if (currentBeacon !== null) {
                        processedResults.push({
                            beaconId: currentBeacon.id,
                            sector: getSector(currentBeacon.id),
                            entrada: entryTimestamp,
                            salida: record.timestamp * 1000,
                            tiempoPermanencia: record.timestamp * 1000 - entryTimestamp,
                        });
                    }
                    currentBeacon = beacon;
                    entryTimestamp = record.timestamp * 1000;
                }
            }
        });

        if (currentBeacon !== null) {
            processedResults.push({
                beaconId: currentBeacon.id,
                sector: getSector(currentBeacon.id),
                entrada: entryTimestamp,
                salida: null,
                tiempoPermanencia: 'En progreso',
            });
        }

        console.log("Processed results:", processedResults);
        res.json(processedResults);
    } catch (error) {
        console.error('Error fetching beacon entries and exits:', error);
        res.status(500).send('Server Error');
    }
});

// Helper function to get sector by beacon ID
const getSector = (beaconId) => {
    switch (beaconId) {
        case '0C403019-61C7-55AA-B7EA-DAC30C720055':
            return 'E/S Bodega';
        case 'E9EB8F18-61C7-55AA-9496-3AC30C720055':
            return 'Farmacia';
        case 'F7826DA6-BC5B-71E0-893E-4B484D67696F':
            return 'Entrada';
        case 'F7826DA6-BC5B-71E0-893E-6D424369696F':
            return 'Pasillo Central';
        case 'F7826DA6-BC5B-71E0-893E-54654370696F':
            return 'Electro';
        default:
            return 'Unknown';
    }
};

// Start the server
app.listen(port, '0.0.0.0', () => {
    console.log(`Server running on port ${port}`);
});
