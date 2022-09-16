import { SUCCESS_200, ERROR_401, USER_AUTH_DOMAIN_ERROR, ERROR_400 } from '../utils/response';
import AD from 'activedirectory';
import { generateToken, removeToken } from './JWTService';

import adConfig from '../config/ad';
import pdaConfig from '../config/hana';
import { getResponseData, formatDateTime, aesEncrypt } from "../utils/utility";
import * as responseMsg from "../utils/response";
import { getHanaUserInfoDB, updateHanaUserInfoDB } from "../persistence/userDao";
import * as contants from '../utils/constants';

/*
 * 配置域服务器信息
 * */
const ad = new AD(adConfig);

/*
 * 用户登录，针对web和pda设备
 * web端 type：web
 * pad： type: pda
 * area_id: 1 总仓 2 产线 3 备件仓
 * */
export const login = async (user, type) => {
    return new Promise((resolve, reject) => {
        if (!user.user_id || !user.password) {
            reject(getResponseData(ERROR_400, responseMsg.USER_NAME_ERROR, {}));
        } else {
            ad.authenticate("aishu\\" + user.user_id, user.password, (err, auth) => {
                if (err || !auth) {
                    reject(getResponseData(ERROR_401, USER_AUTH_DOMAIN_ERROR, {}));
                } else {
                    ad.findUser(user.user_id, async (err, domainUser) => {
                        if (err || !domainUser) {
                            reject(getResponseData(ERROR_401, USER_AUTH_DOMAIN_ERROR, {}));
                        } else {
                            var data = {};
                            if (type == contants.WEB){
                                data = {
                                    area_id: domainUser.pdawebrole1 
                                };
                            }
                            else{
                                data = {
                                    area_id: domainUser.PDARole 
                                };
                            }
                            data.token = await generateToken(user.user_id, type);
                            resolve(getResponseData(SUCCESS_200, '', data));
                        }
                    });
                }
            });
        }
    });
}
/*
 * 注销操作，用于web端和pda设备
 * 注销成功，清除数据库中的token信息
 * */
export const logout = async (user) => {
    const user_id = user.user_id;
    if (!user_id) {
        return Promise.reject(getResponseData(responseMsg.ERROR_400, responseMsg.USER_ID_ERROR, {}));
    }
    try {
        await removeToken(user_id);
        return Promise.resolve(getResponseData(responseMsg.SUCCESS_200, responseMsg.LOGOUT_SUCCESS, {}));
    } catch (e) {
        return Promise.reject(getResponseData(responseMsg.ERROR_400, e.error, {}));
    }


}

/*
 * 查询Hana Cloud用户信息（用户名密码）
 * Made By Richard
 * */
export const getHanaUserInfo = async () => {

    try {
        let response = await getHanaUserInfoDB();
        let encryptData = aesEncrypt(JSON.stringify(response.data));
        return Promise.resolve(getResponseData(response.statusCode, '', { hanaUser: encryptData })); //处理成功的响应
    } catch (err) {
        console.log(err);
        return Promise.reject(getResponseData(err.statusCode, err.error, {})); //处理失败响应
    }
}

/*
 * 查询Hana Cloud用户信息（用户名密码）
 * 未加密
 * */
export const getPDAHanaUserInfo = async () => {

    try {
        let response = await getHanaUserInfoDB();
        let version = parseInt(pdaConfig.pdaVersion);
        if (response.data.length > 0) {
            return Promise.resolve(getResponseData(response.statusCode, '', { hanaUser: response.data[0], pdaVersion: version })); //处理成功的响应
        } else {
            return Promise.reject(getResponseData(err.statusCode, err.error, {})); //处理失败响应
        }
    } catch (err) {
        console.log(err);
        return Promise.reject(getResponseData(err.statusCode, err.error, {})); //处理失败响应
    }
}

/*
 * 更新Hana Cloud用户信息（用户名密码）
 * Made By Richard
 * */
export const updateHanaUserInfo = async (user) => {
    if (!user.user_id || !user.password) { //校验用户名密码是否为空
        return Promise.reject(getResponseData(responseMsg.ERROR_400, responseMsg.USER_AUTH_ERROR, {})); //如果空，reject数据
    }
    try {
        user.update_time = formatDateTime(new Date());
        let response = await updateHanaUserInfoDB(user, user.user_id);
        return Promise.resolve(getResponseData(response.statusCode, '', response.data)); //处理成功的响应
    } catch (err) {
        return Promise.reject(getResponseData(err.statusCode, err.error, {})); //处理失败响应
    }
}
