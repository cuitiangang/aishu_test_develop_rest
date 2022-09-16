import Express from "express";
const router = Express.Router();
import {updateGoodsMovementData, insertPurchaseMovementData, goodsMovementReportData, allocateSerialMovementData, issueProductionOrderData, salesSerialMovementData} from '../services/serialMovementService';
import {getResponseData} from "../utils/utility";
import {tokenValidation} from "../services/JWTService";


//取消采购入库
router.post("/deliverGoodsMovement", async (req, res, next) => {
		try {
				console.log('取消采购入库：deliverGoodsMovement');
				await tokenValidation(req.headers['token']);
				let response = await updateGoodsMovementData(req.body);
				res.status(response.statusCode).json(response);
		} catch (error) {
				next(error);
		}
});

//采购入库
router.post("/deliverPurchaseMovement", async (req, res, next) => {
		try {
				console.log('采购入库：deliverPurchaseMovement ', req.body);
				await tokenValidation(req.headers['token']);
				let response = await insertPurchaseMovementData(req.body);
				res.status(response.statusCode).json(response);
		} catch (error) {
				next(error);
		}
});

//调拨入库，调拨出库
//工单收货，取消工单收货
router.post("/allocateSerialMovement", async (req, res, next) => {
		try {
				console.log('调拨出入库、(取消)工单收货：allocateSerialMovement ', JSON.stringify(req.body));
				await tokenValidation(req.headers['token']);
				let response = await allocateSerialMovementData(req.body);
				console.log('resp: ', response);
				res.status(response.statusCode).json(response);
		} catch (error) {
				next(error);
		}
});

//销售出库，取消销售出库
//销售退库，取消销售退库
router.post("/salesSerialMovement", async (req, res, next) => {
	try {
			console.log('(取消)销售出库、(取消)销售退库：salesSerialMovement ', JSON.stringify(req.body) );
			await tokenValidation(req.headers['token']);
			let response = await salesSerialMovementData(req.body);
			res.status(response.statusCode).json(response);
	} catch (error) {
			next(error);
	}
});


//工单投料
router.post("/issueProductionOrder", async (req, res, next) => {
	try {
			console.log('(取消)工单投料：issueProductionOrder ', JSON.stringify(req.body));
			await tokenValidation(req.headers['token']);
			console.log('(取消)工单投料：issueProductionOrder ', 'TOKEN validated');
			let response = await issueProductionOrderData(req.body);
			res.status(response.statusCode).json(response);
	} catch (error) {
			next(error);
	}
});


//出入库报表
router.get("/goodsMovementReport", async (req, res, next) => {
	try {
			console.log('出入库报表：goodsMovementReport --- ', req.query);
			await tokenValidation(req.headers['token']);
			let response = await goodsMovementReportData(req.query);
			res.status(response.statusCode).json(response);
	} catch (error) {
			next(error);
	}
});


module.exports = router;