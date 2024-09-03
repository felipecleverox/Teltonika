const axios = require('axios');
const mysql = require('mysql2/promise');
const fs = require('fs').promises;
const ddbb_data = require('./config/ddbb.json');
const ubibot_acount_info = require('./config/ubibot_acount_info.json');
const moment = require('moment-timezone');

// ... (resto del código sin cambios)

function getSantiagoTime(utcTime) {
  return moment(utcTime).tz("America/Santiago");
}

async function processSensorReadings(channelId, lastValues) {
  const connection = await pool.getConnection();
  try {
    const utcTimestamp = new Date(lastValues.field1.created_at);
    const santiagoTime = getSantiagoTime(utcTimestamp);
    
    await connection.query(
      'INSERT INTO sensor_readings_ubibot (channel_id, timestamp, temperature, humidity, light, voltage, wifi_rssi, external_temperature, insercion) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [
        channelId,
        utcTimestamp,
        lastValues.field1.value,
        lastValues.field2.value,
        lastValues.field3.value,
        lastValues.field4.value,
        lastValues.field5.value,
        lastValues.field8 ? lastValues.field8.value : null,
        santiagoTime.toDate()
      ]
    );
  } finally {
    connection.release();
  }
}

async function procesarDatosUbibot() {
    let tokenId = await readToken();

    if (!tokenId || !(await isTokenValid(tokenId))) {
        tokenId = await getNewToken();
    }

    if (tokenId) {
        const channels = await getChannels();
        console.log(`Total de canales obtenidos: ${channels.length}`);
        
        const channelsToProcess = channels.filter(channel => !ubibot_acount_info.EXCLUDED_CHANNELS.includes(channel.channel_id));
        console.log(`Canales a procesar: ${channelsToProcess.length}`);
        
        for (const channel of channelsToProcess) {
            try {
                await getChannelData(tokenId, channel.channel_id);
                console.log(`Datos procesados exitosamente para el canal ${channel.channel_id}`);
            } catch (error) {
                console.error(`Error al procesar el canal ${channel.channel_id}:`, error.message);
            }
        }
        
        console.log('Todos los canales han sido procesados.');
    } else {
        console.log('No se pudo obtener un token válido.');
    }
}

module.exports = { procesarDatosUbibot };