import { bulkInsert, query } from '../utils/db';
import {getResponseData} from "../utils/utility";
import {SERIAL_NUMBER_REJECT_DATA} from '../utils/constants';

/*
* 更新数据库操作
* 更新出入库信息记录
* */
export const updateRejectDB = async (items) => {
		try {
				const response = await bulkInsert(SERIAL_NUMBER_REJECT_DATA, items);
				return Promise.resolve(response);
		} catch (error) {
				return Promise.reject(error);
		}
}


//质检统计报表
export const rejectStatReportDataDB = async (data, page, size, all) => {
	let conditions = prepareQueryConditions (data);	
	let searchSQL =  `with query_reject AS (
		SELECT {PERIODCLAUSE} AS period, COUNT(*) as reject_total
		FROM pda_db.serial_number_reject_data 
		{WHERECLAUSE}
		GROUP BY period), 
		query_sn_master AS (
		select  {SNPERIODCLAUSE} AS period, sum(original_work_quantity) as product_total
		from 
		( SELECT work_number, original_work_quantity, create_date
		 FROM pda_db.serial_number_master_data 
		 where original_work_quantity is not null
		 group by work_number ) as a
		 group by period
		 )
		 select *, concat(round(( reject_total/product_total * 100 ),2),'%') as reject_perct from query_reject 
		  join query_sn_master 
		 USING (period)
		order by period  `;

	let subsql = `SELECT serial_number, work_number,
		CONCAT(REPLACE(COALESCE(appearance, ''),'X', '外观 '), 
		REPLACE(COALESCE(hardware, ''),'X', '硬件 '), REPLACE(COALESCE(software,''), 'X', '软件 '), 
		REPLACE(COALESCE(other, ''), 'X', '其它 '), REPLACE(COALESCE(mountings, ''), 'X', '配件 ')) as reject_reason,
		comment 
		FROM pda_db.serial_number_reject_data 
		WHERE {PERIODCLAUSE} = '`
		
	if(data.static_type == 'year'){
		searchSQL = searchSQL.split("{PERIODCLAUSE}").join("YEAR(check_in_time)");
		searchSQL = searchSQL.split("{SNPERIODCLAUSE}").join("YEAR(create_date)");
		subsql = subsql.split("{PERIODCLAUSE}").join("YEAR(check_in_time)");
	}
	else if (data.static_type == 'month'){
		searchSQL = searchSQL.split("{PERIODCLAUSE}").join("concat(YEAR(check_in_time), ' M', MONTH(check_in_time))");
		searchSQL = searchSQL.split("{SNPERIODCLAUSE}").join("concat(YEAR(create_date), ' M', MONTH(create_date))");
		subsql = subsql.split("{PERIODCLAUSE}").join("concat(YEAR(check_in_time), ' M', MONTH(check_in_time))");
	}
	else if (data.static_type == 'quarter'){
		searchSQL = searchSQL.split("{PERIODCLAUSE}").join("concat(YEAR(check_in_time), ' Q', QUARTER(check_in_time))");
		searchSQL = searchSQL.split("{SNPERIODCLAUSE}").join("concat(YEAR(create_date), ' Q', QUARTER(create_date))");
		subsql = subsql.split("{PERIODCLAUSE}").join("concat(YEAR(check_in_time), ' Q', QUARTER(check_in_time))");
	}
	else{
		searchSQL = searchSQL.split("{PERIODCLAUSE}").join("concat(YEAR(check_in_time), ' W', WEEK(check_in_time))");
		searchSQL = searchSQL.split("{SNPERIODCLAUSE}").join("concat(YEAR(create_date), ' W', WEEK(create_date))");
		subsql = subsql.split("{PERIODCLAUSE}").join("concat(YEAR(check_in_time), ' W', WEEK(check_in_time))");
	}
	
	searchSQL = searchSQL.replace('{WHERECLAUSE}', conditions);
	console.log('searchSQL :', searchSQL);
	
	// if (!all) {
	// 	searchSQL = searchSQL + ' limit ' + page * size + ', ' + size;
	// }

    try {
		const response = await query(searchSQL);
		for(let item of response.data) {
			console.log(item.period);
			const subRes = await query(subsql + item.period + `'`);
			item.reject_serials = subRes.data;
		}
        return Promise.resolve(getResponseData(response.statusCode, '', response.data ));
    } catch (error) {
        return Promise.reject({ ...error , data: [] });
    }
}


const prepareQueryConditions = (data) => {
	let condition = '';

	if (data.date_from && data.date_to){
		condition = " WHERE (check_in_time >= '" + data.date_from + "' AND check_in_time <= '" + data.date_to + "')";
	}
	else if (data.date_from || data.date_to){
		let sym = data.date_from? '>=':'<=';
		condition = " WHERE check_in_time " + sym + " '" + (data.date_from? data.date_from:data.date_to)  + "'" ;
	}
	console.log( 'condition: ', condition);
	return condition;
}