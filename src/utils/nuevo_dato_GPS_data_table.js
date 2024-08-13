const mysql = require("mysql2/promise");
const ddbb_data = require("./config/ddbb.json");

var event_enum;

async function process_GPS_DATA_TABLE(event_number, ble_beacons,ident) {
  event_enum = event_number;
  const json_data = JSON.parse(ble_beacons);
  switch (event_enum) {
    case 385:
      await procesar_385(json_data,ident);
      break;
    case 11317:
      await procesar_11317(json_data);
      break;
    default:
      break;
  }
}

async function procesar_385(jsonArray,ident) {

  const connection = await pool.getConnection();
  let highest_rssi = -999999;
  let highest_rssi_element = null;
  // Variables para el caso 385
  let KTK_ID = null;
  let KTK_battery_voltage = null;
  let KTK_RSSI = null;
  let KTK_TEMPERATURE = null;
  let sentencia_insert;
  try {
    jsonArray.forEach((element) => {
      const rssi = parseInt(element.rssi);
      const id = element.id;
      let esPuerta_Bucle;
      connection.query("SELECT esTemperatura FROM beacons WHERE id = ?", [
        esPuerta_Bucle,
        id,
      ]);

      if (rssi > highest_rssi && esPuerta_Bucle === 0) {
        highest_rssi = rssi;
        highest_rssi_element = element;
      }
    });
    if (highest_rssi_element) {
        switch(ident){
            case 352592573522828:
                sentencia_insert = "INSERT INTO teltonika.gh_5200_data_352592573522828(id_dispo,device_id_gps_data, event_enum, altitude,latitude, longitude, timestamp`, `beacon_id`, `rsi_beacon`, `battery_level`, `ble_sensor_humidity`,
                 `ble_sensor_magnet_status`, `ble_sensor_temperature`, `ID_GPS_DATA`)";
            VALUES
                ('352592573522828', NEW.device_id, NEW.event_enum, NEW.altitude, NEW.latitude, NEW.longitude,
                 NEW.timestamp, KTK_ID, KTK_RSSI, NEW.battery_level, NEW.ble_sensor_humidity_1,
                 NEW.ble_sensor_magnet_status_1, KTK_TEMPERATURE, NEW.id);
                break;
            case 353201350896384:
                break;
            case 352592576164230:
                break;
            default:
                break;
        }
    }
  } catch (error) {
    console.error(error);
  } finally {
    connection.release();
  }
}
async function procesar_11317(ble_beacons) {}

const pool = mysql.createPool({
  host: ddbb_data.host,
  user: ddbb_data.user,
  password: ddbb_data.password,
  database: ddbb_data.database,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});


module.exports = { process_GPS_DATA_TABLE };
