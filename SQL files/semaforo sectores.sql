DELIMITER //

DROP EVENT IF EXISTS `actualizar_beacon_status` //

CREATE EVENT `actualizar_beacon_status` 
ON SCHEDULE EVERY 30 MINUTE STARTS '2024-07-01 00:00:00' 
ON COMPLETION NOT PRESERVE ENABLE 
DO
BEGIN
    DECLARE status_beacon_s1, status_beacon_s2, status_beacon_s3, status_beacon_s4, status_beacon_s5 VARCHAR(45);
    DECLARE min_rojo, max_rojo, min_amarillo, max_amarillo INT;
    
    -- Obtener parámetros del semáforo
	SELECT minimo INTO min_rojo FROM parametrizaciones WHERE param_id = 5 LIMIT 1;
	SELECT maximo INTO max_rojo FROM parametrizaciones WHERE param_id = 5 LIMIT 1;
	SELECT minimo INTO min_amarillo FROM parametrizaciones WHERE param_id = 4 LIMIT 1;
	SELECT maximo INTO max_amarillo FROM parametrizaciones WHERE param_id = 4 LIMIT 1;

    -- Procesar cada sector
    CALL process_sector(1, min_rojo, max_rojo, min_amarillo, max_amarillo, status_beacon_s1);
    CALL process_sector(2, min_rojo, max_rojo, min_amarillo, max_amarillo, status_beacon_s2);
    CALL process_sector(3, min_rojo, max_rojo, min_amarillo, max_amarillo, status_beacon_s3);
    CALL process_sector(4, min_rojo, max_rojo, min_amarillo, max_amarillo, status_beacon_s4);
    CALL process_sector(5, min_rojo, max_rojo, min_amarillo, max_amarillo, status_beacon_s5);

    -- Insertar resultados
    INSERT INTO beacons_detection_status(status_timestamp, Sector_1, Sector_2, Sector_3, Sector_4, Sector_5) 
    VALUES (CURRENT_TIMESTAMP(), status_beacon_s1, status_beacon_s2, status_beacon_s3, status_beacon_s4, status_beacon_s5);
END //

DELIMITER ;

DELIMITER //
DROP PROCEDURE IF EXISTS `process_sector` //
CREATE PROCEDURE process_sector(
    IN sector_num INT, 
    IN min_rojo INT, 
    IN max_rojo INT, 
    IN min_amarillo INT, 
    IN max_amarillo INT,
    OUT sector_status VARCHAR(45)
)
BEGIN
    DECLARE minutos_diferencia INT;
    DECLARE inicio int;
    DECLARE fin INT;
    SELECT 
        MIN(gps_data.timestamp), MAX(gps_data.timestamp)
    INTO 
        inicio,fin
    FROM 
        gps_data
    JOIN 
        beacons ON (
            gps_data.ble_beacons LIKE CONCAT('%', beacons.id, '%')
            OR gps_data.ble_beacons LIKE CONCAT('%', beacons.mac, '%')
        )
    WHERE 
        beacons.lugar = CONCAT('Sector ', sector_num)
        AND gps_data.ident IN (SELECT id_dispositivo_asignado FROM personal)
        AND gps_data.timestamp  > ((SELECT timestamp FROM gps_data ORDER BY id DESC LIMIT 1) - 1800);
    
    
	CALL calcular_diferencia_minutos(inicio, fin, minutos_diferencia);
    INSERT INTO `teltonika`.`debug_beacon_count` (`sector`,`count`,`timestamp`)
    VALUES(CONCAT('Sector ', sector_num), minutos_diferencia, CURRENT_TIMESTAMP());
    
    
	IF minutos_diferencia IS NULL OR minutos_diferencia <= min_rojo THEN
		SET sector_status = 'Negro';
	ELSEIF minutos_diferencia > min_rojo AND minutos_diferencia <= max_rojo THEN
		SET sector_status = 'Rojo';
	ELSEIF minutos_diferencia > min_amarillo AND minutos_diferencia <= max_amarillo THEN
		SET sector_status = 'Amarillo';
	ELSE
		SET sector_status = 'Verde';
	END IF;
    
END //

DELIMITER ;