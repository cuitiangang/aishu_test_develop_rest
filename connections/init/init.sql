INSERT INTO `area_permission` SET `id`=1, name='总仓';
INSERT INTO `area_permission` SET `id`=2, name='产线';
INSERT INTO `area_permission` SET `id`=3, name='备件仓';

INSERT INTO `label_type` SET `id`=1, label='大';
INSERT INTO `label_type` SET `id`=2, label='小';
INSERT INTO `label_type` SET `id`=3, label='软件';

insert into hana_user_info set user_id='EISOO_PDA', password="dHTtEqFQN3QGvweMxbrWydErsdKC#dALmcHuistv";

INSERT INTO `receipt_type_info` SET `id`='A', `label`='配件发货';
INSERT INTO `receipt_type_info` SET `id`='B', `label`='坏件返还';
INSERT INTO `receipt_type_info` SET `id`='C', `label`='返修仓检测';
INSERT INTO `receipt_type_info` SET `id`='D', `label`='其他备件库存转储';

INSERT INTO `factory_storage_info` SET `factory_id`='5599', `storage_id`='599D', `area_id`= 1, `factory_name`='上海', `storage_name`='外购软件仓';
INSERT INTO `factory_storage_info` SET `factory_id`='5599', `storage_id`='599B', `area_id`= 1, `factory_name`='上海', `storage_name`='成品仓';
INSERT INTO `factory_storage_info` SET `factory_id`='5599', `storage_id`='599E', `area_id`= 2, `factory_name`='上海', `storage_name`='线边仓';
INSERT INTO `factory_storage_info` SET `factory_id`='5599', `storage_id`='599R', `area_id`= 1, `factory_name`='上海', `storage_name`='退货仓';
INSERT INTO `factory_storage_info` SET `factory_id`='5599', `storage_id`='599A', `area_id`= 1, `factory_name`='上海', `storage_name`='配件仓';
INSERT INTO `factory_storage_info` SET `factory_id`='5599', `storage_id`='598A', `area_id`= 3, `factory_name`='长沙', `storage_name`='备件仓';
INSERT INTO `factory_storage_info` SET `factory_id`='5599', `storage_id`='598D', `area_id`= 3, `factory_name`='长沙', `storage_name`='旧件仓';
INSERT INTO `factory_storage_info` SET `factory_id`='5599', `storage_id`='598B', `area_id`= 3, `factory_name`='长沙', `storage_name`='维修仓';
INSERT INTO `factory_storage_info` SET `factory_id`='5599', `storage_id`='598C', `area_id`= 3, `factory_name`='长沙', `storage_name`='返修仓';
INSERT INTO `factory_storage_info` SET `factory_id`='5599', `storage_id`='598E', `area_id`= 3, `factory_name`='长沙', `storage_name`='返厂仓';

INSERT INTO `factory_storage_info` SET `factory_id`='5595', `storage_id`='595A', `area_id`= 1, `factory_name`='北京越睿', `storage_name`='通用仓';
INSERT INTO `factory_storage_info` SET `factory_id`='5595', `storage_id`='595A', `area_id`= 2, `factory_name`='北京越睿', `storage_name`='通用仓';
INSERT INTO `factory_storage_info` SET `factory_id`='5595', `storage_id`='595A', `area_id`= 3, `factory_name`='北京越睿', `storage_name`='通用仓';

INSERT INTO `factory_storage_info` SET `factory_id`='5596', `storage_id`='596A', `area_id`= 1, `factory_name`='上海凡响', `storage_name`='通用仓';
INSERT INTO `factory_storage_info` SET `factory_id`='5596', `storage_id`='596A', `area_id`= 2, `factory_name`='上海凡响', `storage_name`='通用仓';
INSERT INTO `factory_storage_info` SET `factory_id`='5596', `storage_id`='596A', `area_id`= 3, `factory_name`='上海凡响', `storage_name`='通用仓';




