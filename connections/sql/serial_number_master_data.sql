CREATE TABLE IF NOT EXISTS  `serial_number_master_data` (
  `serial_number` varchar(80) NOT NULL,
  `material_number` varchar(30) NOT NULL,
  `factory` varchar(20) NOT NULL,
  `location` varchar(20) NOT NULL,
  `batch_number` varchar(20) DEFAULT NULL,
  `purchase_order` varchar(20) DEFAULT NULL,
  `work_number` varchar(20) DEFAULT NULL,
  `material_desc` varchar(50) DEFAULT NULL,
  `work_date` varchar(20) DEFAULT NULL,
  `check_flag` varchar(20) DEFAULT NULL,
  `create_person` varchar(20) DEFAULT NULL,
  `create_date` varchar(20) DEFAULT NULL,
  `release_person` varchar(20) DEFAULT NULL,
  `release_time` varchar(20) DEFAULT NULL,
  `location_type` varchar(2) DEFAULT NULL, 
  `issue_flag` varchar(2) DEFAULT NULL,
  PRIMARY KEY (`serial_number`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;