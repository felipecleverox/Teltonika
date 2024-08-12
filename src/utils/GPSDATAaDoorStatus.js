const mysql = require("mysql2/promise");
const ddbb_data = require("./config/ddbb.json");

async function GPS_DATa_To_Door_Status(ble_beacons, timestamp) {
  let mac_address = obtenerMacAddress(ble_beacons);
  let esPuerta = obtenerEsPuerta(mac_address);
  let temperatura;
  let statusMagnetico;
  let ubicacion;
  let tiempo_formateado;
  if (esPuerta) {
    temperatura = await obtenerTemperatura(ble_beacons);
    statusMagnetico = await obtenerStatusMagnetico(ble_beacons);
    ubicacion = await obtenerUbicacion(mac_address);
    tiempo_formateado = fromUnixTime(timestamp);
    await insertarRegistro(
      ubicacion,
      statusMagnetico,
      temperatura,
      tiempo_formateado
    );
  }
}

async function insertarRegistro(
  ubicacion,
  statusMagnetico,
  temperatura,
  tiempo_formateado
) {
  const connection = await pool.getConnection();
  try {
    await connection.query(
      "INSERT INTO door_status (sector, magnet_status, temperature, timestamp) VALUES (?, ?, ?, ?)",
      [ubicacion, statusMagnetico, temperatura, tiempo_formateado]
    );
  } catch (error) {
    console.error(error);
  } finally {
    connection.end();
  }}

async function obtenerUbicacion(mac) {
  const connection = await pool.getConnection();
  try {
    let ubicacion;
    await connection.query(
      "SELECT ubicacion INTO ? FROM beacons WHERE mac = ?",
      [ubicacion, mac]
    );
    return ubicacion;
  } catch (error) {
    console.error(error);
  } finally {
    connection.end();
  }
}
/**
 * Retrieves the status of the magnetic sensor from the first beacon in the provided array.
 *
 * @param {Array<Object>} input - The array of beacons containing the magnetic sensor status.
 * @return {Promise<boolean>} A promise that resolves to the status of the magnetic sensor.
 */
async function obtenerStatusMagnetico(input) {
  let statusMagnetico = input[0].magnet;
  return statusMagnetico;
}
/**
 * Retrieves the temperature from the first beacon in the provided array.
 *
 * @param {Array<Object>} ble_beacons - The array of beacons containing temperature data.
 * @return {Promise<number>} A promise that resolves to the temperature value.
 */
async function obtenerTemperatura(inputs) {
  let temperatura = inputs[0].temperature;
  return temperatura;
}
// para obener la mac address
async function obtenerMacAddress(input_mac) {
  let mac_address = input_mac[0].mac_address;
  return mac_address;
}

// para saber si es una puerta o no
async function obtenerEsPuerta(mac_address) {
  const connection = await pool.getConnection();
  try {
    let out;
    let esPuerta;
    await connection.query(
      "SELECT esPuerta INTO ? FROM beacons WHERE mac = ?",
      [esPuerta, mac_address]
    );
    if (esPuerta == 1) {
      out = true;
    } else {
      out = false;
    }
    return out;
  } catch (error) {
    console.error(error);
  } finally {
    connection.release();
  }
}
// conexion con la base de datos
const pool = mysql.createPool({
  host: ddbb_data.host,
  user: ddbb_data.user,
  password: ddbb_data.password,
  database: ddbb_data.database,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

/**
 * Converts a Unix timestamp to a formatted date and time string.
 *
 * @param {number} tiempo - The Unix timestamp to convert.
 * @return {string} The formatted date and time string in the format "YYYY-MM-DD HH:MM".
 */
async function fromUnixTime(tiempo) {
  const date = new Date(tiempo * 1000); // Convertir tiempo UNIX a milisegundos
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0"); // Agregar ceros a la izquierda si es un solo dígito
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const formattedTime = `${year}-${month}-${day} ${hours}:${minutes}`;
  return formattedTime;
}


module.exports={GPS_DATa_To_Door_Status};