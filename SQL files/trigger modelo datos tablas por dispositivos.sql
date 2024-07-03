CREATE DEFINER=`root`@`localhost` TRIGGER `trigger_nuevo_dato_GPS_data_table` AFTER INSERT ON `gps_data` FOR EACH ROW BEGIN
    -- Variables utilizadas en el trigger
    -- Variables a ser utilizadas en el caso 11317
    DECLARE EYE_battery_low TINYINT DEFAULT NULL;
    DECLARE EYE_humidity INT DEFAULT NULL;
    DECLARE EYE_id VARCHAR(50) DEFAULT NULL;
    DECLARE EYE_mac_address VARCHAR(50) DEFAULT NULL;
    DECLARE EYE_magnet TINYINT DEFAULT NULL;
    DECLARE EYE_magnet_count INT DEFAULT NULL;
    DECLARE EYE_movement TINYINT DEFAULT NULL;
    DECLARE EYE_movement_count INT DEFAULT NULL;
    DECLARE EYE_temperature DECIMAL(5,2) DEFAULT NULL;
    DECLARE EYE_type VARCHAR(45) DEFAULT NULL;
    DECLARE temp_beacon_id VARCHAR(50) DEFAULT NULL;
    
    -- Variables para extraer datos del caso 385
    DECLARE KTK_ID VARCHAR(50) DEFAULT NULL;
    DECLARE KTK_battery_voltage INT DEFAULT NULL;
    DECLARE KTK_RSSI INT DEFAULT NULL;
    DECLARE KTK_TEMPERATURE FLOAT DEFAULT NULL;
    
    -- Variables para loop
    DECLARE counter INT DEFAULT 0;
    DECLARE array_length INT DEFAULT 0;
    DECLARE highest_rssi INT DEFAULT -999999;
    DECLARE json_element JSON DEFAULT NULL;
    DECLARE json_data JSON DEFAULT NULL;
    DECLARE highest_rssi_element JSON DEFAULT NULL;
    -- TEXTO DE ble_beacon
    DECLARE texto_original_ble_beacon VARCHAR(10000);
    

    -- Convertir la cadena a JSON
    SET json_data = NEW.ble_beacons;
    

    -- Log the initial JSON data
    INSERT INTO process_log(message, timestamp) 
    VALUES (CONCAT('json_data: ', json_data), CURRENT_TIMESTAMP);

    -- INICIO CASO EVENT.ENUM = 385
    IF NEW.event_enum = 385 THEN
        SET array_length = JSON_LENGTH(json_data);
        WHILE counter < array_length DO
            -- Extraer el elemento JSON en el índice actual
            SET json_element = JSON_EXTRACT(json_data, CONCAT('$[', counter, ']'));
            
            -- Extraer el valor RSSI del elemento JSON actual
            SET @rssi = CAST(JSON_UNQUOTE(JSON_EXTRACT(json_element, '$.rssi')) AS SIGNED);
            
            -- Verificar si este valor RSSI es mayor que el actual más alto
            IF @rssi > highest_rssi THEN
                SET highest_rssi = @rssi;
                SET highest_rssi_element = json_element;
            END IF;
            SET counter = counter + 1;
        END WHILE;

        -- Obtener los datos del elemento con el rssi más alto
        SET KTK_ID = JSON_UNQUOTE(JSON_EXTRACT(highest_rssi_element, '$.id'));
        SET KTK_battery_voltage = JSON_UNQUOTE(JSON_EXTRACT(highest_rssi_element, '$.battery.voltage'));
        SET KTK_RSSI = JSON_UNQUOTE(JSON_EXTRACT(highest_rssi_element, '$.rssi'));
        SET KTK_TEMPERATURE = JSON_UNQUOTE(JSON_EXTRACT(highest_rssi_element, '$.temperature'));
        
        -- Insertar datos en la tabla adecuada según el device ident
        IF NEW.ident = '352592573522828' THEN
            INSERT INTO `teltonika`.`gh_5200_data_352592573522828`
                (`id_dispo`, `device_id_gps_data`, `event_enum`, `altitude`, `latitude`, `longitude`,
                 `timestamp`, `beacon_id`, `rsi_beacon`, `battery_level`, `ble_sensor_humidity`,
                 `ble_sensor_magnet_status`, `ble_sensor_temperature`, `ID_GPS_DATA`)
            VALUES
                ('352592573522828', NEW.device_id, NEW.event_enum, NEW.altitude, NEW.latitude, NEW.longitude,
                 NEW.timestamp, KTK_ID, KTK_RSSI, NEW.battery_level, NEW.ble_sensor_humidity_1,
                 NEW.ble_sensor_magnet_status_1, KTK_TEMPERATURE, NEW.id);
        END IF;

        IF NEW.ident = '353201350896384' THEN
            INSERT INTO `teltonika`.`magic_box_tmt_210_data_353201350896384`
                (`id_dispo`, `device_id_gps_data`, `event_enum`, `altitude`, `latitude`, `longitude`,
                 `timestamp`, `beacon_id`, `rsi_beacon`, `battery_level`, `ble_sensor_humidity`,
                 `ble_sensor_magnet_status`, `ble_sensor_temperature`, `ID_GPS_DATA`)
            VALUES
                ('353201350896384', NEW.device_id, NEW.event_enum, NEW.altitude, NEW.latitude, NEW.longitude,
                 NEW.timestamp, KTK_ID, KTK_RSSI, NEW.battery_level, NEW.ble_sensor_humidity_1,
                 NEW.ble_sensor_magnet_status_1, KTK_TEMPERATURE, NEW.id);
        END IF;

        IF NEW.ident = '352592576164230' THEN
            INSERT INTO `teltonika`.`fmb204_data_352592576164230`
                (`id_dispo`, `device_id_gps_data`, `event_enum`, `altitude`, `latitude`, `longitude`,
                 `timestamp`, `beacon_id`, `rsi_beacon`, `battery_level`, `ble_sensor_humidity`,
                 `ble_sensor_magnet_status`, `ble_sensor_temperature`, `ID_GPS_DATA`)
            VALUES
                ('352592576164230', NEW.device_id, NEW.event_enum, NEW.altitude, NEW.latitude, NEW.longitude,
                 NEW.timestamp, KTK_ID, KTK_RSSI, NEW.battery_level, NEW.ble_sensor_humidity_1,
                 NEW.ble_sensor_magnet_status_1, KTK_TEMPERATURE, NEW.id);
        END IF;
    END IF;

    -- INICIO CASO EVENT.ENUM = 11317
    IF NEW.event_enum = 11317 THEN
		SET texto_original_ble_beacon = NEW.ble_beacons;
        SET json_element = JSON_EXTRACT(json_data, '$[0]');
        
        CALL ObtenerValorString(texto_original_ble_beacon, 'mac.address', EYE_mac_address);

        -- Log EYE_mac_address
        INSERT INTO process_log(message, timestamp) 
        VALUES (CONCAT('EYE_mac_address: ', IFNULL(EYE_mac_address, 'NULL')), CURRENT_TIMESTAMP);
        
        IF EYE_mac_address IS NOT NULL AND EYE_mac_address <> '' THEN
            SELECT id INTO temp_beacon_id FROM beacons WHERE mac = EYE_mac_address;
        ELSE
            SET temp_beacon_id = CONCAT('no encontrado: ', IFNULL(EYE_mac_address, 'NULL'));
        END IF;

        -- Log temp_beacon_id
        INSERT INTO process_log(message, timestamp) 
        VALUES (CONCAT('temp_beacon_id: ', IFNULL(temp_beacon_id, 'NULL')), CURRENT_TIMESTAMP);
        
        CALL ObtenerValorString(texto_original_ble_beacon, 'battery.low', EYE_battery_low);
        CALL ObtenerValorString(texto_original_ble_beacon, 'humidity', EYE_humidity);
        CALL ObtenerValorString(texto_original_ble_beacon, 'id', EYE_id);
        CALL ObtenerValorString(texto_original_ble_beacon, 'magnet', EYE_magnet);
        CALL ObtenerValorString(texto_original_ble_beacon, 'magnet.count', EYE_magnet_count);
		CALL ObtenerValorString(texto_original_ble_beacon, 'movement', EYE_movement);
        CALL ObtenerValorString(texto_original_ble_beacon, 'movement.count', EYE_movement_count);
        CALL ObtenerValorString(texto_original_ble_beacon, 'temperature', EYE_temperature);
        CALL ObtenerValorString(texto_original_ble_beacon, 'type', EYE_type);
        
        
        -- Log all extracted values
        INSERT INTO process_log(message, timestamp) 
        VALUES (
            CONCAT(
                'EYE_mac_address: ', IFNULL(EYE_mac_address, 'NULL'), ', ',
                'EYE_battery_low: ', IFNULL(EYE_battery_low, 'NULL'), ', ',
                'EYE_humidity: ', IFNULL(EYE_humidity, 'NULL'), ', ',
                'EYE_id: ', IFNULL(EYE_id, 'NULL'), ', ',
                'EYE_magnet: ', IFNULL(EYE_magnet, 'NULL'), ', ',
                'EYE_magnet_count: ', IFNULL(EYE_magnet_count, 'NULL'), ', ',
                'EYE_movement: ', IFNULL(EYE_movement, 'NULL'), ', ',
                'EYE_movement_count: ', IFNULL(EYE_movement_count, 'NULL'), ', ',
                'EYE_temperature: ', IFNULL(EYE_temperature, 'NULL'), ', ',
                'EYE_type: ', IFNULL(EYE_type, 'NULL')
            ), 
            CURRENT_TIMESTAMP
        );

        -- Insertar datos en la tabla adecuada según el device ident
        IF NEW.ident = '352592573522828' THEN
            INSERT INTO `teltonika`.`gh_5200_data_352592573522828`
                (`id_dispo`, `device_id_gps_data`, `event_enum`, `altitude`, `latitude`, `longitude`,
                 `timestamp`, `beacon_id`, `battery_level`, `ble_sensor_humidity`,
                 `ble_sensor_magnet_status`, `ble_sensor_temperature`, `EYE_battery.low`, `EYE_humidity`,
                 `EYE_id`, `EYE_mac.address`, `EYE_magnet`, `EYE_magnet.count`, `EYE_movement`,
                 `EYE_movement.count`, `EYE_temperature`, `EYE_type`, `ID_GPS_DATA`)
            VALUES
                ('352592573522828', NEW.device_id, NEW.event_enum, NEW.altitude, NEW.latitude, NEW.longitude,
                 NEW.timestamp, temp_beacon_id, NEW.battery_level, NEW.ble_sensor_humidity_1,
                 NEW.ble_sensor_magnet_status_1, NEW.ble_sensor_temperature_1, EYE_battery_low, EYE_humidity,
                 EYE_id, EYE_mac_address, EYE_magnet, EYE_magnet_count, EYE_movement, EYE_movement_count,
                 EYE_temperature, EYE_type, NEW.id);
        END IF;

        IF NEW.ident = '353201350896384' THEN
            INSERT INTO `teltonika`.`magic_box_tmt_210_data_353201350896384`
                (`id_dispo`, `device_id_gps_data`, `event_enum`, `altitude`, `latitude`, `longitude`,
                 `timestamp`, `beacon_id`, `battery_level`, `ble_sensor_humidity`,
                 `ble_sensor_magnet_status`, `ble_sensor_temperature`, `EYE_battery.low`, `EYE_humidity`,
                 `EYE_id`, `EYE_mac.address`, `EYE_magnet`, `EYE_magnet.count`, `EYE_movement`,
                 `EYE_movement.count`, `EYE_temperature`, `EYE_type`, `ID_GPS_DATA`)
            VALUES
                ('353201350896384', NEW.device_id, NEW.event_enum, NEW.altitude, NEW.latitude, NEW.longitude,
                 NEW.timestamp, temp_beacon_id, NEW.battery_level, NEW.ble_sensor_humidity_1,
                 NEW.ble_sensor_magnet_status_1, NEW.ble_sensor_temperature_1, EYE_battery_low, EYE_humidity,
                 EYE_id, EYE_mac_address, EYE_magnet, EYE_magnet_count, EYE_movement, EYE_movement_count,
                 EYE_temperature, EYE_type, NEW.id);
        END IF;

        IF NEW.ident = '352592576164230' THEN
            INSERT INTO `teltonika`.`fmb204_data_352592576164230`
                (`id_dispo`, `device_id_gps_data`, `event_enum`, `altitude`, `latitude`, `longitude`,
                 `timestamp`, `beacon_id`, `battery_level`, `ble_sensor_humidity`,
                 `ble_sensor_magnet_status`, `ble_sensor_temperature`, `EYE_battery.low`, `EYE_humidity`,
                 `EYE_id`, `EYE_mac.address`, `EYE_magnet`, `EYE_magnet.count`, `EYE_movement`,
                 `EYE_movement.count`, `EYE_temperature`, `EYE_type`, `ID_GPS_DATA`)
            VALUES
                ('352592576164230', NEW.device_id, NEW.event_enum, NEW.altitude, NEW.latitude, NEW.longitude,
                 NEW.timestamp, temp_beacon_id, NEW.battery_level, NEW.ble_sensor_humidity_1,
                 NEW.ble_sensor_magnet_status_1, NEW.ble_sensor_temperature_1, EYE_battery_low, EYE_humidity,
                 EYE_id, EYE_mac_address, EYE_magnet, EYE_magnet_count, EYE_movement, EYE_movement_count,
                 EYE_temperature, EYE_type, NEW.id);
        END IF;
    END IF;
END