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
const Joi = require('joi'); // New import for schema validation
const sgMail = require('@sendgrid/mail');
const http = require('http');
const { Server } = require('socket.io'); // Import Socket.IO
const config = require('./config/config.json');
const { procesarDatosUbibot } = require('./ubibot');
const { procesarPosibleIncidencia } = require('../servicios/src/utils/control_incidencias');
const { procesarDatosGPS } = require('../servicios/src/utils/dataProcesing');


const intervalo_ejecucion_ubibot= 5 * 60 * 1000;

// Configurar SendGrid
sgMail.setApiKey(config.email.SENDGRID_API_KEY);

// Create an Express application
const app = express();

// Import and configure Socket.IO for real-time communication
const server = http.createServer(app); // Create HTTP server with Express app

const io = new Server(server, {
  cors: {
    origin: ["http://tnstrack.ddns.net:3000", "http://localhost:3000","http://tnstrack.ddns.net:3001", "http://localhost:3001"], // Allow both origins
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type"],
    credentials: true
  }
});
// Initialize control_incidencias with Socket.IO
//controlIncidencias.init(io);
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
  password: 'Clev2.Thenext1', // Database password
  database: 'teltonika', // Database name
  waitForConnections: true, // Wait for connections if none are available
  connectionLimit: 10, // Maximum number of connections in the pool
  queueLimit: 0 // No limit on the number of queued connection requests
});

// Define default position coordinates
const defaultPosition = { lat: -33.4489, lng: -70.6693 }; // Coordinates for Santiago, Chile

// Middleware CORS (debe estar antes de otros middleware o rutas)
const corsOptions = {
  origin: ['http://tnstrack.ddns.net:3000', 'http://localhost:3000','http://tnstrack.ddns.net:3001', 'http://localhost:3001'],
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type'],
  credentials: true
};

// Define schemas for data validation
const schemas = {
  303: { // FBM204
    typeA: Joi.object({
      'ble.beacons': Joi.array().items(Joi.object()),
      'channel.id': Joi.number().integer(),
      'codec.id': Joi.number().integer(),
      'device.id': Joi.number().integer(),
      'device.name': Joi.string(),
      'device.type.id': Joi.number().integer(),
      'event.enum': Joi.number().integer(),
      'event.priority.enum': Joi.number().integer(),
      'ident': Joi.string(),
      'peer': Joi.string(),
      'position.altitude': Joi.number(),
      'position.direction': Joi.number(),
      'position.latitude': Joi.number(),
      'position.longitude': Joi.number(),
      'position.satellites': Joi.number().integer(),
      'position.speed': Joi.number(),
      'protocol.id': Joi.number().integer(),
      'server.timestamp': Joi.number(),
      'timestamp': Joi.number(),
      'battery.current': Joi.number(),
      'battery.voltage': Joi.number(),
      'ble.sensor.humidity.1': Joi.number().integer(),
      'ble.sensor.magnet.status.1': Joi.boolean(),
      'ble.sensor.temperature.1': Joi.number(),
      'channel.id': Joi.number().integer(),
      'codec.id': Joi.number().integer(),
      'device.id': Joi.number().integer(),
      'device.name': Joi.string(),
      'device.type.id': Joi.number().integer(),
      'engine.ignition.status': Joi.boolean(),
      'event.priority.enum': Joi.number().integer(),
      'external.powersource.voltage': Joi.number(),
      'gnss.state.enum': Joi.number().integer(),
      'gnss.status': Joi.boolean(),
      'gsm.mcc': Joi.number().integer(),
      'gsm.mnc': Joi.number().integer(),
      'gsm.operator.code': Joi.string(),
      'gsm.signal.level': Joi.number().integer(),
      'ident': Joi.string(),
      'movement.status': Joi.boolean(),
      'peer': Joi.string(),
      'position.altitude': Joi.number(),
      'position.direction': Joi.number(),
      'position.hdop': Joi.number(),
      'position.latitude': Joi.number(),
      'position.longitude': Joi.number(),
      'position.pdop': Joi.number(),
      'position.satellites': Joi.number().integer(),
      'position.speed': Joi.number(),
      'position.valid': Joi.boolean(),
      'protocol.id': Joi.number().integer(),
      'server.timestamp': Joi.number(),
      'sleep.mode.enum': Joi.number().integer(),
      'timestamp': Joi.number(),
      'vehicle.mileage': Joi.number()
    }).unknown(true)
  },
  507: { // GH5200
    typeA: Joi.object({
      'ble.beacons': Joi.array().items(Joi.object()),
      'channel.id': Joi.number().integer(),
      'codec.id': Joi.number().integer(),
      'device.id': Joi.number().integer(),
      'device.name': Joi.string(),
      'device.type.id': Joi.number().integer().valid(507),
      'event.enum': Joi.number().integer(),
      'event.priority.enum': Joi.number().integer(),
      'ident': Joi.string(),
      'peer': Joi.string(),
      'position.altitude': Joi.number(),
      'position.direction': Joi.number(),
      'position.satellites': Joi.number().integer(),
      'position.speed': Joi.number(),
      'protocol.id': Joi.number().integer(),
      'server.timestamp': Joi.number(),
      'timestamp': Joi.number(),
      'battery.level': Joi.number().integer(),
      'battery.voltage': Joi.number(),
      'ble.sensor.humidity.1': Joi.number().integer(),
      'ble.sensor.humidity.2': Joi.number().integer(),
      'ble.sensor.humidity.3': Joi.number().integer(),
      'ble.sensor.humidity.4': Joi.number().integer(),
      'ble.sensor.low.battery.status.1': Joi.boolean(),
      'ble.sensor.magnet.count.1': Joi.number().integer(),
      'ble.sensor.magnet.status.1': Joi.boolean(),
      'ble.sensor.temperature.1': Joi.number(),
      'ble.sensor.temperature.2': Joi.number(),
      'ble.sensor.temperature.3': Joi.number(),
      'ble.sensor.temperature.4': Joi.number(),
      'bluetooth.state.enum': Joi.number().integer(),
      'channel.id': Joi.number().integer(),
      'codec.id': Joi.number().integer(),
      'custom.param.116': Joi.number().integer(),
      'device.id': Joi.number().integer(),
      'device.name': Joi.string(),
      'device.type.id': Joi.number().integer().valid(507),
      'event.priority.enum': Joi.number().integer(),
      'gnss.sleep.mode.status': Joi.boolean(),
      'gnss.state.enum': Joi.number().integer(),
      'gsm.mcc': Joi.number().integer(),
      'gsm.mnc': Joi.number().integer(),
      'gsm.operator.code': Joi.string(),
      'gsm.signal.level': Joi.number().integer(),
      'ident': Joi.string(),
      'movement.status': Joi.boolean(),
      'peer': Joi.string(),
      'position.altitude': Joi.number(),
      'position.direction': Joi.number(),
      'position.fix.age': Joi.number().integer(),
      'position.hdop': Joi.number(),
      'position.latitude': Joi.number(),
      'position.longitude': Joi.number(),
      'position.pdop': Joi.number(),
      'position.satellites': Joi.number().integer(),
      'position.speed': Joi.number(),
      'protocol.id': Joi.number().integer(),
      'server.timestamp': Joi.number(),
      'sleep.mode.enum': Joi.number().integer(),
      'timestamp': Joi.number()
    }).unknown(true)
  },
  
  508: { // TMT250
    typeA: Joi.object({
      'ble.beacons': Joi.array().items(Joi.object()),
      'channel.id': Joi.number().integer(),
      'codec.id': Joi.number().integer(),
      'device.id': Joi.number().integer(),
      'device.name': Joi.string(),
      'device.type.id': Joi.number().integer().valid(508),
      'event.enum': Joi.number().integer(),
      'event.priority.enum': Joi.number().integer(),
      'ident': Joi.string(),
      'peer': Joi.string(),
      'position.altitude': Joi.number(),
      'position.direction': Joi.number(),
      'position.satellites': Joi.number().integer(),
      'position.speed': Joi.number(),
      'protocol.id': Joi.number().integer(),
      'server.timestamp': Joi.number(),
      'timestamp': Joi.number(),
      'battery.level': Joi.number().integer(),
      'battery.voltage': Joi.number(),
      'ble.sensor.humidity.1': Joi.number().integer(),
      'ble.sensor.low.battery.status.1': Joi.boolean(),
      'ble.sensor.magnet.count.1': Joi.number().integer(),
      'ble.sensor.magnet.status.1': Joi.boolean(),
      'ble.sensor.temperature.1': Joi.number(),
      'channel.id': Joi.number().integer(),
      'codec.id': Joi.number().integer(),
      'custom.param.116': Joi.number().integer(),
      'device.id': Joi.number().integer(),
      'device.name': Joi.string(),
      'device.type.id': Joi.number().integer().valid(508),
      'event.priority.enum': Joi.number().integer(),
      'gnss.sleep.mode.status': Joi.boolean(),
      'gnss.state.enum': Joi.number().integer(),
      'gsm.mcc': Joi.number().integer(),
      'gsm.mnc': Joi.number().integer(),
      'gsm.operator.code': Joi.string(),
      'gsm.signal.level': Joi.number().integer(),
      'ident': Joi.string(),
      'movement.status': Joi.boolean(),
      'peer': Joi.string(),
      'position.altitude': Joi.number(),
      'position.direction': Joi.number(),
      'position.hdop': Joi.number(),
      'position.pdop': Joi.number(),
      'position.satellites': Joi.number().integer(),
      'position.speed': Joi.number(),
      'protocol.id': Joi.number().integer(),
      'server.timestamp': Joi.number(),
      'sleep.mode.enum': Joi.number().integer(),
      'timestamp': Joi.number()
    }).unknown(true)
  }
};

// Función para ejecutar el proceso de Ubibot
async function ejecutarProcesoUbibot() {
  try {
      console.log('Iniciando proceso de Ubibot...');
      await procesarDatosUbibot();
      console.log('Proceso de Ubibot completado.');
  } catch (error) {
      console.error('Error al procesar datos de Ubibot:', error);
  }
}
// Ejecutar el proceso de Ubibot inmediatamente al iniciar el servidor
ejecutarProcesoUbibot();

// Programar la ejecución del proceso de Ubibot cada 5 minutos
const intervaloDatos = setInterval(ejecutarProcesoUbibot,intervalo_ejecucion_ubibot);

// Manejador para detener el intervalo si es necesario
process.on('SIGINT', () => {
    clearInterval(intervaloDatos);
    console.log('Intervalo de Ubibot detenido');
    process.exit();
});
// Justo antes de iniciar el servidor, agrega:
app.get('/api/ubibot-status', (req, res) => {
  res.json({ status: 'Ubibot process running', lastExecution: new Date() });
});
// Nodemailer configuration
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'felipe@thenextsecurity.cl',
    pass: '9516npth8913tqm.'
  }
});
// Agregar esta función de ayuda al principio del archivo
function getCurrentDateStart() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime() / 1000;
}
app.use(cors(corsOptions)); // Enable CORS for all routes

// Otros middleware (deben estar después del middleware CORS)
app.use(express.json()); // Parse JSON request bodies
app.use(express.urlencoded({ extended: false })); // Parse URL-encoded request bodies


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
//const moment = require('moment-timezone');

// Endpoint to receive GPS data
app.post('/gps-data', async (req, res) => {
  const gpsDatas = Array.isArray(req.body) ? req.body : [req.body];
  console.log("Llegaron datos a gps_data");

  try {
    for (const gpsData of gpsDatas) {
      await processGpsData(gpsData);
    }
    res.status(200).send('GPS Data processed successfully');
  } catch (error) {
    console.error('Error processing GPS data:', error);
    res.status(500).send('Server Error');
  }
});

async function processGpsData(gpsData) {
  const deviceTypeId = gpsData['device.type.id'];
  const schema = schemas[deviceTypeId];
  
  if (!schema) {
    throw new Error(`Unknown device type: ${deviceTypeId}`);
  }
  
  console.log('Validating data for device type:', deviceTypeId);

  let validatedData;
  try {
    validatedData = await schema.typeA.validateAsync(gpsData);
  } catch (err) {
    console.error('Validation failed:', err);
    throw err;
  }

  // Insertar datos en la base de datos
  await insertGpsDataIntoDB(validatedData);

  // Procesar datos GPS
  const processedData = {
    event_enum: validatedData['event.enum'],
    ident: validatedData.ident,
    device_id: validatedData['device.id'],
    altitude: validatedData['position.altitude'],
    latitude: validatedData['position.latitude'],
    longitude: validatedData['position.longitude'],
    timestamp: Math.floor(validatedData.timestamp),
    ble_beacons: JSON.stringify(validatedData['ble.beacons'] || []),
    battery_level: validatedData['battery.level'] || -1,
    ble_sensor_humidity_1: validatedData['ble.sensor.humidity.1'] || -1,
    ble_sensor_magnet_status_1: validatedData['ble.sensor.magnet.status.1'] || -1,
    ble_sensor_temperature_1: validatedData['ble.sensor.temperature.1'] || -1,
    id: validatedData.id // Asumiendo que existe un campo 'id' en los datos validados
  };

  await procesarDatosGPS(processedData);

  // Procesar posible incidencia
  await procesarPosibleIncidencia(
    validatedData['device.name'],
    validatedData['ble.beacons'] || [],
    Math.floor(validatedData.timestamp),
    validatedData['event.enum']
  );
}

async function insertGpsDataIntoDB(validatedData) {
  const columns = [
    'device_id', 'device_name', 'device_type_id', 'event_enum', 'event_priority_enum',
    'ident', 'peer', 'altitude', 'direction', 'latitude', 'longitude', 'satellites', 'speed',
    'protocol_id', 'server_timestamp', 'timestamp', 'ble_beacons', 'channel_id', 'codec_id',
    'battery_level', 'battery_voltage', 'battery_current',
    'ble_sensor_humidity_1', 'ble_sensor_humidity_2', 'ble_sensor_humidity_3', 'ble_sensor_humidity_4',
    'ble_sensor_low_battery_status_1', 'ble_sensor_low_battery_status_2',
    'ble_sensor_magnet_status_1', 'ble_sensor_magnet_status_2',
    'ble_sensor_magnet_count_1', 'ble_sensor_magnet_count_2',
    'ble_sensor_temperature_1', 'ble_sensor_temperature_2', 'ble_sensor_temperature_3', 'ble_sensor_temperature_4',
    'bluetooth_state_enum', 'gnss_state_enum', 'gnss_status',
    'gsm_mcc', 'gsm_mnc', 'gsm_operator_code', 'gsm_signal_level',
    'movement_status', 'position_hdop', 'position_pdop', 'position_valid',
    'position_fix_age', 'sleep_mode_enum', 'custom_param_116', 'vehicle_mileage'
  ];

  const query = `INSERT INTO gps_data (${columns.join(', ')}) VALUES (${columns.map(() => '?').join(', ')})`;

  const params = columns.map(column => {
    const key = column.replace(/_/g, '.');
    return validatedData[key] !== undefined ? validatedData[key] : -1;
  });

  try {
    await pool.query(query, params);
    console.log("Datos insertados en gps_data");
  } catch (error) {
    console.error('SQL Error:', error);
    console.error('Query:', query);
    console.error('Params:', params);
    throw error;
  }
}
// Endpoint para obtener los datos más recientes de GPS para un dispositivo específico
app.get('/api/get-latest-gps-data', async (req, res) => {
  const { device_name, startTime, endTime } = req.query;
  
  console.log(`Buscando datos para ${device_name} entre ${startTime} y ${endTime}`);
  
  try {
    const query = `
      SELECT latitude, longitude, timestamp, ble_beacons, event_enum
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
app.get('/api/latest-sectors', async (req, res) => {
  try {
    const [devices] = await pool.query('SELECT id, device_asignado FROM devices');
    const latestSectors = [];
    const now = moment().tz('America/Santiago');
    const startOfDay = now.clone().startOf('day').unix();

    console.log(`Tiempo actual: ${now.format('YYYY-MM-DD HH:mm:ss')}`);
    console.log(`Inicio del día: ${moment.unix(startOfDay).format('YYYY-MM-DD HH:mm:ss')}`);

    for (const device of devices) {
      console.log(`\nProcesando dispositivo: ${device.id}`);
      
      let tableName;
      switch (device.id) {
        case '353201350896384':
          tableName = 'magic_box_tmt_210_data_353201350896384';
          break;
        case '352592573522828':
          tableName = 'gh_5200_data_352592573522828';
          break;
        case '352592576164230':
          tableName = 'fmb204_data_352592576164230';
          break;
        default:
          console.log(`No se encontró una tabla para el dispositivo ${device.id}`);
          continue;
      }

      const query = `
        SELECT beacon_id, timestamp
        FROM ${tableName}
        WHERE timestamp >= ? AND beacon_id IS NOT NULL AND  beacon_id != 'no encontrado: NULL'

        ORDER BY timestamp DESC
      `;
      
      try {
        const [results] = await pool.query(query, [startOfDay]);
        console.log(`Resultados obtenidos: ${results.length}`);

        if (results.length > 0) {
          let latestBeaconId = results[0].beacon_id;
          let latestTimestamp = results[0].timestamp;
          let oldestTimestamp = results[0].timestamp;

          for (let i = 1; i < results.length; i++) {
            if (results[i].beacon_id !== latestBeaconId) {
              oldestTimestamp = results[i-1].timestamp;
              break;
            }
            oldestTimestamp = results[i].timestamp;
          }

          const [sector] = await pool.query('SELECT nombre FROM sectores WHERE id = ?', [latestBeaconId]);
          const timeDiff = now.unix() - oldestTimestamp;
          const hours = Math.floor(timeDiff / 3600);
          const minutes = Math.floor((timeDiff % 3600) / 60);

          console.log(`Beacon más reciente: ${latestBeaconId}`);
          console.log(`Timestamp más reciente: ${moment.unix(latestTimestamp).format('YYYY-MM-DD HH:mm:ss')}`);
          console.log(`Timestamp más antiguo del mismo beacon: ${moment.unix(oldestTimestamp).format('YYYY-MM-DD HH:mm:ss')}`);
          console.log(`Tiempo transcurrido: ${hours} horas y ${minutes} minutos`);

          latestSectors.push({
            device_id: device.id,
            sector: sector.length > 0 ? sector[0].nombre : 'Desconocido',
            timestamp: moment.unix(oldestTimestamp).format('YYYY-MM-DD HH:mm:ss'),
            timeSinceDetection: `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`
          });
        } else {
          console.log(`No se encontraron datos para el dispositivo ${device.id} en el día actual`);
          latestSectors.push({
            device_id: device.id,
            sector: 'Sin datos para este día',
            timestamp: null,
            timeSinceDetection: '-'
          });
        }
      } catch (innerError) {
        console.error(`Error fetching data for device ${device.id}:`, innerError);
        latestSectors.push({
          device_id: device.id,
          sector: 'Error al obtener datos',
          timestamp: null,
          timeSinceDetection: '-'
        });
      }
    }

    console.log('\nDatos finales a enviar:');
    console.log(JSON.stringify(latestSectors, null, 2));

    res.json(latestSectors);
  } catch (error) {
    console.error('Error fetching latest sectors:', error);
    res.status(500).send('Server Error');
  }
});
// Definir el endpoint para obtener el estado de las puertas
// Endpoint to get door status history within a specific date range
// Endpoint to get door status history within a specific date range
app.get('/api/door-status', async (req, res) => {
  const { startDate, endDate } = req.query;

  if (!startDate || !endDate) {
    return res.status(400).send('startDate and endDate are required');
  }

  try {
    const query = `
      SELECT ds.sector, ds.magnet_status, ds.temperature, ds.timestamp
      FROM door_status ds
      JOIN beacons b ON ds.sector = b.ubicacion
      WHERE ds.timestamp BETWEEN ? AND ? AND b.esPuerta = 1
      ORDER BY ds.timestamp ASC
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

// Endpoint para obtener los datos de personal
app.get('/api/personal', async (req, res) => {
  try {
      const [rows] = await pool.query('SELECT * FROM personal');
      res.json(rows);
  } catch (error) {
      console.error('Error fetching personal:', error);
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
  // Extract ident from query parameters
  const { ident } = req.query;
  
  try {
    // Check if ident is provided
    if (!ident) {
      console.log('Error: ident is required');
      return res.status(400).send('ident is required');
    }

    // Log the received ident for debugging purposes
    console.log('Received ident:', ident);

    // Query to get the last known position of the device
    const [lastKnownPosition] = await pool.query(`
      SELECT ident, latitude, longitude, timestamp * 1000 AS unixTimestamp
      FROM gps_data
      WHERE ident = ? AND latitude IS NOT NULL AND longitude IS NOT NULL
      ORDER BY timestamp DESC
      LIMIT 1
    `, [ident]);

    // Check if any data is available for the given ident
    if (lastKnownPosition.length === 0) {
      console.log('Error: No data available for ident:', ident);
      return res.status(404).send('No data available');
    }

    // Log the last known position for debugging purposes
    console.log('Last known position:', lastKnownPosition);

    /* Query to get the last coordinate change of the device
    const [lastCoordinateChange] = await pool.query(`
      SELECT timestamp * 1000 AS changeTimestamp
      FROM gps_data
      WHERE (latitude != ? OR longitude != ?) AND ident = ?
      ORDER BY timestamp DESC
      LIMIT 1
    `, [
      lastKnownPosition[0].latitude || defaultPosition.lat, 
      lastKnownPosition[0].longitude || defaultPosition.lng, 
      ident
    ]);

    // Log the last coordinate change for debugging purposes
    console.log('Last coordinate change:', lastCoordinateChange);*/

    // Construct the response object
    const response = {
      ...lastKnownPosition[0]
      //,
      //changeTimestamp: lastCoordinateChange.length > 0 ? lastCoordinateChange[0].changeTimestamp : null
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
app.get('/api/previous-valid-position', async (req, res) => {
  const { ident, timestamp } = req.query;

  try {
    // Query to get the previous valid position
    const [previousValidPosition] = await pool.query(`
      SELECT ident, latitude, longitude, timestamp * 1000 AS unixTimestamp
      FROM gps_data
      WHERE ident = ? AND timestamp < ? AND latitude IS NOT NULL AND longitude IS NOT NULL
      ORDER BY timestamp DESC
      LIMIT 1
    `, [ident, timestamp / 1000]);

    if (previousValidPosition.length === 0) {
      return res.status(404).send('No previous valid position found');
    }

    res.json(previousValidPosition[0]);
  } catch (error) {
    console.error('Error fetching previous valid position:', error);
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
// Endpoint para obtener las entradas y salidas de beacons para un dispositivo específico
app.get('/api/beacon-entries-exits', async (req, res) => {
  const { startDate, endDate, device_id } = req.query;

  // Determinar la tabla a utilizar basado en el device_id
  let tableName;
  switch (device_id) {
      case '353201350896384':
          tableName = 'magic_box_tmt_210_data_353201350896384';
          break;
      case '352592573522828':
          tableName = 'gh_5200_data_352592573522828';
          break;
      case '352592576164230':
          tableName = 'fmb204_data_352592576164230';
          break;
      default:
          return res.status(400).send('Invalid device_id');
  }

  const startTimestamp = new Date(startDate).getTime() / 1000;
  const endTimestamp = new Date(endDate).getTime() / 1000;

  const query = `
      SELECT timestamp, beacon_id
      FROM ${tableName}
      WHERE timestamp BETWEEN ? AND ? AND beacon_id IS NOT NULL AND beacon_id != 'no encontrado: NULL'
      ORDER BY timestamp ASC
  `;

  try {
      const [results] = await pool.query(query, [startTimestamp, endTimestamp]);
      const processedResults = [];
      let currentBeacon = null;
      let entryTimestamp = null;

      results.forEach(record => {
          const beacon = { id: record.beacon_id };
          if (beacon.id) {
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

      res.json(processedResults);
  } catch (error) {
      console.error('Error fetching beacon entries and exits:', error);
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
    const [rows] = await pool.query('SELECT * FROM beacons WHERE esTemperatura = 0');
    
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
// Endpoint for requesting a password reset
app.post('/api/request-password-reset', async (req, res) => {
  const { email } = req.body;
  console
  try {
    const [user] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    if (user.length === 0) {
      return res.status(404).send('Usuario no encontrado');
    }

    const resetToken = crypto.randomBytes(20).toString('hex');
    const resetTokenExpiry = Date.now() + 3600000; // 1 hora de validez

    await pool.query('UPDATE users SET resetToken = ?, resetTokenExpiry = ? WHERE id = ?', [resetToken, resetTokenExpiry, user[0].id]);

    const resetUrl = `http://thenext.ddns.net:3000/reset-password/${resetToken}`;
    const msg = {
      to: email,
      from: 'felipe@thenextsecurity.cl', // Usa el correo que hayas verificado con SendGrid
      subject: 'Restablecimiento de Contraseña',
      text: `Para restablecer tu contraseña, haz clic en el siguiente enlace: ${resetUrl}`,
    };

    await sgMail.send(msg).then(() => {
      console.log('Email sent');
    })
    .catch((error) => {
      console.error(error);
    });
    res.send('Se ha enviado un enlace de restablecimiento a su email');
  } catch (error) {
    console.error('Error al solicitar restablecimiento de contraseña:', error);
    res.status(500).send('Error del servidor');
  }
});

// Endpoint for resetting the password
app.post('/api/reset-password', async (req, res) => {
  const { token, newPassword } = req.body;
  
  try {
    const [user] = await pool.query('SELECT * FROM users WHERE resetToken = ? AND resetTokenExpiry > ?', [token, Date.now()]);
    if (user.length === 0) {
      return res.status(400).send('Token inválido o expirado');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await pool.query('UPDATE users SET password = ?, resetToken = NULL, resetTokenExpiry = NULL WHERE id = ?', [hashedPassword, user[0].id]);

    res.send('Contraseña restablecida con éxito');
  } catch (error) {
    console.error('Error al restablecer la contraseña:', error);
    res.status(500).send('Error del servidor');
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
      

      const record = JSON.parse(latestRecord[0].ble_beacons)[0]; // Analizar el primer elemento del array JSON
      // caso regsitro EYE
      if (record.hasOwnProperty("mac.address")) {
        console.log("Registro con mac.address:", record);
        const beaconsData = latestRecord[0].ble_beacons ? JSON.parse(latestRecord[0].ble_beacons) : []; // Asegurar que beaconsData no es undefined
        const activeBeaconMacAdrress = beaconsData.map(beacon => {
          // Verificar si beacon.mac existe y tiene la propiedad address
          return beacon["mac.address"] || null; // Obtener el valor de mac.address o null si no existe
        }).filter(mac => mac !== null); // Filtrar los valores nulos
      
        console.log('Active Beacon IDs:', activeBeaconMacAdrress);
        const [location] = await connection.query(`SELECT ubicacion FROM beacons WHERE mac = ?`, [activeBeaconMacAdrress[0]]);
        console.log('Ubicación:', location);
        return location.length > 0 ? location[0].ubicacion : null;
      } else {
        const activeBeaconIds = beaconsData.map(beacon => beacon.id);
        console.log('Active Beacon IDs:', activeBeaconIds);
        const [location] = await connection.query(`SELECT ubicacion FROM beacons WHERE id = ?`, [activeBeaconIds[0]]);
        console.log('Ubicación:', location);
        return location.length > 0 ? location[0].ubicacion : null;
      }


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
// En server.js, modifica el endpoint /api/temperature-data
app.get('/api/temperature-data', async (req, res) => {
  try {
    const { date } = req.query;
    const query = `
      SELECT rt.beacon_id, rt.temperatura, rt.timestamp, b.lugar, b.ubicacion,
             (SELECT minimo FROM parametrizaciones WHERE param_id = 6) AS minimo,
             (SELECT maximo FROM parametrizaciones WHERE param_id = 6) AS maximo
      FROM registro_temperaturas rt
      JOIN beacons b ON rt.beacon_id = b.id
      WHERE DATE(rt.timestamp) = ?
      ORDER BY rt.timestamp ASC
    `;
    
    const [rows] = await pool.query(query, [date]);

    const data = rows.reduce((acc, row) => {
      if (!acc[row.beacon_id]) {
        acc[row.beacon_id] = {
          beacon_id: row.beacon_id,
          location: `Cámara de Frío: ${row.lugar || 'Desconocido'}`,
          ubicacion: row.ubicacion || 'Desconocido',
          temperatures: [],
          timestamps: [],
          minimo: row.minimo,
          maximo: row.maximo
        };
      }
      acc[row.beacon_id].temperatures.push(row.temperatura);
      acc[row.beacon_id].timestamps.push(row.timestamp);
      return acc;
    }, {});

    res.json(Object.values(data));
  } catch (error) {
    console.error('Error fetching temperature data:', error);
    res.status(500).send('Server Error');
  }
});

// Endpoint para obtener los umbrales de temperatura
app.get('/api/temperatura-umbrales', async (req, res) => {
  try {
    const [results] = await pool.query('SELECT minimo, maximo FROM parametrizaciones WHERE param_id = 6');
    res.json(results[0]);
  } catch (error) {
    console.error('Error fetching temperature thresholds:', error);
    res.status(500).send('Server Error');
  }
});

// Endpoint para actualizar los umbrales de temperatura
app.post('/api/temperatura-umbrales', async (req, res) => {
  const { minimo, maximo } = req.body;
  try {
    await pool.query('UPDATE parametrizaciones SET minimo = ?, maximo = ? WHERE param_id = 6', [minimo, maximo]);
    res.sendStatus(200);
  } catch (error) {
    console.error('Error updating temperature thresholds:', error);
    res.status(500).send('Server Error');
  }
});
// Temperaturas en camaras de frio
app.get('/api/temperature-camaras-data', async (req, res) => {
  try {
    const { date } = req.query;

    // Convertir la fecha a la zona horaria de Chile
    const startDate = moment.tz(date, 'America/Santiago').startOf('day');
    const endDate = moment(startDate).add(1, 'day');

    console.log('Fecha de inicio (Chile):', startDate.format());
    console.log('Fecha de fin (Chile):', endDate.format());

    const query = `
      SELECT sr.channel_id, sr.temperature, sr.timestamp, c.name
      FROM sensor_readings_ubibot sr
      JOIN channels_ubibot c ON sr.channel_id = c.channel_id
      WHERE sr.timestamp >= ? AND sr.timestamp < ?
      ORDER BY sr.channel_id, sr.timestamp ASC
    `;
    
    const [rows] = await pool.query(query, [startDate.toDate(), endDate.toDate()]);

    const groupedData = rows.reduce((acc, row) => {
      if (!acc[row.channel_id]) {
        acc[row.channel_id] = {
          channel_id: row.channel_id,
          name: row.name,
          temperatures: [],
          timestamps: []
        };
      }
      acc[row.channel_id].temperatures.push(row.temperature);
      // Convertir el timestamp a la zona horaria de Chile
      const timestamp = moment(row.timestamp).tz('America/Santiago').format();
      acc[row.channel_id].timestamps.push(timestamp);
      return acc;
    }, {});

    const result = Object.values(groupedData);
    console.log('Datos agrupados:', JSON.stringify(result, null, 2));

    res.json(result);
  } catch (error) {
    console.error('Error fetching temperature data:', error);
    res.status(500).send('Server Error');
  }
});
// En server.js, modifica el endpoint /api/blind-spot-intrusions
app.get('/api/blind-spot-intrusions', async (req, res) => {
  try {
    const { date } = req.query;

    // Convertir la fecha a la zona horaria de Chile
    const startOfDay = moment.tz(date, 'YYYY-MM-DD', 'America/Santiago').startOf('day');
    const endOfDay = moment(startOfDay).endOf('day');

    const query = `
      SELECT hc.dispositivo, hc.mac_address, hc.timestamp,
             d.device_asignado, b.ubicacion
      FROM historico_llamadas_blindspot hc
      LEFT JOIN devices d ON hc.dispositivo = d.id
      LEFT JOIN beacons b ON hc.mac_address = b.mac
      WHERE hc.timestamp BETWEEN ? AND ?
      ORDER BY hc.timestamp ASC
    `;
    
    const [rows] = await pool.query(query, [startOfDay.toDate(), endOfDay.toDate()]);

    // Convertir los timestamps a la zona horaria de Chile
    const formattedRows = rows.map(row => ({
      ...row,
      timestamp: moment(row.timestamp).tz('America/Santiago').format('YYYY-MM-DD HH:mm:ss')
    }));

    res.json(formattedRows);
  } catch (error) {
    console.error('Error fetching blind spot intrusions:', error);
    res.status(500).send('Server Error');
  }
});
// Start the server
server.listen(port, '0.0.0.0', () => {
  console.log(`Server running on port ${port}`);
});