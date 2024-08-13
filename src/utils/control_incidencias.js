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
  let id_incidencia;
  if (comprobarBlindSpot(id_dispositivo, 1)) {
    if (comprobarBleBeacons(ble_beacons)) {
      if (comprobarBlindSpot(ble_beacons, 2)) {
        if (existenIncidencias(id_dispositivo)) {
          id_incidencia = obtenerUltimaIncidencia(id_dispositivo);
          if (tieneHoraSalida(id_incidencia)) {
            insertarIncidencia(id_dispositivo, timestamp);
          } else {
            actualizarUltimaIncidencia(id_dispositivo, timestamp);
          }
        } else {
          insertarIncidencia(id_dispositivo, timestamp);
        }
      }
    } else {
      actualizarUltimaIncidencia(id_dispositivo, timestamp);
    }
  }
}

module.exports = { procesarPosibleIncidencia };
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
