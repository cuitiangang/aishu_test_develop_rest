import {getResponseData} from "../utils/utility";
import * as contants from '../utils/constants';
import * as responseMsg from '../utils/response';
const tokenConfig = require("../config/token");
import {replaceTokenDB, removeTokenDB, getTokenDB } from '../persistence/userDao';

/*
* 验证token是否过期
* */
const expire = (token) => {
    const expire = getExpire(token);
    const now = (+new Date / 1000).toFixed(0);
    const expired = now - expire > +tokenConfig.expire;
    return expired;
}
/*
* 获取过期时间
* */
const getExpire = (token) => {
    const tokenStr = new Buffer(token, "base64").toString();
    const tokenArray = tokenStr.split(".");
    return +tokenArray[1] + +tokenArray[2] + tokenConfig.random;
}
/*
* 每次登陆生成一个新的token并覆盖原有的token
* */
export const generateToken = async (userid, type) => {
    const randomNumber = Math.floor(Math.random() * 10000);
    const timeStamp = (+new Date / 1000).toFixed(0);
    const expire = timeStamp - randomNumber;
    const baseString = userid + "." + expire + "." + (randomNumber - tokenConfig.random);
    const token = new Buffer(baseString).toString("base64");
    try {
		    await replaceTokenDB({user_id:userid, token: token, expire: expire, type: type});
		    return Promise.resolve(token);
		    
    }catch (e) {
		    return Promise.reject(false);
    }
}

/*
* 验证token是否存在
* 如果web端登陆，需要额外验证token是否在有效期内
* PDA不需要验证
* */
export const tokenValidation = async (token, type) => {
		try {
				if(!token){
						return Promise.reject(getResponseData(responseMsg.ERROR_401, responseMsg.TOKEN_INVALIDATE_ERROR, ''));  //处理失败响应
				}
				let response = await getTokenDB(token);
				switch (type) {
            case contants.WEB:
		            if (expire(token)) {
				            return Promise.reject(getResponseData(responseMsg.ERROR_401, responseMsg.TOKEN_INVALIDATE_ERROR, ''));
		            }
                break;
				}
				return Promise.resolve(response);
		}catch (e) {
				return Promise.reject(e);
		}
}
/*
* 注销操作需要删除token。
* */
export const removeToken = async (user_id) => {
		try {
				let response = await removeTokenDB(user_id);
				return Promise.resolve(response);
		}catch (e) {
				return Promise.reject(e);
		}
}