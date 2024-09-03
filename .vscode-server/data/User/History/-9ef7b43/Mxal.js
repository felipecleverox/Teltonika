const { procesarDatosGPS_GPS_DATA } = require('./nuevo_dato_GPS_data_table');
const { triggerGPSRegistroTemperatura } = require('./trigger_GPS_registro_temperatura');
const { GPS_DATa_To_Door_Status } = require('./GPSDATAaDoorStatus');

async function procesarDatosGPS(newData) {
  try {
    // Paso 1: Procesar los datos GPS principales
    await procesarDatosGPS_GPS_DATA(newData);

    // Paso 2: Registrar temperaturas
    await triggerGPSRegistroTemperatura(newData);

    // Paso 3: Actualizar estado de puertas solo si event_enum es 11317
    if (newData.event_enum === 11317) {
      // Nota: GPS_DATa_To_Door_Status ahora espera ble_beacons como un array
      const bleBeacons = JSON.parse(newData.ble_beacons);
      await GPS_DATa_To_Door_Status(bleBeacons, newData.timestamp);
      console.log('Actualización de estado de puertas completada');
    } else {
      console.log('Saltando actualización de estado de puertas (event_enum no es 11317)');
    }

    console.log('Procesamiento de datos GPS completado con éxito');
  } catch (error) {
    console.error('Error en el procesamiento de datos GPS:', error);
  }
}

module.exports = { procesarDatosGPS };