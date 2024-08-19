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
async function triggerGPSRegistroTemperatura(newData) {
  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);

    const jsonData = JSON.parse(newData.ble_beacons);
    const arrayLength = jsonData.length;

    for (let counter = 0; counter < arrayLength; counter++) {
      const jsonElement = jsonData[counter];
      const temperatura = jsonElement.temperature;

      await connection.execute('INSERT INTO process_log(message) VALUES(?)', [temperatura]);

      if (temperatura !== null && temperatura !== undefined) {
        let macAddress = jsonElement['mac.address'];
        let beaconId, esTemperatura;

        if (macAddress) {
          const [rows] = await connection.execute(
            'SELECT id, esTemperatura FROM beacons WHERE mac LIKE ?',
            [`%${macAddress}%`]
          );
          if (rows.length > 0) {
            beaconId = rows[0].id;
            esTemperatura = rows[0].esTemperatura;
          }
          await connection.execute('INSERT INTO process_log(message) VALUES(?)', 
            [`%${macAddress}% esTemperatura:_${esTemperatura}`]);
        } else {
          beaconId = jsonElement.id;
          const [rows] = await connection.execute(
            'SELECT esTemperatura FROM beacons WHERE id LIKE ?',
            [`%${beaconId}%`]
          );
          if (rows.length > 0) {
            esTemperatura = rows[0].esTemperatura;
          }
          await connection.execute('INSERT INTO process_log(message) VALUES(?)', 
            [`%${beaconId}% esTemperatura:_${esTemperatura}`]);
        }

        if (esTemperatura === 1) {
          const timestamp = new Date(newData.timestamp * 1000).toISOString().slice(0, 19).replace('T', ' ');
          await connection.execute(
            'INSERT INTO registro_temperaturas(beacon_id, timestamp, temperatura) VALUES (?, ?, ?)',
            [beaconId, timestamp, temperatura]
          );
          await connection.execute('INSERT INTO process_log(message) VALUES(?)', 
            [`INSERT INTO teltonika.registro_temperaturas(beacon_id, timestamp, temperatura) VALUES (${beaconId}, ${timestamp}, ${temperatura})`]);
        }
      }
    }

    await connection.execute('INSERT INTO process_log(message) VALUES(?)', 
      ['Proceso de registro de temperaturas completado']);

  } catch (error) {
    console.error('Error en triggerGPSRegistroTemperatura:', error);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

module.exports = { triggerGPSRegistroTemperatura };