// server.js

// Import necessary libraries
const express = require('express'); // Web framework for Node.js
const cors = require('cors'); // Middleware to enable Cross-Origin Resource Sharing
const mysql = require('mysql2/promise'); // MySQL client for Node.js with Promise support
const moment = require('moment-timezone'); // Importar moment-timezone
const bcrypt = require('bcrypt'); // Library to hash passwords
const crypto = require('crypto'); // Library for cryptographic functions
const nodemailer = require('nodemailer'); // Library to send emails
const jwt = require('jsonwebtoken'); // Library to handle JSON Web Tokens

// Create an Express application
const app = express();

// Import and configure Socket.IO for real-time communication
const http = require('http'); // HTTP server
const server = http.createServer(app); // Create HTTP server with Express app
const { Server } = require('socket.io'); // Import Socket.IO
const io = new Server(server, {
  cors: {
    origin: ["http://thenext.ddns.net:3000", "http://localhost:3000"], // Allow both origins
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type"],
    credentials: true
  }
});

// Configure Socket.IO connection and disconnection events
io.on('connection', (socket) => {
  console.log('A user connected'); // Log when a user connects
  socket.on('disconnect', () => {
    console.log('User disconnected'); // Log when a user disconnects
  });
});

// Define the port to listen on, default to 1337 if not specified in environment variables
const port = process.env.PORT || 1337;

// Create a MySQL connection pool for efficient database access
const pool = mysql.createPool({
  host: 'localhost', // Database host
  user: 'root', // Database user
  password: 'admin', // Database password
  database: 'teltonika', // Database name
  waitForConnections: true, // Wait for connections if none are available
  connectionLimit: 10, // Maximum number of connections in the pool
  queueLimit: 0 // No limit on the number of queued connection requests
});

// Define default position coordinates
const defaultPosition = { lat: -33.4489, lng: -70.6693 }; // Coordinates for Santiago, Chile

// Middleware CORS (debe estar antes de otros middleware o rutas)
const corsOptions = {
  origin: ['http://thenext.ddns.net:3000', 'http://localhost:3000'],
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type'],
  credentials: true
};

app.use(cors(corsOptions)); // Enable CORS for all routes

// Otros middleware (deben estar después del middleware CORS)
app.use(express.json()); // Parse JSON request bodies
app.use(express.urlencoded({ extended: false })); // Parse URL-encoded request bodies

// Helper function to get sector name based on beacon ID
// Helper function to get sector name based on beacon ID
const getSector = (beaconId) => {
  switch (beaconId) {
    case '0C403019-61C7-55AA-B7EA-DAC30C720055':
      return 'E/S Bodega'; // Return sector name for specific beacon ID
    case 'E9EB8F18-61C7-55AA-9496-3AC30C720055':
      return 'Farmacia'; // Return sector name for specific beacon ID
    case 'F7826DA6-BC5B-71E0-893E-4B484D67696F':
      return 'Entrada'; // Return sector name for specific beacon ID
    case 'F7826DA6-BC5B-71E0-893E-6D424369696F':
      return 'Pasillo Central'; // Return sector name for specific beacon ID
    case 'F7826DA6-BC5B-71E0-893E-54654370696F':
      return 'Electro'; // Return sector name for specific beacon ID
    default:
      return 'Unknown'; // Return 'Unknown' if beacon ID does not match any case
  }
};

// Convert timestamp to local time in Chile
const convertToLocalTime = (timestamp) => {
  return moment(timestamp * 1000).tz('America/Santiago').format('YYYY-MM-DD HH:mm:ss');
};

// Endpoint to receive GPS data
app.post('/gps-data', async (req, res) => {
  const gpsDatas = req.body;
  console.log('GPS Data Received:', JSON.stringify(gpsDatas, null, 2));

  try {
    for (const gpsData of gpsDatas) {
      const beacons = gpsData['ble.beacons'] || [];
      const isSensorData = gpsData.hasOwnProperty('battery.level');

      let query = '';
      let params = [];

      if (isSensorData) {
        // Insertar datos del sensor en la tabla 'gps_data'
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

        // Ejecutar la inserción en gps_data
        await pool.query(query, params);

        // Insertar en la nueva tabla 'door_status'
        if (gpsData['ble.sensor.magnet.status.1'] !== null && gpsData['ble.sensor.temperature.1'] !== null) {
          const [lastBeaconRecord] = await pool.query(`
            SELECT ubicacion 
            FROM beacons 
            WHERE id LIKE CONCAT('%', 
                JSON_UNQUOTE(JSON_EXTRACT((SELECT ble_beacons 
                                           FROM gps_data 
                                           WHERE id = (SELECT MAX(id) 
                                                       FROM gps_data 
                                                       WHERE ble_beacons IS NOT NULL 
                                                       AND ble_beacons != '[]' 
                                                       AND device_name = ?)
                                           ), '$[0].id')), 
                '%')
          `, [gpsData['device.name']]);

          const sector = lastBeaconRecord.length > 0 ? lastBeaconRecord[0].ubicacion : 'Desconocido';
          const magnetStatus = gpsData['ble.sensor.magnet.status.1'];
          const temperature = gpsData['ble.sensor.temperature.1'];
          const timestamp = convertToLocalTime(gpsData.timestamp); // Convertir a hora local de Chile

          await pool.query(`
            INSERT INTO door_status (sector, magnet_status, temperature, timestamp)
            VALUES (?, ?, ?, ?)
          `, [sector, magnetStatus, temperature, timestamp]);
        }
      } else {
        // Insertar datos de posición en la tabla 'gps_data'
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

        await pool.query(query, params);
      }
    }

    res.status(200).send('GPS Data processed successfully');
  } catch (error) {
    console.error('Error processing GPS data:', error);
    res.status(500).send('Server Error');
  }
});
// Endpoint para obtener los datos más recientes de GPS para un dispositivo específico
app.get('/api/get-latest-gps-data', async (req, res) => {
  const { device_name, startTime, endTime } = req.query;
  
  console.log(`Buscando datos para ${device_name} entre ${startTime} y ${endTime}`);
  
  try {
    const query = `
      SELECT latitude, longitude, timestamp, ble_beacons
      FROM gps_data
      WHERE device_name = ? AND timestamp BETWEEN ? AND ?
      ORDER BY timestamp DESC
      LIMIT 1
    `;
    const [results] = await pool.query(query, [device_name, startTime, endTime]);
    
    console.log(`Resultados para ${device_name}:`, results);
    
    res.json({ data: results });
  } catch (error) {
    console.error('Error fetching latest GPS data:', error);
    res.status(500).send('Server Error');
  }
});

// Definir el endpoint para obtener el estado de las puertas
app.get('/api/door-status', async (req, res) => {
  const { startDate, endDate } = req.query;

  if (!startDate || !endDate) {
    return res.status(400).send('startDate and endDate are required');
  }

  try {
    const query = `
      SELECT sector, magnet_status, temperature, timestamp
      FROM door_status
      WHERE timestamp BETWEEN ? AND ?
    `;
    const [rows] = await pool.query(query, [startDate, endDate]);
    res.json(rows);
  } catch (error) {
    console.error('Error fetching door status:', error);
    res.status(500).send('Server Error');
  }
});

// Endpoint para obtener datos históricos de GPS
app.get('/api/historical-gps-data', async (req, res) => {
  const { device_id, date, startHour, endHour } = req.query;

  // Convertir la fecha y hora a Unix timestamp usando la zona horaria de Chile
  const startDateTime = moment.tz(`${date} ${startHour}:00`, 'YYYY-MM-DD HH:mm:ss', 'America/Santiago').unix();
  const endDateTime = moment.tz(`${date} ${endHour}:59`, 'YYYY-MM-DD HH:mm:ss', 'America/Santiago').unix();

  console.log(`Received request with device_id: ${device_id}, date: ${date}, startHour: ${startHour}, endHour: ${endHour}`);
  console.log(`Constructed datetime range: ${startDateTime} to ${endDateTime}`);

  try {
    const query = `
      SELECT latitude, longitude, timestamp
      FROM gps_data
      WHERE device_name = ? AND timestamp BETWEEN ? AND ?
      ORDER BY timestamp ASC
    `;
    const [results] = await pool.query(query, [device_id, startDateTime, endDateTime]);

    console.log(`Query results: ${JSON.stringify(results)}`);
    if (results.length === 0) {
      console.log(`No data found for device_id: ${device_id} between ${startDateTime} and ${endDateTime}`);
    } else {
      results.forEach(result => {
        result.timestamp = convertToLocalTime(result.timestamp);
      });
    }

    res.json(results);
  } catch (error) {
    console.error('Error fetching historical GPS data:', error);
    res.status(500).send('Server Error');
  }
});


app.get('/api/get-gps-data', async (req, res) => {
  const { startDate, endDate, device_name } = req.query;

  // Agregar logs para verificar los valores de los parámetros recibidos
  console.log('Start Date:', startDate);
  console.log('End Date:', endDate);
  console.log('Device Name:', device_name);

  const query = `
      SELECT device_id, latitude, longitude, timestamp AS unixTimestamp
      FROM gps_data
      WHERE timestamp BETWEEN ? AND ? AND device_name = ?
  `;

  const params = [parseInt(startDate), parseInt(endDate), device_name];

  try {
      const [results] = await pool.query(query, params);
      
      // Agregar logs para verificar los resultados de la consulta
      if (results.length === 0) {
          console.log(`No data found for device_name: ${device_name} between ${startDate} and ${endDate}`);
          return res.json({ data: [], message: 'No data found' });
      }

      console.log('Query Results:', results);

      res.json({ data: results, message: 'Data found' });
  } catch (error) {
      console.error('Error fetching GPS data:', error);
      res.status(500).send('Server Error');
  }
});


// Endpoint to get the last known position
app.get('/api/last-known-position', async (req, res) => {
  // Extract device_id from query parameters
  const { device_id } = req.query;
  
  try {
    // Check if device_id is provided
    if (!device_id) {
      console.log('Error: device_id is required');
      return res.status(400).send('device_id is required');
    }

    // Log the received device_id for debugging purposes
    console.log('Received device_id:', device_id);

    // Query to get the last known position of the device
    const [lastKnownPosition] = await pool.query(`
      SELECT device_id, latitude, longitude, timestamp * 1000 AS unixTimestamp
      FROM gps_data
      WHERE device_name = ?
      ORDER BY timestamp DESC
      LIMIT 1
    `, [device_id]);

    // Check if any data is available for the given device_id
    if (lastKnownPosition.length === 0) {
      console.log('Error: No data available for device_name:', device_id);
      return res.status(404).send('No data available');
    }

    // Log the last known position for debugging purposes
    console.log('Last known position:', lastKnownPosition);

    // Query to get the last coordinate change of the device
    const [lastCoordinateChange] = await pool.query(`
      SELECT timestamp * 1000 AS changeTimestamp
      FROM gps_data
      WHERE (latitude != ? OR longitude != ?) AND device_name = ?
      ORDER BY timestamp DESC
      LIMIT 1
    `, [
      lastKnownPosition[0].latitude || defaultPosition.lat, 
      lastKnownPosition[0].longitude || defaultPosition.lng, 
      device_id
    ]);

    // Log the last coordinate change for debugging purposes
    console.log('Last coordinate change:', lastCoordinateChange);

    // Construct the response object
    const response = {
      ...lastKnownPosition[0],
      changeTimestamp: lastCoordinateChange.length > 0 ? lastCoordinateChange[0].changeTimestamp : null
    };

    // Set default coordinates if latitude or longitude is null
    response.latitude = response.latitude !== null ? response.latitude : defaultPosition.lat;
    response.longitude = response.longitude !== null ? response.longitude : defaultPosition.lng;

    // Log the response object for debugging purposes
    console.log('Response:', response);

    // Send the response as JSON
    res.json(response);
  } catch (error) {
    // Log any errors that occur during the query execution
    console.error('Error fetching last known position:', error);
    // Send a 500 Internal Server Error response if an error occurs
    res.status(500).send('Server Error');
  }
});


// Endpoint to get active beacons
app.get('/api/active-beacons', async (req, res) => {
  try {
    // Query to get the latest record with non-empty ble_beacons from gps_data table
    const [latestRecord] = await pool.query(`
            SELECT ble_beacons FROM gps_data
            WHERE ble_beacons != '[]'
            ORDER BY timestamp DESC
            LIMIT 1
        `);

    // Check if the latest record exists and contains non-empty ble_beacons
    if (latestRecord.length && latestRecord[0].ble_beacons && latestRecord[0].ble_beacons !== '[]') {
      // Parse the ble_beacons JSON string to an array
      const beaconsData = JSON.parse(latestRecord[0].ble_beacons);
      // Extract the IDs of active beacons
      const activeBeaconIds = beaconsData.map(beacon => beacon.id);
      // Send the active beacon IDs as a JSON response
      res.json({ activeBeaconIds });
    } else {
      // Log a message if no active beacons are found
      console.log('No active beacons found.');
      // Send an empty array as the response
      res.json({ activeBeaconIds: [] });
    }
  } catch (error) {
    // Log any errors that occur during the query execution
    console.error('Error fetching active beacons:', error);
    // Send a 500 Internal Server Error response if an error occurs
    res.status(500).send('Server Error');
  }
});


// Endpoint to search for beacon entries and exits for a specific device
app.get('/api/beacon-entries-exits', async (req, res) => {
  // Extract startDate, endDate, and device_id from query parameters
  const { startDate, endDate, device_id } = req.query;

  // Log the received search request for debugging purposes
  console.log("Received search request:", { startDate, endDate, device_id });

  // Convert startDate and endDate to Unix timestamps (seconds since epoch)
  const startTimestamp = new Date(startDate).getTime() / 1000;
  const endTimestamp = new Date(endDate).getTime() / 1000;

  // Log the converted timestamps for debugging purposes
  console.log("Converted timestamps:", { startTimestamp, endTimestamp });

  // SQL query to select timestamp and ble_beacons from gps_data table
  // The query filters records by device_id and timestamp range, and ensures ble_beacons is not empty
  const query = `
        SELECT timestamp, ble_beacons
        FROM gps_data
        WHERE ident = ? AND timestamp BETWEEN ? AND ? AND ble_beacons != "[]"
        ORDER BY timestamp ASC
    `;

  try {
    // Execute the SQL query with the provided parameters
    const [results] = await pool.query(query, [device_id, startTimestamp, endTimestamp]);
    // Log the query results for debugging purposes
    console.log("Query results:", results);

    // Initialize variables to process the results
    const processedResults = [];
    let currentBeacon = null;
    let entryTimestamp = null;

    // Iterate over each record in the query results
    results.forEach(record => {
      // Parse the ble_beacons JSON string to an array
      const beacons = JSON.parse(record.ble_beacons || '[]');
      if (beacons.length > 0) {
        const beacon = beacons[0];
        // Check if the current beacon has changed
        if (currentBeacon === null || beacon.id !== currentBeacon.id) {
          // If there was a previous beacon, add an exit record for it
          if (currentBeacon !== null) {
            processedResults.push({
              beaconId: currentBeacon.id,
              sector: getSector(currentBeacon.id),
              entrada: entryTimestamp,
              salida: record.timestamp * 1000,
              tiempoPermanencia: record.timestamp * 1000 - entryTimestamp,
            });
          }
          // Update the current beacon and entry timestamp
          currentBeacon = beacon;
          entryTimestamp = record.timestamp * 1000;
        }
      }
    });

    // If there is a current beacon, add an entry record for it
    if (currentBeacon !== null) {
      processedResults.push({
        beaconId: currentBeacon.id,
        sector: getSector(currentBeacon.id),
        entrada: entryTimestamp,
        salida: null,
        tiempoPermanencia: 'En progreso',
      });
    }

    // Log the processed results for debugging purposes
    console.log("Processed results:", processedResults);

    // Send the processed results as a JSON response
    res.json(processedResults);
  } catch (error) {
    // Log any errors that occur during the query execution
    console.error('Error fetching beacon entries and exits:', error);
    // Send a 500 Internal Server Error response if an error occurs
    res.status(500).send('Server Error');
  }
});

// Endpoint to get the oldest timestamp for a specific active beacon
app.get('/api/oldest-active-beacon-detections', async (req, res) => {
  try {
    // Extract activeBeaconId from query parameters
    const activeBeaconId = req.query.activeBeaconId;
    if (!activeBeaconId) {
      // If activeBeaconId is not provided, send a 400 Bad Request response
      return res.status(400).send('activeBeaconId is required');
    }

    // SQL query to select timestamp and ble_beacons from gps_data table
    // The query filters records where ble_beacons is not an empty array
    // The results are ordered by timestamp in descending order
    const query = `
            SELECT timestamp, ble_beacons
            FROM gps_data
            WHERE ble_beacons != '[]'
            ORDER BY timestamp DESC
        `;

    // Execute the SQL query
    const [results] = await pool.query(query);

    // Initialize variables to track the beacon detection
    let foundBeacon = false;
    let timestamp = null;

    // Iterate over each record in the query results
    for (let i = 0; i < results.length; i++) {
      const record = results[i];
      // Parse the ble_beacons JSON string to an array
      const beacons = JSON.parse(record.ble_beacons || '[]');

      // Check if the activeBeaconId is present in the current record's beacons
      if (beacons.some(beacon => beacon.id === activeBeaconId)) {
        if (!foundBeacon) {
          // If the beacon is found for the first time, set foundBeacon to true
          foundBeacon = true;
        }
      } else if (foundBeacon) {
        // If the beacon was previously found but is not in the current record
        // Set the timestamp to the current record's timestamp and break the loop
        timestamp = record.timestamp * 1000;
        break;
      }
    }

    // If a timestamp was found, send it as a JSON response
    if (timestamp) {
      res.json({ [activeBeaconId]: { timestamp } });
    } else {
      // If no matching records were found, send a 404 Not Found response
      res.status(404).send('No matching records found');
    }
  } catch (error) {
    // Log any errors that occur during the query execution
    console.error('Error fetching oldest beacon detections:', error);
    // Send a 500 Internal Server Error response if an error occurs
    res.status(500).send('Server Error');
  }
});

// Endpoint para obtener los datos de beacons
app.get('/api/beacons', async (req, res) => {
  try {
    // Ejecutar una consulta SQL para seleccionar todos los registros de la tabla 'beacons'
    const [rows] = await pool.query('SELECT * FROM beacons');
    
    // Enviar los resultados de la consulta como una respuesta JSON
    res.json(rows);
  } catch (error) {
    // Registrar cualquier error que ocurra durante la ejecución de la consulta
    console.error('Error fetching beacons:', error);
    
    // Enviar una respuesta de error 500 (Internal Server Error) con un mensaje de error en formato JSON
    res.status(500).json({ error: 'Error fetching beacons' });
  }
});


// Endpoint para obtener los estados de detección de beacons
app.get('/api/beacons-detection-status', async (req, res) => {
  // Extraer startDate y endDate de los parámetros de la solicitud
  const { startDate, endDate } = req.query;
  
  // Validar que startDate y endDate estén presentes
  if (!startDate || !endDate) {
    return res.status(400).send('startDate and endDate are required');
  }

  try {
    // Definir la consulta SQL para seleccionar registros de la tabla beacons_detection_status
    // La consulta filtra los registros cuyo status_timestamp esté entre startDate y endDate
    const query = `
      SELECT *
      FROM beacons_detection_status
      WHERE status_timestamp BETWEEN ? AND ?
    `;
    
    // Ejecutar la consulta SQL con los parámetros startDate y endDate
    const [rows] = await pool.query(query, [startDate, endDate]);
    
    // Enviar los resultados de la consulta como una respuesta JSON
    res.json(rows);
  } catch (error) {
    // Registrar cualquier error que ocurra durante la ejecución de la consulta
    console.error('Error fetching beacons detection status:', error);
    
    // Enviar una respuesta de error 500 (Internal Server Error) con un mensaje de error en formato JSON
    res.status(500).json({ error: 'Error fetching beacons detection status' });
  }
});


// Endpoint to get the list of assigned devices
app.get('/api/devices', async (req, res) => {
  try {
    // Execute a SQL query to select all records from the 'devices' table
    const [results] = await pool.query('SELECT * FROM devices');
    
    // Send the query results as a JSON response
    res.json(results);
  } catch (error) {
    // Log any errors that occur during the query execution
    console.error('Error fetching devices:', error);
    
    // Send a 500 Internal Server Error response with a message
    res.status(500).send('Server Error');
  }
});


// Endpoint para obtener la lista de sectores
app.get('/api/sectores', async (req, res) => {
  try {
    // Ejecutar una consulta SQL para seleccionar todos los registros de la tabla 'sectores'
    const [results] = await pool.query('SELECT * FROM sectores');
    
    // Enviar los resultados de la consulta como una respuesta JSON
    res.json(results);
  } catch (error) {
    // Registrar cualquier error que ocurra durante la ejecución de la consulta
    console.error('Error fetching sectors:', error);
    
    // Enviar una respuesta de error 500 (Internal Server Error) con un mensaje de error
    res.status(500).send('Server Error');
  }
});


// Endpoint para obtener la configuración
app.get('/api/configuracion', async (req, res) => {
  
  try {
    // Ejecutar una consulta SQL para seleccionar todos los registros de la tabla 'configuracion'
    const [results] = await pool.query('SELECT * FROM configuracion');
    
    // Enviar los resultados de la consulta como una respuesta JSON
    res.json(results);
  } catch (error) {
    // Registrar cualquier error que ocurra durante la ejecución de la consulta
    console.error('Error fetching configuration:', error);
    
    // Enviar una respuesta de error 500 (Internal Server Error) con un mensaje de error
    res.status(500).send('Server Error');
  }
});


// Endpoint para actualizar la configuración
app.post('/api/configuracion', async (req, res) => {
  // Obtener las configuraciones del cuerpo de la solicitud
  const configuraciones = req.body;

  try {
    // Vaciar la tabla 'configuracion' antes de insertar nuevas configuraciones
    await pool.query('TRUNCATE TABLE configuracion');

    // Insertar cada configuración en la tabla 'configuracion'
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

    // Enviar una respuesta de éxito
    res.sendStatus(200);
  } catch (error) {
    // Registrar cualquier error que ocurra durante la actualización de la configuración
    console.error('Error updating configuration:', error);
    
    // Enviar una respuesta de error 500 (Internal Server Error) con un mensaje de error
    res.status(500).send('Server Error');
  }
});

app.get('/api/configuracion_uno_solo/:beaconID', async (req, res) => {
  try {
    // Obtener el beaconID de los parámetros de la URL
    const { beaconID } = req.params;
    
    // Ejecutar una consulta SQL para seleccionar los registros de la tabla 'configuracion' donde el beaconID coincida
    const [results] = await pool.query('SELECT * FROM configuracion WHERE beacon_id = ?', [beaconID]);
    
    // Enviar los resultados de la consulta como una respuesta JSON
    res.json(results);
  } catch (error) {
    // Registrar cualquier error que ocurra durante la ejecución de la consulta
    console.error('Error fetching configuration:', error);
    
    // Enviar una respuesta de error 500 (Internal Server Error) con un mensaje de error
    res.status(500).send('Server Error');
  }
});

// ...

// Endpoint consolidado para obtener sectores, configuración, umbrales y dispositivos
app.get('/api/retrive_MapWithQuadrants_information', async (req, res) => {
  try {
    // Obtener sectores
    const [sectors] = await pool.query('SELECT * FROM sectores');

    // Obtener configuración
    const [configuration] = await pool.query('SELECT * FROM configuracion');

    // Obtener umbrales
    const [thresholds] = await pool.query('SELECT * FROM configuracion');

    // Obtener dispositivos
    const [devices] = await pool.query('SELECT * FROM devices');

    // Obtener personal
    const [personal] = await pool.query('SELECT * FROM personal');

    // Construir el objeto de respuesta consolidada
    const combinedData = {
      sectors,
      configuration,
      thresholds,
      devices,
      personal,  // Añadir los datos de personal aquí
    };

    // Enviar la respuesta consolidada como JSON
    res.json(combinedData);
  } catch (error) {
    console.error('Error fetching combined data:', error);
    res.status(500).send('Server Error');
  }
});


// Endpoint para obtener los umbrales
app.get('/api/umbrales', async (req, res) => {
  try {
    // Ejecutar una consulta SQL para seleccionar el primer registro de la tabla 'umbrales'
    const [results] = await pool.query('SELECT * FROM configuracion LIMIT 1');
    
    // Enviar el primer resultado de la consulta como una respuesta JSON
    res.json(results[0]);
  } catch (error) {
    // Registrar cualquier error que ocurra durante la ejecución de la consulta
    console.error('Error fetching thresholds:', error);
    
    // Enviar una respuesta de error 500 (Internal Server Error) con un mensaje de error
    res.status(500).send('Server Error');
  }
});

// Endpoint para actualizar los umbrales
app.post('/api/umbrales', async (req, res) => {
  // Extraer los umbrales del cuerpo de la solicitud
  const { umbral_verde, umbral_amarillo, umbral_rojo } = req.body;

  try {
    // Vaciar la tabla 'umbrales' antes de insertar nuevos umbrales
    await pool.query('TRUNCATE TABLE configuracion');

    // Insertar los nuevos umbrales en la tabla 'umbrales'
    await pool.query(
      'INSERT INTO umbrales (umbral_verde, umbral_amarillo, umbral_rojo) VALUES (?, ?, ?)',
      [umbral_verde, umbral_amarillo, umbral_rojo]
    );

    // Enviar una respuesta de éxito
    res.sendStatus(200);
  } catch (error) {
    // Registrar cualquier error que ocurra durante la actualización de los umbrales
    console.error('Error updating thresholds:', error);
    
    // Enviar una respuesta de error 500 (Internal Server Error) con un mensaje de error
    res.status(500).send('Server Error');
  }
});

// Endpoint for user registration
app.post('/api/register', async (req, res) => {
  const { userId, username, password, email, permissions } = req.body;
  const hashedPassword = password ? await bcrypt.hash(password, 10) : null;

  try {
    if (userId) {
      // Update existing user
      await pool.query(
        'UPDATE users SET username = ?, email = ?, permissions = ? WHERE id = ?',
        [username, email, permissions, userId]
      );
      res.sendStatus(200);
    } else {
      // Create new user
      const [existingUser] = await pool.query('SELECT * FROM users WHERE username = ?', [username]);
      if (existingUser.length > 0) {
        return res.status(400).send('Username already exists');
      }

      await pool.query('INSERT INTO users (username, password, email, permissions) VALUES (?, ?, ?, ?)', [username, hashedPassword, email, permissions]);
      res.sendStatus(201);
    }
  } catch (error) {
    console.error('Error registering or updating user:', error);
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

    const token = jwt.sign({ userId: user[0].id, permissions: user[0].permissions }, 'your_jwt_secret', { expiresIn: '1h' });
    res.json({ token });
  } catch (error) {
    console.error('Error logging in user:', error);
    res.status(500).send('Server Error');
  }
});
// Endpoint to get the list of users
app.get('/api/users', async (req, res) => {
  try {
    const [users] = await pool.query('SELECT id, username, email, permissions FROM users');
    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).send('Server Error');
  }
});


// Endpoint for resetting the password
app.post('/api/reset-password', async (req, res) => {
  const { token, newPassword } = req.body;
  const hashedPassword = await bcrypt.hash(newPassword, 10);

  try {
    // Fetch the user by reset token and ensure the token is not expired
    const [user] = await pool.query('SELECT * FROM users WHERE resetToken = ? AND resetTokenExpiry > ?', [token, Date.now()]);
    if (user.length === 0) {
      return res.status(400).send('Invalid or expired token');
    }

    // Update the user's password and clear the reset token and expiry time
    await pool.query('UPDATE users SET password = ?, resetToken = NULL, resetTokenExpiry = NULL WHERE id = ?', [hashedPassword, user[0].id]);

    res.send('Password reset successful');
  } catch (error) {
    console.error('Error resetting password:', error);
    res.status(500).send('Server Error');
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

// Endpoint para recibir datos de SMS
app.post('/sms', async (req, res) => {
  console.log('Request Headers:', req.headers);
  console.log('Request Body:', req.body);

  if (typeof req.body !== 'object' || !req.body.From || !req.body.Body) {
    console.log('Received incorrect data format:', req.body);
    return res.status(400).json({ error: 'Invalid data format', received: req.body });
  }

  try {
    const currentEpoch = Math.floor(Date.now() / 1000);
    const deviceId = req.body.From;
    const deviceID_name = await getDeviceAsignado(deviceId);
    const message = req.body.Body;
    const timestamp = req.body.Timestamp;
    const lon = getLongitudeFromMessage(message);
    const lat = getLatitudeFromMessage(message);
    const ident = await getIdentFromDeviceID(deviceId);
    const ubicacion = await getUbicacionFromIdent(ident, currentEpoch);

    console.log('Parsed SMS:', { deviceId, message, currentEpoch });

    if (!deviceId || !message) {
      console.log('Invalid data format', req.body);
      return res.status(400).json({ error: 'Invalid data format', received: req.body });
    }

    // Formatear el timestamp
    const formattedTimestamp = moment(timestamp).tz('America/Santiago').format('YYYY-MM-DD HH:mm:ss');

    const connection = await pool.getConnection();
    try {
      // Insertar los datos del SMS en la base de datos
      const [result] = await connection.query(
        'INSERT INTO sms_data (device_id, message, timestamp, latitud, longitud, sector) VALUES (?, ?, ?, ?, ?, ?)',
        [deviceID_name, message, formattedTimestamp, lat, lon, ubicacion]
      );
      console.log('SMS inserted successfully:', { id: result.insertId });

      // Emitir un evento para el nuevo SMS
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

async function getDeviceAsignado(deviceId) {
  try {
    const connection = await pool.getConnection();
    try {
      const [rows] = await connection.query('SELECT device_asignado FROM devices WHERE telefono = ?', [deviceId]);

      if (rows.length > 0) {
        const deviceID_name = rows[0].device_asignado;
        console.log('Device Asignado:', deviceID_name);
        return deviceID_name;
      } else {
        console.log('No se encontró ningún dispositivo asignado para el teléfono:', deviceId);
        return null;
      }
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Error al obtener el dispositivo asignado:', error);
    throw error;
  }
}
// Función para extraer la latitud del mensaje
function getLatitudeFromMessage(message) {
  // Expresión regular para encontrar la latitud en el mensaje
  const latRegex = /Lat:(-?\d+\.\d+)/;
  const match = message.match(latRegex);

  if (match && match[1]) {
    return parseFloat(match[1]);
  } else {
    console.error('Latitud no encontrada en el mensaje:', message);
    return null;
  }
}
// Función para extraer la longitud del mensaje
function getLongitudeFromMessage(message) {
  // Expresión regular para encontrar la longitud en el mensaje
  const lonRegex = /Lon:(-?\d+\.\d+)/;
  const match = message.match(lonRegex);

  if (match && match[1]) {
    return parseFloat(match[1]);
  } else {
    console.error('Longitud no encontrada en el mensaje:', message);
    return null;
  }
}

async function getIdentFromDeviceID(deviceId){
  try {
    const connection = await pool.getConnection();
    try {
      const [rows] = await connection.query('SELECT id FROM devices WHERE telefono = ?', [deviceId]);
      
      if (rows.length > 0) {
        const deviceID = rows[0].id; // Correcto
        console.log('Device id obtenido:', deviceID);
        return deviceID;
      } else {
        console.log('No se encontró ningún ID para el teléfono:', deviceId);
        return null;
      }
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Error al obtener el ID:', error);
    throw error;
  }
}

// Función para obtener la ubicación desde el ident y el timestamp
async function getUbicacionFromIdent(ident, timestamp) {
  if (timestamp === null) {
    throw new Error('Invalid timestamp');
  }
  
  const connection = await pool.getConnection();
  try {
    const [latestRecord] = await connection.query(`
      SELECT ble_beacons FROM gps_data
      WHERE ident = ? AND timestamp <= ? and ble_beacons != "[]"
      ORDER BY timestamp DESC limit 1
    `, [ident, timestamp]);

    console.log('Ultimo Registro obtenido:', latestRecord);

    if (latestRecord.length > 0 && latestRecord[0].ble_beacons && latestRecord[0].ble_beacons !== '[]') {
      const beaconsData = JSON.parse(latestRecord[0].ble_beacons);
      const activeBeaconIds = beaconsData.map(beacon => beacon.id);
      console.log('Active Beacon IDs:', activeBeaconIds);

      const [location] = await connection.query(`SELECT ubicacion FROM beacons WHERE id = ?`, [activeBeaconIds[0]]);
      console.log('Ubicación:', location);

      return location.length > 0 ? location[0].ubicacion : null;
    } else {
      console.log('No active beacons found.');
      return null;
    }
  } catch (error) {
    console.error('Error fetching active beacons:', error);
    throw new Error('Error fetching active beacons');
  } finally {
    connection.release();
  }
}
// Start the server
server.listen(port, '0.0.0.0', () => {
  console.log(`Server running on port ${port}`);
});