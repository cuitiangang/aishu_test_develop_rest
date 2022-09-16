import Express from "express";
const router = Express.Router();
import {updateRejectData, rejectStatReportData} from '../services/serialRejectService';
import {getResponseData} from "../utils/utility";
import {tokenValidation} from "../services/JWTService";


router.post("/deliverRejectData", async (req, res, next) => {
		try {
				console.log('不良品: deliverRejectData');
				await tokenValidation(req.headers['token']);
				let response = await updateRejectData(req.body);
				res.status(response.statusCode).json(response);
		} catch (error) {
				next(error);
		}
});


//出入库报表
router.get("/rejectStatReport", async (req, res, next) => {
	try {
			console.log('质检统计报表：rejectStatReport --- ', req.query);
			await tokenValidation(req.headers['token']);
			let response = await rejectStatReportData(req.query);
			res.status(response.statusCode).json(response);
	} catch (error) {
			next(error);
	}
});

module.exports = router;