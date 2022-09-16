CREATE TABLE IF NOT EXISTS  `user_token` (
  `user_id` varchar(40) NOT NULL,
  `token` varchar(80) NOT NULL,
  `type` varchar(10) NOT NULL,
  `expire` varchar(80) NOT NULL,
  PRIMARY KEY (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;