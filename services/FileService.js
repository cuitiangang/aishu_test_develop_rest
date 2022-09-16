import fs from 'fs';
import { formatDateTime, format8DateTime, getResponseData } from '../utils/utility';
import smbConfig from '../config/smb';
import {checkSerialMasterDataByNoDB,} from "../persistence/serialMasterDataDao";
import { insertBarcodeBulk, deleteBarcodeBulk } from '../persistence/barcodeDao';
import { SUCCESS_201, ERROR_400, FILE_CREATED, FILE_REJECTD, SERIAL_EXISTED, MATERIAL_NUMBER_ERROR, PARAMETER_ERROR, FILE_BAD_CONTENT } from '../utils/response';
const { promisify } = require('util') // available in node v8 onwards
const readdir = promisify(fs.readdir)

const getTimeString = () => {
    const now = new Date;
    const standTime = formatDateTime(now);
    const ms = now.getMilliseconds();
    return standTime.replace(/\-|\ |\:/g, "") + ms.toString();
}

/*
8	当前年份减去2019，如果结果大于10就从A开始计数，到Z后重新以0开始计数
9	月份，10月为A，11月为B，以此类推
10	当前日，10号为A，11号为B，以此类推
11	当前小时，0点开始，24小时制，10点为A，以此类推
*/
const getDateString = () => {
    const converter = {0:"0",1:"1",2:"2",3:"3",4:"4",5:"5",6:"6",7:"7",8:"8",9:"9",10:"A",11:"B",12:"C",13:"D",14:"E",15:"F",16:"G",17:"H",18:"I",19:"G",20:"K",21:"L",22:"M",23:"N",24:"O",25:"P",26:"Q",27:"R",28:"S",29:"T",30:"U",31:"V",32:"W",33:"X",34:"Y",35:"Z"};
    
    const now = new Date;
    const year = now.getFullYear();
    const yearMinus2019 = converter[(year - 2019)%36];
    
    const s = now.getMonth()+1;
    const monthStr = converter[s];

    const days = now.getUTCDate();
    const dayStr = converter[days];

    const hour = now.getHours();
    const hourStr = converter[hour];
    
    const minute = now.getMinutes();
    const minuteStr = ("0" + minute).slice(-2);

    let dateStr = yearMinus2019 + monthStr + dayStr + hourStr + minuteStr;
    
    return dateStr;
}

const getPath = (type, pdaRole) => {
    var path ;
    if (pdaRole === '3'){
        //备件仓与其他路径不同
        path = smbConfig.dev_path + smbConfig["cs_folder_" + type]
    }
    else{
        path = smbConfig.dev_path + smbConfig["folder_" + type]
    }
    return path;   
}

const getContent = (contentArray) => {
    return contentArray.join("\r\n");
}

const getFileName = (type) => {
    return getTimeString() + smbConfig["name_" + type];
}

//check if the target folder is there
async function canReachPrintServer(path) {
    try {                                        
      const foldersInDir = await readdir(path)  
      return true;
      console.log('OK, folders:', foldersInDir)   
    } catch (e) {
      console.log('FAIL reading dir:', e)         
      return false;
    }  
  }

/*生成序列号
位数	取值逻辑
1~7	取物料号的第4、5、10、11、13、  14、15位字符，共7位, 示例数据：MA-AB-AF-60-HZZ
8	当前年份减去2019，如果结果大于10就从A开始计数，到Z后重新以0开始计数
9	月份，10月为A，11月为B，以此类推
10	当前日，10号为A，11号为B，以此类推
11	当前小时，0点开始，24小时制，10点为A，以此类推
12~13	当前分钟，小时计数
14~15	当前工厂的后两位，如5599就是99
16~18   三位流水号，000开始，999结束。 每次打印都从000开始计数，比如某次要打印10个条码，每个条码10张，则从000开始，009结束。
*/
const generateSerial = (material, factory, serial_count) => {
    try{
        //1~7
        const s4 = material.slice(3,5);
        const s10 = material.slice(9,11);
        const s13 = material.slice(12,15);
        //8~13
        const dateStr = getDateString();

        //14~15
        const plantStr = factory.slice(factory.length-2, factory.length);;
        
        let serialArr = [];
        //16~18
        for (let i=0; i< serial_count; i++){
            const sNumber = ("00" + i).slice(-3);
            const serial = s4 + s10 + s13 + dateStr + plantStr + sNumber;
            serialArr.push(serial);
        }
        return serialArr;
    }
    catch (err) {
        return [];
    }
    
}

/* 生成打印文件内容
物料：TEST012
条码数：10个
每个条码：5张
标签类型：1，2，3，4
1：大
2：小
3：软件
4：外箱
number_foreach_serial 打印张数
serial_number_repeat	序列号_标签复打印
*/
const generateFileLines = (type, serialArr, productOldID, material, material_name,number_foreach_serial, outbox_barcode, serial_number_repeat, materialGroupName) => {
    try{
        let lineArry = [];
        console.log('Generate file content, ', type, serialArr, productOldID, material, material_name, number_foreach_serial, serial_number_repeat)
        if (serial_number_repeat && serial_number_repeat.length > 0){
            // 标签复打印
            console.log('serial_number_repeat', serial_number_repeat);
            //开票名称,物料描述,物料号,序列号
            switch (type) {
                //文件中每行的数据为“开票名称,物料描述,物料号”，行数与用户填在屏幕上的“每个标签张数”相等。
                case '1':{
                    const line = productOldID + "," +  material_name + "," +  material + "," + serial_number_repeat;
                    for (let i = 0; i < number_foreach_serial; i++){
                        lineArry.push(line);
                    }
                    break;
                }
                case '2':{
                    //小：物料名称,物料号,序列号
                        const line = material_name + "," +  material + "," +  serial_number_repeat;
                        for (let i = 0; i < number_foreach_serial; i++){
                            lineArry.push(line);
                        }
                    break;
                } 
            }
        }
        else{
            switch (type) {
                //文件中每行的数据为“开票名称,物料描述,物料号”，行数与用户填在屏幕上的“每个标签张数”相等。
                case '3':{
                    const line = productOldID + "," +  material_name + "," +  material;
                    console.log ('lines: ', line);
                    for (let i = 0; i < number_foreach_serial; i++){
                        lineArry.push(line);
                    }
                    break;
                }
                //每行的数据为“开票名称,物料描述,物料号,序列号”，每个序列号的行数与用户填在屏幕上的“每个标签张数”相等。
                case '1':{
                    serialArr.forEach(function(serial) {
                        const line = productOldID + "," + material_name + "," +  material + "," +  serial;
                        for (let i = 0; i < number_foreach_serial; i++){
                            lineArry.push(line);
                        }
                    });
                    break;
                } 
                //小：每行的数据为“开票名称,物料号,序列号”，每个序列号的行数与用户填在屏幕上的“每个标签张数”相等
                case '2':{
                    serialArr.forEach(function(serial) {
                        const line = material_name + "," +  material + "," +  serial;
                        for (let i = 0; i < number_foreach_serial; i++){
                            lineArry.push(line);
                        }
                    });
                    break;
                }
                case '4':{
                    console.log('#### outbox_barcode: ', outbox_barcode);
                    //remove %
                    var sns = outbox_barcode.substr(1);
                    // add , at the end
                    const snCount = sns.split('@').length;
                    for (let i = 0; i < (12 - snCount); i++){
                        sns = sns + ',';
                    }
                    //replace @ as ,
                    sns = sns.replace(/@/g, ',');

                    for (let i = 0; i < number_foreach_serial; i++){
                        const line = outbox_barcode + "," + materialGroupName + "," + material_name + "," +  material + "," + snCount + "," + sns ;
                        lineArry.push(line);
                    }
                    
                    console.log(lineArry);
                    break;
                }
            }
        }
        return lineArry;
    }
    catch(error){
        return [];
    }
}
/*
number_foreach_serial 打印张数
serial_number_repeat	序列号_标签复打印
*/
export const writeFile = async(req, cb) => {
    try{
        //#1 验证request
        const { body: { type, material, material_name, IsBatchManagementRequired, serial_count, factory, user, productOldID, materialGroupName, number_foreach_serial, outbox_barcode, serial_number_repeat, pdaRole} } = req
        if(material.length < 15){
            cb(getResponseData(ERROR_400, MATERIAL_NUMBER_ERROR, {}));
            return;
        }
        if ((type && (type > 4 || type < 1)) || factory.length < 2 || !user || number_foreach_serial <=0 || serial_count > 1000 || (type == 4 && outbox_barcode.length == 0) ) {
            cb(getResponseData(ERROR_400, PARAMETER_ERROR, {}));
            return;
        }

        //verify if print server is available
        const filePath = getPath(type, pdaRole);
        let reachable = await canReachPrintServer(filePath);
        console.log ('reachable: ', filePath, reachable);

        if(!reachable){
            return cb(getResponseData(ERROR_400, FILE_REJECTD, {}));
        }
        else{
            let lines = [];
        
            if (type == 4){
                //外箱，前端传入拼接条码串
                lines = generateFileLines(type, [], productOldID,material, material_name,number_foreach_serial, outbox_barcode, "", materialGroupName);
            }
            else if(serial_number_repeat && serial_number_repeat.length > 0 ){
                //标签复打印
                console.log ('# 标签复打印');
                lines = generateFileLines(type, [], productOldID,material, material_name,number_foreach_serial, "" , serial_number_repeat);
            }
            else {
                //#2 生成序列号
                let serialArr = generateSerial(material, factory, serial_count);
                if (serialArr.length == 0){
                    return cb(getResponseData(ERROR_400, SERIAL_EXISTED, {}));
                }
                console.log ('#2 Generate serial number ', serialArr);
        
                //#3 验证序列号在数据库中是否存在
                try {
                    let response = await checkSerialMasterDataByNoDB(serialArr[0]);
                    return cb(getResponseData(ERROR_400, SERIAL_EXISTED, {}));
                }catch (err) {
                    //序列号再主数据中不存在可继续，保存文件
                };
                console.log ('#3 Verify serial nubmer existed or not  SUCCESS');
        
                //#4 保存序列号到条码主数据中
                let serialData = [];
                var date = new Date();
                const firstday = date.toISOString().slice(0,7).replace(/-/g,"") + '01';
                serialArr.forEach(function(serial) {
                    serialData.push({
                        serial_number:serial,
                        material_number:material,
                        material_desc: material_name,
                        factory:factory,
                        location:"",
                        batch_number: IsBatchManagementRequired? firstday:"",
                        create_person: user,
                        create_date: formatDateTime(new Date()),
                        original_work_quantity: serial_count
                    });
                });
                
                let response = await insertBarcodeBulk(serialData);
                if(response.statusCode >= 400){
                    //插入数据失败
                    console.log('#5 Upload print file failed，Remove added serial data from DB', fileLocation);
                    deleteBarcodeBulk(serialArr);
                    return cb(getResponseData(ERROR_400, FILE_REJECTD, {}));
                }
                else {
                    console.log ('#4 Save serial data to DB SUCCESS');
                    lines = generateFileLines(type, serialArr, productOldID,material, material_name,number_foreach_serial);
                }
            }
        
            //#5 上传打印文件
            const fileLocation = filePath + getFileName(type);
            const contentString = getContent(lines);
            console.log('#5-1 Upload file content ', lines);
            console.log('#5-2 Upload print file to ', fileLocation);
            if(contentString.length == 0){
                return cb(getResponseData(ERROR_400, FILE_REJECTD, {}));
            }
            fs.writeFile(fileLocation, contentString, 'utf8', (error, response) => {
                if (error) {
                    return cb(getResponseData(ERROR_400, FILE_REJECTD, {}));
                }
                else{
                    cb(getResponseData(SUCCESS_201, "", { message: FILE_CREATED }))
                };
            });
        }
    }
    catch(error){
        return cb(getResponseData(ERROR_400, FILE_REJECTD, {}));
    }
}

//工单标签打印
export const uploadLabelFileForWorkOrder = async (req, cb) => {
    try{
        //#1 验证request
        const { body: { type, material, material_name, IsBatchManagementRequired, serial_count, factory, user, productOldID, number_foreach_serial, workNumber, workDate, orderType, work_quantity} } = req
        if ((type && (type > 4 || type < 1)) ||  material.length < 15 || factory.length < 2 || !user || number_foreach_serial <=0 || serial_count > 1000 ) {
            cb(getResponseData(ERROR_400, PARAMETER_ERROR, {}));
            return;
        }

        //verify if print server is available
        //只有产线有该功能 - 工单标签打印
        const filePath = getPath(type, '2');  
        console.log ('reachable: ', filePath);
        let reachable = await canReachPrintServer(filePath);

        if(!reachable){
            return cb(getResponseData(ERROR_400, FILE_REJECTD, {}));
        }
        else{
            let lines = [];

            //#2 生成序列号
            let serialArr = generateSerial(material, factory, serial_count);
            if (serialArr.length == 0){
                return cb(getResponseData(ERROR_400, SERIAL_EXISTED, {}));
            }
            console.log ('#2 Generate serial number SUCCESS');

            //#3 验证序列号在数据库中是否存在
            try {
                let response = await checkSerialMasterDataByNoDB(serialArr[0]);
                return cb(getResponseData(ERROR_400, SERIAL_EXISTED, {}));
            }catch (err) {
                //序列号再主数据中不存在可继续，保存文件
            };
            console.log ('#3 Verify serial number is not in DB  SUCCESS');

            //#4 保存序列号到条码主数据中
            let serialData = [];
            let locationType = (orderType == "ZP03")? "E":"";
            var date = new Date();
            const firstday = date.toISOString().slice(0,7).replace(/-/g,"") + '01';
            serialArr.forEach(function(serial) {
                serialData.push({
                    serial_number: serial,
                    material_number: material,
                    material_desc: material_name,
                    work_date: workDate,
                    work_number: workNumber,
                    factory: factory,
                    location: "TBD",
                    batch_number: IsBatchManagementRequired? firstday:"",
                    create_person: user,
                    create_date: formatDateTime(new Date()), 
                    location_type: locationType,
                    original_work_quantity: work_quantity
                });
            });
            
            let response = await insertBarcodeBulk(serialData);
            if(response.statusCode >= 400){
                //插入数据失败
                return cb(getResponseData(ERROR_400, FILE_REJECTD, {}));
            }
            else {
                console.log ('#4 Add serial master data to DB SUCCESS');
                lines = generateFileLines(type, serialArr, productOldID,material, material_name,number_foreach_serial);
                console.log ('#4 Generate file content: ', lines);
            }

            //#5 上传打印文件
            const fileLocation = filePath + getFileName(type);
            const contentString = getContent(lines);
            console.log('#5-1 Upload file content ', contentString);
            console.log('#5-2 Upload file to ', fileLocation);
            fs.writeFile(fileLocation, contentString, 'utf8', (error, response) => {
                if (error) {
                    //如上传失败，删除已插入的数据
                    console.log('#5 Upload file failed，Remove added serial data from DB', fileLocation);
                    deleteBarcodeBulk(serialArr);
                    return cb(getResponseData(ERROR_400, FILE_REJECTD, {}));
                }
                else{
                    cb(getResponseData(SUCCESS_201, "", { message: FILE_CREATED }));
                }
            });
        }    
    }
    catch(error){
        return cb(getResponseData(ERROR_400, FILE_REJECTD, {}));
    }
}