import { excludeEmpty } from '../utils/utility';


//前端post服务字段要和服务字段名称保持一致，以便编写和维护
let getMovementDataBaseObject = (data) => {
		return {
				serial_number: data.serial_number,
				material_document_number: data.material_document_number,
				material_number: excludeEmpty(data.material_number),
				transfer_date: excludeEmpty(data.transfer_date),
				transfer_type: excludeEmpty(data.transfer_type),
				movement_type: excludeEmpty(data.movement_type),
				location_from: excludeEmpty(data.location_from),
				location_to: excludeEmpty(data.location_to),
				receipt_type: excludeEmpty(data.receipt_type),
				receipt_number: excludeEmpty(data.receipt_number),
				transfer_person: excludeEmpty(data.transfer_person),
				transfer_time: excludeEmpty(data.transfer_time),
				comment: excludeEmpty(data.comment)
		}
};

module.exports = {
		getMovementDataBaseObject
};