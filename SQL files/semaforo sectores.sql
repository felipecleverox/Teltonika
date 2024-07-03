DELIMITER //
CREATE DEFINER=`root`@`localhost` EVENT `actualizar_beacon_status` ON SCHEDULE EVERY 30 MINUTE STARTS '2023-06-07 10:00:00' ON COMPLETION NOT PRESERVE ENABLE DO BEGIN
    DECLARE status_beacon_s1 VARCHAR(45);
    DECLARE status_beacon_s2 VARCHAR(45);
    DECLARE status_beacon_s3 VARCHAR(45);
    DECLARE status_beacon_s4 VARCHAR(45);
    DECLARE status_beacon_s5 VARCHAR(45);
    DECLARE count_beacons INT;
    declare min_rojo int;
    declare max_rojo int;
    declare min_amarillo int;
    declare max_amarillo int;
    
    -- ini parametrizar semaforo --
    
    select minimo into min_rojo from parametrizaciones where param_id = 5; -- 5 es el id del semaforo rojo, que es 0
    select maximo into max_rojo from parametrizaciones where param_id = 5; -- igual que el anterior. ahora sale 15
	select minimo into min_amarillo from parametrizaciones where param_id = 4; -- 4 es el id del semaforo amarillo, que es 15
    select maximo into max_amarillo from parametrizaciones where param_id = 4; -- igual que el anterior. ahora sale 20
    -- ini parametrizar semaforo --
    
    
    -- ini sector 1 --
    SELECT COUNT(*) into count_beacons
    FROM gps_data
    WHERE ble_beacons LIKE (select CONCAT('%',id, '%')  from beacons where lugar="Sector 1")
    AND ident = 352592573522828 
    AND timestamp > ((SELECT timestamp FROM gps_data ORDER BY id DESC LIMIT 1)- 1800);
    insert into debug_beacon_count(sector,beacon_id,count,timestamp) values('sector 1', (select id from beacons where lugar like 'Sector 1'),count_beacons,NOW());

    IF count_beacons <= min_rojo THEN
        SET status_beacon_s1 = 'Negro';
    ELSEIF count_beacons < max_rojo THEN
        SET status_beacon_s1 = 'Rojo';
    ELSEIF count_beacons >= min_amarillo AND count_beacons < max_amarillo THEN
        SET status_beacon_s1 = 'Amarillo';
    ELSE
        SET status_beacon_s1 = 'Verde';
    END IF;

    -- ini sector 2 --
	SELECT COUNT(*) into count_beacons
    FROM gps_data
    WHERE ble_beacons LIKE (select CONCAT('%',id, '%')  from beacons where lugar="Sector 2")
    AND ident = 352592573522828 
    AND timestamp > ((SELECT timestamp FROM gps_data ORDER BY id DESC LIMIT 1)- 1800);
    insert into debug_beacon_count(sector,beacon_id,count,timestamp) values('sector 2', (select id from beacons where lugar like 'Sector 2'),count_beacons,NOW());

	IF count_beacons <= min_rojo THEN
        SET status_beacon_s2 = 'Negro';
    ELSEIF count_beacons < max_rojo THEN
        SET status_beacon_s2 = 'Rojo';
    ELSEIF count_beacons >= min_amarillo AND count_beacons < max_amarillo THEN
        SET status_beacon_s2 = 'Amarillo';
    ELSE
        SET status_beacon_s2 = 'Verde';
    END IF;

    -- ini sector 3 --
	SELECT COUNT(*) into count_beacons
    FROM gps_data
    WHERE ble_beacons LIKE (select CONCAT('%',id, '%')  from beacons where lugar="Sector 3")
    AND ident = 352592573522828 
    AND timestamp > ((SELECT timestamp FROM gps_data ORDER BY id DESC LIMIT 1)- 1800);
    insert into debug_beacon_count(sector,beacon_id,count,timestamp) values('sector 3', (select id from beacons where lugar like 'Sector 3'),count_beacons,NOW());

    IF count_beacons <= min_rojo THEN
        SET status_beacon_s3 = 'Negro';
    ELSEIF count_beacons < max_rojo THEN
        SET status_beacon_s3 = 'Rojo';
    ELSEIF count_beacons >= min_amarillo AND count_beacons < max_amarillo THEN
        SET status_beacon_s3 = 'Amarillo';
    ELSE
        SET status_beacon_s3 = 'Verde';
    END IF;

    -- ini sector 4 --
	SELECT COUNT(*) into count_beacons
    FROM gps_data
    WHERE ble_beacons LIKE (select CONCAT('%',id, '%')  from beacons where lugar="Sector 4")
    AND ident = 352592573522828 
    AND timestamp > ((SELECT timestamp FROM gps_data ORDER BY id DESC LIMIT 1)- 1800);
    insert into debug_beacon_count(sector,beacon_id,count,timestamp) values('sector 4', (select id from beacons where lugar like 'Sector 4'),count_beacons,NOW());

    IF count_beacons <= min_rojo THEN
        SET status_beacon_s4 = 'Negro';
    ELSEIF count_beacons < max_rojo THEN
        SET status_beacon_s4 = 'Rojo';
    ELSEIF count_beacons >= min_amarillo AND count_beacons < max_amarillo THEN
        SET status_beacon_s4 = 'Amarillo';
    ELSE
        SET status_beacon_s4 = 'Verde';
    END IF;

    -- ini sector 5 --
     SELECT COUNT(*) into count_beacons
    FROM gps_data
    WHERE ble_beacons LIKE (select CONCAT('%',id, '%')  from beacons where lugar="Sector 5")
    AND ident = 352592573522828 
    AND timestamp > ((SELECT timestamp FROM gps_data ORDER BY id DESC LIMIT 1)- 1800);
    insert into debug_beacon_count(sector,beacon_id,count,timestamp) values('sector 5', (select id from beacons where lugar like 'Sector 5'),count_beacons,NOW());

    IF count_beacons <= min_rojo THEN
        SET status_beacon_s5 = 'Negro';
    ELSEIF count_beacons < max_rojo THEN
        SET status_beacon_s5 = 'Rojo';
    ELSEIF count_beacons >= min_amarillo AND count_beacons < max_amarillo THEN
        SET status_beacon_s5 = 'Amarillo';
    ELSE
        SET status_beacon_s5 = 'Verde';
    END IF;
    
    -- fin sector 5 --
    -- Aquí puedes agregar el código adicional para procesar status_beacon
    INSERT INTO beacons_detection_status(status_timestamp, Sector_1, Sector_2, Sector_3, Sector_4, Sector_5) 
    VALUES (CURRENT_TIMESTAMP, status_beacon_s1, status_beacon_s2, status_beacon_s3, status_beacon_s4, status_beacon_s5);

END