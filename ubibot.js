const axios = require('axios');
const mysql = require('mysql2/promise');
const fs = require('fs').promises;
const ddbb_data = require('./config/ddbb.json');
const ubibot_acount_info = require('./config/ubibot_acount_info.json');

const CHANNEL_ID = '88850';

const pool = mysql.createPool({
  host: ddbb_data.host,
  user: ddbb_data.user,
  password: ddbb_data.password,
  database: ddbb_data.database,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

async function getNewToken() {
    try {
        const response = await axios.get('https://webapi.ubibot.com/accounts/generate_access_token', {
            params: { account_key: ubibot_acount_info.ACCOUNT_KEY }
        });

        if (response.data.result === 'success') {
            const tokenId = response.data.token_id;
            await fs.writeFile(ubibot_acount_info.TOKEN_FILE, tokenId);
            await fs.writeFile(ubibot_acount_info.LOG_FILE,"Nuevo token obtenido");
            console.log('Token generado y guardado con éxito.');
            return tokenId;
        } else {
            throw new Error('Error al generar el token, verifique su account_key.');
        }
    } catch (error) {
        console.error('Error al obtener el token:', error.message);
        return null;
    }
}

async function readToken() {
    try {
        return await fs.readFile(ubibot_acount_info.TOKEN_FILE, 'utf8');
    } catch (error) {
        console.error('Error al leer el token:', error.message);
        return null;
    }
}

async function isTokenValid(tokenId) {
    try {
        const response = await axios.get(`https://webapi.ubibot.com/channels/${CHANNEL_ID}`, {
            params: { token_id: tokenId }
        });
        await fs.writeFile(ubibot_acount_info.LOG_FILE,"Token valido");
        return response.data.result === 'success';
    } catch (error) {
        await fs.writeFile(ubibot_acount_info.LOG_FILE,"error en el token:");
        await fs.writeFile(ubibot_acount_info.LOG_FILE,error.message);
        console.error('Error al validar el token:', error.message);
        return false;
    }
}

async function getChannelData(tokenId) {
  try {
    const response = await axios.get(`https://webapi.ubibot.com/channels/${CHANNEL_ID}`, {
      params: { token_id: tokenId }
    });

    const channelData = response.data.channel;
    const lastValues = JSON.parse(channelData.last_values);

    await processChannelData(channelData);
    await processSensorReadings(channelData.channel_id, lastValues);

  } catch (error) {
    console.error('Error fetching channel data:', error);
  }
}

async function processChannelData(channelData) {
  const connection = await pool.getConnection();
  try {
    const [existingChannel] = await connection.query(
      'SELECT * FROM channels_ubibot WHERE channel_id = ?',
      [channelData.channel_id]
    );

    if (existingChannel.length === 0) {
      await connection.query(
        'INSERT INTO channels_ubibot (channel_id, name, product_id, device_id, latitude, longitude, firmware, mac_address, created_at, last_entry_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [channelData.channel_id, channelData.name, channelData.product_id, channelData.device_id, channelData.latitude, channelData.longitude, channelData.firmware, channelData.mac_address, new Date(channelData.created_at), new Date(channelData.last_entry_date)]
      );
    } else {
      const currentChannel = existingChannel[0];
      if (
        currentChannel.product_id !== channelData.product_id ||
        currentChannel.device_id !== channelData.device_id ||
        currentChannel.latitude !== channelData.latitude ||
        currentChannel.longitude !== channelData.longitude ||
        currentChannel.firmware !== channelData.firmware ||
        currentChannel.mac_address !== channelData.mac_address ||
        new Date(currentChannel.last_entry_date).getTime() !== new Date(channelData.last_entry_date).getTime()
      ) {
        await connection.query(
          'UPDATE channels_ubibot SET product_id = ?, device_id = ?, latitude = ?, longitude = ?, firmware = ?, mac_address = ?, last_entry_date = ? WHERE channel_id = ?',
          [channelData.product_id, channelData.device_id, channelData.latitude, channelData.longitude, channelData.firmware, channelData.mac_address, new Date(channelData.last_entry_date), channelData.channel_id]
        );
      }
    }
  } finally {
    connection.release();
  }
}

async function processSensorReadings(channelId, lastValues) {
  const connection = await pool.getConnection();
  try {
    await connection.query(
      'INSERT INTO sensor_readings_ubibot (channel_id, timestamp, temperature, humidity, light, voltage, wifi_rssi, external_temperature) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [
        channelId,
        new Date(lastValues.field1.created_at),
        lastValues.field1.value,
        lastValues.field2.value,
        lastValues.field3.value,
        lastValues.field4.value,
        lastValues.field5.value,
        lastValues.field8.value
      ]
    );
  } finally {
    connection.release();
  }
}

async function procesarDatosUbibot() {
    await fs.writeFile(ubibot_acount_info.LOG_FILE,"Inicio del proceso");
    let tokenId = await readToken();

    if (!tokenId || !(await isTokenValid(tokenId))) {
        tokenId = await getNewToken();
    }

    if (tokenId) {
        await getChannelData(tokenId);
        await fs.writeFile(ubibot_acount_info.LOG_FILE,"Proceso finalizado exitosamente");
        console.log('Datos de Ubibot procesados exitosamente.');
    } else {
        await fs.writeFile(ubibot_acount_info.LOG_FILE,"Error al obtener token");
        console.log('No se pudo obtener un token válido.');
    }
}

module.exports = { procesarDatosUbibot };