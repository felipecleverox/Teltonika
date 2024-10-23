const axios = require('axios');
const mysql = require('mysql2/promise');
const fs = require('fs').promises;
const ddbb_data = require('./config/ddbb.json');
const ubibot_acount_info = require('./config/ubibot_acount_info.json');
const sgMailConfig = require('./config/sgMailConfig.json');
const twilioConfig = require('./config/twilio.json');
const moment = require('moment-timezone');
const twilio = require('twilio');

// Configuración de SendGrid
const SENDGRID_API_KEY = sgMailConfig.SENDGRID_API_KEY;

// Configuración de Twilio
const twilioClient = new twilio(twilioConfig.accountSid, twilioConfig.authToken);

// Configuración de la base de datos
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
        const response = await axios.get(`https://webapi.ubibot.com/channels`, {
            params: { token_id: tokenId }
        });
        return response.data.result === 'success';
    } catch (error) {
        console.error('Error al validar el token:', error.message);
        return false;
    }
}

async function getChannels() {
    try {
        const response = await axios.get('https://webapi.ubibot.com/channels', {
            params: { account_key: ubibot_acount_info.ACCOUNT_KEY }
        });
        
        if (response.data.result === 'success') {
            return response.data.channels;
        } else {
            throw new Error('Error al obtener los canales.');
        }
    } catch (error) {
        console.error('Error al obtener los canales:', error.message);
        return [];
    }
}

async function getChannelData(tokenId, channelId) {
  try {
    const response = await axios.get(`https://webapi.ubibot.com/channels/${channelId}`, {
      params: { token_id: tokenId }
    });

    const channelData = response.data.channel;
    const lastValues = JSON.parse(channelData.last_values);

    await processChannelData(channelData);
    await processSensorReadings(channelData.channel_id, lastValues);

  } catch (error) {
    console.error(`Error fetching channel data for channel ${channelId}:`, error);
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

function getSantiagoTime(utcTime) {
  return moment.utc(utcTime).tz("America/Santiago");
}

async function processSensorReadings(channelId, lastValues) {
  const connection = await pool.getConnection();
  try {
    const utcTimestamp = moment.utc(lastValues.field1.created_at);
    const santiagoTime = getSantiagoTime(utcTimestamp);
    
    console.log('UTC Timestamp:', utcTimestamp.format());
    console.log('Santiago Time:', santiagoTime.format());

    await connection.query(
      'INSERT INTO sensor_readings_ubibot (channel_id, timestamp, temperature, humidity, light, voltage, wifi_rssi, external_temperature, insercion) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [
        channelId,
        utcTimestamp.toDate(),
        lastValues.field1.value,
        lastValues.field2.value,
        lastValues.field3.value,
        lastValues.field4.value,
        lastValues.field5.value,
        lastValues.field8 ? lastValues.field8.value : null,
        santiagoTime.format('YYYY-MM-DD HH:mm:ss')
      ]
    );

    console.log('Inserted data:', {
      channel_id: channelId,
      timestamp: utcTimestamp.toDate(),
      insercion: santiagoTime.format('YYYY-MM-DD HH:mm:ss')
    });

    // Verificar parámetros después de la inserción
    await checkParametersAndNotify(channelId, lastValues);
  } finally {
    connection.release();
  }
}

async function checkParametersAndNotify(channelId, lastValues) {
  console.log('Configuración de correo electrónico:', sgMailConfig);
  console.log('Configuración de Twilio:', twilioConfig);

  let connection;
  try {
    connection = await pool.getConnection();

    // Obtener los parámetros de la tabla parametrizaciones
    const [parameters] = await connection.query('SELECT minimo AS minima_temp_camara, maximo AS maxima_temp_camara FROM parametrizaciones WHERE param_id = 6');
    
    if (parameters.length === 0) {
      console.log('No se encontraron parámetros de temperatura. Abortando la verificación.');
      return;
    }

    const { minima_temp_camara, maxima_temp_camara } = parameters[0];
    const temperature = lastValues.field8 ? parseFloat(lastValues.field8.value) : null;
    
    if (temperature === null) {
      console.log(`No se pudo obtener la temperatura para el canal ${channelId}. Abortando la verificación.`);
      return;
    }

    console.log(`Verificando temperatura para el canal ${channelId}: ${temperature.toFixed(2)}°C`);
    console.log(`Rango permitido: ${minima_temp_camara}°C a ${maxima_temp_camara}°C`);

    if (temperature < minima_temp_camara || temperature > maxima_temp_camara) {
      console.log(`Temperatura fuera de rango. Enviando alerta.`);
      
      const [channelInfo] = await connection.query('SELECT name FROM channels_ubibot WHERE channel_id = ?', [channelId]);
      
      if (channelInfo.length === 0) {
        console.log(`No se encontró información para el canal ${channelId}. No se puede enviar la alerta.`);
        return;
      }

      const channelName = channelInfo[0].name;
      const timestamp = moment(lastValues.field1.created_at).format('YYYY-MM-DD HH:mm:ss');
      
      // Enviar notificaciones
      await sendEmail(channelName, temperature, timestamp, minima_temp_camara, maxima_temp_camara);
      await sendSMS(channelName, temperature, timestamp, minima_temp_camara, maxima_temp_camara);

      console.log(`Alertas enviadas para el canal ${channelName}`);
    } else {
      console.log(`Temperatura dentro del rango permitido. No se requiere alerta.`);
    }
  } catch (error) {
    console.error('Error en checkParametersAndNotify:', error);
  } finally {
    if (connection) connection.release();
  }
}

async function sendEmail(channelName, temperature, timestamp, minima_temp_camara, maxima_temp_camara) {
  const FROM_EMAIL = sgMailConfig.email_contacto.from_verificado;
  const TO_EMAILS = sgMailConfig.email_contacto.destinatarios;

  const data = {
    personalizations: [{ to: TO_EMAILS.map(email => ({ email })) }],
    from: { email: FROM_EMAIL },
    subject: `Alerta de temperatura para ${channelName}`,
    content: [{ 
      type: 'text/plain', 
      value: `La temperatura en ${channelName} está fuera de los límites establecidos.
              Temperatura: ${temperature}°C
              Timestamp: ${timestamp}
              Límites permitidos: ${minima_temp_camara}°C - ${maxima_temp_camara}°C`
    }]
  };

  try {
    console.log('Intentando enviar email con la siguiente configuración:');
    console.log('API Key:', SENDGRID_API_KEY.substring(0, 10) + '...');
    console.log('Destinatarios:', TO_EMAILS);
    console.log('Remitente:', FROM_EMAIL);

    const response = await axios.post('https://api.sendgrid.com/v3/mail/send', data, {
      headers: {
        'Authorization': `Bearer ${SENDGRID_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('Respuesta de SendGrid:', response.status, response.statusText);
    console.log('Email enviado exitosamente');
    return true;
  } catch (error) {
    console.error('Error al enviar el email:');
    if (error.response) {
      console.error('Datos de respuesta:', error.response.data);
      console.error('Estado de respuesta:', error.response.status);
      console.error('Cabeceras de respuesta:', error.response.headers);
    } else if (error.request) {
      console.error('No se recibió respuesta. Detalles de la solicitud:', error.request);
    } else {
      console.error('Error al configurar la solicitud:', error.message);
    }
    console.error('Configuración completa del error:', error.config);
    return false;
  }
}

async function sendSMS(channelName, temperature, timestamp, minima_temp_camara, maxima_temp_camara) {
  const message = `Alerta: La temperatura en ${channelName} está fuera de los límites. 
                   Temperatura: ${temperature}°C 
                   Timestamp: ${timestamp} 
                   Límites permitidos: ${minima_temp_camara}°C - ${maxima_temp_camara}°C`;

  const destinatarios = twilioConfig.destinatarios;

  console.log('Destinatarios SMS:', destinatarios);

  for (const destinatario of destinatarios) {
    try {
      const result = await twilioClient.messages.create({
        body: message,
        from: twilioConfig.phoneNumber,
        to: destinatario
      });
      console.log(`SMS de alerta enviado a ${destinatario}. SID: ${result.sid}`);
    } catch (error) {
      console.error(`Error al enviar SMS de alerta a ${destinatario}:`, error.message);
      if (error.code) {
        console.error('Código de error Twilio:', error.code);
      }
    }
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