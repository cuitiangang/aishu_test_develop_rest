import { bulkInsert, bulkQuery, query, transactionBulkInsert, transactionBulkInsertAndUpdate } from '../utils/db';
import {SERIAL_NUMBER_GOODS_MOVEMENT, SERIAL_NUMBER_MASTER_DATA} from '../utils/constants';
import * as responseMsg from '../utils/response';
import {getResponseData} from '../utils/utility';
import {getMovementDataBaseObject} from '../model/serial_number_movement';
import {getSerialNumberDataBaseObject} from '../model/serial_number_master';



/*
* 更新条码主数据
* 插入出入库信息记录
* */
export const updateGoodsMovementDB = async (items, material_document_number) => {
		try {
				//插入数据
				let goodsMovement = {table: SERIAL_NUMBER_GOODS_MOVEMENT, values:[]};
				items.forEach((item) => {
						item.material_document_number = material_document_number;
						goodsMovement.values.push(getMovementDataBaseObject(item));
				});
				let insertData = [ goodsMovement ];
				
				//更新数据
				let bulkUpdateArray = [];
				items.forEach((item) => {
						let updateData = {
								table: SERIAL_NUMBER_MASTER_DATA,
								values:{},
								conditions:[]
						};
						if(item.serial_number){
								updateData.values.location = '';
								updateData.conditions = [
										{
												key: 'serial_number',
												value: item.serial_number,
										}
								];
						}
						bulkUpdateArray.push(updateData);
				});
				await transactionBulkInsertAndUpdate(insertData, bulkUpdateArray);
				return Promise.resolve(getResponseData(responseMsg.SUCCESS_200, '', {success: true}));

		} catch (error) {
				return Promise.reject(error);
		}
}

/*
* 更新数据库操作
* 更新出入库信息记录
* */
export const insertPurchaseMovementDB = async (items, material_document_number) => {
		try {
				let goodsMovement = {table: SERIAL_NUMBER_GOODS_MOVEMENT, values:[]};
				let masterData = {table: SERIAL_NUMBER_MASTER_DATA, values:[]};
				items.forEach((item) => {
						item.receipt_number = item.purchase_order;
						item.transfer_person = item.create_person;
						item.material_document_number = material_document_number;
						goodsMovement.values.push(getMovementDataBaseObject(item));
						masterData.values.push(getSerialNumberDataBaseObject(item));
				});
				let data = [ goodsMovement, masterData ];
				await transactionBulkInsert(data);
				return Promise.resolve(getResponseData(responseMsg.SUCCESS_200, '', {success: true}));
		} catch (error) {
				return Promise.reject(error);
		}
}

/*
* 更新数据库操作
* 更新出入库信息记录
* */
export const allocateSerialMovementDataDB = async (items, material_document_number) => {
		try {
			if (items && items.length > 0){
				//插入数据
				let goodsMovement = {table: SERIAL_NUMBER_GOODS_MOVEMENT, values:[]};
				items.forEach((item) => {
					if (material_document_number && material_document_number.length > 0){
						item.material_document_number = material_document_number;
					}
					goodsMovement.values.push(getMovementDataBaseObject(item));
				});
				let insertData = [ goodsMovement ];
				
				//更新数据
				let bulkUpdateArray = [];
				items.forEach((item) => {
						let updateData = {
								table: SERIAL_NUMBER_MASTER_DATA,
								values:{},
								conditions:[]
						};
						if(item.serial_number){
								updateData.values.location = item.location;
								updateData.conditions = [
										{
												key: 'serial_number',
												value: item.serial_number,
										}
								];
						}
						bulkUpdateArray.push(updateData);
				});
				await transactionBulkInsertAndUpdate(insertData, bulkUpdateArray);
				return Promise.resolve(getResponseData(responseMsg.SUCCESS_200, '', {success: true}));
			}else{
				return Promise.resolve(getResponseData(responseMsg.SUCCESS_200, '', {success: true}));
			}
		} catch (error) {
				return Promise.reject(error);
		}
}



/*
* 更新数据库操作
* 更新出入库信息记录
* */
export const issueProductionOrderDataDB = async (data, material_document_number) => {
	try {

		console.log('issueProductionOrderDataDB  : ',data, material_document_number);

		//插入数据
		let items = data.items;
		let goodsMovement = {table: SERIAL_NUMBER_GOODS_MOVEMENT, values:[]};
		items.forEach((item) => {
			item.material_document_number = material_document_number;
			goodsMovement.values.push(getMovementDataBaseObject(item));
		});
		let insertData = [ goodsMovement ];
		
		//更新条码主数据
		let bulkUpdateArray = [];
		items.forEach((item) => {
			let updateData = {
					table: SERIAL_NUMBER_MASTER_DATA,
					values:{},
					conditions:[]
			};
			if(item.serial_number){
					updateData.values.issue_flag = data.issue_flag;
					updateData.values.location = item.location;
					updateData.conditions = [
							{
									key: 'serial_number',
									value: item.serial_number,
							}
					];
			}
			bulkUpdateArray.push(updateData);
		});

		//产成品序列号更新issue_flag
		if(data.POSerial_number){
			let updateData = {
				table: SERIAL_NUMBER_MASTER_DATA,
				values:{},
				conditions:[]
			};
			updateData.values.issue_flag = data.issue_flag;
			updateData.values.location = 'TBD';//data.items[0].location;
			updateData.conditions = [
				{
						key: 'serial_number',
						value: data.POSerial_number,
				}
			];
		
			bulkUpdateArray.push(updateData);
		}
		await transactionBulkInsertAndUpdate(insertData, bulkUpdateArray);
		return Promise.resolve(getResponseData(responseMsg.SUCCESS_200, '', {success: true}));

	} catch (error) {
			return Promise.reject(error);
	}
}

//出入库报表
export const goodsMovementReportDB = async (data, page, size, all) => {
	const specialTypes = ['工单投料','取消工单投料','销售出库','取消销售出库'];
	let conditions = prepareQueryConditions (data);
	let conditionString = conditions.join (" AND ");
	
	let searchSQL =  `SELECT a.serial_number,a.material_number, a.material_document_number,b1.material_desc, a.movement_type, a.transfer_type, a.location_from, 
	CASE WHEN a.location_from <> '' THEN c1.storage_name ELSE NULL END AS location_from_name, a.location_to, 
	CASE WHEN a.location_to <> '' THEN c2.storage_name ELSE NULL END AS location_to_name, a.receipt_type, a.receipt_number, 
	SUBSTRING(a.transfer_time, 1, 10) as transfer_date, 
	SUBSTRING(a.transfer_time, 12, 8) as transfer_time, a.transfer_person,
	CASE WHEN a.movement_type in ('261', '262') THEN b2.material_number ELSE NULL END AS product_material_number,
	CASE WHEN a.movement_type in ('261', '262') THEN b2.material_desc ELSE NULL END AS product_material_desc,
	CASE WHEN a.movement_type in ('261', '262') THEN b2.work_number ELSE NULL END AS work_number,
	CASE WHEN a.movement_type in ('261', '262') THEN b2.original_work_quantity ELSE NULL END AS original_work_quantity,
	CASE WHEN a.movement_type in ('601', '602') THEN d.reference_sd_document ELSE NULL END AS reference_sd_document,
	CASE WHEN a.movement_type in ('601', '602') THEN d.purchase_order_by_customer ELSE NULL END AS purchase_order_by_customer,
	CASE WHEN a.movement_type in ('601', '602') THEN d.ship_to_party ELSE NULL END AS ship_to_party,
	CASE WHEN a.movement_type in ('601', '602') THEN d.business_partner_name ELSE NULL END AS business_partner_name,
	b1.purchase_order,
	SUBSTRING(b1.create_date, 1, 10) as purchase_date, 
	SUBSTRING(b1.create_date, 12, 8) as purchase_time, b1.create_person as purchase_person
	FROM 
	pda_db.serial_number_goods_movement AS a 
	JOIN pda_db.serial_number_master_data AS b1 ON a.serial_number = b1.serial_number 
	LEFT JOIN pda_db.serial_number_master_data AS b2 ON (a.receipt_number = b2.serial_number AND a.receipt_number <> '')
	LEFT JOIN pda_db.factory_storage_info AS c1 ON ( a.location_from = c1.storage_ID AND a.location_from <> '' )
	LEFT JOIN pda_db.factory_storage_info AS c2 ON ( a.location_to = c2.storage_ID AND a.location_to <> '')
	LEFT JOIN customer_po AS d ON (a.receipt_number = d.delivery_document OR SUBSTRING(a.receipt_number, 3, 8) = d.delivery_document) WHERE `;

	let sort = addPrefixForSort (data.sort);
	console.log (sort);
	searchSQL = searchSQL + conditionString + ' order by ' + sort + ' ' + data.sortDirection;
	if (!all) {
		searchSQL = searchSQL + ' limit ' + page * size + ', ' + size;
	}
	const countSql = `SELECT COUNT(*) as totalNumber FROM 
	pda_db.serial_number_goods_movement AS a 
	LEFT JOIN pda_db.serial_number_master_data AS b1 ON a.serial_number = b1.serial_number 
	LEFT JOIN pda_db.serial_number_master_data AS b2 ON (a.receipt_number = b2.serial_number AND a.receipt_number <> '')
	LEFT JOIN pda_db.factory_storage_info AS c1 ON ( a.location_from = c1.storage_ID AND a.location_from <> '' )
	LEFT JOIN pda_db.factory_storage_info AS c2 ON ( a.location_to = c2.storage_ID AND a.location_to <> '')
	LEFT JOIN customer_po AS d ON (a.receipt_number = d.delivery_document OR SUBSTRING(a.receipt_number, 3, 8) = d.delivery_document) WHERE  ` + conditionString;
	
    try {
		const resCount = await query(countSql);
		const response = await query(searchSQL);
		const respPage = {totalNumber: resCount.data[0].totalNumber, page:page, pageSize:size}
        return Promise.resolve(getResponseData(response.statusCode, '', {pagination: respPage, rows: response.data} ));
    } catch (error) {
        return Promise.reject({ ...error , data: [] });
    }
}

 //检查sn是否投料过
 export const checkSerialHasIssued = async (sn) => {
	const conditions = " serial_number = '" + sn + "'";
    const targetFields = ["serial_number","issue_flag"];
    try {
        const response = await bulkQuery(SERIAL_NUMBER_MASTER_DATA, targetFields, conditions);
		const { data } = response;
        if (data.length > 0) {
            return Promise.resolve({ ...response, data: data });
		}
	}
	catch (error) {
		return Promise.reject({ ...error , data: [] });
	}
}

const addPrefixForSort = (sort) => {
	console.log ('addPrefixForSort: ');
	let a = ['serial_number', 'material_number', 'material_document_number','movement_type', 'transfer_type' , 'location_from', 'location_to', 'receipt_number', 'transfer_time',];
	let b1 = ['material_desc','material_number', 'work_number', 'original_work_quantity'];
	let c1 = ['storage_ID'];
	let d = ['reference_sd_document', 'purchase_order_by_customer', 'ship_to_party', 'business_partner_name'];
	let founda = a.includes(sort);
	
	if (founda) {
		return 'a.' + sort;
	}
	let foundb1 = b1.includes(sort);
	if (foundb1) {
		return 'b1.' + sort;
	}
	let foundc1 = c1.includes(sort);
	if (foundc1) {
		return 'c1.' + sort;
	}
	let foundd = d.includes(sort);
	if (foundd) {
		return 'd.' + sort;
	}
	if(sort === 'transfer_date'){
		return 'a.transfer_time';
	}
	if(sort === 'product_material_number'){
		return 'b1.material_number';
	}
	if(sort === 'product_material_desc'){
		return 'b1.material_desc';
	}
	if(sort === 'purchase_person' ){
		return 'b1.create_person';
	}
	if(sort === 'purchase_date' || sort === 'purchase_time'){
		return 'b1.create_date';
	}
	return 'a.transfer_time';
}
const prepareQueryConditions = (data) => {
	let conditions = [];
	let types = data.transfer_types.split(',').join("','");

	if (data.transfer_types){
		conditions.push(" a.transfer_type in ('" + types + "')");
	}

	if (data.serial_number_from && data.serial_number_to){
		conditions.push(" (a.serial_number LIKE '%" + data.serial_number_from + "%' OR a.serial_number LIKE '%" + data.serial_number_to + "%')");
	}
	else if (data.serial_number_from || data.serial_number_to){
		conditions.push(" a.serial_number LIKE '%" + (data.serial_number_from? data.serial_number_from:data.serial_number_to)  + "%'" );
	}

	if (data.material_number_from && data.material_number_to){
		conditions.push(" (a.material_number LIKE '%" + data.material_number_from + "%' OR a.material_number LIKE '%" + data.material_number_to + "%')");
	}
	else if (data.material_number_from || data.material_number_to){
		conditions.push(" a.material_number LIKE '%" + (data.material_number_from? data.material_number_from:data.material_number_to)  + "%'" );
	}

	if (data.location_from_from && data.location_from_to){
		conditions.push(" (a.location_from = '" + data.location_from_from + "' OR a.location_from = '" + data.location_from_to + "')");
	}
	else if (data.location_from_from || data.location_from_to){
		conditions.push(" a.location_from = '" + (data.location_from_from? data.location_from_from:data.location_from_to)  + "'" );
	}

	if (data.location_to_from && data.location_to_to){
		conditions.push(" (a.location_to = '" + data.location_to_from + "' OR a.location_to = '" + data.location_to_to + "')");
	}
	else if (data.location_to_from || data.location_to_to){
		conditions.push(" a.location_to = '" + (data.location_to_from? data.location_to_from:data.location_to_to)  + "'" );
	}
	
	if (data.receipt_number_from && data.receipt_number_to){
		conditions.push(" (a.receipt_number = '" + data.receipt_number_from + "' OR a.receipt_number = '" + '00' + data.receipt_number_from + "' OR a.receipt_number = '" + data.receipt_number_to + "' OR a.receipt_number = '" + '00' + data.receipt_number_to + "')");
	}
	else if (data.receipt_number_from || data.receipt_number_to){
		let rn = data.receipt_number_from? data.receipt_number_from:data.receipt_number_to;
		conditions.push(" (a.receipt_number = '" + rn + "' OR a.receipt_number = '" + '00' + rn + "')" );
	}

	if (data.transfer_date_from){
		conditions.push(" a.transfer_date >= '" + data.transfer_date_from + "'");
	}
	if (data.transfer_date_to){
		conditions.push(" a.transfer_date <= '" + data.transfer_date_to + "'");
	}

	if (data.transfer_person_from && data.transfer_person_to){
		conditions.push(" (a.transfer_person = '" + data.transfer_person_from + "' OR a.transfer_person = '" + data.transfer_person_to + "')");
	}
	else if (data.transfer_person_from || data.transfer_person_to){
		conditions.push(" a.transfer_person = '" + (data.transfer_person_from? data.transfer_person_from:data.transfer_person_to)  + "'" );
	}
	
	if (data.work_number_from && data.work_number_to){
		conditions.push(" (b1.work_number = '" + data.work_number_from + "' OR b1.work_number = '" + data.work_number_to + "' OR b2.work_number = '" + data.work_number_from + "' OR b2.work_number = '" + data.work_number_to + "')");
	}
	else if (data.work_number_from || data.work_number_to){
		let wn = (data.work_number_from? data.work_number_from:data.work_number_to);
		conditions.push(" (b1.work_number = '" + wn + "' OR b2.work_number = '" + wn + "')");
	}

	if (data.product_material_number_from && data.product_material_number_to){
		conditions.push(" (b2.material_number LIKE '%" + data.product_material_number_from + "%' OR b2.material_number LIKE '%" + data.product_material_number_to + "%')");
	}
	else if (data.product_material_number_from || data.product_material_number_to){
		conditions.push(" b2.material_number LIKE '%" + (data.product_material_number_from? data.product_material_number_from:data.product_material_number_to)  + "%'" );
	}

	if (data.reference_sd_document_from && data.reference_sd_document_to){
		conditions.push(" (d.reference_sd_document = '" + data.reference_sd_document_from + "' OR d.reference_sd_document = '" + data.reference_sd_document_to + "')");
	}
	else if (data.reference_sd_document_from || data.reference_sd_document_to){
		conditions.push(" d.reference_sd_document = '" + (data.reference_sd_document_from? data.reference_sd_document_from:data.reference_sd_document_to)  + "'" );
	}

	if (data.purchase_order_by_customer_from && data.purchase_order_by_customer_to){
		conditions.push(" (d.purchase_order_by_customer = '" + data.purchase_order_by_customer_from + "' OR d.purchase_order_by_customer = '" + data.purchase_order_by_customer_to + "')");
	}
	else if (data.purchase_order_by_customer_from || data.purchase_order_by_customer_to){
		conditions.push(" d.purchase_order_by_customer = '" + (data.purchase_order_by_customer_from? data.purchase_order_by_customer_from:data.purchase_order_by_customer_to)  + "'" );
	}

	if (data.ship_to_party_from && data.ship_to_party_to){
		conditions.push(" (d.ship_to_party = '" + data.ship_to_party_from + "' OR d.ship_to_party = '" + data.ship_to_party_to + "')");
	}
	else if (data.ship_to_party_from || data.ship_to_party_to){
		conditions.push(" d.ship_to_party = '" + (data.ship_to_party_from? data.ship_to_party_from:data.ship_to_party_to ) + "'" );
	}

	if (data.business_partner_name_from && data.business_partner_name_to){
		conditions.push(" (d.business_partner_name LIKE '%" + data.business_partner_name_from + "%' OR d.business_partner_name LIKE '%" + data.business_partner_name_to + "%')");
	}
	else if (data.business_partner_name_from || data.business_partner_name_to){
		conditions.push(" d.business_partner_name LIKE '%" +  (data.business_partner_name_from? data.business_partner_name_from:data.business_partner_name_to ) + "%'" );
	}

	return conditions;
}