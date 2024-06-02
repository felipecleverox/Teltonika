// server.js

// Import necessary libraries
const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const jwt = require('jsonwebtoken');

// Create an Express application
const app = express();

// Define the port to listen on
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

// Define default position
const defaultPosition = { lat: -33.4489, lng: -70.6693 };

// Middleware
app.use(cors());
app.use(express.json());

// Endpoint to receive GPS data
app.post('/gps-data', async (req, res) => {
  const gpsDatas = req.body;

  console.log('GPS Data Received:', JSON.stringify(gpsDatas, null, 2));

  try {
    for (const gpsData of gpsDatas) {
      console.log('Processing GPS Data:', JSON.stringify(gpsData, null, 2));

      const beacons = gpsData['ble.beacons'] || [];
      console.log('Beacons:', JSON.stringify(beacons, null, 2));

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

// Endpoint to get the last known position
app.get('/api/last-known-position', async (req, res) => {
  const { device_id } = req.query;
  try {
    // Validar que el parámetro device_id esté presente
    if (!device_id) {
      console.log('Error: device_id is required');
      return res.status(400).send('device_id is required');
    }

    console.log('Received device_id:', device_id);

    // Consulta para obtener la última posición conocida del dispositivo
    const [lastKnownPosition] = await pool.query(`
      SELECT device_id, latitude, longitude, timestamp * 1000 AS unixTimestamp
      FROM gps_data
      WHERE device_name = ?
      ORDER BY timestamp DESC
      LIMIT 1
    `, [device_id]);

    // Verificar si se encontró alguna posición
    if (lastKnownPosition.length === 0) {
      console.log('Error: No data available for device_name:', device_id);
      return res.status(404).send('No data available');
    }

    console.log('Last known position:', lastKnownPosition);

    // Consulta para obtener el último cambio de coordenadas del dispositivo
    const [lastCoordinateChange] = await pool.query(`
      SELECT timestamp * 1000 AS changeTimestamp
      FROM gps_data
      WHERE (latitude != ? OR longitude != ?) AND device_name = ?
      ORDER BY timestamp DESC
      LIMIT 1
    `, [lastKnownPosition[0].latitude || defaultPosition.lat, lastKnownPosition[0].longitude || defaultPosition.lng, device_id]);

    console.log('Last coordinate change:', lastCoordinateChange);

    // Construir la respuesta
    const response = {
      ...lastKnownPosition[0],
      changeTimestamp: lastCoordinateChange.length > 0 ? lastCoordinateChange[0].changeTimestamp : null
    };

    response.latitude = response.latitude !== null ? response.latitude : defaultPosition.lat;
    response.longitude = response.longitude !== null ? response.longitude : defaultPosition.lng;

    console.log('Response:', response);

    res.json(response);
  } catch (error) {
    console.error('Error fetching last known position:', error);
    res.status(500).send('Server Error');
  }
});


// Endpoint to get active beacons
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

// Endpoint to search for beacon entries and exits for a specific person
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

    const processedResults = [];
    let currentBeacon = null;
    let entryTimestamp = null;

    results.forEach(record => {
      const beacons = JSON.parse(record.ble_beacons || '[]');
      if (beacons.length > 0) {
        const beacon = beacons[0];
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
    const activeBeaconId = req.query.activeBeaconId;
    if (!activeBeaconId) {
      return res.status(400).send('activeBeaconId is required');
    }

    const query = `
            SELECT timestamp, ble_beacons
            FROM gps_data
            WHERE ble_beacons != '[]'
            ORDER BY timestamp DESC
        `;

    const [results] = await pool.query(query);

    let foundBeacon = false;
    let timestamp = null;

    for (let i = 0; i < results.length; i++) {
      const record = results[i];
      const beacons = JSON.parse(record.ble_beacons || '[]');

      if (beacons.some(beacon => beacon.id === activeBeaconId)) {
        if (!foundBeacon) {
          foundBeacon = true;
        }
      } else if (foundBeacon) {
        timestamp = record.timestamp * 1000;
        break;
      }
    }

    if (timestamp) {
      res.json({ [activeBeaconId]: { timestamp } });
    } else {
      res.status(404).send('No matching records found');
    }
  } catch (error) {
    console.error('Error fetching oldest beacon detections:', error);
    res.status(500).send('Server Error');
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
  const configuraciones = req.body;

  try {
    await pool.query('TRUNCATE TABLE configuracion');

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
    await pool.query('TRUNCATE TABLE umbrales');

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

// Endpoint to get the list of assigned devices
app.get('/api/devices', async (req, res) => {
  try {
    const [results] = await pool.query('SELECT * FROM devices');
    res.json(results);
  } catch (error) {
    console.error('Error fetching devices:', error);
    res.status(500).send('Server Error');
  }
});

// Start the server
app.listen(port, '0.0.0.0', () => {
  console.log(`Server running on port ${port}`);
});
