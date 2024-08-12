const { GPS_DATa_To_Door_Status } = require('./GPSDATAaDoorStatus');

async function processGpsData(gpsData) {
    await GPS_DATa_To_Door_Status(gpsData.ble_beacons, gpsData.timestamp);
}
module.exports = { processGpsData }