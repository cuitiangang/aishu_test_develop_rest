import { excludeEmpty } from '../utils/utility';


//前端post服务字段要和服务字段名称保持一致，以便编写和维护
let getUserDataBaseObject = (user) => {
	return {
			user_id: user.user_name,
			password: user.password,
			update_time: excludeEmpty(user.update_time)
	}
};

module.exports = {
		getUserDataBaseObject
};