import { bulkInsert, bulkQuery, query } from '../utils/db';
import {getResponseData} from '../utils/utility';
import * as responseMsg from '../utils/response';
import { SERIAL_NUMBER_MASTER_DATA, SERIAL_NUMBER_GOODS_MOVEMENT } from '../utils/constants';
import { MASTER_NOT_FULL_MATCHED, ERROR_400 } from '../utils/response';

export const insertBarcodeBulk = async (items) => {
    try {
        const response = await bulkInsert(SERIAL_NUMBER_MASTER_DATA, items);
        return Promise.resolve({ ...response });
    } catch (error) {
        return Promise.reject({ ...error });
    }
}

//根据序列号批量删除条码主数据
export const deleteBarcodeBulk = async (items) => {
    try {
        let sql = "DELETE FROM " + SERIAL_NUMBER_MASTER_DATA + " WHERE serial_number in ('" + items.join("','") + "')";
		console.log(sql);
        const response = await query(sql); 
        return Promise.resolve({ ...response });
    } catch (error) {
        return Promise.reject({ ...error });
    }
}

export const validateMaterialNo = async (sNumbers) => {
    const conditions = "serial_number in (" + sNumbers.join(",") + ");";
    const targetFields = ["material_number"];
    try {
        const response = await bulkQuery(SERIAL_NUMBER_MASTER_DATA, targetFields, conditions);
        return Promise.resolve({ ...response, data: { exist: true } });
    } catch (error) {
        if (error.statusCode === 400) {
            return Promise.reject({ ...error, data: { exist: false }, statusCode: 200, error: "" });
        }
        return Promise.reject({ ...error, data: {} });
    }
}

export const readMaterialNumber = async (serialNumber) => {
    const conditionString = " serial_number= " + serialNumber;
    const targetFields = ["material_number", "location", "serial_number", "batch_number"];
    try {
        const response = await bulkQuery(SERIAL_NUMBER_MASTER_DATA, targetFields, conditionString);
        return Promise.resolve({ ...response });
    } catch (error) {
        return Promise.reject({ ...error , data: [] });
    }
}


export const readSerialWithMovement = async (serialNumber, movementType) => {
    const conditionString = " serial_number= " + serialNumber;
    const targetFields = ["material_number", "location", "serial_number", "batch_number"];

    const gmConditionString = "movement_type = '" + movementType + "'";
    const gmConditionStringC = movementTypeCancelCondition(movementType);
    const sqlGM = `SELECT SUM(CASE WHEN ` + gmConditionString + `THEN 1 ELSE 0 END) feed, 
    SUM(CASE WHEN ` + gmConditionStringC + ` THEN 1 ELSE 0 END) cancel_feed 
    FROM ` + SERIAL_NUMBER_GOODS_MOVEMENT + ` WHERE ` + conditionString;
    
    try {       
        const responseGM = await query(sqlGM);
        let has_movement_record = hasMovementTypeRecords(responseGM);
        let response = await bulkQuery(SERIAL_NUMBER_MASTER_DATA, targetFields, conditionString);
        if (response && response.data && response.data.length > 0 ){
            response.data[0].has_movement_record = has_movement_record;
        }
        return Promise.resolve({ ...response });
    } catch (error) {
        return Promise.reject({ ...error , data: [] });
    }
}

export const readBarcodeMasterBulkWithMovement = async (sNumbers, movementType) => {
    try {    
        const gmConditionString = "movement_type = '" + movementType + "'";
        const gmConditionStringC = movementTypeCancelCondition(movementType);
        let arr = [];

        for(let serial_number of sNumbers) {
            const conditionString = "serial_number = " + serial_number ;
            const sqlGM = `SELECT SUM(CASE WHEN ` + gmConditionString + `THEN 1 ELSE 0 END) feed, 
            SUM(CASE WHEN ` + gmConditionStringC + ` THEN 1 ELSE 0 END) cancel_feed 
            FROM ` + SERIAL_NUMBER_GOODS_MOVEMENT + ` WHERE ` + conditionString;

            const responseGM = await query(sqlGM);
            let has_movement_record = hasMovementTypeRecords(responseGM);
            
            const targetFields = [
                "serial_number",
                "material_number",
                "factory",
                "location",
                "batch_number",
                "purchase_order",
                "work_number",
                "work_date",
                "check_flag", 
                "issue_flag"
            ];
            let response = await bulkQuery(SERIAL_NUMBER_MASTER_DATA, targetFields, conditionString);
            if (response && response.data && response.data.length > 0 ){
                response.data[0].has_movement_record = has_movement_record;
                arr.push(response.data[0]);
            }
        }
        if (arr.length === sNumbers.length) {
            return Promise.resolve(getResponseData(responseMsg.SUCCESS_200, '',  {contents:arr}));
        } else {
            return Promise.resolve(getResponseData(responseMsg.ERROR_400, MASTER_NOT_FULL_MATCHED, {data: {contents:[]}} ));
        }
    } catch (error) {
        return Promise.reject({ ...error, data: {} });
    }
}

export const readBarcodeMasterBulk = async (sNumbers) => {
    const conditions = "serial_number in (" + sNumbers.join(",") + ");";
    const targetFields = [
        "serial_number",
        "material_number",
        "factory",
        "location",
        "batch_number",
        "purchase_order",
        "work_number",
        "work_date",
        "check_flag", 
        "issue_flag"
    ];
    try {
        const response = await bulkQuery(SERIAL_NUMBER_MASTER_DATA, targetFields, conditions);
        const { data } = response
        if (data.length === sNumbers.length) {
            return Promise.resolve({ ...response, data: { contents: data } });
        } else {
            return Promise.resolve({ ...response, statusCode: ERROR_400, data: { contents: [] }, error: MASTER_NOT_FULL_MATCHED });
        }
    } catch (error) {
        return Promise.reject({ ...error, data: {} });
    }
}

export const readBarcodeMasterBySerialOrMaterial = async (serial, material) => {
    const serialQuery = serial ? "serial_number like '%" + serial + "%'" : "";
    const materialQuery = material ? "material_number like '%" + material + "%'" : "";
    let conditions = serialQuery;;
    if (conditions) {
        conditions = materialQuery ? conditions + " or " + materialQuery : conditions;
    } else {
        conditions = materialQuery;
    }

    const targetFields = [
        "serial_number",
        "material_number",
        "material_desc"
    ];
    try {
        const response = await bulkQuery(SERIAL_NUMBER_MASTER_DATA, targetFields, conditions);
        console.log(response);
        return Promise.resolve({ ...response });
    } catch (error) {
        return Promise.reject({ ...error, data: {} });
    }
}

const movementTypeCancelCondition = (movement_type) => {
    let gmConditionStringC = '';
    switch (movement_type) {
        case '261':{
            gmConditionStringC = "movement_type = '262' "; 
            break;
        }
        case '262':{
            gmConditionStringC = "movement_type = '261' "; 
            break;
        }
        case '601':{
            gmConditionStringC = "movement_type = '602' "; 
            break;
        }
        case '602':{
            gmConditionStringC = "movement_type = '601' "; 
            break;
        }
    }
    console.log ('movementTypeCancelCondition: ',gmConditionStringC );
    return gmConditionStringC;
}

const hasMovementTypeRecords = (movement_response) =>{
    if(movement_response && movement_response.data && movement_response.data.length > 0){
        let result = movement_response.data[0];
        var feed = parseInt(result.feed);
        var cancel_feed = parseInt(result.cancel_feed);
        console.log('hasMovementTypeRecords : ', feed, cancel_feed);
        if (result && (feed > cancel_feed) ){
            return true;
        }
    }
    return false;
}