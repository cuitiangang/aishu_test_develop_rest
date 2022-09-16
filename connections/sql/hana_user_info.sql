CREATE TABLE IF NOT EXISTS  `hana_user_info` (
  `user_id` varchar(40) NOT NULL,
  `password` varchar(90) NOT NULL,
  `update_time` varchar(40) DEFAULT NULL,
  PRIMARY KEY (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;