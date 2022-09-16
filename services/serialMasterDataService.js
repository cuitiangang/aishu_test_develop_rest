import {getSerialMasterDataDB,
		checkSerialMasterDataByNoDB,
		getSerialDataByWorkNumberDB,
		getStorageByFactoryDB,
		querySerialMasterByNoDB,
		updateSerialMasterDataByNoDB,
		querySerialMasterDataByFactoryWorkNoDB,
		querySerialMasterDataBySerialOrMaterialDB,
		querySerialMasterCountDataByWorkNoDB,
		getBasicDataDB,
		vendorSpareBackDataDB,
		querySerialMasterDataByWorkDateOrWorkNoDB,
		updateSerialMasterDataDB, 
		serialMasterReportDB,
		queryProductQualityReport
	} from "../persistence/serialMasterDataDao";
import {getResponseData} from "../utils/utility";
import * as responseMsg from "../utils/response";
import {callMaterialDocument} from "./serialMovementService"
import _ from 'lodash';


/*
release_type:1 工单放行, 0 取消工单放行
release_count：工单放行 返回未放行数量， 取消工单放行 返回已放行数量
-	“已放行数量”： “检验标识”不为空的行项目的数量
*/
export const getSerialDataByWorkNumber = async (queryData) => {
		try {
				if(!queryData || (!queryData.work_number && !queryData.work_date)){
					return Promise.reject(getResponseData(responseMsg.ERROR_400, responseMsg.MASTER_DATA_QUERY_ID_ERROR, {}));
				}
				let response = await getSerialDataByWorkNumberDB(queryData.work_number, queryData.work_date);
				const groupRes = _.groupBy(response.data, 'work_number');
				let responseObject = [];
				_.forEach(groupRes, function(value, key) {
					var count ;
					const releaseArray = _.filter(value, ['check_flag', 'X' ]);
					count = releaseArray.length;
					
					const item = {
							work_number: key,
							serialNumberArray:value,
							material_number: value.length > 0 ? value[0].material_number : '',  //工单号和物料是一一对应，所以取第一个即可
							work_count: value[0].original_work_quantity,
							release_count: count
					}
					responseObject.push(item);
						
				});
				return Promise.resolve(getResponseData(response.statusCode, responseObject.length === 0 ? responseMsg.NO_WORK_NUMBER_ITEMS_DATA : '', {releaseWorkData: responseObject}));   //处理成功的响应
		}catch (err) {
				return Promise.reject(getResponseData(err.statusCode, err.error, {}));  //处理失败响应
		}
}

/*
* 读取所有的条形码主数据集合
* */
export const getSerialMasterData = async () => {
		try {
				let response = await getSerialMasterDataDB();
				return Promise.resolve(getResponseData(response.statusCode, '', {serialMaster: response.data}));   //处理成功的响应
		}catch (err) {
				return Promise.reject(getResponseData(err.statusCode, err.error, {}));  //处理失败响应
		}
}

export const updateSerialDataByWorkNumber = async (data) => {
		try {
				let response = await updateSerialMasterDataDB(data);
				return Promise.resolve(getResponseData(response.statusCode, '', {success: true}));   //处理成功的响应
		}catch (err) {
				return Promise.reject(getResponseData(err.statusCode, err.error, {}));  //处理失败响应
		}
}

export const updateSerialMasterData = async (data) => {
		try {
				let response = await updateSerialMasterDataDB(data);
				return Promise.resolve(getResponseData(response.statusCode, '', {success: true}));   //处理成功的响应
		}catch (err) {
				return Promise.reject(getResponseData(err.statusCode, err.error, {}));  //处理失败响应
		}
}

// 14 按工单放行
export const updateSerialMasterDataByNo = async (data) => {
		try {
				let response = await updateSerialMasterDataByNoDB(data);
				return Promise.resolve(getResponseData(response.statusCode, '', {success: true}));   //处理成功的响应
		}catch (err) {
				return Promise.reject(getResponseData(err.statusCode, responseMsg.WORK_NUMBER_RELEASE_ERROR, {}));  //处理失败响应
		}
}

/*
* 根据serialNumber查看当前主数据是否存在
* 存在返回true
* 不存在返回false
* */
export const checkSerialMasterDataByNo = async (queryData) => {
		if(!queryData || !queryData.serialNumber){
				return Promise.reject(getResponseData(responseMsg.ERROR_400, responseMsg.MASTER_DATA_QUERY_ID_ERROR, {}));
		}
		
		try {
				let response = await checkSerialMasterDataByNoDB(queryData.serialNumber);
				return Promise.resolve(getResponseData(response.statusCode, '', {exist: true}));   //处理成功的响应
		}catch (err) {
				return Promise.reject(getResponseData(err.statusCode, err.error, {exist: false}));  //处理失败响应
		}
}

/*
* 从条码主数据表中，查询满足查询条件的记录
- 序列号：必填
- 工厂：必填
* */
export const querySerialMasterDataByNo = async (bodyData) => {
		if(!bodyData.serial_numbers || !bodyData.factory){
				return Promise.reject(getResponseData(responseMsg.ERROR_400, responseMsg.MASTER_DATA_QUERY_ID_ERROR, {}));
		}
		try {
				let response = await querySerialMasterByNoDB(bodyData.serial_numbers, bodyData.factory);
				return Promise.resolve(getResponseData(response.statusCode, '', response.data));   //处理成功的响应
		}catch (err) {
				return Promise.reject(getResponseData(err.statusCode, err.error, {exist: false}));  //处理失败响应
		}
}


/*
* 根据factory_id area_id获取库存地点信息数据集
* */
export const getStorageByFactory = async (bodyData) => {
		if (!bodyData.area_id || !bodyData.factory_id) { //校验用户名密码是否为空
				return Promise.reject(getResponseData(responseMsg.ERROR_400, responseMsg.POST_DATA_ERROR, {})); //如果空，reject数据
		}
		try {
				let response = await getStorageByFactoryDB(bodyData.area_id, bodyData.factory_id);
				return Promise.resolve(getResponseData(response.statusCode, '', {storageData: response.data})); //处理成功的响应
		} catch (err) {
				return Promise.reject(getResponseData(err.statusCode, err.error, {})); //处理失败响应
		}
}

/*
* 14_查询序列号主数据
* 参数：- 工厂代码、工单日期、工单号
* 返回：返回满足查询条件的记录，每个工单号为一个数组（一个工单号可能对应多条记录） 
* */
export const querySerialMasterDataByFactoryWorkNo = async (queryData) => {
	if(!queryData || !queryData.factory || (!queryData.workDate && !queryData.workNo)){
		return Promise.reject(getResponseData(responseMsg.ERROR_400, responseMsg.MASTER_DATA_QUERY_ID_ERROR, {}));
	}
	try {
			let response = await querySerialMasterDataByFactoryWorkNoDB(queryData.factory, queryData.workDate, queryData.workNo);
			let groupRes = _.groupBy(response.data, 'work_number');
			console.log(groupRes);
			return Promise.resolve(getResponseData(response.statusCode, '', groupRes));   //处理成功的响应
	}catch (err) {
			return Promise.reject(getResponseData(err.statusCode, err.error, {exist: false}));  //处理失败响应
	}
}


/*
* 12_查询序列号主数据
* 参数： 工单号
* 返回： 工单号， 已投数量，工单总数量
* */
export const querySerialMasterCountDataByWorkNo = async (bodyData) => {
	if(!bodyData.serial_numbers || !bodyData.factory){
		return Promise.reject(getResponseData(responseMsg.ERROR_400, responseMsg.MASTER_DATA_QUERY_ID_ERROR, {}));
	}
	try {
			let response = await querySerialMasterCountDataByWorkNoDB(bodyData.serial_numbers, bodyData.factory);
			return Promise.resolve(getResponseData(response.statusCode, response.error, response.data));   //处理成功的响应
	}catch (err) {
		console.log('ERROR:', err);
		return Promise.reject(getResponseData(err.statusCode, err.error, {exist: false}));  //处理失败响应
	}
}

/*
* 19_查询序列号主数据
* 参数：- 序列号、物料号
* 返回：支持模糊查询 
* */
export const querySerialMasterDataBySerialOrMaterial = async (queryData) => {
	console.log('querySerialMasterDataBySerialOrMaterial.serialNumber ', queryData.serialNumber);
	if(!queryData || (!queryData.serialNumber && !queryData.materialNumber)){
		return Promise.reject(getResponseData(responseMsg.ERROR_400, responseMsg.MASTER_DATA_QUERY_ID_ERROR, {}));
	}
	try {
			let response = await querySerialMasterDataBySerialOrMaterialDB(queryData.serialNumber, queryData.materialNumber);
			return Promise.resolve(getResponseData(response.statusCode, '', response.data));   //处理成功的响应
	}catch (err) {
			return Promise.reject(getResponseData(err.statusCode, err.error, {exist: false}));  //处理失败响应
	}
}


/*
* 08_工单收货
* 参数：- 工单日期、工单号。二者不能都为空
* 返回：支持模糊查询 
type: 1-收货；0-取消收货
* */
export const querySerialMasterDataByWorkDateOrWorkNo = async (queryData) => {
	console.log('querySerialMasterDataByWorkDateOrWorkNo: ', queryData.workNo, queryData.workDate);
	if(!queryData || !queryData.type || (!queryData.workNo && !queryData.workDate)){
		return Promise.reject(getResponseData(responseMsg.ERROR_400, responseMsg.MASTER_DATA_QUERY_ID_ERROR, {}));
	}
	try {
		   let response = await querySerialMasterDataByWorkDateOrWorkNoDB(queryData.type, queryData.workNo, queryData.workDate);
			const groupRes = _.groupBy(response.data, 'work_number'); //按工单号分组
			let responseObject = [];
			let noDataWorkNumber = 0;

			if (queryData.type === '1' ){
				_.forEach(groupRes, function(value, key) {
					//工单收货 已检数量：汇总检验标识字段为“X”的序列号行项目的总数量
					const filteredArray = _.filter(value, {'location':'TBD', 'check_flag':'X'});
					
					//该工单的所有序列号
					const serialArray = _.filter(response.data, {'work_number':key});
					const serialNumberArray = _.map(serialArray, _.partialRight(_.pick, ['serial_number']));
					const totalnumber = (value[0].original_work_quantity == '' || value[0].original_work_quantity == null )? 0:parseInt(value[0].original_work_quantity);
					if(filteredArray.length > 0){
						const item = {
							work_number: key,
							material_number: value[0].material_number,
							material_desc: value[0].material_desc ,
							total_number: totalnumber,
							checked_number: filteredArray.length,
							received_number: 0,
							serial_numbers: serialNumberArray
						}
						responseObject.push(item)
						
					}
					else{
					  return Promise.reject(getResponseData(responseMsg.ERROR_400, responseMsg.DATABASE_NO_AFFECT_ROWS_ERROR, []));
					}
				});
				if(responseObject.length > 0){
					return Promise.resolve(getResponseData(response.statusCode, '', responseObject));   //处理成功的响应
				}
				else{
					return Promise.reject(getResponseData(responseMsg.ERROR_400, responseMsg.DATABASE_NO_AFFECT_ROWS_ERROR, []));
				}
			}else{
				_.forEach(groupRes, function(value, key) {
					//0 取消工单收货
					console.log(value);
					//已收数量：汇总检验标识字段为“X”且库存地点不等于“TBD”也不为空的序列号行项目的总数量
					const filteredArray = _.filter(value, function(x) { return x.location !== 'TBD' && x.location !== null && x.location !== '' && x.check_flag == 'X' });
					
					//该工单的所有序列号
					const serialArray = _.filter(response.data, {'work_number':key});
					const serialNumberArray = _.map(serialArray, _.partialRight(_.pick, ['serial_number']));
					// value[0].material_desc, value.length, filteredArray.length, serialNumberArray);
					const item = {
							work_number: key,
							material_number: value[0].material_number,
							material_desc: value[0].material_desc,
							total_number:value.length,
							checked_number: 0,
							received_number: filteredArray.length,
							serial_numbers: serialNumberArray
					}
					
					responseObject.push(item);
				});
				if(responseObject.length > 0){
					return Promise.resolve(getResponseData(response.statusCode, '', responseObject));   //处理成功的响应
				}
				else{
					return Promise.reject(getResponseData(responseMsg.ERROR_400, responseMsg.DATABASE_NO_AFFECT_ROWS_ERROR, []));
				}
			}
	}catch (err) {
			return Promise.reject(getResponseData(err.statusCode, err.error, []));  //处理失败响应
	}
}


/*
* PDA 获取基础数据
* */
export const getBasicData = async () => {
		try {
				let response = await getBasicDataDB();
				return Promise.resolve(getResponseData(response.statusCode, '', response.data)); //处理成功的响应
		} catch (err) {
				return Promise.reject(getResponseData(err.statusCode, err.error, {})); //处理失败响应
		}
}

/*
* 备件库供应商退回
* */
export const vendorSpareBackData = async (data) => {
	try {
			if(!data || !data.postHanaData || !data.postMWData){
					return Promise.reject(getResponseData(responseMsg.ERROR_400, responseMsg.POST_DATA_ERROR, {}));
			}
			
			let responseHana = await callMaterialDocument(data.postHanaData);
			if (responseHana && responseHana.data){
				let response = await vendorSpareBackDataDB(data.postMWData, responseHana.data);
				return Promise.resolve(getResponseData(response.statusCode, '', response.data));   //处理成功的响应
			}
			else{
				return Promise.reject(getResponseData(responseMsg.ERROR_400, responseMsg.HANA_MATERIAL_DOCUMENT_ERROR, {}));  //处理失败响应	
			}
	}catch (err) {
			return Promise.reject(getResponseData(err.statusCode, err.error, {}));  //处理失败响应
	}
}

//参数放在url中
export const serialMasterReport = async (query) => {
	try {
		if(!query ){
			return Promise.reject(getResponseData(responseMsg.ERROR_400, responseMsg.POST_DATA_ERROR, {}));
		}
		let all, page, pageSize, start; 
		if(query.all && query.all == 1){
			all = true;
		}
		else{
			all = false;
			page = parseInt(query.pageIndex, 10) || 0;
			pageSize = parseInt(query.pageSize, 10) || 50;
			start = page * pageSize;
		}
		if(!query.sort || query.sort === ''){
			query.sort = 'serial_number';
		}
		if(!query.sortDirection || query.sortDirection === ''){
			query.sortDirection = 'asc';
		}
		let response = await serialMasterReportDB(query, page, pageSize, all);
		return Promise.resolve(getResponseData(response.statusCode, '', response.data));   //处理成功的响应
	
	}catch (err) {
			return Promise.reject(getResponseData(err.statusCode, err.error, {}));  //处理失败响应
	}
}


export const productQualityReport = async(df, dt, wnf, wnt, mnf, mnt, mdf, mdt, rp, type, pg, ps, ex, len, sf, sd) => {
	try {
		const response = await queryProductQualityReport(df, dt, wnf, wnt, mnf, mnt, mdf, mdt, rp, type, pg, ps, ex, len, sf, sd);
		return Promise.resolve(response);
	} catch (error) {
		return Promise.reject(error);
	}
}