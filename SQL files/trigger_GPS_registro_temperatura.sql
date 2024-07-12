DELIMITER //
DROP TRIGGER IF EXISTS `teltonika`.`trigger_GPS_registro_temperatura` //
CREATE DEFINER=`root`@`localhost` TRIGGER `trigger_GPS_registro_temperatura` AFTER INSERT ON `gps_data` FOR EACH ROW BEGIN

END