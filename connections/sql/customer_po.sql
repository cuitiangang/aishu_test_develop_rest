CREATE TABLE IF NOT EXISTS `customer_po` (
  `delivery_document` varchar(50)  NOT NULL,
  `reference_sd_document` varchar(20)  NOT NULL,
  `purchase_order_by_customer` varchar(50)  DEFAULT NULL,
  `ship_to_party` varchar(20)  DEFAULT NULL,
  `business_partner_name` varchar(80) DEFAULT NULL,
  PRIMARY KEY (`delivery_document`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;