import request from 'request';
import { insertBarcodeBulk, validateMaterialNo, readMaterialNumber, readBarcodeMasterBulk, readSerialWithMovement,readBarcodeMasterBySerialOrMaterial , readBarcodeMasterBulkWithMovement} from '../persistence/barcodeDao';
import { getResponseData, formatDateTime } from '../utils/utility';
import { getHanaToken } from '../persistence/userDao';
import { MASTER_DATA_QUERY_ID_ERROR } from '../utils/response';

const HANA_SERVICE = "https://my300184-api.saps4hanacloud.cn/sap/opu/odata/sap/YY1_PRODUCT_PDA_NEW_CDS/YY1_Product_PDA_NEW";
const options = {
    headers: {},
    method: "get",
    json: true
};

const subTemp = {
    work_number: "",
    material_desc: "",
    work_date: "",
    check_flag: "",
    create_person: "",
    create_date: "",
    release_person: "",
    release_time: ""
}

export const upload = async (body, create_person, res) => {
    const requests = [];
    const errorCollection = [];
    const barcodeList = [];
    let promise;

    try {
        const response = await getHanaToken();
        options.headers["Authorization"] = "Basic " + response.data;
        options.method = "get";
    } catch (error) {
        return Promise.reject(error);
    }

    body.map(
        (item, index) => {
            const { material_number, factory, location } = item;
            const params = "(Product='" + material_number + "',Language='ZH',StorageLocation='" + location + "',Plant='" + factory + "')";
            options.url = HANA_SERVICE + params;
            promise = new Promise((resolve) => request(options, (e, r, body) => {

                if (e) {
                    resolve({ index, message: "从hana获取信息发生错误", data: {} });
                    errorCollection.push({ index, error: "从hana获取信息发生错误, 请联系管理员" });
                } else {
                    if (r.statusCode > 300 && r.statusCode !== 401 && r.statusCode !== 404) {
                        resolve({ index, message: body.error.message.value, data: {} });
                        errorCollection.push({ index, error: body.error.message.value });
                    } else if (r.statusCode === 401) {
                        resolve({ index, message: "用户锁定，请联系管理员", data: {} });
                        errorCollection.push({ index, error: "从hana获取信息发生错误, 请联系管理员" });
                    } else if (r.statusCode === 404) {
                        resolve({ index, data: {}, message: "导入失败，系统中没有维护对应的物料-工厂-库存地点的关系" });
                        errorCollection.push({ index, error: "导入失败，系统中没有维护对应的物料-工厂-库存地点的关系" });
                    } else if (r.statusCode === 200) {
                        if (body && body.d && body.d.__metadata) {
                            delete body.d.__metadata;
                            resolve({ index, data: body.d, message: "ok" });
                        } else {
                            resolve({ index, message: "hana用户验证失败，请联系管理员", data: {} });
                            errorCollection.push({ index, error: "hana用户验证失败，请联系管理员" });
                        }
                    }
                }
            }));
            requests.push(promise);
        }
    );
    Promise.all(requests).then(
        r => {
            // 请求hana发生错误，返回错误
            if (errorCollection.length) {
                return res.status(400).json(getResponseData(400, errorCollection.sort((a, b) => a.index > b.index), {}));
            }

            // 未发生错误，进行数据(序列化层级)和(批次管理标识)验证
            const items = r.sort((a, b) => a.index > b.index);
            items.map((item) => {
                if (item.data.SerialNoExplicitnessLevel !== "1") {
                    errorCollection.push({ index: item.index, error: "导入失败，模板中含有非序列号管理的物料" });
                }
                if (item.data.IsBatchManagementRequired !== !!body[item.index].batch_number) {
                    errorCollection.push({ index: item.index, error: "导入失败，模板中的批次与物料主数据的批次标识不匹配" });
                }
                // 验证通过，拼接数据
                barcodeList.push({
                    ...body[item.index],
                    ...subTemp,
                    create_person,
                    material_desc: item.data.ProductDescription,
                    create_date: formatDateTime(new Date())
                });
            });
            // 有数据未通过验证
            if (errorCollection.length) {
                return res.status(400).json(getResponseData(400, errorCollection, {}));
            }
            // 所有数据通过验证，保存到数据库并返回结果给前端
            insertBarcodeBulk(barcodeList).then(
                response => res.status(response.statusCode).json(response),
                error => res.status(error.statusCode).json(error)
            );
        }
    );
}

export const validateMaterial = async (sNumbers) => {
    try {
        const serialNumbers = sNumbers.map(number => "'" + number + "'");
        const response = await validateMaterialNo(serialNumbers);
        return Promise.resolve(response);
    } catch (error) {
        return Promise.reject(error);
    }
}

export const getMaterialNumber = async (serialNumber, movementType) => {
    try {
        const sNumber = "'" + serialNumber + "'";
        console.log ('##getMaterialNumber##: ',sNumber, movementType);
        let response;
        if (movementType){
            response = await readSerialWithMovement(sNumber,movementType);
        }
        else{
            response = await readMaterialNumber(sNumber);
        }
         
        return Promise.resolve(response);
    } catch (error) {
        return Promise.reject(error);
    }
}

export const getBarcodeMasterBulk = async (sNumbers, movementType) => {
    console.log ('##getBarcodeMasterBulk##: ',sNumbers, movementType);
    if (!sNumbers.length) {
        return Promise.resolve(getResponseData(400, MASTER_DATA_QUERY_ID_ERROR, {}));
    }
    try {
        const serialNumbers = sNumbers.map(number => "'" + number + "'");
        if (movementType){
            const response = await readBarcodeMasterBulkWithMovement(serialNumbers, movementType);
            return Promise.resolve(response);
        }
        else{
            const response = await readBarcodeMasterBulk(serialNumbers);
            return Promise.resolve(response);
        }
    } catch (error) {
        return Promise.reject(error);
    }
}

export const getBarcodeMasterBySerialOrMaterial = async (serial, material) => {
    if (!serial && !material) {
        return Promise.resolve(getResponseData(400, MASTER_DATA_QUERY_ID_ERROR, {}));
    }
    try {
        const response = await readBarcodeMasterBySerialOrMaterial(serial, material);
        return Promise.resolve(response);
    } catch (error) {
        return Promise.reject(error);
    }
}