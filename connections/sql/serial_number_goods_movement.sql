CREATE TABLE IF NOT EXISTS  `serial_number_goods_movement` (
  `serial_number` varchar(40) NOT NULL,
  `material_document_number` varchar(40) NOT NULL,
  `material_number` varchar(40) DEFAULT NULL,
  `transfer_date` varchar(20) DEFAULT NULL,
  `transfer_type` varchar(10) DEFAULT NULL,
  `movement_type` varchar(10) DEFAULT NULL,
  `location_from` varchar(80) DEFAULT NULL,
  `location_to` varchar(80) DEFAULT NULL,
  `receipt_type` varchar(10) DEFAULT NULL,
  `receipt_number` varchar(50) DEFAULT NULL,
  `transfer_person` varchar(20) DEFAULT NULL,
  `transfer_time` varchar(20) DEFAULT NULL,
  `comment` varchar(20) DEFAULT NULL,
  PRIMARY KEY (`serial_number`, `material_document_number`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;