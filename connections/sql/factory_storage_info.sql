CREATE TABLE IF NOT EXISTS  `factory_storage_info` (
  `factory_id` varchar(10) NOT NULL,
  `storage_id` varchar(10) NOT NULL,
  `area_id` int NOT NULL,
  `factory_name` varchar(30) NOT NULL,
  `storage_name` varchar(30) NOT NULL,
  PRIMARY KEY (`factory_id`, `storage_id`, `area_id`),
  FOREIGN KEY(`area_id`) REFERENCES `area_permission`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;