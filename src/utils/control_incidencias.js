const mysql = require("mysql2/promise");
const ddbb_data = require("/config/ddbb.json");
const { func } = require("joi");
const { concat } = require("core-js/core/array");

const pool = mysql.createPool({
  host: ddbb_data.host,
  user: ddbb_data.user,
  password: ddbb_data.password,
  database: ddbb_data.database,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

async function procesarPosibleIncidencia(
  id_dispositivo,
  ble_beacons,
  timestamp
) {
  try {
    if (comprobarBlindSpot(id_dispositivo, 1)) {
      // comprueba de que el dispositivo es blindspot
      if (comprobarBleBeacons(ble_beacons)) {
        //Si el dispositivo es blindspot y hay beacons
        // Parsear la cadena JSON para convertirla en un arreglo de objetos
        const beaconList = JSON.parse(jsonArray);
        beaconList.forEach((beacon) => {
          //por cada beacon
          if (comprobarBlindSpot(beacon.id, 2)) {
            //comprueba de que el beacon es blindspot
            if (existenIncidencias(id_dispositivo, beacon.id)) {
              //si existen incidencias
              id_incidencia = obtenerUltimaIncidencia(
                id_dispositivo,
                beacon.id
              ); //obtiene la ultima incidencia
              if (tieneHoraSalida(id_incidencia)) {
                //si tiene hora de salida, se inserta la incidencia
                insertarIncidencia(id_dispositivo, beacon.id, timestamp);
                //aqui hay que llamar
              }
            } else {
              //si no existen incidencias
              insertarIncidencia(id_dispositivo, beacon.id, timestamp);
              //aqui hay que llamar
            }
          }
        });
      } else {
        //si no hay beacons
        actualizarUltimaIncidencia(timestamp, id_dispositivo);
      }
    }
  } catch (error) {
    console.error("Error al procesar el JSON:", error.message);
    return [];
  }
}

async function actualizarUltimaIncidencia(hora_salida, dispositivo) {
  const query = `
      UPDATE incidencias_blindspot
      SET hora_salida = ?
      WHERE id = (
        SELECT id
        FROM incidencias_blindspot
        WHERE id_dispositivo = ?
        AND hora_salida IS NULL
        ORDER BY id DESC
        LIMIT 1
      )
    `;
  const connection = await pool.getConnection();
  try {
    await connection.query(query, [hora_salida, dispositivo]);
  } finally {
    connection.release();
  }
}
async function tieneHoraSalida(idIncidencia) {
  const query = `
      SELECT hora_salida
      FROM incidencias_blindspot
      WHERE id = ?
    `;
  const connection = await pool.getConnection();
  try {
    const result = await connection.query(query, [idIncidencia]);
    return result[0] && result[0].hora_salida !== null;
  } finally {
    connection.release();
  }
}

async function obtenerUltimaIncidencia(dispositivo, beacon) {
  const query = `
      SELECT id
      FROM incidencias_blindspot
      WHERE id_dispositivo = ? AND beacon_id = ?
      ORDER BY id DESC
      LIMIT 1
    `;
  const connection = await pool.getConnection();
  try {
    const result = await connection.query(query, [dispositivo, beacon]);
    return result[0] ? result[0].id : null;
  } finally {
    connection.release();
  }
}
async function existenIncidencias(dispositivo, beacon, timestamp) {
  const query = `
    SELECT COUNT(*) as count
    FROM incidencias_blindspot
    WHERE id_dispositivo = ? AND beacon_id = ? AND hora_entrada >= ?
  `;
  const horaAtras = timestamp - 60 * 60; // 1 hora en segundos
  const connection = await pool.getConnection();
  try {
    const result = await connection.query(query, [
      dispositivo,
      beacon,
      horaAtras,
    ]);
    return result[0].count > 0;
  } finally {
    connection.release();
  }
}
async function insertarIncidencia(dispositivo, beacon, timestamp) {
  let query =
    "INSERT INTO incidencias_blindspot (id_dispositivo,beacon_id,hora_entrada) VALUES ( ? , ? , ? )";
  const connection = await pool.getConnection();
  try {
    connection.query(query, [dispositivo, beacon, timestamp]);
  } finally {
    connection.release();
  }
}
async function comprobarBlindSpot(inputToCheck, caso) {
  let sentenciaSQL = "SELECT esBlind_spot FROM";
  let query;
  switch (caso) {
    case 1: // para comprobar si es blindspot el dispositivo
      query = concat(sentenciaSQL, " devices WHERE id = ?");
      break;
    case 2: // para comprobar si es blindspot el beacon
      query = concat(sentenciaSQL, " beacons WHERE id = ?");
      break;
    default:
      return false;
  }
  const connection = await pool.getConnection();
  try {
    connection.query(query, [inputToCheck], (error, results) => {
      if (error) {
        return callback(error, null);
      }
      if (results.length > 0) {
        const valor = results[0].esBlind_spot;
        callback(null, valor === 1);
      } else {
        callback(null, false); // Si no se encuentra el ID, retorna false
      }
    });
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
