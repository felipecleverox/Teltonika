const mysql = require("mysql2/promise");
const ddbb_data = require("./config/ddbb.json");
const twilioConfig = require("./config/twilio.json");
const moment = require('moment');
const twilio = require('twilio');

const client = twilio(twilioConfig.accountSid, twilioConfig.authToken);

const INTERVALO_ENTRE_LLAMADAS = 2 * 60; // 2 minutos en segundos

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
  if (event_enum !== 11317) {
    return;
  }

  try {
    const esBlindSpot = await comprobarBlindSpot(device_name, 1);
    if (!esBlindSpot) return;

    const hayBeacons = comprobarBleBeacons(ble_beacons);
    if (!hayBeacons) return;

    const beaconList = typeof ble_beacons === 'string' ? JSON.parse(ble_beacons) : ble_beacons;

    for (const beacon of beaconList) {
      await procesarBeacon(device_name, beacon);
    }
  } catch (error) {
    console.error("Error al procesar el JSON:", error.message);
  }
}

async function procesarBeacon(device_name, beacon) {
  const beaconEsBlindSpot = await comprobarBlindSpot(beacon['mac.address'], 2);
  if (!beaconEsBlindSpot) return;

  await insertarIncidencia(device_name, beacon['mac.address']);
  await realizarLlamadaTelefonica(device_name, beacon['mac.address']);
}

async function insertarIncidencia(dispositivo, mac_address) {
  const query = "INSERT INTO incidencias_blindspot (id_dispositivo, beacon_id, hora_entrada) VALUES (?, ?, NOW())";
  const connection = await pool.getConnection();
  try {
    await connection.query(query, [dispositivo, mac_address]);
    console.log("Se inserto en incidencias_blindspot");
  } finally {
    connection.release();
  }
}

async function realizarLlamadaTelefonica(dispositivo, mac_address) {
  try {
    const puedeRealizarLlamada = await verificarTiempoUltimaLlamada(dispositivo, mac_address);
    if (!puedeRealizarLlamada) {
      console.log(`Aún no ha pasado suficiente tiempo para realizar otra llamada para ${dispositivo} y ${mac_address}`);
      return;
    }

    console.log('Intentando realizar llamada telefónica...');
    const call = await client.calls.create({
      url: twilioConfig.url_llamada,
      to: '+56962377945',
      from: twilioConfig.phoneNumber
    });
    console.log(`Llamada iniciada con SID: ${call.sid} para dispositivo ${dispositivo} y beacon MAC ${mac_address}`);
    
    await actualizarUltimaLlamada(dispositivo, mac_address);
  } catch (error) {
    console.error('Error al realizar la llamada:', error);
  }
}

async function verificarTiempoUltimaLlamada(dispositivo, mac_address) {
  const query = `
    SELECT ultima_llamada
    FROM ultima_llamada_blindspot
    WHERE id_dispositivo = ? AND beacon_id = ?
  `;
  const connection = await pool.getConnection();
  try {
    const [results] = await connection.query(query, [dispositivo, mac_address]);
    if (results.length === 0) return true;
    
    const ultimaLlamada = moment(results[0].ultima_llamada);
    const ahora = moment();
    return ahora.diff(ultimaLlamada, 'seconds') >= INTERVALO_ENTRE_LLAMADAS;
  } finally {
    connection.release();
  }
}

async function actualizarUltimaLlamada(dispositivo, mac_address) {
  const query = `
    INSERT INTO ultima_llamada_blindspot (id_dispositivo, beacon_id, ultima_llamada)
    VALUES (?, ?, NOW())
    ON DUPLICATE KEY UPDATE ultima_llamada = NOW()
  `;
  const connection = await pool.getConnection();
  try {
    await connection.query(query, [dispositivo, mac_address]);
    console.log("Se inserto o actualizo en ultima_llamada_blindspot");
  } finally {
    connection.release();
  }
}

async function comprobarBlindSpot(inputToCheck, caso) {
  let sentenciaSQL = "SELECT esBlind_spot FROM";
  let query = caso === 1 
    ? `${sentenciaSQL} devices WHERE id = ?`
    : `${sentenciaSQL} beacons WHERE mac = ?`;
  
  const connection = await pool.getConnection();
  try {
    const [results] = await connection.query(query, [inputToCheck]);
    const esBlindSpot = results[0]?.esBlind_spot === 1;
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

module.exports = { procesarPosibleIncidencia };