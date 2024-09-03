const mysql = require('mysql2/promise');
const ddbb_data = require('../../config/ddbb.json');

const pool = mysql.createPool({
  host: ddbb_data.host,
  user: ddbb_data.user,
  password: ddbb_data.password,
  database: ddbb_data.database,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

const EVENTS = {
  KTK: 385,
  EYE: 11317
};

const TABLE_NAMES = {
  '352592573522828': 'gh_5200_data_352592573522828',
  '353201350896384': 'magic_box_tmt_210_data_353201350896384',
  '352592576164230': 'fmb204_data_352592576164230'
};

async function queryDatabase(query, params = []) {
  let connection;
  try {
    connection = await pool.getConnection();
    const [rows] = await connection.query(query, params);
    return rows;
  } catch (error) {
    console.error(`Error en la consulta: ${query}`, error);
    throw error;
  } finally {
    if (connection) await connection.release();
  }
}

async function obtenerMacsDeBaseDeDatos() {
  const rows = await queryDatabase('SELECT mac FROM beacons');
  return rows.map(row => row.mac);
}

async function buscarMacEnTexto(texto, macs) {
  return macs.find(mac => texto.includes(mac)) || null;
}

async function obtenerIdPorMac(mac) {
  const rows = await queryDatabase('SELECT id FROM beacons WHERE mac = ?', [mac]);
  return rows.length > 0 ? rows[0].id : null;
}

async function esTemperatura(mac) {
  const rows = await queryDatabase('SELECT esTemperatura FROM beacons WHERE mac = ?', [mac]);
  return rows.length > 0 ? rows[0].esTemperatura === 1 : false;
}

function getTableName(ident) {
  if (!(ident in TABLE_NAMES)) {
    throw new Error(`Ident no reconocido: ${ident}`);
  }
  return TABLE_NAMES[ident];
}

async function insertarDatosSegunIdent(ident, newData, additionalData, temp_beacon_id = null) {
  const tableName = getTableName(ident);
  const baseColumns = 'id_dispo, device_id_gps_data, event_enum, altitude, latitude, longitude, timestamp, beacon_id';
  const baseValues = '?, ?, ?, ?, ?, ?, ?, ?';

  let query, values;

  if (newData.event_enum === EVENTS.KTK) {
    query = `INSERT INTO teltonika.${tableName} 
             (${baseColumns}, rsi_beacon, battery_level, ble_sensor_humidity, 
              ble_sensor_magnet_status, ble_sensor_temperature, ID_GPS_DATA) 
             VALUES (${baseValues}, ?, ?, ?, ?, ?, ?)`;
    values = [
      ident, newData.device_id, newData.event_enum, newData.altitude, newData.latitude, newData.longitude,
      newData.timestamp, additionalData.KTK_ID || null, additionalData.KTK_RSSI || null, newData.battery_level || null, 
      newData.ble_sensor_humidity_1 || null, newData.ble_sensor_magnet_status_1 || null, additionalData.KTK_TEMPERATURE || null, 
      newData.id || null
    ];
  } else if (newData.event_enum === EVENTS.EYE) {
    query = `INSERT INTO teltonika.${tableName} 
             (${baseColumns}, battery_level, ble_sensor_humidity, ble_sensor_magnet_status, 
              ble_sensor_temperature, \`EYE_battery.low\`, EYE_humidity, EYE_id, 
              \`EYE_mac.address\`, EYE_magnet, \`EYE_magnet.count\`, EYE_movement, 
              \`EYE_movement.count\`, EYE_temperature, EYE_type, ID_GPS_DATA) 
             VALUES (${baseValues}, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    values = [
      ident, newData.device_id, newData.event_enum, newData.altitude, newData.latitude, newData.longitude,
      newData.timestamp, temp_beacon_id, newData.battery_level || null, newData.ble_sensor_humidity_1 || null,
      newData.ble_sensor_magnet_status_1 || null, newData.ble_sensor_temperature_1 || null, 
      additionalData.EYE_battery_low || false, additionalData.EYE_humidity || null, additionalData.EYE_id || null, 
      additionalData.EYE_mac_address || null, additionalData.EYE_magnet || false, 
      additionalData.EYE_magnet_count || null, additionalData.EYE_movement || false, 
      additionalData.EYE_movement_count || null, additionalData.EYE_temperature || null, 
      additionalData.EYE_type || null, newData.id || null
    ];
  }

  values = values.map(value => value === undefined ? null : value);
  
  try {
    await queryDatabase(query, values);
    console.log(`Datos insertados correctamente para ident: ${ident}`);
  } catch (error) {
    console.error('Error al insertar datos:', error);
    console.error('Query:', query);
    console.error('Valores:', values);
    throw error;
  }
}

async function procesarDatosGPS_GPS_DATA(newData) {
  const macs = await obtenerMacsDeBaseDeDatos();

  if (newData.event_enum === EVENTS.KTK) {
    await procesarEventoKTK(newData, macs);
  } else if (newData.event_enum === EVENTS.EYE) {
    await procesarEventoEYE(newData, macs);
  }
}

async function procesarEventoKTK(newData, macs) {
  const beacons = newData.ble_beacons.split('},').map(b => b.trim() + '}');
  const highestRssiElement = await encontrarBeaconConMayorRSSI(beacons, macs);

  if (highestRssiElement) {
    const ktkData = extraerDatosKTK(highestRssiElement);
    await insertarDatosSegunIdent(newData.ident, newData, ktkData);
  }
}

async function procesarEventoEYE(newData, macs) {
  const bleBeacons = newData.ble_beacons;
  const mac = await buscarMacEnTexto(bleBeacons, macs);
  
  if (mac) {
    const eyeData = extraerDatosEYE(bleBeacons, mac);
    await insertarDatosSegunIdent(newData.ident, newData, eyeData, eyeData.EYE_id);
  }
}

async function encontrarBeaconConMayorRSSI(beacons, macs) {
  let highestRssi = -Infinity;
  let highestRssiElement = null;

  for (const beacon of beacons) {
    const mac = await buscarMacEnTexto(beacon, macs);
    if (mac) {
      const rssi = parseInt(beacon.match(/"rssi":(-?\d+)/)?.[1] || '-Infinity');
      const esPuerta = await esTemperatura(mac);
      if (rssi > highestRssi && !esPuerta) {
        highestRssi = rssi;
        highestRssiElement = { beacon, mac };
      }
    }
  }

  return highestRssiElement;
}

function extraerDatosKTK(beaconElement) {
  return {
    KTK_ID: obtenerIdPorMac(beaconElement.mac),
    KTK_battery_voltage: beaconElement.beacon.match(/"voltage":(\d+(\.\d+)?)/)?.[1],
    KTK_RSSI: parseInt(beaconElement.beacon.match(/"rssi":(-?\d+)/)?.[1] || '-Infinity'),
    KTK_TEMPERATURE: beaconElement.beacon.match(/"temperature":(-?\d+(\.\d+)?)/)?.[1]
  };
}

function extraerDatosEYE(bleBeacons, mac) {
  return {
    EYE_mac_address: mac,
    EYE_battery_low: bleBeacons.includes('"battery.low":true'),
    EYE_humidity: bleBeacons.match(/"humidity":(\d+(\.\d+)?)/)?.[1],
    EYE_id: obtenerIdPorMac(mac),
    EYE_magnet: bleBeacons.includes('"magnet":true'),
    EYE_magnet_count: bleBeacons.match(/"magnet.count":(\d+)/)?.[1],
    EYE_movement: bleBeacons.includes('"movement":true'),
    EYE_movement_count: bleBeacons.match(/"movement.count":(\d+)/)?.[1],
    EYE_temperature: bleBeacons.match(/"temperature":(-?\d+(\.\d+)?)/)?.[1],
    EYE_type: bleBeacons.match(/"type":"(\w+)"/)?.[1]
  };
}

module.exports = { procesarDatosGPS_GPS_DATA };