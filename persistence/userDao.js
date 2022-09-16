import { insertData, getAllItems, deleteDataByField, updateData, findDataByField, replaceData, query, findDataByPage } from '../utils/db';
import { USER_TABLE_NAME, USER_TOKEN_INFO, FACTORY_STORAGE_INFO } from '../utils/constants';
import { getUserDataBaseObject } from '../model/user';
import { getResponseData } from '../utils/utility';
import * as responseMsg from '../utils/response';


/*
 * 插入token
 * */
let replaceTokenDB = async function(user) {
    try {
        let response = await replaceData(USER_TOKEN_INFO, user); // 插入数据
        return Promise.resolve(getResponseData(response.statusCode, '', {})); //处理成功的返回
    } catch (err) {
        return Promise.reject(getResponseData(err.statusCode, err.error, {})); //处理失败的返回
    }
};

/*
 * 插入token
 * */
let getTokenDB = async function(token) {
    try {
        let response = await query("SELECT * FROM ?? WHERE token = ? ", [USER_TOKEN_INFO, token]); // 插入数据
        return Promise.resolve(getResponseData(response.statusCode, '', {})); //处理成功的返回
    } catch (err) {
        return Promise.reject(getResponseData(responseMsg.ERROR_401, responseMsg.TOKEN_INVALIDATE_ERROR, {})); //处理失败的返回
    }
};

/*
 * 注销
 * */
let removeTokenDB = async function(user_id) {
    try {
        let response = await query("DELETE FROM ?? WHERE user_id = ? ", [USER_TOKEN_INFO, user_id]); // 插入数据
        return Promise.resolve(getResponseData(response.statusCode, '', {})); //处理成功的返回
    } catch (err) {
        return Promise.reject(getResponseData(err.statusCode, err.error, {})); //处理失败的返回
    }
};

/*
 * 执行数据库编辑操作， 获取所有的用户列表
 * */
let getHanaUserInfoDB = async function() {
    try {
        let response = await getAllItems(USER_TABLE_NAME, '*'); // 查询所有数据
        console.log(response);
        return Promise.resolve(getResponseData(response.statusCode, '', response.data)); //处理成功的返回
    } catch (err) {
        return Promise.reject(getResponseData(err.statusCode, err.error, {})); //处理失败的返回
    }
};

/*
 * 执行数据库编辑操作， 更新所有的用户列表
 * */
let updateHanaUserInfoDB = async function(user, id) {
    try {
        let newUserData = getUserDataBaseObject(user); // 获取数据库插入的数据对象
        delete newUserData.user_id; //删除用户id从待更改数据
        let response = await updateData(USER_TABLE_NAME, newUserData, 'user_id', id); // 编辑数据
        return Promise.resolve(getResponseData(response.statusCode, '', response.data)); //处理成功的返回
    } catch (err) {
        return Promise.reject(getResponseData(err.statusCode, err.error, {})); //处理失败的返回
    }
};

const getHanaToken = async () => {
    try {
        const response = await findDataByPage(USER_TABLE_NAME, "*", 0, 1);
        const { user_id, password } = response.data[0];
        const data = new Buffer(user_id + ":" + password).toString("base64");
        return Promise.resolve({ ...response, data });
    } catch (error) {
        return Promise.reject({ ...error });
    }
}



module.exports = {
    replaceTokenDB,
    removeTokenDB,
    getTokenDB,
    getHanaUserInfoDB,
    updateHanaUserInfoDB,
    getHanaToken
};