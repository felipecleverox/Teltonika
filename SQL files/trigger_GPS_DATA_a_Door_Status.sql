DELIMITER //
DROP TRIGGER IF EXISTS triggerGPSDATAaDoorStatus //
CREATE TRIGGER `triggerGPSDATAaDoorStatus` AFTER INSERT ON `gps_data`
FOR EACH ROW 
BEGIN
    DECLARE mac_address VARCHAR(45);
    DECLARE es_puerta TINYINT;
    DECLARE temperatura FLOAT;
    DECLARE status_magnetico TINYINT;
    DECLARE raw_data TEXT;
    DECLARE nombre_sector VARCHAR(45);
    DECLARE tiempo BIGINT;
    DECLARE tiempo_formateado DATETIME;
    
    
    IF NEW.event_enum = 11317 THEN
        SET raw_data = NEW.ble_beacons;
        SET tiempo = NEW.timestamp;
        CALL ObtenerValorString(raw_data, 'mac.address', mac_address);
        SELECT esPuerta INTO es_puerta FROM beacons WHERE mac = mac_address;
        IF es_puerta = 1 THEN
            CALL ObtenerValorString(raw_data, 'temperature', temperatura);
            CALL ObtenerValorString(raw_data, 'magnet', status_magnetico);
            SELECT ubicacion INTO nombre_sector FROM beacons WHERE mac = mac_address;
            SET tiempo_formateado = FROM_UNIXTIME(tiempo);
            INSERT INTO door_status (sector, magnet_status, temperature, timestamp)
            VALUES (nombre_sector, status_magnetico, temperatura, tiempo_formateado);
        END IF;
    END IF;
END //

DELIMITER ;