require("dotenv").config();
import dateFormat from 'dateformat';
import crypto from 'crypto';
const encryptConfig = require("../config/encrypt");
/*
* 获取运行环境
* 可选为prd 或者 dev
* */
let getEnv = function() {
	return process.env.NODE_ENV;
}

/*
* 检测字段是否存在，否则返回''
* */
let excludeEmpty = (originValue) => {
	return originValue ? originValue : '';
}


/*
* 格式化日期类型
* 说明：日期格式使用 yyyymmdd
* 禁止单独编写日期格式脚本
* */
let format8DateTime = (dateStr, format) => {
	let formatStr = format ? format : 'yyyymmdd';
	return dateFormat(dateStr, formatStr);
}

/*
* 格式化日期类型
* 说明：日期格式使用 yyyy-mm-dd
* 禁止单独编写日期格式脚本
* */
let formatDateTime = (dateStr, format) => {
		let formatStr = format ? format : 'yyyy-mm-dd HH:MM:ss';
		return dateFormat(dateStr, formatStr);
}

/*
* 统一定义所有返回格式数据结构
* */
let getResponseData = (statusCode, error, data) => {
		return {
				statusCode: statusCode,
				error: error,
				data: data
		}
}

let aesEncrypt = (data) => {
		let clearEncoding = 'utf8';
		let cipherEncoding = 'base64';
		let cipherChunks = [];
		let cipher = crypto.createCipheriv('aes-256-ecb', encryptConfig.encryptKey, '');
		cipher.setAutoPadding(true);
		cipherChunks.push(cipher.update(data, clearEncoding, cipherEncoding));
		cipherChunks.push(cipher.final(cipherEncoding));
		return cipherChunks.join('');
}

/*
* 如果返回对象，需要JSON.parse()转换
* */
let aesDecrypt = (encrypted) => {
		const decipher = crypto.createDecipher('aes-256-ecb', encryptConfig.encryptKey);
		let decrypted = decipher.update(encrypted, 'hex', 'utf8');
		decrypted += decipher.final('utf8');
		return decrypted;
}

module.exports = {
		getEnv,
		excludeEmpty,
		aesEncrypt,
		aesDecrypt,
		getResponseData,
		formatDateTime
};