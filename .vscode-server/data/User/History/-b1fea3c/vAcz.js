const mysql = require('mysql2/promise');
const ddbb_data = require('../../config/ddbb.json');

// Configuración de la conexión a la base de datos
const pool = mysql.createPool({
  host: ddbb_data.host,
  user: ddbb_data.user,
  password: ddbb_data.password,
  database: ddbb_data.database,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

async function obtenerMacsDeBaseDeDatos() {
  let connection;
  try {
    connection = await pool.getConnection();
    const [rows] = await connection.query('SELECT mac FROM beacons');
    return rows.map(row => row.mac);
  } catch (error) {
    console.error('Error al obtener MACs de la base de datos:', error);
    return [];
  } finally {
    if (connection) await connection.release();
  }
}

async function buscarMacEnTexto(texto, macs) {
  for (const mac of macs) {
    if (texto.includes(mac)) {
      return mac;
    }
  }
  return null;
}

async function obtenerIdPorMac(mac) {
  let connection;
  try {
    connection = await pool.getConnection();
    const [rows] = await connection.query('SELECT id FROM beacons WHERE mac = ?', [mac]);
    return rows.length > 0 ? rows[0].id : null;
  } catch (error) {
    console.error('Error al obtener ID por MAC:', error);
    return null;
  } finally {
    if (connection) await connection.release();
  }
}

async function esTemperatura(mac) {
  let connection;
  try {
    connection = await pool.getConnection();
    const [rows] = await connection.query('SELECT esTemperatura FROM beacons WHERE mac = ?', [mac]);
    return rows.length > 0 ? rows[0].esTemperatura === 1 : false;
  } catch (error) {
    console.error('Error al consultar esTemperatura:', error);
    return false;
  } finally {
    if (connection) await connection.release();
  }
}

function getTableName(ident) {
  switch (ident) {
    case '352592573522828':
      return 'gh_5200_data_352592573522828';
    case '353201350896384':
      return 'magic_box_tmt_210_data_353201350896384';
    case '352592576164230':
      return 'fmb204_data_352592576164230';
    default:
      throw new Error(`Ident no reconocido: ${ident}`);
  }
}

async function insertarDatosSegunIdent(ident, newData, additionalData, temp_beacon_id = null) {
  let connection;
  try {
    connection = await pool.getConnection();
    let query, values;

    const baseColumns = 'id_dispo, device_id_gps_data, event_enum, altitude, latitude, longitude, timestamp, beacon_id';
    const baseValues = '?, ?, ?, ?, ?, ?, ?, ?';

    switch (ident) {
      case '352592573522828':
      case '353201350896384':
      case '352592576164230':
        if (newData.event_enum === 385) {
          query = `INSERT INTO teltonika.${getTableName(ident)} 
                   (${baseColumns}, rsi_beacon, battery_level, ble_sensor_humidity, 
                    ble_sensor_magnet_status, ble_sensor_temperature, ID_GPS_DATA) 
                   VALUES (${baseValues}, ?, ?, ?, ?, ?, ?)`;
          values = [
            ident, newData.device_id, newData.event_enum, newData.altitude, newData.latitude, newData.longitude,
            newData.timestamp, additionalData.KTK_ID, additionalData.KTK_RSSI, newData.battery_level, 
            newData.ble_sensor_humidity_1, newData.ble_sensor_magnet_status_1, additionalData.KTK_TEMPERATURE, 
            newData.id
          ];
        } else if (newData.event_enum === 11317) {
          query = `INSERT INTO teltonika.${getTableName(ident)} 
                   (${baseColumns}, battery_level, ble_sensor_humidity, ble_sensor_magnet_status, 
                    ble_sensor_temperature, \`EYE_battery.low\`, EYE_humidity, EYE_id, 
                    \`EYE_mac.address\`, EYE_magnet, \`EYE_magnet.count\`, EYE_movement, 
                    \`EYE_movement.count\`, EYE_temperature, EYE_type, ID_GPS_DATA) 
                   VALUES (${baseValues}, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
          values = [
            ident, newData.device_id, newData.event_enum, newData.altitude, newData.latitude, newData.longitude,
            newData.timestamp, temp_beacon_id, newData.battery_level, newData.ble_sensor_humidity_1,
            newData.ble_sensor_magnet_status_1, newData.ble_sensor_temperature_1, additionalData.EYE_battery_low, 
            additionalData.EYE_humidity, additionalData.EYE_id, additionalData.EYE_mac_address, 
            additionalData.EYE_magnet, additionalData.EYE_magnet_count, additionalData.EYE_movement, 
            additionalData.EYE_movement_count, additionalData.EYE_temperature, additionalData.EYE_type, newData.id
          ];
        }
        break;
      default:
        console.log(`Ident no reconocido: ${ident}`);
        return;
    }

    values = values.map(value => value === undefined ? null : value);
    await connection.execute(query, values);
    console.log(`Datos insertados correctamente para ident: ${ident}`);
  } catch (error) {
    console.error('Error al insertar datos:', error);
  } finally {
    if (connection) await connection.release();
  }
}

async function procesarDatosGPS_GPS_DATA(newData) {
  const macs = await obtenerMacsDeBaseDeDatos();

  if (newData.event_enum === 385) {
    const bleBeacons = newData.ble_beacons;
    let highestRssi = -999999;
    let highestRssiElement = null;

    const beacons = bleBeacons.split('},').map(b => b.trim() + '}');
    for (const beacon of beacons) {
      const mac = await buscarMacEnTexto(beacon, macs);
      if (mac) {
        const rssi = parseInt(beacon.match(/"rssi":(-?\d+)/)?.[1] || '-999999');
        const esPuerta = await esTemperatura(mac);
        if (rssi > highestRssi && !esPuerta) {
          highestRssi = rssi;
          highestRssiElement = { beacon, mac };
        }
      }
    }

    if (highestRssiElement) {
      const ktkData = {
        KTK_ID: await obtenerIdPorMac(highestRssiElement.mac),
        KTK_battery_voltage: highestRssiElement.beacon.match(/"voltage":(\d+(\.\d+)?)/)?.[1],
        KTK_RSSI: highestRssi,
        KTK_TEMPERATURE: highestRssiElement.beacon.match(/"temperature":(-?\d+(\.\d+)?)/)?.[1]
      };

      await insertarDatosSegunIdent(newData.ident, newData, ktkData);
    }
  } else if (newData.event_enum === 11317) {
    const bleBeacons = newData.ble_beacons;
    const mac = await buscarMacEnTexto(bleBeacons, macs);
    
    if (mac) {
      const eyeData = {
        EYE_mac_address: mac,
        EYE_battery_low: bleBeacons.includes('"battery.low":true'),
        EYE_humidity: bleBeacons.match(/"humidity":(\d+(\.\d+)?)/)?.[1],
        EYE_id: await obtenerIdPorMac(mac),
        EYE_magnet: bleBeacons.includes('"magnet":true'),
        EYE_magnet_count: bleBeacons.match(/"magnet.count":(\d+)/)?.[1],
        EYE_movement: bleBeacons.includes('"movement":true'),
        EYE_movement_count: bleBeacons.match(/"movement.count":(\d+)/)?.[1],
        EYE_temperature: bleBeacons.match(/"temperature":(-?\d+(\.\d+)?)/)?.[1],
        EYE_type: bleBeacons.match(/"type":"(\w+)"/)?.[1]
      };

      const temp_beacon_id = eyeData.EYE_id;

      const esPuerta = await esTemperatura(mac);
      await insertarDatosSegunIdent(newData.ident, newData, eyeData, temp_beacon_id);
      
    }
  }
}

module.exports = { procesarDatosGPS_GPS_DATA };