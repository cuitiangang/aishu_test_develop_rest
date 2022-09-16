
import {updateGoodsMovementDB, checkSerialHasIssued, insertPurchaseMovementDB, allocateSerialMovementDataDB, issueProductionOrderDataDB , goodsMovementReportDB} from "../persistence/serialMovementDao";
import {getResponseData} from "../utils/utility";
import { getHanaToken } from '../persistence/userDao';
import hanaConfig from '../config/hana';
import request from 'request';
import * as responseMsg from '../utils/response';
import { STATUS_CODES } from "http";

const HANA_SERVICE = hanaConfig.baseurl + "/API_MATERIAL_DOCUMENT_SRV/A_MaterialDocumentHeader";
const HANA_SERVICE_TOKEN_URL = hanaConfig.baseurl + "/API_MATERIAL_DOCUMENT_SRV";

/*
* 上传更新出入库信息
* */
export const updateGoodsMovementData = async (data) => {
		try {
				//校验post数据
				if(!data || data.length == 0){ 
					return Promise.reject(getResponseData(responseMsg.ERROR_400, responseMsg.POST_DATA_ERROR, {}));  //处理失败响应
				}

				//创建物料凭证
				let responseHana = await callMaterialDocument(data.postHanaData);
				if (responseHana && responseHana.data){
					let response = await updateGoodsMovementDB(data.postMWData, responseHana.data);
					return Promise.resolve(getResponseData(response.statusCode, '', {material_document:responseHana.data}));   //处理成功的响应
				}
				else{
					return Promise.reject(getResponseData(responseMsg.ERROR_400, responseMsg.HANA_MATERIAL_DOCUMENT_ERROR, {}));  //处理失败响应	
				}
				
		}catch (err) {
				return Promise.reject(getResponseData(err.statusCode, err.error, {}));  //处理失败响应
		}
}

/*
* 采购入库最后一步，将数据分别写入序列号主数据表、出入库记录表
* */
export const insertPurchaseMovementData = async (data) => {
		try {
				//
				// if(!data.serial_number || !data.material_document_number){ // 校验主键数据是否为空
				// 		return Promise.reject(getResponseData(reponseMsg.ERROR_400, reponseMsg.POST_DATA_ERROR, {}));  //处理失败响应
				// }

				//创建物料凭证
				let responseHana = await callMaterialDocument(data.postHanaData);
				if (responseHana && responseHana.data){
					let response = await insertPurchaseMovementDB(data.postMWData, responseHana.data);
					return Promise.resolve(getResponseData(response.statusCode, '', {material_document:responseHana.data}));   //处理成功的响应
				}
				else{
					return Promise.reject(getResponseData(responseMsg.ERROR_400, responseMsg.HANA_MATERIAL_DOCUMENT_ERROR, {}));  //处理失败响应	
				}
		}catch (err) {
				return Promise.reject(getResponseData(err.statusCode, err.error, {}));  //处理失败响应
		}
}

/*
* 涉及功能：06 调拨入库/出库
* API描述：调拨入库/出库最后一步，需将数据插入出入库表，并更新条码主数据表
* */
export const allocateSerialMovementData = async (data) => {
		try {
			//call hana service
				let responseHana = await callMaterialDocument(data.postHanaData);
				if (responseHana && responseHana.data){
					let response = await allocateSerialMovementDataDB(data.postMWData, responseHana.data);
					return Promise.resolve(getResponseData(response.statusCode, '', {material_document:responseHana.data}));   //处理成功的响应
				}
				else{
					return Promise.reject(getResponseData(responseMsg.ERROR_400, responseMsg.HANA_MATERIAL_DOCUMENT_ERROR, {}));  //处理失败响应	
				}
				

		}catch (err) {
				return Promise.reject(getResponseData(err.statusCode, err.error, {}));  //处理失败响应
		}
}


/*
* 涉及功能：销售出库、退库
* API描述：将数据插入出入库表，并更新条码主数据表
* */
export const salesSerialMovementData = async (data) => {
	try {	
			let response = await allocateSerialMovementDataDB(data, '');
			return Promise.resolve(getResponseData(response.statusCode, '', response.data));   //处理成功的响应
	}catch (err) {
			return Promise.reject(getResponseData(err.statusCode, err.error, {}));  //处理失败响应
	}
}

/*
* 涉及功能：12 工单投料
* API描述：工单投料最后一步，需将数据插入出入库表，并更新条码主数据表 投料标记字段
* */
export const issueProductionOrderData = async (data) => {
	try {
		//检查是否投料过
		const serial_number = data.postMWData.POSerial_number;
		console.log ('检查是否投料过', serial_number);
		let checkResult = await checkSerialHasIssued(serial_number);
		if(checkResult.data.length > 0 && checkResult.data[0].issue_flag === data.postMWData.issue_flag) {
			return Promise.reject(getResponseData(responseMsg.ERROR_400, responseMsg.SERIAL_DUP_ISSUED, {}));  //处理失败响应	
		}

		console.log('(取消)工单投料：issueProductionOrder ', '检查是否投料过完成');
		//未投料过，则继续
		let responseHana = await callMaterialDocument(data.postHanaData);
		if (responseHana && responseHana.data){
			let response = await issueProductionOrderDataDB(data.postMWData, responseHana.data);
			return Promise.resolve(getResponseData(response.statusCode, '',  {material_document:responseHana.data}));   //处理成功的响应
		}
		else{
			return Promise.reject(getResponseData(responseMsg.ERROR_400, responseMsg.HANA_MATERIAL_DOCUMENT_ERROR, {}));  //处理失败响应	
		}
	}catch (err) {
			return Promise.reject(getResponseData(err.statusCode, err.error, {}));  //处理失败响应
	}
}


/*
* 涉及功能：出入库报表
* */
export const goodsMovementReportData = async (query) => {
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
			query.sort = 'a.transfer_time';
		}
		if(!query.sortDirection || query.sortDirection === ''){
			query.sortDirection = 'asc';
		}
		let response = await goodsMovementReportDB(query, page, pageSize, all);
		return Promise.resolve(getResponseData(response.statusCode, '', response.data));   //处理成功的响应
	
	}catch (err) {
			return Promise.reject(getResponseData(err.statusCode, err.error, {}));  //处理失败响应
	}
}

/*
Call hana 创建物料凭证接口
1 fetch CSRF token
2 POST call 
*/
export const callMaterialDocument = async (postHanaData) => {
	try {
		let options = {
			headers: {},
			method: "get",
			json: true
		};
		let resCSRF = await fetchCSRFToken(postHanaData, options);
		if(resCSRF.csrftoken){
			console.log('(取消)工单投料：issueProductionOrder ', '获取xsrf token 完成');
			let resMaterial = await materialDocumentCall(resCSRF.csrftoken, resCSRF.cookie, options);
			console.log('res material d: ',resMaterial.data.MaterialDocument, postHanaData );
			return Promise.resolve(getResponseData(responseMsg.SUCCESS_200, '', resMaterial.data.MaterialDocument));
		}
		else{
			return Promise.reject(getResponseData(responseMsg.ERROR_400, responseMsg.HANA_GENERAL_ERROR, {}));
		}

	}
	 catch (error) {
		return Promise.reject(error);
	}
}

const fetchCSRFToken = async (postHanaData, options) => {
	//basic auth
	const response = await getHanaToken();

	//request
	options.url = HANA_SERVICE_TOKEN_URL ;
	options.headers["Authorization"] = "Basic " + response.data;
	options.headers["x-csrf-token"] = "fetch";
	options.headers["Content-Type"] = "application/json";
	options.method = "GET";
	options.body = postHanaData;

    return new Promise((resolve) => request(options, (e, r) => {
		if (e) {
			console.log ("fetchCSRFToken failed",JSON.stringify(e));
			resolve({ message: "从hana获取信息发生错误", data: {} });
		} else {
			console.log ("fetchCSRFToken success", JSON.stringify(r));
			const csrftoken = r.headers["x-csrf-token"];
			const cookie = r.headers["set-cookie"][1];
			console.log ('res headers: ', r.headers);
			resolve({csrftoken:csrftoken, cookie:cookie});
		}        
	}));
}

const materialDocumentCall = async (csrftoken, cookie, options) => { 
	try{
		options.url = HANA_SERVICE;
		options.method = "POST";
		options.headers["x-csrf-token"] = csrftoken;
		if(cookie){
			options.headers["Cookie"] = cookie;
		}
		
		return new Promise((resolve, reject) => request(options, (e, r, body) => {
			if (e) {
				console.log (e);
				reject(getResponseData(responseMsg.ERROR_400, responseMsg.HANA_GENERAL_ERROR, {}));
			} else {
				if (r.statusCode != 201){
					console.log ('Not 201: ', body, JSON.stringify(options.body));
					var errm = '';
					if(body && body.error && body.error.message.value && body.error.innererror.errordetails){
						if (body.error.innererror.errordetails[0] && body.error.innererror.errordetails[0].message){
							errm = body.error.innererror.errordetails[0].message ;
						}
						else{
							errm = body.error.message.value ;
						}
						reject(getResponseData(responseMsg.ERROR_400, errm, {}));
					}
					else{
						reject(getResponseData(responseMsg.ERROR_400, responseMsg.HANA_CSRF_ERROR, {}));
					}
					
				}
				else{
					if (body && body.d && body.d.__metadata) {
						console.log ('material document n : ', body.d.MaterialDocument, JSON.stringify(options.body));
						resolve(getResponseData(responseMsg.SUCCESS_200, '', body.d));
					} else {
						reject(getResponseData(responseMsg.ERROR_400, responseMsg.HANA_MATERIAL_DOCUMENT_ERROR, {}));
					}
					
				}
			}        
		}));
	}
	catch (error) {
		reject(getResponseData(responseMsg.ERROR_400, responseMsg.HANA_GENERAL_ERROR, {}));
	}
}