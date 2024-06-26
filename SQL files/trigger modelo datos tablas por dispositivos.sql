DELIMITER //

CREATE TRIGGER trigger_nuevo_dato_gh5200
AFTER INSERT ON gps_data
FOR EACH ROW
BEGIN
	DECLARE json_data JSON;
    DECLARE max_rssi INT;
    DECLARE selected_id VARCHAR(255);
    DECLARE i INT DEFAULT 0;
	DECLARE current_rssi INT;
	DECLARE current_id VARCHAR(255);
    
    -- Convertir la cadena a JSON
    SET json_data = JSON_EXTRACT(NEW.ble_beacons, '$');
    
    -- Inicializar max_rssi con un valor muy bajo
    SET max_rssi = -1000000;
    
        -- Iterar a través de todos los objetos en el array JSON
    WHILE i < JSON_LENGTH(json_data) DO
		-- Extraer el rssi y el id actual
        SET current_rssi = JSON_EXTRACT(json_data, CONCAT('$[', i, '].rssi'));
        SET current_id = JSON_UNQUOTE(JSON_EXTRACT(json_data, CONCAT('$[', i, '].id')));
        
        -- Comprobar si este rssi es el más alto hasta ahora
        IF current_rssi > max_rssi THEN
            SET max_rssi = current_rssi;
            SET selected_id = current_id;
        END IF;
        
        SET i = i + 1;
    END WHILE;
    
    
    IF NEW.device_name = 352592573522828 THEN
		INSERT INTO `teltonika`.`gh_5200_data_352592573522828`
			(
			`id_dispo`,
			`device_id_gps_data`,
			`event_enum`,
			`altitude`,
			`latitude`,
			`longitude`,
			`timestamp`,
			`beacon_id`,
			`rsi_beacon`,
			`battery_level`,
			`ble_sensor_humidity`,
			`ble_sensor_magnet_status`,
			`ble_sensor_temperature`)
			VALUES
			(352592573522828,
			NEW.device_id,
			NEW.event_enum,
			NEW.altitude,
			NEW.latitude,
			NEW.longitude,
			NEW.timestamp,
			selected_id,
			max_rssi,
			NEW.battery_level,
			NEW.ble_sensor_humidity_1,
			NEW.ble_sensor_magnet_status_1,
			NEW.ble_sensor_temperature_1);
    END IF;
     


END//

DELIMITER ;
