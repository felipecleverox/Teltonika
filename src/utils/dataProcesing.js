const { procesarDatosGPS_GPS_DATA } = require('./nuevo_dato_GPS_data_table');
const { triggerGPSRegistroTemperatura } = require('./trigger_GPS_registro_temperatura');
const { GPS_DATa_To_Door_Status } = require('./GPSDATAaDoorStatus');

async function procesarDatosGPS(newData) {
  try {
    // Paso 1: Procesar los datos GPS principales
    await procesarDatosGPS_GPS_DATA(newData);

    // Paso 2: Registrar temperaturas
    await triggerGPSRegistroTemperatura(newData);

    // Paso 3: Actualizar estado de puertas
    // Nota: GPS_DATa_To_Door_Status espera ble_beacons y timestamp como argumentos separados
    await GPS_DATa_To_Door_Status(JSON.parse(newData.ble_beacons), newData.timestamp);

    console.log('Procesamiento de datos GPS completado con éxito');
  } catch (error) {
    console.error('Error en el procesamiento de datos GPS:', error);
  }
}

module.exports = { procesarDatosGPS };  