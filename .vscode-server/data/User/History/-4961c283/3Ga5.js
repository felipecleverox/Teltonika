async function triggerGPSRegistroTemperatura(newData) {
  let connection;
  try {
    connection = await pool.getConnection();

    if (!newData || typeof newData.ble_beacons !== 'string') {
      console.error('Datos de entrada inválidos:', newData);
      return;
    }

    let jsonData;
    try {
      jsonData = JSON.parse(newData.ble_beacons);
    } catch (error) {
      console.error('Error al parsear ble_beacons:', error);
      return;
    }

    if (!Array.isArray(jsonData)) {
      console.error('ble_beacons no es un array:', jsonData);
      return;
    }

    for (let jsonElement of jsonData) {
      const temperatura = jsonElement.temperature;

      if (temperatura !== null && temperatura !== undefined) {
        await connection.execute('INSERT INTO process_log(message) VALUES(?)', [temperatura.toString()]);

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
          if (beaconId) {
            const [rows] = await connection.execute(
              'SELECT esTemperatura FROM beacons WHERE id LIKE ?',
              [`%${beaconId}%`]
            );
            if (rows.length > 0) {
              esTemperatura = rows[0].esTemperatura;
            }
            await connection.execute('INSERT INTO process_log(message) VALUES(?)', 
              [`%${beaconId}% esTemperatura:_${esTemperatura}`]);
          } else {
            console.warn('Beacon sin ID ni MAC address encontrado:', jsonElement);
            continue;
          }
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
      await connection.release();
    }
  }
}