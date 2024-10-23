const mysql = require("mysql2/promise");
const ddbb_data = require("../../config/ddbb.json"); 
const twilioConfig = require("../../../servicios/config/twilio.json");
const moment = require('moment');
const twilio = require('twilio');
let io;

// Constante para el umbral RSSI
const RSSI_THRESHOLD = -80;

function init(socketIo) {
  io = socketIo;
}
const client = twilio(twilioConfig.accountSid, twilioConfig.authToken);

const INTERVALO_ENTRE_SMS = 2 * 60; // 2 minutos en segundos

const pool = mysql.createPool({
  host: ddbb_data.host,
  user: ddbb_data.user,
  password: ddbb_data.password,
  database: ddbb_data.database,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

async function procesarPosibleIncidencia(device_name, ble_beacons, timestamp, event_enum) {
  console.log(`Procesando posible incidencia para ${device_name}`);
  console.log(`ble_beacons: ${JSON.stringify(ble_beacons)}`);
  
  try {
    const esBlindSpot = await comprobarBlindSpot(device_name, 1);
    if (!esBlindSpot) {
      console.log(`El dispositivo ${device_name} no es un blind spot`);
      return;
    }

    const hayBeacons = comprobarBleBeacons(ble_beacons);
    if (!hayBeacons) {
      console.log(`No hay beacons para procesar`);
      return;
    }

    const beaconList = typeof ble_beacons === 'string' ? JSON.parse(ble_beacons) : ble_beacons;

    for (const beacon of beaconList) {
      await procesarBeacon(device_name, beacon);
    }
  } catch (error) {
    console.error("Error al procesar el JSON:", error.message);
  }
}

async function procesarBeacon(device_name, beacon) {
  console.log(`Procesando beacon: ${JSON.stringify(beacon)}`);
  
  const beaconEsBlindSpot = await comprobarBlindSpot(beacon.id, 2);
  if (!beaconEsBlindSpot) {
    console.log(`El beacon ${beacon.id} no es un blind spot`);
    return;
  }

  console.log(`El beacon ${beacon.id} es un blind spot`);

  if (beacon.rssi <= RSSI_THRESHOLD) {
    console.log(`El RSSI del beacon ${beacon.id} (${beacon.rssi}) es menor o igual que el umbral ${RSSI_THRESHOLD}`);
    return;
  }

  console.log(`El RSSI del beacon ${beacon.id} (${beacon.rssi}) es mayor que el umbral ${RSSI_THRESHOLD}`);

  await insertarIncidencia(device_name, beacon.id);
  await enviarSMS(device_name, beacon.id);
}

async function insertarIncidencia(dispositivo, beacon_id) {
  const query = "INSERT INTO incidencias_blindspot (id_dispositivo, beacon_id, hora_entrada) VALUES (?, ?, NOW())";
  const connection = await pool.getConnection();
  try {
    await connection.query(query, [dispositivo, beacon_id]);
    console.log("Se insertó en incidencias_blindspot");
    if (io) {
      io.emit('nueva_incidencia', { mensaje: 'Nueva incidencia registrada', dispositivo, beacon_id });
    } else {
      console.warn('Socket.IO no está inicializado. No se pudo emitir el evento nueva_incidencia.');
    }
  } finally {
    connection.release();
  }
}

async function enviarSMS(dispositivo, beacon_id) {
  try {
    const puedeEnviarSMS = await verificarTiempoUltimoSMS(dispositivo, beacon_id);
    if (!puedeEnviarSMS) {
      console.log(`Aún no ha pasado suficiente tiempo para enviar otro SMS para ${dispositivo} y ${beacon_id}`);
      return;
    }

    console.log('Intentando enviar SMS...');
    const message = await client.messages.create({
      body: 'tns tns setdigout ?1? ? 2',
      to: '+56985016411',
      from: '+56229145477'
    });
    console.log(`SMS enviado con SID: ${message.sid} para dispositivo ${dispositivo} y beacon ID ${beacon_id}`);
    console.log(message);
    await actualizarUltimoSMS(dispositivo, beacon_id);

    // Registrar el SMS en la nueva tabla
    const query = `
      INSERT INTO historico_sms_blindspot 
      (dispositivo, mac_address, timestamp, estado_sms, sid) 
      VALUES (?, ?, NOW(), 'enviado', ?)
    `;
    const connection = await pool.getConnection();
    try {
      await connection.query(query, [dispositivo, beacon_id, message.sid]);
      console.log("Se registró el SMS en historico_sms");
    } finally {
      connection.release();
    }

  } catch (error) {
    console.error('Error al enviar el SMS:', error);
    
    // Registrar el fallo del SMS
    const query = `
      INSERT INTO historico_sms_blindspot 
      (dispositivo, mac_address, timestamp, estado_sms, detalles) 
      VALUES (?, ?, NOW(), 'fallido', ?)
    `;
    const connection = await pool.getConnection();
    try {
      await connection.query(query, [dispositivo, beacon_id, error.message]);
      console.log("Se registró el fallo del SMS en historico_sms");
    } finally {
      connection.release();
    }
  }
}

async function verificarTiempoUltimoSMS(dispositivo, beacon_id) {
  const query = `
    SELECT ultimo_sms
    FROM ultimo_sms_blindspot
    WHERE id_dispositivo = ? AND beacon_id = ?
  `;
  const connection = await pool.getConnection();
  try {
    const [results] = await connection.query(query, [dispositivo, beacon_id]);
    if (results.length === 0) return true;
    
    const ultimoSMS = moment(results[0].ultimo_sms);
    const ahora = moment();
    return ahora.diff(ultimoSMS, 'seconds') >= INTERVALO_ENTRE_SMS;
  } finally {
    connection.release();
  }
}

async function actualizarUltimoSMS(dispositivo, beacon_id) {
  const query = `
    INSERT INTO ultimo_sms_blindspot (id_dispositivo, beacon_id, ultimo_sms)
    VALUES (?, ?, NOW())
    ON DUPLICATE KEY UPDATE ultimo_sms = NOW()
  `;
  const connection = await pool.getConnection();
  try {
    await connection.query(query, [dispositivo, beacon_id]);
    console.log("Se insertó o actualizó en ultimo_sms_blindspot");
  } finally {
    connection.release();
  }
}

async function comprobarBlindSpot(inputToCheck, caso) {
  let sentenciaSQL = "SELECT esBlind_spot FROM";
  let query = caso === 1 
    ? `${sentenciaSQL} devices WHERE id = ?`
    : `${sentenciaSQL} beacons WHERE id = ?`;
  
  const connection = await pool.getConnection();
  try {
    const [results] = await connection.query(query, [inputToCheck]);
    const esBlindSpot = results[0]?.esBlind_spot === 1;
    console.log(`Resultado de comprobarBlindSpot para ${inputToCheck}: ${esBlindSpot}`);
    return esBlindSpot;
  } finally {
    connection.release();
  }
}

function comprobarBleBeacons(inputToCheck) {
  if (typeof inputToCheck === "string") {
    return inputToCheck !== "[]";
  }
  return inputToCheck.length > 0;
}

module.exports = { init, procesarPosibleIncidencia };