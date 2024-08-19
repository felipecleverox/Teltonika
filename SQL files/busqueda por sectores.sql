WITH latest_person_data AS (
    SELECT g.device_name, g.timestamp, g.ble_beacons,
           ROW_NUMBER() OVER (PARTITION BY g.device_name ORDER BY g.timestamp DESC) as rn
    FROM gps_data g
    WHERE g.ble_beacons != '[]'
),
person_sector AS (
    SELECT lpd.device_name, lpd.timestamp, 
           JSON_UNQUOTE(JSON_EXTRACT(JSON_EXTRACT(lpd.ble_beacons, '$[0]'), '$.id')) as beacon_id,
           s.id as sector_id
    FROM latest_person_data lpd
    INNER JOIN sectores s ON JSON_UNQUOTE(JSON_EXTRACT(JSON_EXTRACT(lpd.ble_beacons, '$[0]'), '$.id')) = s.id
    WHERE lpd.rn = 1
)
SELECT 
    s.id as sector_id, 
    s.nombre as nombre_sector,
    IFNULL(GROUP_CONCAT(DISTINCT CONCAT(p.Nombre_Personal, ' (', p.id_dispositivo_asignado, ')') SEPARATOR ', '), '') as personas_en_sector
FROM 
    sectores s
LEFT JOIN person_sector ps ON s.id = ps.sector_id
LEFT JOIN personal p ON ps.device_name = p.id_dispositivo_asignado
GROUP BY s.id, s.nombre
ORDER BY s.id;