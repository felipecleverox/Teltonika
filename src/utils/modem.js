const { SerialPort } = require('serialport');

class ModemSMS {
  constructor() {
    this.port = new SerialPort({
      path: 'COM3', // Este puerto deberás verificarlo en el administrador de dispositivos
      baudRate: 115200,
      dataBits: 8,
      parity: 'none',
      stopBits: 1,
      flowControl: false
    });

    this.port.on('error', (err) => {
      console.error('Error en el puerto serial:', err);
    });
  }

  async initialize() {
    await this.sendCommand('AT'); // Verifica comunicación
    await this.sendCommand('AT+CMGF=1'); // Configura modo texto
    await this.sendCommand('AT+CSCS="GSM"'); // Configura codificación
  }

  sendCommand(command) {
    return new Promise((resolve, reject) => {
      let response = '';
      
      const timeout = setTimeout(() => {
        reject(new Error('Timeout esperando respuesta del módem'));
      }, 5000);

      const dataHandler = (data) => {
        response += data.toString();
        if (response.includes('OK') || response.includes('ERROR')) {
          clearTimeout(timeout);
          this.port.removeListener('data', dataHandler);
          if (response.includes('ERROR')) {
            reject(new Error(`Error del módem: ${response}`));
          } else {
            resolve(response);
          }
        }
      };

      this.port.on('data', dataHandler);
      this.port.write(command + '\r\n');
    });
  }

  async sendSMS(phoneNumber, message) {
    try {
      await this.sendCommand(`AT+CMGS="${phoneNumber}"`);
      await new Promise(resolve => setTimeout(resolve, 1000));
      await this.sendCommand(message + '\x1A'); // \x1A es Ctrl+Z
      return true;
    } catch (error) {
      console.error('Error enviando SMS:', error);
      throw error;
    }
  }
}

module.exports = ModemSMS;