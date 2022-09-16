import Express from "express";
import { upload, validateMaterial, getMaterialNumber, getBarcodeMasterBulk, getBarcodeMasterBySerialOrMaterial } from "../services/shapeCodeService";
import { tokenValidation } from '../services/JWTService';
import * as CONSTANTS from '../utils/constants';
const router = Express.Router();

// Web_Excel条形码批量上传
router.post("/", async (req, res, next) => {
    try {
        const { headers: { token, type, user_id }, body } = req;
        await tokenValidation(token, type);
        await upload(body, user_id, res);
    } catch (error) {
        next(error);
    }
});

// PDA_21_根据序列号查询是否存在对应物料号，支持批量查询
router.post("/material", async (req, res, next) => {
    try {
        const { body, headers: { token } } = req;
        await tokenValidation(token);
        const response = await validateMaterial(body);
        res.status(response.statusCode).json(response);
    } catch (error) {
        next(error);
    }
});

//工单投料，扫描组件序列号
router.get("/material/:serialNumber", async (req, res, next) => {
    try {
        const { params: { serialNumber }, query: { movementType }, headers: { token } } = req;
        await tokenValidation(token);
        const response = await getMaterialNumber(serialNumber, movementType);
        res.status(response.statusCode).json(response);
    } catch (error) {
        next(error);
    }
});

// 15_批量查询序列号返回主数据
// 按序列号放行
// 销售4个
router.post("/material/bulk", async (req, res, next) => {
    try {
        const { body: { content, movementType }, headers: { token } } = req;
        console.log('/material/bulk', content, movementType);
        
        await tokenValidation(token);
        const response = await getBarcodeMasterBulk(content, movementType);
        res.status(response.statusCode).json(response);
    } catch (error) {
        next(error);
    }
})

// 19_根据序列号或物料号查询条码主数据
router.post("/serial/material", async (req, res, next) => {
    try {
        const { body: { serial, material }, headers: { token } } = req;
        await tokenValidation(token);
        const response = await getBarcodeMasterBySerialOrMaterial(serial, material);
        res.status(response.statusCode).json(response);
    } catch (error) {
        next(error);
    }
})


module.exports = router;