// server.js

// Import necessary libraries
const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt'); // Import bcrypt
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const jwt = require('jsonwebtoken');

// Create an Express application
const app = express();

// Define the port to listen on (using environment variable or default port 1337)
const port = process.env.PORT || 1337;

// Create a MySQL connection pool with configuration
const pool = mysql.createPool({
    host: 'localhost', // Hostname of the MySQL server
    user: 'root', // Username for the MySQL database
    password: 'admin', // Password for the MySQL database
    database: 'teltonika', // Name of the MySQL database
    waitForConnections: true, // Wait for available connections
    connectionLimit: 10, // Maximum number of connections in the pool
    queueLimit: 0 // Limit for waiting connections in the queue
});

// Middleware to enable CORS for all origins
app.use(cors());

// Middleware to parse JSON request bodies
app.use(express.json());

// Endpoint to receive GPS data from Teltonika devices
app.post('/gps-data', async (req, res) => {
    const gpsDatas = req.body; // Get the GPS data from the request body

    console.log('GPS Data Received:', JSON.stringify(gpsDatas, null, 2)); // Log the received data in a formatted way

    try {
        // Iterate over each GPS data object
        for (const gpsData of gpsDatas) {
            console.log('Processing GPS Data:', JSON.stringify(gpsData, null, 2)); // Log the individual GPS data object

            // Extract the beacons array, if present
            const beacons = gpsData['ble.beacons'] || [];
            console.log('Beacons:', JSON.stringify(beacons, null, 2)); // Log the beacon data

            // Check if a specific beacon exists in the array
            const beaconExists = beacons.some(beacon => beacon.id === "0C403019-61C7-55AA-B7EA-DAC30C720055");
            if (beaconExists) {
                console.log('Beacon 0C403019-61C7-55AA-B7EA-DAC30C720055 found!');
            } else {
                console.log('Beacon 0C403019-61C7-55AA-B7EA-DAC30C720055 not found!');
            }

            // Construct the SQL query to insert data into the `gps_data` table
            const result = await pool.query(
                'INSERT INTO gps_data (ble_beacons, channel_id, codec_id, device_id, device_name, device_type_id, event_enum, event_priority_enum, ident, peer, altitude, direction, latitude, longitude, satellites, speed, protocol_id, server_timestamp, timestamp) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
                [
                    JSON.stringify(beacons), // Store beacon data as a JSON string
                    gpsData['channel.id'], // Get channel ID from the data
                    gpsData['codec.id'], // Get codec ID from the data
                    gpsData['device.id'], // Get device ID from the data
                    gpsData['device.name'], // Get device name from the data
                    gpsData['device.type.id'], // Get device type ID from the data
                    gpsData['event.enum'], // Get event enum from the data
                    gpsData['event.priority.enum'], // Get event priority enum from the data
                    gpsData.ident, // Get ident from the data
                    gpsData.peer, // Get peer from the data
                    gpsData['position.altitude'], // Get altitude from the data
                    gpsData['position.direction'], // Get direction from the data
                    gpsData['position.latitude'], // Get latitude from the data
                    gpsData['position.longitude'], // Get longitude from the data
                    gpsData['position.satellites'], // Get satellite count from the data
                    gpsData['position.speed'], // Get speed from the data
                    gpsData['protocol.id'], // Get protocol ID from the data
                    gpsData['server.timestamp'], // Get server timestamp from the data
                    gpsData.timestamp // Get timestamp from the data
                ]
            );

            console.log('Data inserted successfully:', JSON.stringify(result, null, 2)); // Log the insertion result
        }

        // Send a 200 status code to the client to indicate success
        res.sendStatus(200);
    } catch (error) {
        console.error('Error inserting data:', error); // Log any error that occurred during the insertion
        res.status(500).send('Server Error'); // Send a 500 status code and an error message to the client
    }
});

// Endpoint for querying GPS data with filters
app.get('/api/get-gps-data', async (req, res) => {
    const { startDate, endDate } = req.query; // Get start and end dates from query parameters

    // Construct the SQL query to select data within the specified time range
    const query = `
        SELECT device_id, latitude, longitude, timestamp AS unixTimestamp
        FROM gps_data
        WHERE timestamp BETWEEN ? AND ?
    `;

    // Define the parameters for the SQL query
    const params = [parseInt(startDate), parseInt(endDate)];

    console.log('Query Params:', { startDate, endDate }); // Log the query parameters
    console.log('SQL Query:', query); // Log the SQL query
    console.log('SQL Params:', params); // Log the SQL query parameters

    try {
        // Execute the SQL query and retrieve the results
        const [results] = await pool.query(query, params);
        console.log('Query Results:', results); // Log the query results

        // Send the results as JSON to the client
        res.json(results);
    } catch (error) {
        console.error('Error fetching GPS data:', error); // Log any error that occurred during the query execution
        res.status(500).send('Server Error'); // Send a 500 status code and an error message to the client
    }
});

// Endpoint to get the last known position of a Teltonika device
app.get('/api/last-known-position', async (req, res) => {
    try {
        // Query to get the most recent data entry
        const [lastKnownPosition] = await pool.query(`
            SELECT device_id, latitude, longitude, timestamp * 1000 AS unixTimestamp
            FROM gps_data
            ORDER BY timestamp DESC
            LIMIT 1
        `);

        if (lastKnownPosition.length === 0) {
            return res.status(404).send('No data available');
        }

        // Query to get the timestamp of the last change in coordinates
        const [lastCoordinateChange] = await pool.query(`
            SELECT timestamp * 1000 AS changeTimestamp
            FROM gps_data
            WHERE latitude != ? OR longitude != ?
            ORDER BY timestamp DESC
            LIMIT 1
        `, [lastKnownPosition[0].latitude, lastKnownPosition[0].longitude]);

        if (lastCoordinateChange.length === 0) {
            return res.status(404).send('No coordinate change data available');
        }

        res.json({
            ...lastKnownPosition[0],
            changeTimestamp: lastCoordinateChange[0].changeTimestamp
        });
    } catch (error) {
        console.error('Error fetching last known position:', error);
        res.status(500).send('Server Error');
    }
});

// Endpoint to get active beacons
app.get('/api/active-beacons', async (req, res) => {
    try {
        // Construct the SQL query to select the latest `gps_data` record containing beacon data
        const [latestRecord] = await pool.query(`
            SELECT ble_beacons FROM gps_data
            where ble_beacons != '[]'
            ORDER BY timestamp DESC
            LIMIT 1
        `);

        console.log('Latest Record:', latestRecord); // Log the latest record

        // Check if there is a valid latest record with beacon data
        if (latestRecord.length && latestRecord[0].ble_beacons && latestRecord[0].ble_beacons !== '[]') {
            // Parse the beacon data from the JSON string
            const beaconsData = JSON.parse(latestRecord[0].ble_beacons);

            // Extract the active beacon IDs
            const activeBeaconIds = beaconsData.map(beacon => beacon.id);
            console.log('Active Beacon IDs:', activeBeaconIds); // Log the active beacon IDs

            // Send the active beacon IDs as JSON to the client
            res.json({ activeBeaconIds });
        } else {
            console.log('No active beacons found.'); // Log if no active beacons are found
            res.json({ activeBeaconIds: [] }); // Send an empty array to the client
        }
    } catch (error) {
        console.error('Error fetching active beacons:', error); // Log any error that occurred during the query execution
        res.status(500).send('Server Error'); // Send a 500 status code and an error message to the client
    }
});

// Endpoint to search for beacon entries and exits for a specific person
app.get('/api/beacon-entries-exits', async (req, res) => {
    const { startDate, endDate, person } = req.query; // Get the search parameters from query parameters

    console.log("Received search request:", { startDate, endDate, person }); // Log the received search request

    // Convert the start and end dates to timestamps
    const startTimestamp = new Date(startDate).getTime() / 1000;
    const endTimestamp = new Date(endDate).getTime() / 1000;

    console.log("Converted timestamps:", { startTimestamp, endTimestamp }); // Log the converted timestamps

    // Construct the SQL query to search for beacon entries and exits
    const query = `
        SELECT timestamp, ble_beacons
        FROM gps_data
        WHERE device_name = ? AND timestamp BETWEEN ? AND ? AND ble_beacons != "[]"
        ORDER BY timestamp ASC
    `;

    try {
        // Execute the SQL query and retrieve the results
        const [results] = await pool.query(query, [person, startTimestamp, endTimestamp]);
        console.log("Query results:", results); // Log the query results

        // Process the results to identify beacon entries and exits
        const processedResults = [];
        let currentBeacon = null;
        let entryTimestamp = null;

        results.forEach(record => {
            const beacons = JSON.parse(record.ble_beacons || '[]'); // Parse the beacon data
            if (beacons.length > 0) {
                const beacon = beacons[0]; // Assume only one beacon for simplicity
                if (currentBeacon === null || beacon.id !== currentBeacon.id) {
                    // If the beacon is different from the previous one, process the previous beacon's data
                    if (currentBeacon !== null) {
                        processedResults.push({
                            beaconId: currentBeacon.id,
                            sector: getSector(currentBeacon.id), // Get the sector name using the helper function
                            entrada: entryTimestamp, // Store the entry timestamp
                            salida: record.timestamp * 1000, // Store the exit timestamp
                            tiempoPermanencia: record.timestamp * 1000 - entryTimestamp, // Calculate permanence time
                        });
                    }
                    // Update the current beacon and entry timestamp
                    currentBeacon = beacon;
                    entryTimestamp = record.timestamp * 1000;
                }
            }
        });

        // Process the data for the last beacon
        if (currentBeacon !== null) {
            processedResults.push({
                beaconId: currentBeacon.id,
                sector: getSector(currentBeacon.id), // Get the sector name using the helper function
                entrada: entryTimestamp, // Store the entry timestamp
                salida: null, // Mark the exit as null if the person is still in the sector
                tiempoPermanencia: 'En progreso', // Set permanence as "In progress"
            });
        }

        console.log("Processed results:", processedResults); // Log the processed results

        // Send the processed results as JSON to the client
        res.json(processedResults);
    } catch (error) {
        console.error('Error fetching beacon entries and exits:', error); // Log any error that occurred during the query execution
        res.status(500).send('Server Error'); // Send a 500 status code and an error message to the client
    }
});

// Helper function to get sector name based on beacon ID
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

// Endpoint to get the oldest timestamp for a specific active beacon
app.get('/api/oldest-active-beacon-detections', async (req, res) => {
    try {
        // Get the active beacon ID from the query parameters
        const activeBeaconId = req.query.activeBeaconId;
        if (!activeBeaconId) {
            // Return a 400 error if the beacon ID is missing
            return res.status(400).send('activeBeaconId is required');
        }

        // Construct the SQL query to select all records containing beacon data
        const query = `
            SELECT timestamp, ble_beacons
            FROM gps_data
            WHERE ble_beacons != '[]'
            ORDER BY timestamp DESC
        `;

        // Execute the SQL query and retrieve the results
        const [results] = await pool.query(query);

        let foundBeacon = false; // Flag to track if the beacon has been found
        let timestamp = null; // Variable to store the oldest timestamp

        // Iterate through the results in reverse order
        for (let i = 0; i < results.length; i++) {
            const record = results[i];
            const beacons = JSON.parse(record.ble_beacons || '[]'); // Parse the beacon data

            // Check if the active beacon is present in the current record
            if (beacons.some(beacon => beacon.id === activeBeaconId)) {
                // If the beacon is found, set the flag to true
                if (!foundBeacon) {
                    foundBeacon = true;
                }
            } else if (foundBeacon) {
                // If the beacon is not found and the flag is true, it means the beacon has been absent
                // Store the timestamp of the previous record where the beacon was present
                timestamp = record.timestamp * 1000;
                break;
            }
        }

        // Send the oldest timestamp as JSON to the client
        if (timestamp) {
            res.json({ [activeBeaconId]: { timestamp } });
        } else {
            // Send a 404 error if no matching records are found
            res.status(404).send('No matching records found');
        }
    } catch (error) {
        console.error('Error fetching oldest beacon detections:', error); // Log any error that occurred during the query execution
        res.status(500).send('Server Error'); // Send a 500 status code and an error message to the client
    }
});

// Endpoint para obtener la lista de sectores
app.get('/api/sectores', async (req, res) => {
    try {
        const [results] = await pool.query('SELECT * FROM sectores');
        res.json(results);
    } catch (error) {
        console.error('Error fetching sectors:', error);
        res.status(500).send('Server Error');
    }
});

// Endpoint para obtener la configuración
app.get('/api/configuracion', async (req, res) => {
    try {
        const [results] = await pool.query('SELECT * FROM configuracion');
        res.json(results);
    } catch (error) {
        console.error('Error fetching configuration:', error);
        res.status(500).send('Server Error');
    }
});

// Endpoint para actualizar la configuración
app.post('/api/configuracion', async (req, res) => {
    const configuraciones = req.body; // Array de configuraciones

    try {
        // Eliminar configuraciones existentes
        await pool.query('TRUNCATE TABLE configuracion');

        // Insertar nuevas configuraciones
        for (const config of configuraciones) {
            await pool.query(
                'INSERT INTO configuracion (beacon_id, min_tiempo_permanencia, max_tiempo_permanencia, umbral_verde, umbral_amarillo, umbral_rojo) VALUES (?, ?, ?, ?, ?, ?)',
                [
                    config.beacon_id,
                    config.min_tiempo_permanencia,
                    config.max_tiempo_permanencia,
                    config.umbral_verde,
                    config.umbral_amarillo,
                    config.umbral_rojo
                ]
            );
        }

        res.sendStatus(200);
    } catch (error) {
        console.error('Error updating configuration:', error);
        res.status(500).send('Server Error');
    }
});

// Endpoint para obtener los umbrales
app.get('/api/umbrales', async (req, res) => {
    try {
        const [results] = await pool.query('SELECT * FROM umbrales LIMIT 1');
        res.json(results[0]);
    } catch (error) {
        console.error('Error fetching thresholds:', error);
        res.status(500).send('Server Error');
    }
});

// Endpoint para actualizar los umbrales
app.post('/api/umbrales', async (req, res) => {
    const { umbral_verde, umbral_amarillo, umbral_rojo } = req.body;

    try {
        // Eliminar umbrales existentes
        await pool.query('TRUNCATE TABLE umbrales');

        // Insertar nuevos umbrales
        await pool.query(
            'INSERT INTO umbrales (umbral_verde, umbral_amarillo, umbral_rojo) VALUES (?, ?, ?)',
            [umbral_verde, umbral_amarillo, umbral_rojo]
        );

        res.sendStatus(200);
    } catch (error) {
        console.error('Error updating thresholds:', error);
        res.status(500).send('Server Error');
    }
});

// Endpoint for user registration
app.post('/api/register', async (req, res) => {
    const { username, password, email } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);

    try {
        const [existingUser] = await pool.query('SELECT * FROM users WHERE username = ?', [username]);
        if (existingUser.length > 0) {
            return res.status(400).send('Username already exists');
        }

        await pool.query('INSERT INTO users (username, password, email) VALUES (?, ?, ?)', [username, hashedPassword, email]);
        res.sendStatus(201);
    } catch (error) {
        console.error('Error registering user:', error);
        res.status(500).send('Server Error');
    }
});

// Endpoint for user login
app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;

    try {
        const [user] = await pool.query('SELECT * FROM users WHERE username = ?', [username]);
        if (user.length === 0) {
            return res.status(400).send('Invalid username or password');
        }

        const validPassword = await bcrypt.compare(password, user[0].password);
        if (!validPassword) {
            return res.status(400).send('Invalid username or password');
        }

        const token = jwt.sign({ userId: user[0].id }, 'your_jwt_secret', { expiresIn: '1h' });
        res.json({ token });
    } catch (error) {
        console.error('Error logging in user:', error);
        res.status(500).send('Server Error');
    }
});

// Endpoint for password reset request
app.post('/api/request-password-reset', async (req, res) => {
    const { email } = req.body;

    try {
        const [user] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
        if (user.length === 0) {
            return res.status(400).send('User with this email does not exist');
        }

        const resetToken = crypto.randomBytes(32).toString('hex');
        const resetTokenExpiry = Date.now() + 3600000; // Token valid for 1 hour

        await pool.query('UPDATE users SET resetToken = ?, resetTokenExpiry = ? WHERE email = ?', [resetToken, resetTokenExpiry, email]);

        const transporter = nodemailer.createTransport({
            service: 'Gmail',
            auth: {
                user: 'your_email@gmail.com',
                pass: 'your_email_password',
            },
        });

        const mailOptions = {
            from: 'your_email@gmail.com',
            to: email,
            subject: 'Password Reset',
            text: `You requested for a password reset. Use this token to reset your password: ${resetToken}`,
        };

        transporter.sendMail(mailOptions);

        res.send('Password reset email sent');
    } catch (error) {
        console.error('Error requesting password reset:', error);
        res.status(500).send('Server Error');
    }
});

// Endpoint for resetting the password
app.post('/api/reset-password', async (req, res) => {
    const { token, newPassword } = req.body;
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    try {
        const [user] = await pool.query('SELECT * FROM users WHERE resetToken = ? AND resetTokenExpiry > ?', [token, Date.now()]);
        if (user.length === 0) {
            return res.status(400).send('Invalid or expired token');
        }

        await pool.query('UPDATE users SET password = ?, resetToken = NULL, resetTokenExpiry = NULL WHERE id = ?', [hashedPassword, user[0].id]);

        res.send('Password reset successful');
    } catch (error) {
        console.error('Error resetting password:', error);
        res.status(500).send('Server Error');
    }
});

// Start the Express server and listen on the specified port
app.listen(port, '0.0.0.0', () => {
    console.log(`Server running on port ${port}`); // Log the server's running status
});
