import { excludeEmpty } from '../utils/utility';


//前端post服务字段要和服务字段名称保持一致，以便编写和维护
let getSerialNumberDataBaseObject = (data) => {
		return {
				serial_number: data.serial_number,
				material_number: data.material_number,
				factory: excludeEmpty(data.factory),
				location: excludeEmpty(data.location),
				batch_number: excludeEmpty(data.batch_number),
				purchase_order: excludeEmpty(data.purchase_order),
				work_number: excludeEmpty(data.work_number),
				work_date: excludeEmpty(data.work_date),
				check_flag: excludeEmpty(data.check_flag),
				create_person: excludeEmpty(data.create_person),
				create_date: excludeEmpty(data.create_date),
				material_desc: excludeEmpty(data.material_desc),
				release_person: excludeEmpty(data.release_person),
				release_time: excludeEmpty(data.release_time),
				location_type: excludeEmpty(data.location_type),
				issue_flag: excludeEmpty(data.issue_flag)
		}
};

module.exports = {
		getSerialNumberDataBaseObject
};