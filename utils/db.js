const allConfig = require("../config/db");
const mysql = require("mysql");
import { getEnv } from './utility'
import _ from 'lodash';
const env = getEnv();
const dbConfig = allConfig[env];
import { getResponseData } from '../utils/utility';
import * as responseMsg from './response';
import { infoLogger } from '../utils/logger';

const pool = mysql.createPool({
    host: dbConfig.host,
    user: dbConfig.user,
    password: dbConfig.password,
    database: dbConfig.database,
    //20211117 add by ctg
    //关于node链接数据库Handshake inactivity timeout
    //test database need 设置超时时间解决握手不活动超时问题
    connectionLimit: 1000,
    connectTimeout: 60 * 60 * 1000,
    acquireTimeout: 60 * 60 * 1000,
    timeout: 60 * 60 * 1000,
});

let query = function(sql, values) {
    console.log(values,"values");
    console.log('------------sql执行语句------------\n' + sql);
    return new Promise((resolve, reject) => {
        pool.getConnection(function(err, connection) {
            if (err) {
                console.log('------------连接------ 失败\n' + err);
		            pool.releaseConnection(connection);
                reject(getResponseData(responseMsg.ERROR_400, err.toString(), ''));
            } else {
                connection.query(sql, values, (err, rows) => {
 		pool.releaseConnection(connection);
                    if (err) {
                        console.log('------------sql执行语句------ 失败\n' + err);
                        reject(getResponseData(responseMsg.ERROR_400, err.toString(), ''));
                    } else {
                        if (!rows || rows.length === 0 || rows.affectedRows === 0) {
                            console.log('------------sql执行语句------ 失败\n' + err);
                            reject(getResponseData(responseMsg.ERROR_400, responseMsg.DATABASE_NO_AFFECT_ROWS_ERROR, ''));
                        } else {
                            console.log('------------sql执行语句------ 成功\n' + rows);
                            resolve(getResponseData(responseMsg.SUCCESS_200, '', rows));
                        }

                    }
		               
                })
            }
        })
    })

};


/*
 * 对单个sql语句执行更新操作
 *
 * */
let executeQueryAction = (connection, sql, values) => {
    return new Promise((resolve, reject) => {
        console.log(sql, values);
        connection.query(sql, values, (err, rows) => {
            if (err) {
                console.log('------------事务sql执行------ 失败\n' + err);
                //插入错误，执行回滚操作
                connection.rollback(function() {
                    reject(false);
                });
            } else {
                if (!rows || rows.length === 0 || rows.affectedRows === 0) {
                    reject(false);
                } else {
                    resolve(true);
                }
            }
        })
    });
}

/*
 * [{sql, values}]
 * 不限表数量，多张表事务操作处理
 * */
let transactionQuery = function(sqlList) {
    console.log('------------事务sql执行语句------------\n');
    return new Promise((resolve, reject) => {
        pool.getConnection(function(err, connection) {
            if (err) {
                console.log('------------连接------ 失败\n' + err);
		            pool.releaseConnection(connection);
                reject(getResponseData(responseMsg.ERROR_400, err.toString(), ''));
            } else {
                connection.beginTransaction(async function(err) { //开始事务
                    if (err) {
                        console.log('------------事务开始------ 失败\n' + err);
                        reject(getResponseData(responseMsg.ERROR_400, err.toString(), ''));
                    }

                    let success = false;
                    let error = null;
                    for (let i = 0; i <= sqlList.length; i++) { //遍历需要执行的表以及数据
                        const sqlItem = sqlList[i];
                        try {
                            await executeQueryAction(connection, sqlItem.sql, sqlItem.values); //执行sql语句更新
                            if (i === sqlList.length - 1) { //如果最后一张表数据更新完成，则所有更新成功
                                success = true; //记录结果
                            }
                        } catch (e) {
                            error = e; //一旦有数据更新失败，执行异常，终止所有更新操作，记录失败结果
                            break;
                        }
                    }
                    if (!success) {
                        console.log('整体事务执行失败');
                        connection.commit(function(err) { //对于事务性操作，最终需要总体commit
                            connection.rollback(function() { // commit失败，整体回滚
		                            pool.releaseConnection(connection);
                                reject(getResponseData(responseMsg.ERROR_400, error.toString(), ''));
                            });
		                        
                        });
                    } else {
                        connection.commit(function(err) { //对于事务性操作，最终需要总体commit
                            if (err) {
                                connection.rollback(function() { // commit失败，整体回滚
		                                pool.releaseConnection(connection);
                                    reject(getResponseData(responseMsg.ERROR_400, err.toString(), ''));
                                });
                            }else{
		                            pool.releaseConnection(connection);
		                            resolve(getResponseData(responseMsg.SUCCESS_200, '', {}));
                            }
                        });
                    }
                });
            }
        })
    })

};


let findDataById = function(table, id) {
    let _sql = "SELECT * FROM ?? WHERE id = ? "
    return query(_sql, [table, id, start, end])
};

let findDataByField = function(table, field, value) {
    let _sql = "SELECT * FROM ?? WHERE ? = ? "
    return query(_sql, [table, field, value])
};


let findDataByPage = function(table, keys, start, end) {
    let _sql = "SELECT ?? FROM ??  LIMIT ? , ?"
    return query(_sql, [keys, table, start, end])
};

let insertData = function(table, values) {
    let _sql = "INSERT INTO ?? SET ?"
    return query(_sql, [table, values])
};


let updateData = function(table, values, primaryKey, id) {
    let _sql = "UPDATE ?? SET ? WHERE ?? = ?"
    return query(_sql, [table, values, primaryKey, id])
};

let replaceData = function(table, values) {
    let _sql = "replace into ?? SET ?";
    return query(_sql, [table, values])
};

let deleteDataById = function(table, id) {
    let _sql = "DELETE FROM ?? WHERE id = ?"
    return query(_sql, [table, id])
};

let deleteDataByField = function(table, value) {
    let _sql = "DELETE FROM ?? WHERE user_id = ?"
    return query(_sql, [table, value])
};


let getAllItems = function(table, keys) {
    let _sql = "SELECT ?? FROM ?? "
    return query(_sql, [keys, table])
};

let count = function(table) {
    let _sql = "SELECT COUNT(*) AS total_count FROM ?? "
    return query(_sql, [table])
};


/*
 * 单张表批量插入功能
 * */
const bulkInsert = (table, values) => {
    const res = getTransactionDataSqlData(values);
    return query(res.sql, [table, res.valuesArray]);
}

/*
 * 通用方法，遍历数据中的key, 以及对应的value，返回对象，
 * 执行下一步批量插入操作，values示例：
 *
 * [{key: value, key1: value1}]
 * */
const getTransactionDataSqlData = (values) => {
    let fieldsKey = [];
    let valuesArray = [];
    if (values.length > 0) {
        _.forEach(values, function(item, index) {
            let valuesItem = [];
            _.forEach(item, function(value, key) {
                if (index === 0) {
                    fieldsKey.push(key);
                }
                valuesItem.push(value);
            });
            valuesArray.push(valuesItem);
        });
    }
    fieldsKey = fieldsKey.join(', ');
    console.log (fieldsKey);
    return { sql: "INSERT INTO ?? (" + fieldsKey + ") VALUES ?", valuesArray: valuesArray };
}

const getTransactionInsertArray = (transactionInsertData) => {
    let transactionArray = [];
    console.log (transactionInsertData);
    transactionInsertData.forEach((dataItem) => {
        let item = {};
        let res = getTransactionDataSqlData(dataItem.values);
        item.sql = res.sql;
        item.values = [dataItem.table, res.valuesArray];
        transactionArray.push(item);
    });
    return transactionArray;
}

/*
* 事务操作，多张表的插入更新
* 如果单一一张表数据插入失败，则所有数据回滚操作，总体执行失败，保持数据统一
* 如下方法传入参数 transactionInsertData， 示例如下：
* [{
						table: SERIAL_NUMBER_GOODS_MOVEMENT,
						values:[{
								serial_number: '123',
								material_document_number:'345'
						}]
				},{
						table: SERIAL_NUMBER_MASTER_DATA,
						values:[{
								serial_number:'1231245',
								material_number:'12341234556',
								factory:'asdf',
								location:'asdf'
						}]
				}]
* */
const transactionBulkInsert = (transactionInsertData) => {
    return transactionQuery(getTransactionInsertArray(transactionInsertData));
}

const getTransactionUpdateArray = (transactionUpdateData) => {
    let transactionArray = [];
    transactionUpdateData.forEach((dataItem) => {
        let item = {};
        item.values = [dataItem.table, dataItem.values];
        item.sql = "UPDATE ?? SET ? WHERE ?? = ?";
        item.values.push(dataItem.conditions[0].key);
        item.values.push(dataItem.conditions[0].value);
        for (let i = 1; i < dataItem.conditions.length; i++) {
            item.sql = item.sql + ' and ?? = ?';
            item.values.push(dataItem.conditions[i].key);
            item.values.push(dataItem.conditions[i].value);
        }
        transactionArray.push(item);
    });
    return transactionArray
}


/*
* 事务操作，多张表的更新
* 如果单一一张表数据更新失败，则所有数据回滚操作，总体执行失败，保持数据统一
* 如下方法传入参数 transactionUpdateData， 示例如下：
* [{
						table: SERIAL_NUMBER_GOODS_MOVEMENT,
						values:{
								serial_number: '123',
								material_document_number:'345'
						},
						conditions:[
						    {
						    key: key,
						    value: value,
						    }
						]
				},{
						table: SERIAL_NUMBER_MASTER_DATA,
						values:{
								serial_number:'1231245',
								material_number:'12341234556',
								factory:'asdf',
								location:'asdf'
						},
						conditions:[
						    {
						    key: key,
						    value: value,
						    }
						]
				}]
* */

const transactionBulkUpdate = (transactionUpdateData) => {
    return transactionQuery(getTransactionUpdateArray(transactionUpdateData));
}

/*
* 事务操作，多张表更新外加多张表插入
* 如果单一一张表数据更新或者插入失败，则所有数据回滚操作，总体执行失败，保持数据统一
* 如下方法传入参数 bulkUpdateData， 示例如下：
* [{
						table: SERIAL_NUMBER_GOODS_MOVEMENT,
						values:{
								serial_number: '123',
								material_document_number:'345'
						},
						conditions:[
						    {
						    key: key,
						    value: value,
						    }
						]
				},{
						table: SERIAL_NUMBER_MASTER_DATA,
						values:{
								serial_number:'1231245',
								material_number:'12341234556',
								factory:'asdf',
								location:'asdf'
						},
						conditions:[
						    {
						    key: key,
						    value: value,
						    }
						]
				}]
*
* * bulkInsertData， 示例如下：
* [{
						table: SERIAL_NUMBER_GOODS_MOVEMENT,
						values:[{
								serial_number: '123',
								material_document_number:'345'
						}]
				},{
						table: SERIAL_NUMBER_MASTER_DATA,
						values:[{
								serial_number:'1231245',
								material_number:'12341234556',
								factory:'asdf',
								location:'asdf'
						}]
				}]
* */
const transactionBulkInsertAndUpdate = (bulkInsertData, bulkUpdateData) => {
    return transactionQuery([...getTransactionInsertArray(bulkInsertData), ...getTransactionUpdateArray(bulkUpdateData)]);
}

const bulkQuery = (table, fields, conditions) => {
    const _sql = "SELECT ?? FROM ?? WHERE " + conditions;
    return query(_sql, [fields, table])
}

/*
  replace into 批量处理
*/
const transactionBulkInsertReplaceAndUpdate = (bulkInsertData,bulkReplaceData,bulkUpdateData) => {
    console.log ('transactionBulkInsertReplaceAndUpdate');
    return transactionQuery([...getTransactionInsertArray(bulkInsertData), ...getTransactionReplaceArray(bulkReplaceData), ...getTransactionUpdateArray(bulkUpdateData)]);
}


/*
 * 通用方法，遍历数据中的key, 以及对应的value，返回对象，
 * 执行下一步批量插入操作，values示例：
 *
 * [{key: value, key1: value1}]
 * */
const getTransactionDataReplaceSqlData = (values) => {
    let fieldsKey = [];
    let valuesArray = [];
    if (values.length > 0) {
        _.forEach(values, function(item, index) {
            let valuesItem = [];
            _.forEach(item, function(value, key) {
                if (index === 0) {
                    fieldsKey.push(key);
                }
                valuesItem.push(value);
            });
            valuesArray.push(valuesItem);
        });
    }
    fieldsKey = fieldsKey.join(', ');
    return { sql: "REPLACE INTO ?? (" + fieldsKey + ") VALUES ?", valuesArray: valuesArray };
}

const getTransactionReplaceArray = (transactionReplaceData) => {
    let transactionArray = [];
    transactionReplaceData.forEach((dataItem) => {
        let item = {};
        let res = getTransactionDataReplaceSqlData(dataItem.values);
        item.sql = res.sql;
        item.values = [dataItem.table, res.valuesArray];
        transactionArray.push(item);
    });
    return transactionArray;
}

module.exports = {
    query,
    replaceData,
    findDataById,
    findDataByPage,
    deleteDataById,
    insertData,
    updateData,
    getAllItems,
    deleteDataByField,
    findDataByField,
    count,
    transactionBulkInsert,
    transactionQuery,
    transactionBulkUpdate,
    transactionBulkInsertAndUpdate,
    transactionBulkInsertReplaceAndUpdate,
    bulkInsert,
    bulkQuery
};


