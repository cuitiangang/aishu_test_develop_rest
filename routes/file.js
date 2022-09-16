import Express from "express";
import { writeFile, uploadLabelFileForWorkOrder } from "../services/FileService";
import { tokenValidation } from '../services/JWTService';

const router = Express.Router();

router.post("/label", async (req, res, next) => {
    const { headers: { token } } = req;
    try {
        console.log('标签打印 - label: ', req.body);
        await tokenValidation(token);
        writeFile(req, response => res.status(response.statusCode).json(response));
    } catch (error) {
        next(error);
    }
});

router.post("/workOrderLabel", async (req, res, next) => {
    const { headers: { token } } = req;
    try {
        console.log('工单复打印 - workOrderLabel: ', req.body);
        await tokenValidation(token);
        uploadLabelFileForWorkOrder(req, response => res.status(response.statusCode).json(response));
    } catch (error) {
        next(error);
    }
});

module.exports = router;