
import {updateRejectDB, rejectStatReportDataDB} from "../persistence/serialRejectDao";
import {getResponseData} from "../utils/utility";
import * as reponseMsg from '../utils/response';

/*
* 上传更新出入库信息
* */
export const updateRejectData = async (data) => {
		try {
				// if(data.length > 0){
				// 		return Promise.reject(getResponseData(reponseMsg.ERROR_400, reponseMsg.POST_DATA_ERROR, {}));  //处理失败响应
				// }
				let response = await updateRejectDB(data);
				return Promise.resolve(getResponseData(response.statusCode, '', response.data));   //处理成功的响应
		}catch (err) {
				return Promise.reject(getResponseData(err.statusCode, err.error, {}));  //处理失败响应
		}
}

/*
* 涉及功能：出入库报表
* */
export const rejectStatReportData = async (query) => {
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
			if(query.pageIndex && query.pageSize){
				page = parseInt(query.pageIndex, 10);
				pageSize = parseInt(query.pageSize, 10) 
			}
			else{
				page = 0;
				pageSize = 50;
			} 
			start = page * pageSize;
		}
		let response = await rejectStatReportDataDB(query, page, pageSize, all);
		return Promise.resolve(getResponseData(response.statusCode, '', response.data));   //处理成功的响应
	
	}catch (err) {
			return Promise.reject(getResponseData(err.statusCode, err.error, {}));  //处理失败响应
	}
}