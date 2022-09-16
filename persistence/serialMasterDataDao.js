import {getAllItems, bulkQuery, transactionBulkInsertReplaceAndUpdate, query, transactionBulkUpdate} from '../utils/db';
import {FACTORY_STORAGE_INFO, SERIAL_NUMBER_MASTER_DATA,SERIAL_NUMBER_REJECT_DATA, USER_TOKEN_INFO, SERIAL_NUMBER_GOODS_MOVEMENT, LABEL_TYPE, AREA_PERMISSION} from '../utils/constants';
import {getResponseData} from "../utils/utility";
import * as responseMsg from '../utils/response';
import {getMovementDataBaseObject} from '../model/serial_number_movement';
import {getSerialNumberDataBaseObject} from '../model/serial_number_master';
import { error } from 'util';
import _ from 'lodash';


export const getSerialDataByWorkNumberDB = async (work_number, work_date) => {
		try {
				let sql = "SELECT serial_number, work_number, material_number, check_flag, release_person, release_time, issue_flag, original_work_quantity FROM ?? WHERE";
				let queryParam = [SERIAL_NUMBER_MASTER_DATA];
				let hasWorkNumber = false;
				if(work_number) {
						sql = sql + ' work_number = ?';
						hasWorkNumber = true;
						queryParam.push(work_number);
				}
				
				if(work_date) {
						if(hasWorkNumber){
								sql = sql + ' and ';
						}
						sql = sql + ' work_date = ?';
						queryParam.push(work_date);
				}
				
				let response = await query(sql, queryParam); // 插入数据
				return Promise.resolve(response);
		} catch (error) {
				return Promise.reject(error);
		}
}


/*
* 读取数据库操作
* 查询出所有序列号主数据信息
* */
export const getSerialMasterDataDB = async () => {
		try {
				const response = await getAllItems(SERIAL_NUMBER_MASTER_DATA, '*');
				return Promise.resolve(response);
		} catch (error) {
				return Promise.reject(error);
		}
}

//按工单放行
//把所有投料标记为“X”的序列号，的放行标记置为“X”
export const updateSerialMasterDataByNoDB = async (data) => {
		try {
				if(data.length > 0){
					let bulkUpdateArray = [];
					data.forEach((item) => {
							let updateData = {
									table: SERIAL_NUMBER_MASTER_DATA,
									values:{},
									conditions:[]
							};
							updateData.values.check_flag = item.check_flag;
							updateData.values.release_person = item.release_person;
							updateData.values.release_time = item.release_time;
							updateData.conditions = [
									{
											key: 'serial_number',
											value: item.serial_number,
									}
							];
							bulkUpdateArray.push(updateData);
					});
					const response = await transactionBulkUpdate(bulkUpdateArray);
					return Promise.resolve(response);
				}
				return Promise.resolve(getResponseData(responseMsg.SUCCESS_200, '', {}));
				
		} catch (error) {
				return Promise.reject(error);
		}
}

/*
* 读取数据库操作
* 查询出所有序列号主数据信息
* */
export const updateSerialMasterDataDB = async (data) => {
		try {
				let bulkUpdateArray = [];
				data.forEach((item) => {
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
					 }else{
							 updateData.conditions = [
									 {
											 key: 'material_number',
											 value: item.material_number,
									 }
							 ];
							 updateData.values.work_number = item.work_number;
							 updateData.values.check_flag = item.check_flag;
							 updateData.values.release_person = item.release_person;
							 updateData.values.release_time = item.release_time;
					 }
						bulkUpdateArray.push(updateData);
				});
				const response = await transactionBulkUpdate(bulkUpdateArray);
				return Promise.resolve(response);
		} catch (error) {
				return Promise.reject(error);
		}
}

/*
* 根据序列号查找主数据是否存在
* */
export const checkSerialMasterDataByNoDB = async (queryId) => {
		try {
				let response = await query("SELECT serial_number FROM ?? WHERE serial_number = ? ", [SERIAL_NUMBER_MASTER_DATA, queryId]); // 插入数据
				return Promise.resolve(response);
		} catch (error) {
				return Promise.reject(error);
		}
}

/*
* 读取数据库
* 根据factory_id serial_numbers读取所有库存地点信息
* */
export const querySerialMasterByNoDB = async function(serial_numbers,  factory) {
		try {
				const sql = "SELECT distinct serial_number, material_number, work_number, material_desc, batch_number, location, check_flag, issue_flag FROM " + SERIAL_NUMBER_MASTER_DATA + " WHERE factory = '" + factory + "' and serial_number in ('" + serial_numbers.join("','") + "')";
				console.log(sql);
				let response = await query(sql); // 插入数据
				return Promise.resolve(getResponseData(response.statusCode, '', { serialData: response.data}));  //处理成功的返回
		} catch(err) {
				return Promise.reject(getResponseData(err.statusCode, err.error, {}));  //处理失败的返回s
		}
};

/*
* 12_工单投料
* 参数： 工单号
* 返回： 工单号， 已投数量（issue_flag为X），工单总数量
* */
export const querySerialMasterCountDataByWorkNoDB = async function(serial_numbers,  factory) {
	try {
			let sql = "SELECT distinct serial_number, material_number, work_number, material_desc, batch_number, location, check_flag, issue_flag, original_work_quantity FROM " + SERIAL_NUMBER_MASTER_DATA + " WHERE factory = '" + factory + "' and serial_number in ('" + serial_numbers.join("','") + "')";
			console.log(sql);
			let response = await query(sql); 
			
			const workNo = response.data[0].work_number;
			var totalWorkNumber = response.data[0].original_work_quantity? response.data[0].original_work_quantity:0;
			console.log('查询出工单数：', totalWorkNumber);
			
			if(workNo && workNo.length > 0){
				const sql2 = "SELECT count(*) as numberOfIssuedWorkItem FROM " + SERIAL_NUMBER_MASTER_DATA + " WHERE work_number = '" + workNo + "' and issue_flag = 'X'";
				let res_IssuedRows = await query(sql2); 
				
				const resp = {
					work_number: workNo,
					numberOfWorkItem: totalWorkNumber.toString(),//res_NumberOfRows.data[0].numberOfWorkItem.toString(),
					numberOfIssuedWorkItem: res_IssuedRows.data[0].numberOfIssuedWorkItem.toString(),
					serialData: response.data
				}
				return Promise.resolve(getResponseData(response.statusCode, '', resp));  //处理成功的返回
			}
			else{
				return Promise.reject(getResponseData(responseMsg.ERROR_400, responseMsg.WORK_NUMBER_NOTEXISTED, {}));  //处理失败的返回s
			}
			
	} catch(err) {	
			return Promise.reject(getResponseData(err.statusCode, err.error, {}));  //处理失败的返回s
	}
};


/*
* 14_查询序列号主数据
* 参数：- 工厂代码、工单日期、工单号
* 返回：返回满足查询条件的记录，每个工单号为一个数组（一个工单号可能对应多条记录） 
* */
export const querySerialMasterDataByFactoryWorkNoDB = async function(factory, workDate, workNo) {
	try {
			console.log('querySerialMasterDataByFactoryWorkNoDB: ', workNo, factory, workDate);
			let sql = '';
			if(workNo){
				sql = "SELECT distinct serial_number, work_number, location, material_number, material_desc, check_flag FROM " + SERIAL_NUMBER_MASTER_DATA + " WHERE factory = '" + factory + "' and work_number = '" + workNo + "'";
			}
			else{
				sql = "SELECT distinct serial_number, work_number, location, material_number, material_desc, check_flag FROM " + SERIAL_NUMBER_MASTER_DATA + " WHERE factory = '" + factory + "' and work_date = '" + workDate + "'";
			}
			console.log(sql);
			let response = await query(sql); 
			
			return Promise.resolve(getResponseData(response.statusCode, '', response.data));  //处理成功的返回
	} catch(err) {
			return Promise.reject(getResponseData(err.statusCode, err.error, {}));  //处理失败的返回s
	}
};



/*
* 19_查询序列号主数据
* 参数：- 序列号、物料号
* 返回：支持模糊查询 
* */
export const querySerialMasterDataBySerialOrMaterialDB = async function(serialNumber, materialNumber) {
	try {
			console.log(serialNumber);
			console.log(materialNumber);
			let sql = "SELECT distinct serial_number, material_number, material_desc, location, factory, batch_number, purchase_order, work_number, work_date, check_flag FROM " + SERIAL_NUMBER_MASTER_DATA ;
			if(serialNumber && materialNumber){
				sql = sql + " WHERE serial_number LIKE '%" + serialNumber + "%' and material_number LIKE '%" + materialNumber + "%' and location = '598E'";
			}
			else if (serialNumber){
				sql = sql + " WHERE serial_number LIKE '%" + serialNumber + "%' and location = '598E'";
			}
			else{
				sql = sql + " WHERE material_number LIKE '%" + materialNumber + "%' and location = '598E'";
			}
			console.log(sql);
			let response = await query(sql); 
			return Promise.resolve(getResponseData(response.statusCode, '',  { serialData: response.data}));  //处理成功的返回
	} catch(err) {
			return Promise.reject(getResponseData(err.statusCode, err.error, {}));  //处理失败的返回s
	}
};

/*
* 读取数据库
* 根据factory_id area_id读取所有库存地点信息
* */
export const getStorageByFactoryDB = async function( area_id,  factory_id) {
		try {
			let response = await query("SELECT distinct storage_id, area_id, CONCAT(factory_name, ' - ' , storage_name) as storage_name FROM ?? WHERE factory_id = ?", [FACTORY_STORAGE_INFO, factory_id]); // 插入数据
				return Promise.resolve(getResponseData(response.statusCode, '', response.data));  //处理成功的返回
		} catch(err) {
				return Promise.reject(getResponseData(err.statusCode, err.error, {}));  //处理失败的返回
		}
};
/*
* 读取数据库
* 读取基础数据信息（工厂 仓位 label数据）
* */
export const getBasicDataDB = async function() {
		try {
				let responseData = {};
				let factoryResponse = await query("SELECT distinct factory_id, area_id, factory_name FROM ??", [FACTORY_STORAGE_INFO]); // 查询工厂数据
				let areaResponse = await query("SELECT * FROM ??", [AREA_PERMISSION]); // 查询仓位数据
				let labelResponse = await query("SELECT * FROM ??", [LABEL_TYPE]); // 查询仓位数据
				responseData.areaData = areaResponse.data;
				responseData.factoryData = factoryResponse.data;
				responseData.labelData = labelResponse.data;
				return Promise.resolve(getResponseData(200, '', responseData));  //处理成功的返回
		} catch(err) {
				return Promise.reject(getResponseData(err.statusCode, err.error, {}));  //处理失败的返回
		}
};

/*
* 08_工单收货
* 参数：- 类型（0：工单收货，1：取消工单收货），工单日期、工单号。二者不能都为空.支持模糊查询
* 返回： 每个工单为一条记录
查询：库存地点为TBD
0：总数量，已检数量（检验标识为X）

查询：库存地点不为TBD
1：总数量，已检数量（检验标识为X）
* */
export const querySerialMasterDataByWorkDateOrWorkNoDB = async function(type,  workNo, workDate) {
	try {
			console.log(type);
			console.log(workNo);
			
			let sql = "select serial_number, work_number,material_number, material_desc, location, check_flag, original_work_quantity FROM ?? WHERE ";
			let queryParam = [SERIAL_NUMBER_MASTER_DATA];
			let hasWorkNumber = false;
			if(workNo) {
				sql = sql + " work_number LIKE '%" + workNo + "%' ";
				hasWorkNumber = true;
			}
			
			if(workDate) {
				if(hasWorkNumber){
						sql = sql + ' and ';
				}
				sql = sql + " work_date = '" + workDate + "' ";
			}

			console.log(sql);
			let response = await query(sql, queryParam); 
			return Promise.resolve(response);
			
	} catch(err) {
			return Promise.reject(getResponseData(err.statusCode, err.error, {}));  //处理失败的返回s
	}
};

/*
* 备件库供应商退回
* */
export const vendorSpareBackDataDB = async (data, material_document_number) => {
	try {
			
			//插入数据
			let goodsMovement = {table: SERIAL_NUMBER_GOODS_MOVEMENT, values:[]};
			let masterData = {table: SERIAL_NUMBER_MASTER_DATA, values:[]};
			data.movementData.forEach((item) => {
					goodsMovement.values.push(getMovementDataBaseObject(item));
			});
			
			data.serialData.forEach((item) => {
					item.material_document_number = material_document_number;
					masterData.values.push(getSerialNumberDataBaseObject(item))
			});
			
			let insertData = [ goodsMovement ];
			
			//更新数据
			let bulkUpdateArray = [];
			if(data.oldSerialNumber){
				let updateData = {
					table: SERIAL_NUMBER_MASTER_DATA,
					values:{},
					conditions:[]
				};
				updateData.values.location = '';
				updateData.conditions = [
						{
								key: 'serial_number',
								value: data.oldSerialNumber,
						}
				];
				bulkUpdateArray.push(updateData);
			}
			await transactionBulkInsertReplaceAndUpdate(insertData, [masterData], bulkUpdateArray);

			return Promise.resolve(getResponseData(responseMsg.SUCCESS_200, '', {success: true}));
	} catch (error) {
			return Promise.reject(error);
	}
}

//序列号主数据查询报表
export const serialMasterReportDB = async (data, page, size, all) => {
	let conditions = prepareQueryConditions (data);
	let conditionString = conditions.join (" and ");
	console.log ('conditionString: ', conditionString);
	let fiels = ` a.serial_number, a.material_number, a.material_desc,
	a.factory, a.location, a.batch_number, a.work_number, a.work_date, a.original_work_quantity, a.issue_flag, a.check_flag, a.create_person, 
	SUBSTRING(a.create_date, 1, 10) as create_date, 
	SUBSTRING(a.create_date, 12, 8) as create_time,  
	b1.transfer_person as product_person, a.release_person, 
	b1.serial_number AS component_serial_number, b1.material_number AS component_material_number,a2.material_desc as component_material_desc,
	d.reference_sd_document, d.purchase_order_by_customer, d.ship_to_party, d.business_partner_name, 
	a.purchase_order,
	CASE WHEN a.purchase_order <>'' and a.purchase_order is not null THEN SUBSTRING(a.create_date, 1, 10) ELSE NULL END AS purchase_date,
	CASE WHEN a.purchase_order <>'' and a.purchase_order is not null THEN SUBSTRING(a.create_date, 12, 8) ELSE NULL END AS purchase_time,
	a.create_person as purchase_person,
	b2.receipt_number, b2.transfer_date as outbound_date, b2.transfer_person as outbound_person`;
	
	let tables = ` from pda_db.serial_number_master_data as a 
	left join 
	(select * from pda_db.serial_number_goods_movement where movement_type in ('261','262') ) as b1 on (b1.receipt_number = a.serial_number ) 
	left join 
	(select * from pda_db.customer_po as x 
	left join pda_db.serial_number_goods_movement as y 
	on (x.delivery_document = y.receipt_number OR x.delivery_document = SUBSTRING(y.receipt_number, 3, 8) ) ) d 
	on (d.serial_number = a.serial_number) 
	left join 
	(select * from pda_db.serial_number_goods_movement where movement_type in ('601','602')) b2 on (b2.serial_number = a.serial_number) 
	left join
	(select * from pda_db.serial_number_master_data) a2 on b1.serial_number = a2.serial_number 
	where ` ;

	let searchSQL = `SELECT `+ fiels + tables + conditionString ;
	
	let sort = addPrefixForSort (data.sort);
	console.log (sort);
	searchSQL = searchSQL + ' order by ' + sort + ' ' + data.sortDirection;
	if (!all) {
		searchSQL = searchSQL + ' limit ' + page * size + ', ' + size;
	}

	const countSql = 'SELECT COUNT(*) as totalNumber '+ tables + conditionString;
	
	console.log ('serialMasterReportDB: ', searchSQL);

    try {
		const resCount = await query(countSql);
		const response = await query(searchSQL);
		const respPage = {totalNumber: resCount.data[0].totalNumber, page:page, pageSize:size}
		console.log('RESPONSE : ', respPage);
        return Promise.resolve(getResponseData(response.statusCode, '', {pagination: respPage, rows: response.data} ));
    } catch (error) {
        return Promise.reject({ ...error , data: [] });
    }
}

const prepareQueryConditions = (data) => {
	let conditions = [];

	//模糊查询
	if (data.serial_number_from && data.serial_number_to){
		conditions.push(" (a.serial_number >= '" + data.serial_number_from + "' AND a.serial_number <= '" + data.serial_number_to + "')");
	}
	else if (data.serial_number_from || data.serial_number_to){
		conditions.push(" a.serial_number LIKE '%" + (data.serial_number_from? data.serial_number_from:data.serial_number_to)  + "%'" );
	}
	
	//模糊查询
	if (data.material_number_from && data.material_number_to){
		conditions.push(" (a.material_number >= '" + data.material_number_from + "' AND a.material_number <= '" + data.material_number_to + "')");
	}
	else if (data.material_number_from || data.material_number_to){
		conditions.push(" a.material_number LIKE '%" + (data.material_number_from? data.material_number_from:data.material_number_to)  + "%'" );
	}

	//模糊查询
	if (data.material_desc_from && data.material_desc_to){
		conditions.push(" (a.material_desc LIKE '%" + data.material_desc_from + "%' OR a.material_desc LIKE '%" + data.material_desc_to + "%')");
	}
	else if (data.material_desc_from || data.material_desc_to){
		conditions.push(" a.material_desc LIKE '%" + (data.material_desc_from? data.material_desc_from:data.material_desc_to)  + "%'" );
	}

	if (data.component_serial_number_from && data.component_serial_number_to){
		conditions.push(" (b1.serial_number >= '" + data.component_serial_number_from + "' AND b1.serial_number <= '" + data.component_serial_number_to + "')");
	}
	else if (data.component_serial_number_from || data.component_serial_number_to){
		conditions.push(" b1.serial_number LIKE '%" + (data.component_serial_number_from? data.component_serial_number_from:data.component_serial_number_to)  + "%'" );
	}
	
	if(data.factory){
		conditions.push("( a.factory = '" + data.factory + "' )");
	}

	if (data.purchase_order_from && data.purchase_order_to){
		conditions.push(" (a.purchase_order >= '" + data.purchase_order_from + "' and a.purchase_order <= '" + data.purchase_order_to + "')");
	}
	else if (data.purchase_order_from || data.purchase_order_to){
		conditions.push(" a.purchase_order = '" + (data.purchase_order_from? data.purchase_order_from:data.purchase_order_to)  + "'" );
	}
	
	if (data.work_number_from && data.work_number_to){
		conditions.push(" (a.work_number >= '" + data.work_number_from + "' and a.work_numbe <= '" + data.work_number_to + "')");
	}
	else if (data.work_number_from || data.work_number_to){
		conditions.push(" a.work_number = '" + (data.work_number_from? data.work_number_from:data.work_number_to)  + "'" );
	}

	if (data.work_date_from && data.work_date_to){
		conditions.push(" (a.work_date >= '" + data.work_date_from + "' and a.work_date <= '" + data.work_date_to + "')");
	}
	else if (data.work_date_from || data.work_date_to){
		conditions.push(" a.work_date = '" + (data.work_date_from? data.work_date_from:data.work_date_to)  + "'" );
	}

	if (data.create_person_from && data.create_person_to){
		conditions.push(" (a.create_person = '" + data.create_person_from + "' OR a.create_person = '" + data.create_person_to + "')");
	}
	else if (data.create_person_from || data.create_person_to){
		conditions.push(" a.create_person = '" + (data.create_person_from? data.create_person_from:data.create_person_to)  + "'" );
	}

	if (data.create_date_from && data.create_date_to){
		conditions.push(" (a.create_date >= '" + data.create_date_from + "' and a.create_date <= '" + data.create_date_to + "')");
	}
	else if (data.create_date_from || data.create_date_to){
		let con = "a.create_date = '";
		conditions.push(con + (data.create_date_from? data.create_date_from:data.create_date_to)  + "'" );
	}

	if (data.reference_sd_document_from && data.reference_sd_document_to){
		conditions.push(" (d.reference_sd_document >= '" + data.reference_sd_document_from + "' and d.reference_sd_document <= '" + data.reference_sd_document_to + "')");
	}
	else if (data.reference_sd_document_from || data.reference_sd_document_to){
		let con = "d.reference_sd_document = '";
		conditions.push(con + (data.reference_sd_document_from? data.reference_sd_document_from:data.reference_sd_document_to)  + "'" );
	}

	if (data.purchase_order_by_customer_from && data.purchase_order_by_customer_to){
		conditions.push(" (d.purchase_order_by_customer >= '" + data.purchase_order_by_customer_from + "' and d.purchase_order_by_customer <= '" + data.purchase_order_by_customer_to + "')");
	}
	else if (data.purchase_order_by_customer_from || data.purchase_order_by_customer_to){
		let con = "d.purchase_order_by_customer = '" ;
		conditions.push(con + (data.purchase_order_by_customer_from? data.purchase_order_by_customer_from:data.purchase_order_by_customer_to)  + "'" );
	}

	if (data.ship_to_party_from && data.ship_to_party_to){
		conditions.push(" (d.ship_to_party LIKE '%" + data.ship_to_party_from + "%' OR d.ship_to_party_to LIKE '%" + data.ship_to_party_to + "%')");
	}
	else if (data.ship_to_party_from || data.purchase_order_by_customer_to){
		conditions.push(" d.ship_to_party LIKE '%" + (data.ship_to_party_from? data.ship_to_party_from:data.ship_to_party_to)  + "%'" );
	}

	if (data.business_partner_name_from && data.business_partner_name_to){
		conditions.push(" (d.business_partner_name LIKE '%" + data.business_partner_name_from + "%' OR d.business_partner_name LIKE '%" + data.business_partner_name_to + "%')");
	}
	else if (data.business_partner_name_from || data.purchase_order_by_customer_to){
		conditions.push(" d.business_partner_name LIKE '%" + (data.business_partner_name_from? data.business_partner_name_from:data.business_partner_name_to)  + "%'" );
	}
	return conditions;
}

const addPrefixForSort = (sort) => {
	console.log ('addPrefixForSort: ', sort);
	let b1 = ['component_serial_number'];
	let d = ['reference_sd_document', 'purchase_order_by_customer', 'ship_to_party', 'business_partner_name'];
	
	let foundb1 = b1.includes(sort);
	if (foundb1) {
		return 'b1.serial_number';
	}
	else{
		let foundd = d.includes(sort);
		if (foundd) {
			return 'd.' + sort;
		}
	}

	if(sort === 'component_serial_number' ){
		return 'b1.serial_number';
	}
	if(sort === 'product_person' ){
		return 'b1.transfer_person';
	}

	if(sort === 'component_material_number' || sort === 'component_material_desc'){
		return 'b1.material_number';
	}
	
	if(sort === 'purchase_date' || sort === 'purchase_time' || sort === 'create_time'){
		return 'a.create_date';
	}
	if(sort === 'purchase_person' ){
		return 'a.create_person';
	}
	
	if(sort === 'outbound_date' ){
		return 'b2.transfer_date';
	}
	if(sort === 'outbound_person' ){
		return 'b2.transfer_person';
	}

	return 'b1.serial_number';
	
}

export const queryProductQualityReport = async(df, dt, wnf, wnt, mnf, mnt, mdf, mdt, rp, type, pg = 0, ps = 50, ex, len, sf, sd) => {
	const params= [SERIAL_NUMBER_MASTER_DATA,SERIAL_NUMBER_REJECT_DATA, pg * ps, +ps];
	const fields = ["a.work_date", " a.work_number", " a.factory", " a.material_number", " a.material_desc", " a.original_work_quantity", " SUM(IF(b.serial_number != '', 1, 0)) AS reject", "group_concat(concat(b.serial_number,':',COALESCE(b.comment, '')) separator '\n') as reject_detail", " a.create_person", " a.release_person"," b.appearance"," b.hardware"," b.software"," b.mountings"," b.other"];
	const conditions = ["a.work_number != ''"];
	let temp;
	if(df && dt) {
		conditions.push("AND a.work_date BETWEEN " + df + " AND " + dt);
	}
	if(df && !dt){
		conditions.push("AND a.work_date >= " + df);
	}
	if(!df && dt){
		conditions.push("AND a.work_date <= " + dt);
	}
	if(wnf && wnt) {
		conditions.push("AND (a.work_number LIKE '%" + wnf + "%' OR a.work_number LIKE '%" + wnt + "%')");
	}else if(!wnf && wnt || wnf && !wnt){
		temp = wnf || wnt;
		conditions.push("AND a.work_number LIKE '%" + temp + "%'");
	}
	if(mnf && mnt){
		conditions.push("AND (a.material_number LIKE '%" + mnf + "%' OR a.material_number LIKE '%" + mnt + "%')");
	}else if(!mnf && mnt || mnf && !mnt){
		temp = mnf || mnt;
		conditions.push("AND a.material_number LIKE '%" + temp + "%'");
	}
	if(mdf && mdt){
		conditions.push("AND (a.material_desc LIKE '%" + mdf + "%' OR a.material_desc LIKE '%" + mdt + "%')");
	}else if (!mdf && mdt || mdf && !mdt) {
		temp = mdf || mdt
		conditions.push("AND a.material_desc LIKE '%" + temp + "%'");
	}
	rp && conditions.push("AND a.release_person = '" + rp + "'");

	let sql = "SELECT " + fields.join();
	sql += " FROM ?? a JOIN ?? b ON a.serial_number = b.serial_number";
	sql += " WHERE {PERIODCLAUSE} and " + conditions.join(" ") + " GROUP BY work_number";
	sql += sf && sd ? " ORDER BY " + sf + " " + sd : " ORDER BY create_date desc";

	console.log ('REJECT REPORT SQL: ',sql);
	let staticSQL = getStaticSQL(type, conditions.join(" "));

	try {
		// if(len){
			const response = await query(staticSQL);
			for(let item of response.data) {
				console.log(item.period);

				// ex ? "" : sql += " LIMIT ?, ?";
				let subSQL = getSubSQL(sql, item.period, type);
				const subRes = await query(subSQL, params);
				item.reject_serials = subRes.data;
			}
			response.length = len;
			return Promise.resolve(response); 
		// }

    } catch (error) {
        return Promise.reject({ ...error , data: [] });
	}

}

const getStaticSQL = (type, conditions) => {
	let searchSQL =  `with query_reject AS (
			SELECT {PERIODCLAUSE} AS period, COUNT(a.serial_number) as reject_total
			FROM pda_db.serial_number_reject_data a 
			join pda_db.serial_number_master_data b 
            where a.serial_number = b.serial_number
			GROUP BY period),
		query_sn_master AS 
		(
			select {SNPERIODCLAUSE} AS period, sum(original_work_quantity) as product_total
			from 
				( 
				SELECT work_number, original_work_quantity, work_date
				FROM pda_db.serial_number_master_data AS a
				where original_work_quantity is not null and {WHERECLAUSE}
				group by work_number 
				) as sn
			group by period 
		)
		 select *, concat(round(( reject_total/product_total * 100 ),2),'%') as reject_perct from query_reject 
		  join query_sn_master 
		 USING (period)
		order by period  `;
		
	if(type == 'year'){
		searchSQL = searchSQL.split("{PERIODCLAUSE}").join("YEAR(b.work_date)");
		searchSQL = searchSQL.split("{SNPERIODCLAUSE}").join("YEAR(work_date)");
	}
	else if (type == 'month'){
		searchSQL = searchSQL.split("{PERIODCLAUSE}").join("concat(YEAR(b.work_date), ' M', MONTH(b.work_date))");
		searchSQL = searchSQL.split("{SNPERIODCLAUSE}").join("concat(YEAR(work_date), ' M', MONTH(work_date))");
	}
	else if (type == 'quarter'){
		searchSQL = searchSQL.split("{PERIODCLAUSE}").join("concat(YEAR(b.work_date), ' Q', QUARTER(b.work_date))");
		searchSQL = searchSQL.split("{SNPERIODCLAUSE}").join("concat(YEAR(work_date), ' Q', QUARTER(work_date))");
	}
	else{
		searchSQL = searchSQL.split("{PERIODCLAUSE}").join("concat(YEAR(b.work_date), ' W', WEEK(b.work_date)+1)");
		searchSQL = searchSQL.split("{SNPERIODCLAUSE}").join("concat(YEAR(work_date), ' W', WEEK(work_date)+1)");
	}
	
	searchSQL = searchSQL.replace('{WHERECLAUSE}', conditions);
	console.log('static sql :', searchSQL);

	return searchSQL;
}

const getSubSQL = (subsql, period, type) => {
	if(type == 'year'){
		subsql = subsql.split("{PERIODCLAUSE}").join("YEAR(a.work_date)");
	}
	else if (type == 'month'){
		subsql = subsql.split("{PERIODCLAUSE}").join("concat(YEAR(a.work_date), ' M', MONTH(a.work_date)) = '" + period + "'");
	}
	else if (type == 'quarter'){
		subsql = subsql.split("{PERIODCLAUSE}").join("concat(YEAR(a.work_date), ' Q', QUARTER(a.work_date)) = '" + period + "'");
	}
	else{
		subsql = subsql.split("{PERIODCLAUSE}").join("concat(YEAR(a.work_date), ' W', WEEK(a.work_date)+1) = '" + period + "'");
	}
	console.log('sub sql :', subsql);
	return subsql;
}