CREATE DEFINER=`root`@`localhost` PROCEDURE `process_existing_gps_data`()
BEGIN
    DECLARE done INT DEFAULT FALSE;
    DECLARE v_device_id BIGINT;
    DECLARE v_device_name VARCHAR(255);
    DECLARE v_event_enum INT;
    DECLARE v_altitude DECIMAL(10,2);
    DECLARE v_latitude DECIMAL(10,8);
    DECLARE v_longitude DECIMAL(10,8);
    DECLARE v_timestamp BIGINT;
    DECLARE v_ble_beacons TEXT;
    DECLARE v_battery_level INT;
    DECLARE v_ble_sensor_humidity_1 INT;
    DECLARE v_ble_sensor_magnet_status_1 TINYINT;
    DECLARE v_ble_sensor_temperature_1 INT;

    DECLARE cur CURSOR FOR 
        SELECT device_id, device_name, event_enum, altitude, latitude, longitude, 
               timestamp, ble_beacons, battery_level, ble_sensor_humidity_1, 
               ble_sensor_magnet_status_1, ble_sensor_temperature_1
        FROM gps_data;
    
    DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;

    OPEN cur;

    read_loop: LOOP
        FETCH cur INTO v_device_id, v_device_name, v_event_enum, v_altitude, v_latitude, v_longitude, 
                      v_timestamp, v_ble_beacons, v_battery_level, v_ble_sensor_humidity_1, 
                      v_ble_sensor_magnet_status_1, v_ble_sensor_temperature_1;
        
        IF done THEN
            LEAVE read_loop;
        END IF;

        -- Procesar ble_beacons
        BLOCK: BEGIN
            DECLARE json_data JSON;
            DECLARE max_rssi INT DEFAULT -1000000;
            DECLARE selected_id VARCHAR(255);
            DECLARE i INT DEFAULT 0;
            DECLARE current_rssi INT;
            DECLARE current_id VARCHAR(255);

            SET json_data = JSON_EXTRACT(v_ble_beacons, '$');

            WHILE i < JSON_LENGTH(json_data) DO
                SET current_rssi = JSON_EXTRACT(json_data, CONCAT('$[', i, '].rssi'));
                SET current_id = JSON_UNQUOTE(JSON_EXTRACT(json_data, CONCAT('$[', i, '].id')));
                
                IF current_rssi > max_rssi THEN
                    SET max_rssi = current_rssi;
                    SET selected_id = current_id;
                END IF;
                
                SET i = i + 1;
            END WHILE;

            -- Insertar en la tabla específica si el device_name coincide
            IF v_device_name = '352592573522828' THEN
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
                    `ble_sensor_temperature`
                )
                VALUES
                (
                    352592573522828,
                    v_device_id,
                    v_event_enum,
                    v_altitude,
                    v_latitude,
                    v_longitude,
                    v_timestamp,
                    selected_id,
                    max_rssi,
                    v_battery_level,
                    v_ble_sensor_humidity_1,
                    v_ble_sensor_magnet_status_1,
                    v_ble_sensor_temperature_1
                );
            END IF;
                        IF v_device_name = '352592576164230' THEN
                INSERT INTO `teltonika`.`fmb204_data_352592576164230`
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
                    `ble_sensor_temperature`
                )
                VALUES
                (
                    352592576164230,
                    v_device_id,
                    v_event_enum,
                    v_altitude,
                    v_latitude,
                    v_longitude,
                    v_timestamp,
                    selected_id,
                    max_rssi,
                    v_battery_level,
                    v_ble_sensor_humidity_1,
                    v_ble_sensor_magnet_status_1,
                    v_ble_sensor_temperature_1
                );
            END IF;
                        IF v_device_name = '353201350896384' THEN
                INSERT INTO `teltonika`.`magic_box_tmt_210_data_353201350896384`
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
                    `ble_sensor_temperature`
                )
                VALUES
                (
                    353201350896384,
                    v_device_id,
                    v_event_enum,
                    v_altitude,
                    v_latitude,
                    v_longitude,
                    v_timestamp,
                    selected_id,
                    max_rssi,
                    v_battery_level,
                    v_ble_sensor_humidity_1,
                    v_ble_sensor_magnet_status_1,
                    v_ble_sensor_temperature_1
                );
            END IF;
        END BLOCK;
    END LOOP;

    CLOSE cur;
END