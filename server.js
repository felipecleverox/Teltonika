// server.js

// Import necessary libraries
const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const jwt = require('jsonwebtoken');
const bodyParser = require('body-parser'); // Importar body-parser

// Create an Express application
const app = express();

// Agregar Socket.IO
const http = require('http');
const server = http.createServer(app);
const { Server } = require('socket.io');
const io = new Server(server, {
  cors: {
    origin: "*", // Ajustar esto según tu configuración de CORS
  }
});

// Configurar Socket.IO
io.on('connection', (socket) => {
  console.log('A user connected');
  socket.on('disconnect', () => {
    console.log('User disconnected');
  });
});
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
app.use(bodyParser.urlencoded({ extended: false })); // Twilio envía datos en formato URL-encoded
app.use(bodyParser.json()); // También puedes necesitar esto para manejar JSON

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
      

      // Identificar el tipo de registro
      const isSensorData = gpsData.hasOwnProperty('battery.level');

      // Construir la consulta de inserción
      let query = '';
      let params = [];

      if (isSensorData) {
        // Si es un registro con datos de sensores
        query = `
          INSERT INTO gps_data (ble_beacons, channel_id, codec_id, device_id, device_name, device_type_id, event_priority_enum, ident, peer, altitude, direction, latitude, longitude, satellites, speed, protocol_id, server_timestamp, timestamp, battery_level, battery_voltage, ble_sensor_humidity_1, ble_sensor_humidity_2, ble_sensor_humidity_3, ble_sensor_humidity_4, ble_sensor_low_battery_status_1, ble_sensor_magnet_status_1, ble_sensor_temperature_1, ble_sensor_temperature_2, ble_sensor_temperature_3, ble_sensor_temperature_4, bluetooth_state_enum, gnss_state_enum, gnss_status, gsm_mcc, gsm_mnc, gsm_operator_code, gsm_signal_level, movement_status, position_hdop, position_pdop, position_valid, sleep_mode_enum, custom_param_116)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        params = [
          JSON.stringify(beacons),
          gpsData['channel.id'],
          gpsData['codec.id'],
          gpsData['device.id'],
          gpsData['device.name'],
          gpsData['device.type.id'],
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
          gpsData.timestamp,
          gpsData['battery.level'],
          gpsData['battery.voltage'],
          gpsData['ble.sensor.humidity.1'],
          gpsData['ble.sensor.humidity.2'],
          gpsData['ble.sensor.humidity.3'],
          gpsData['ble.sensor.humidity.4'],
          gpsData['ble.sensor.low.battery.status.1'],
          gpsData['ble.sensor.magnet.status.1'],
          gpsData['ble.sensor.temperature.1'],
          gpsData['ble.sensor.temperature.2'],
          gpsData['ble.sensor.temperature.3'],
          gpsData['ble.sensor.temperature.4'],
          gpsData['bluetooth.state.enum'],
          gpsData['gnss.state.enum'],
          gpsData['gnss.status'],
          gpsData['gsm.mcc'],
          gpsData['gsm.mnc'],
          gpsData['gsm.operator.code'],
          gpsData['gsm.signal.level'],
          gpsData['movement.status'],
          gpsData['position.hdop'],
          gpsData['position.pdop'],
          gpsData['position.valid'],
          gpsData['sleep.mode.enum'],
          gpsData['custom.param.116']
        ];
      } else {
        // Si es un registro de posición
        query = `
          INSERT INTO gps_data (ble_beacons, channel_id, codec_id, device_id, device_name, device_type_id, event_enum, event_priority_enum, ident, peer, altitude, direction, latitude, longitude, satellites, speed, protocol_id, server_timestamp, timestamp)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        params = [
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
        ];
      }

      const result = await pool.query(query, params);
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
    if (!device_id) {
      console.log('Error: device_id is required');
      return res.status(400).send('device_id is required');
    }

    console.log('Received device_id:', device_id);

    const [lastKnownPosition] = await pool.query(`
      SELECT device_id, latitude, longitude, timestamp * 1000 AS unixTimestamp
      FROM gps_data
      WHERE device_name = ?
      ORDER BY timestamp DESC
      LIMIT 1
    `, [device_id]);

    if (lastKnownPosition.length === 0) {
      console.log('Error: No data available for device_name:', device_id);
      return res.status(404).send('No data available');
    }

    console.log('Last known position:', lastKnownPosition);

    const [lastCoordinateChange] = await pool.query(`
      SELECT timestamp * 1000 AS changeTimestamp
      FROM gps_data
      WHERE (latitude != ? OR longitude != ?) AND device_name = ?
      ORDER BY timestamp DESC
      LIMIT 1
    `, [lastKnownPosition[0].latitude || defaultPosition.lat, lastKnownPosition[0].longitude || defaultPosition.lng, device_id]);

    console.log('Last coordinate change:', lastCoordinateChange);

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

// Endpoint to search for beacon entries and exits for a specific device
app.get('/api/beacon-entries-exits', async (req, res) => {
  const { startDate, endDate, device_id } = req.query;

  console.log("Received search request:", { startDate, endDate, device_id });

  const startTimestamp = new Date(startDate).getTime() / 1000;
  const endTimestamp = new Date(endDate).getTime() / 1000;

  console.log("Converted timestamps:", { startTimestamp, endTimestamp });

  const query = `
        SELECT timestamp, ble_beacons
        FROM gps_data
        WHERE ident = ? AND timestamp BETWEEN ? AND ? AND ble_beacons != "[]"
        ORDER BY timestamp ASC
    `;

  try {
    const [results] = await pool.query(query, [device_id, startTimestamp, endTimestamp]);
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

// Endpoint para obtener los datos de beacons
app.get('/api/beacons', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM beacons');
    res.json(rows);
  } catch (error) {
    console.error('Error fetching beacons:', error);
    res.status(500).json({ error: 'Error fetching beacons' });
  }
});

// Endpoint para obtener los estados de detección de beacons
app.get('/api/beacons-detection-status', async (req, res) => {
  const { startDate, endDate } = req.query;
  
  if (!startDate || !endDate) {
    return res.status(400).send('startDate and endDate are required');
  }

  try {
    const query = `
      SELECT *
      FROM beacons_detection_status
      WHERE status_timestamp BETWEEN ? AND ?
    `;
    const [rows] = await pool.query(query, [startDate, endDate]);
    res.json(rows);
  } catch (error) {
    console.error('Error fetching beacons detection status:', error);
    res.status(500).json({ error: 'Error fetching beacons detection status' });
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

// Zapier function to format timestamp
function formatTimestamp(timestamp) {
  const date = new Date(timestamp);
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  const hh = String(date.getHours()).padStart(2, '0');
  const min = String(date.getMinutes()).padStart(2, '0');
  const ss = String(date.getSeconds()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd} ${hh}:${min}:${ss}`;
}

// Endpoint to receive SMS data
app.post('/sms', async (req, res) => {
  console.log('Request Headers:', req.headers);
  console.log('Request Body:', req.body);

  if (typeof req.body !== 'object' || !req.body.From || !req.body.Body) {
    console.log('Received incorrect data format:', req.body);
    return res.status(400).json({ error: 'Invalid data format', received: req.body });
  }

  try {
    const deviceId = req.body.From;
    const message = req.body.Body;
    const timestamp = req.body.Timestamp || new Date().toISOString();

    console.log('Parsed SMS:', { deviceId, message, timestamp });

    if (!deviceId || !message) {
      console.log('Invalid data format', req.body);
      return res.status(400).json({ error: 'Invalid data format', received: req.body });
    }

    const formattedTimestamp = formatTimestamp(timestamp);

    const connection = await pool.getConnection();
    try {
      const [result] = await connection.query(
        'INSERT INTO sms_data (device_id, message, timestamp) VALUES (?, ?, ?)',
        [deviceId, message, formattedTimestamp]
      );
      console.log('SMS inserted successfully:', { id: result.insertId });

      // Emitir evento de nuevo SMS
      io.emit('new_sms', { id: result.insertId, deviceId, message, timestamp: formattedTimestamp });

      res.status(201).json({ id: result.insertId });
    } catch (queryError) {
      console.error('Error executing query:', queryError);
      res.status(500).json({ error: 'Database Error' });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Error storing SMS:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Endpoint to fetch SMS data
app.get('/api/sms-data', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM sms_data');
    res.json(rows);
  } catch (error) {
    console.error('Error fetching SMS data:', error);
    res.status(500).json({ error: 'Error fetching SMS data' });
  }
});
// Helper function to format timestamp
function formatTimestamp(timestamp) {
  const date = new Date(timestamp);
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  const hh = String(date.getHours()).padStart(2, '0');
  const min = String(date.getMinutes()).padStart(2, '0');
  const ss = String(date.getSeconds()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd} ${hh}:${min}:${ss}`;
}
// Endpoint to handle Flespi webhook
app.post('/flespi-webhook', async (req, res) => {
  const { "ble.sensor.magnet.status.1": magnetStatus, "device.id": deviceId } = req.body;

  console.log('Webhook Data Received:', req.body);

  if (magnetStatus !== undefined && deviceId) {
    try {
      let result;
      const timestamp = new Date().toISOString();

      if (magnetStatus) {
        // Puerta abierta
        result = await pool.query(
          'INSERT INTO puertas (Puerta_Sector, Timestamp_Apertura) VALUES (?, ?)',
          [deviceId, timestamp]
        );
        console.log('Puerta abierta registrada:', result);
      } else {
        // Puerta cerrada
        result = await pool.query(
          'UPDATE puertas SET Timestamp_Cierre = ? WHERE Puerta_Sector = ? AND Timestamp_Cierre IS NULL',
          [timestamp, deviceId]
        );
        console.log('Puerta cerrada registrada:', result);
      }

      res.sendStatus(200);
    } catch (error) {
      console.error('Error processing webhook data:', error);
      res.status(500).send('Server Error');
    }
  } else {
    res.status(400).send('Invalid data format');
  }
});


// Start the server
server.listen(port, '0.0.0.0', () => {
  console.log(`Server running on port ${port}`);
});
