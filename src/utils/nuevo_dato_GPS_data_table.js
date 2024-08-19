const mysql = require('mysql2/promise');

// Configuración de la conexión a la base de datos
const dbConfig = mysql.createPool({
    host: ddbb_data.host,
    user: ddbb_data.user,
    password: ddbb_data.password,
    database: ddbb_data.database,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
  });
async function esTemperatura(idOrMac) {
  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);
    const query = `
      SELECT esTemperatura 
      FROM beacons 
      WHERE id = ? OR mac = ?
    `;
    const [rows] = await connection.execute(query, [idOrMac, idOrMac]);
    return rows.length > 0 ? rows[0].esTemperatura === 1 : false;
  } catch (error) {
    console.error('Error al consultar la base de datos:', error);
    return false;
  } finally {
    if (connection) await connection.end();
  }
}

async function obtenerTempBeaconId(macAddress) {
  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);
    const query = 'SELECT id FROM beacons WHERE mac = ?';
    const [rows] = await connection.execute(query, [macAddress]);
    return rows.length > 0 ? rows[0].id : null;
  } catch (error) {
    console.error('Error al obtener temp_beacon_id:', error);
    return null;
  } finally {
    if (connection) await connection.end();
  }
}

function obtenerValor(jsonString, key) {
  try {
    const json = JSON.parse(jsonString);
    return json[key];
  } catch (e) {
    return null;
  }
}

async function insertarDatosSegunIdent(ident, newData, additionalData, temp_beacon_id = null) {
  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);
    let query, values;

    switch (ident) {
      case '352592573522828':
        query = `INSERT INTO teltonika.gh_5200_data_352592573522828 
                 (id_dispo, device_id_gps_data, event_enum, altitude, latitude, longitude, 
                  timestamp, beacon_id, rsi_beacon, battery_level, ble_sensor_humidity, 
                  ble_sensor_magnet_status, ble_sensor_temperature, ID_GPS_DATA) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
        break;
      case '353201350896384':
        query = `INSERT INTO teltonika.magic_box_tmt_210_data_353201350896384 
                 (id_dispo, device_id_gps_data, event_enum, altitude, latitude, longitude, 
                  timestamp, beacon_id, rsi_beacon, battery_level, ble_sensor_humidity, 
                  ble_sensor_magnet_status, ble_sensor_temperature, ID_GPS_DATA) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
        break;
      case '352592576164230':
        query = `INSERT INTO teltonika.fmb204_data_352592576164230 
                 (id_dispo, device_id_gps_data, event_enum, altitude, latitude, longitude, 
                  timestamp, beacon_id, rsi_beacon, battery_level, ble_sensor_humidity, 
                  ble_sensor_magnet_status, ble_sensor_temperature, ID_GPS_DATA) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
        break;
      default:
        console.log(`Ident no reconocido: ${ident}`);
        return;
    }

    if (newData.event_enum === 385) {
      values = [
        ident, newData.device_id, newData.event_enum, newData.altitude, newData.latitude, newData.longitude,
        newData.timestamp, additionalData.KTK_ID, additionalData.KTK_RSSI, newData.battery_level, 
        newData.ble_sensor_humidity_1, newData.ble_sensor_magnet_status_1, additionalData.KTK_TEMPERATURE, 
        newData.id
      ];
    } else if (newData.event_enum === 11317) {
      query = query.replace('rsi_beacon', 'battery_level, ble_sensor_humidity, ble_sensor_magnet_status, ble_sensor_temperature, `EYE_battery.low`, EYE_humidity, EYE_id, `EYE_mac.address`, EYE_magnet, `EYE_magnet.count`, EYE_movement, `EYE_movement.count`, EYE_temperature, EYE_type');
      values = [
        ident, newData.device_id, newData.event_enum, newData.altitude, newData.latitude, newData.longitude,
        newData.timestamp, temp_beacon_id, newData.battery_level, newData.ble_sensor_humidity_1,
        newData.ble_sensor_magnet_status_1, newData.ble_sensor_temperature_1, additionalData.EYE_battery_low, 
        additionalData.EYE_humidity, additionalData.EYE_id, additionalData.EYE_mac_address, 
        additionalData.EYE_magnet, additionalData.EYE_magnet_count, additionalData.EYE_movement, 
        additionalData.EYE_movement_count, additionalData.EYE_temperature, additionalData.EYE_type, newData.id
      ];
    }

    await connection.execute(query, values);
    console.log(`Datos insertados correctamente para ident: ${ident}`);
  } catch (error) {
    console.error('Error al insertar datos:', error);
  } finally {
    if (connection) await connection.end();
  }
}

async function procesarDatosGPS_GPS_DATA(newData) {
  if (newData.event_enum === 385) {
    const bleBeacons = JSON.parse(newData.ble_beacons);
    let highestRssi = -999999;
    let highestRssiElement = null;

    for (const beacon of bleBeacons) {
      const rssi = parseInt(beacon.rssi);
      const id = beacon.id;
      const esPuerta = await esTemperatura(id);

      if (rssi > highestRssi && !esPuerta) {
        highestRssi = rssi;
        highestRssiElement = beacon;
      }
    }

    if (highestRssiElement) {
      const ktkData = {
        KTK_ID: highestRssiElement.id,
        KTK_battery_voltage: highestRssiElement.battery?.voltage,
        KTK_RSSI: highestRssiElement.rssi,
        KTK_TEMPERATURE: highestRssiElement.temperature
      };

      await insertarDatosSegunIdent(newData.ident, newData, ktkData);
    }
  } else if (newData.event_enum === 11317) {
    const bleBeacons = newData.ble_beacons;
    const eyeData = {
      EYE_mac_address: obtenerValor(bleBeacons, 'mac.address'),
      EYE_battery_low: obtenerValor(bleBeacons, 'battery.low'),
      EYE_humidity: obtenerValor(bleBeacons, 'humidity'),
      EYE_id: obtenerValor(bleBeacons, 'id'),
      EYE_magnet: obtenerValor(bleBeacons, 'magnet'),
      EYE_magnet_count: obtenerValor(bleBeacons, 'magnet.count'),
      EYE_movement: obtenerValor(bleBeacons, 'movement'),
      EYE_movement_count: obtenerValor(bleBeacons, 'movement.count'),
      EYE_temperature: obtenerValor(bleBeacons, 'temperature'),
      EYE_type: obtenerValor(bleBeacons, 'type')
    };

    let temp_beacon_id = null;
    if (eyeData.EYE_mac_address) {
      temp_beacon_id = await obtenerTempBeaconId(eyeData.EYE_mac_address);
    }

    if (temp_beacon_id === null) {
      temp_beacon_id = `no encontrado: ${eyeData.EYE_mac_address || 'NULL'}`;
    }

    const esPuerta = await esTemperatura(eyeData.EYE_mac_address);

    if (!esPuerta) {
      await insertarDatosSegunIdent(newData.ident, newData, eyeData, temp_beacon_id);
    }
  }
}


module.exports={procesarDatosGPS_GPS_DATA};