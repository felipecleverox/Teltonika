// Importar las bibliotecas necesarias
const axios = require('axios'); // Para hacer solicitudes HTTP
const fs = require('fs').promises; // Para operaciones de archivo asíncronas
const ExcelJS = require('exceljs'); // Para manejar archivos Excel

// Configuración
const ACCOUNT_KEY = '2bb378b1b4e0b210b3974a02b9d5b4d0'; // Tu account_key de UbiBot
const TOKEN_FILE = 'token_id.txt'; // Archivo para almacenar el token
const EXCEL_FILE = 'channel_80005_data.xlsx'; // Archivo Excel para almacenar datos
const UPDATE_INTERVAL = 60000; // Intervalo de actualización en milisegundos (1 minuto)
const TOKEN_UPDATE_CYCLE = 50; // Número de ciclos antes de actualizar el token

// Función para obtener un nuevo token
async function getNewToken() {
    try {
        // Hacer una solicitud GET para generar un nuevo token
        const response = await axios.get('https://webapi.ubibot.com/accounts/generate_access_token', {
            params: { account_key: ACCOUNT_KEY }
        });

        // Verificar si la solicitud fue exitosa
        if (response.data.result === 'success') {
            const tokenId = response.data.token_id;
            // Guardar el nuevo token en el archivo
            await fs.writeFile(TOKEN_FILE, tokenId);
            console.log('Token generado y guardado con éxito.');
            return tokenId;
        } else {
            throw new Error('Error al generar el token, verifique su account_key.');
        }
    } catch (error) {
        console.error('Error al obtener el token:', error.message);
        return null;
    }
}

// Función para leer el token actual
async function readToken() {
    try {
        // Leer el token desde el archivo
        return await fs.readFile(TOKEN_FILE, 'utf8');
    } catch (error) {
        console.error('Error al leer el token:', error.message);
        return null;
    }
}

// Función para obtener y procesar datos del canal
async function processChannelData(tokenId) {
    try {
        // Hacer una solicitud GET para obtener los datos del canal
        const response = await axios.get('https://webapi.ubibot.com/channels', {
            params: { token_id: tokenId }
        });

        // Encontrar el canal con channel_id "80005"
        const channelData = response.data.channels.find(channel => channel.channel_id === '80005');

        if (channelData) {
            // Extraer y procesar los datos del canal
            const lastValues = JSON.parse(channelData.last_values);
            const datetime = new Date(channelData.last_entry_date);
            datetime.setHours(datetime.getHours() - 4); // Restar 4 horas

            // Preparar los datos extraídos
            const extractedData = {
                date: datetime.toLocaleDateString('es-ES'),
                time: datetime.toLocaleTimeString('es-ES'),
                longitude: channelData.longitude,
                latitude: channelData.latitude,
                field1_value: lastValues.field1?.value,
                field2_value: lastValues.field2?.value,
                field7_value: lastValues.field7?.value,
            };

            // Guardar los datos en el archivo Excel
            await saveToExcel(extractedData);
            console.log('Datos del canal 80005 añadidos al archivo Excel.');
        } else {
            console.log('El canal 80005 no se encontró en la respuesta de la API.');
        }
    } catch (error) {
        console.error('Error al procesar los datos del canal:', error.message);
    }
}

// Función para guardar datos en Excel
async function saveToExcel(data) {
    const workbook = new ExcelJS.Workbook();
    try {
        // Intentar cargar el archivo Excel existente
        await workbook.xlsx.readFile(EXCEL_FILE);
    } catch (error) {
        // Si el archivo no existe, crear una nueva hoja
        workbook.addWorksheet('Sheet1');
    }

    const worksheet = workbook.getWorksheet('Sheet1');

    // Si la hoja está vacía, agregar encabezados
    if (worksheet.rowCount === 0) {
        worksheet.addRow(Object.keys(data));
    }

    // Agregar los nuevos datos
    worksheet.addRow(Object.values(data));

    // Guardar el archivo Excel
    await workbook.xlsx.writeFile(EXCEL_FILE);
}

// Función principal que ejecuta el proceso
async function main() {
    let cycleCount = 0;
    let tokenId = await readToken();

    // Bucle principal
    while (true) {
        if (!tokenId || cycleCount >= TOKEN_UPDATE_CYCLE) {
            // Obtener un nuevo token si no existe o si es tiempo de actualizarlo
            tokenId = await getNewToken();
            cycleCount = 0;
        }

        if (tokenId) {
            // Procesar los datos del canal
            await processChannelData(tokenId);
            cycleCount++;
        } else {
            console.log('No se pudo obtener un token válido. Reintentando en el próximo ciclo.');
        }

        // Esperar antes del próximo ciclo
        await new Promise(resolve => setTimeout(resolve, UPDATE_INTERVAL));
    }
}

// Iniciar el proceso principal
main().catch(error => console.error('Error en el proceso principal:', error));