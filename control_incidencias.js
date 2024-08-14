const mysql = require("mysql2/promise");
const ddbb_data = require("./config/ddbb.json");
const moment = require('moment');
const tiempoEntreIncidencias = 1; //TIEMPO ENTRE INCIDENCIAS

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
  //console.log(`Procesando posible incidencia para dispositivo ${device_name}, event.enum: ${event_enum}`);
  
  if (event_enum !== 11317) { //Ignorando evento con event.enum DIFERENTE a 11317
    return;
  }

  try {
    const esBlindSpot = await comprobarBlindSpot(device_name, 1); // comprobacion se es BlindSpot
    if (!esBlindSpot) return;

    const hayBeacons = comprobarBleBeacons(ble_beacons); //comprobacion si llegaron beacons
    if (!hayBeacons) return;

    const beaconList = typeof ble_beacons === 'string' ? JSON.parse(ble_beacons) : ble_beacons; // se detectaron beacons

    for (const beacon of beaconList) {
      await procesarBeacon(device_name, beacon);
    }
  } catch (error) {
    console.error("Error al procesar el JSON:", error.message);
  }
}

async function procesarBeacon(device_name, beacon) {
  //comienzo de procesamiento de un beacon especifico
  const beaconEsBlindSpot = await comprobarBlindSpot(beacon['mac.address'], 2);
  //comprobacion si el beacon es blindspot
  if (!beaconEsBlindSpot) return;

  const ultimaIncidencia = await obtenerUltimaIncidencia(device_name, beacon['mac.address']);
  if (!ultimaIncidencia) {
    await insertarIncidencia(device_name, beacon['mac.address']);// si no tiene una ultima incidencia, se agrega una nueva
  } else {
    const pasadoMasDeUnMinuto = await haPasadoMasDeUnMinuto(ultimaIncidencia); //se comprueba si a pasado mas de un minuto (segun contante del principio)
    if (pasadoMasDeUnMinuto) {
      await insertarIncidencia(device_name, beacon['mac.address']); //ha pasado mas de un minuto y se agega una nueva incidencia
      /*
       *
       * AQUI SE TIENE QUE HACER LA LLAMADA TELEFONICA
       * a estas alturas tienes el device y el beacon implicado
       */
    }
  }
}

async function obtenerUltimaIncidencia(dispositivo, mac_address) {
  // Obteniendo última incidencia para dispositivo ${dispositivo} y beacon MAC ${mac_address}`);
  const query = `
    SELECT id_incidencia, hora_entrada
    FROM incidencias_blindspot
    WHERE id_dispositivo = ? AND beacon_id = ?
    ORDER BY id_incidencia DESC
    LIMIT 1
  `;
  const connection = await pool.getConnection();
  try {
    const [result] = await connection.query(query, [dispositivo, mac_address]);
    //  Última incidencia encontrada: 
    return result[0];
  } finally {
    connection.release();
  }
}

async function haPasadoMasDeUnMinuto(incidencia) {
  if (!incidencia || !incidencia.hora_entrada) {
    // No se encontró la hora de entrada para la incidencia 
    return true;
  }

  const ahora = moment();
  const entrada = moment(incidencia.hora_entrada);
  const diferenciaEnMinutos = ahora.diff(entrada, 'minutes');
  
  //console.log(`Tiempo transcurrido: ${diferenciaEnMinutos} minutos`);
  
  return diferenciaEnMinutos >=  tiempoEntreIncidencias;                                                                                  
}

async function insertarIncidencia(dispositivo, mac_address) {
  // `Insertando nueva incidencia para dispositivo ${dispositivo} y beacon MAC ${mac_address}`);
  const query = "INSERT INTO incidencias_blindspot (id_dispositivo, beacon_id, hora_entrada) VALUES (?, ?, NOW())";
  const connection = await pool.getConnection();
  try {
    const [result] = await connection.query(query, [dispositivo, mac_address]);
    // console.log(`Incidencia insertada con ID: ${result.insertId}`);
  } finally {
    connection.release();
  }
}

async function comprobarBlindSpot(inputToCheck, caso) {
  let sentenciaSQL = "SELECT esBlind_spot FROM";
  let query = caso === 1 
    ? `${sentenciaSQL} devices WHERE id = ?`
    : `${sentenciaSQL} beacons WHERE mac = ?`;
 // console.log(`Comprobando si ${caso === 1 ? 'el dispositivo' : 'el beacon con MAC'} '${inputToCheck}' es blindspot`);
  
  const connection = await pool.getConnection();
  try {
    const [results] = await connection.query(query, [inputToCheck]);
    const esBlindSpot = results[0]?.esBlind_spot === 1;
    //console.log(`Resultado de la comprobación: ${esBlindSpot}`);
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