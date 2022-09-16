import Express from "express";
const router = Express.Router();
import {getSerialMasterData,
		checkSerialMasterDataByNo,
		updateSerialDataByWorkNumber,
		getSerialDataByWorkNumber,
		querySerialMasterDataByNo,
		vendorSpareBackData,
		getStorageByFactory,
		updateSerialMasterDataByNo,
		getBasicData,
		querySerialMasterDataByFactoryWorkNo,
		querySerialMasterDataBySerialOrMaterial,
		querySerialMasterCountDataByWorkNo,
		querySerialMasterDataByWorkDateOrWorkNo,
		updateSerialMasterData, 
		serialMasterReport,
		productQualityReport
	} from '../services/serialMasterDataService';
import {getResponseData} from "../utils/utility";
import {tokenValidation} from "../services/JWTService";
import {allocateSerialMovementData} from "../services/serialMovementService";

/*
* 读取条码数据数据信息
* */
router.get("/querySerialMasterData", async (req, res, next) => {
		try {
				await tokenValidation(req.headers['token']);
				let response = await getSerialMasterData();
				res.status(response.statusCode).json(response);
		} catch (error) {
				next(error);
		}
});

/*
* 更新条码数据数据信息
* */
router.post("/modifySerialMasterData", async (req, res, next) => {
		try {
				await tokenValidation(req.headers['token']);
				let response = await updateSerialMasterData(req.body);
				res.status(response.statusCode).json(response);
		} catch (error) {
				next(error);
		}
});

/*
* 更新条码数据数据信息
* */
router.post("/releaseSerialMasterDataByNo", async (req, res, next) => {
		try {
				await tokenValidation(req.headers['token']);
				let response = await updateSerialMasterDataByNo(req.body);
				res.status(response.statusCode).json(response);
		} catch (error) {
				next(error);
		}
});

/*
* 读取factory_id  area_id读取对应的库存地点信息
* */
router.post("/queryStorageByFactory", async (req, res, next) => {
		try {
				await tokenValidation(req.headers['token']);
				let response = await getStorageByFactory(req.body);
				res.status(response.statusCode).json(response);
		}catch (err) {
				next(err);
		}
});


/*
* 读取PDA基础数据  仓库位  工厂等信息
* */
router.get("/queryBasicData", async (req, res, next) => {
		try {
				//不需要验证token，自动自读读取基础数据
				let response = await getBasicData();
				res.status(response.statusCode).json(response);
		}catch (err) {
				next(err);
		}
});

/*
* 根据序列号查找主数据是否存在
* 存在返回 true
* 不存在返回 false
* */
router.get("/checkSerialMasterDataByNo", async (req, res, next) => {
		try {
				await tokenValidation(req.headers['token']);
				let response = await checkSerialMasterDataByNo(req.query);
				res.status(response.statusCode).json(response);
		} catch (error) {
				next(error);
		}
});

/*
*API涉及功能 06_调拨入库
API描述：从条码主数据表中，查询满足查询条件的记录
POST
- 序列号：必填
- 工厂：数组
* */
router.post("/querySerialMasterDataByNo", async (req, res, next) => {
		try {
				await tokenValidation(req.headers['token']);
				let response = await querySerialMasterDataByNo(req.body);
				res.status(response.statusCode).json(response);
		} catch (error) {
				next(error);
		}
});

/*
*按照工单号，或者日期进行查询
*按工单放行
* */
router.get("/querySerialDataByWorkNumber", async (req, res, next) => {
		try {
				await tokenValidation(req.headers['token']);
				let response = await getSerialDataByWorkNumber(req.query);
				res.status(response.statusCode).json(response);
		} catch (error) {
				next(error);
		}
});


/*
* 14_查询序列号主数据
* 参数：- 工厂代码、工单日期、工单号
* 返回：返回满足查询条件的记录，每个工单号为一个数组（一个工单号可能对应多条记录） 
* */
router.get("/querySerialMasterDataByFactoryWorkNo", async (req, res, next) => {
	try {
			await tokenValidation(req.headers['token']);
			let response = await querySerialMasterDataByFactoryWorkNo(req.query);
			res.status(response.statusCode).json(response);
	} catch (error) {
			next(error);
	}
});


/*
* 12_查询序列号主数据
* 参数： 工单号
* 返回： 工单号， 已投数量，工单总数量
* */
router.post("/querySerialMasterCountDataByWorkNo", async (req, res, next) => {
	try {
			await tokenValidation(req.headers['token']);
			let response = await querySerialMasterCountDataByWorkNo(req.body);
			res.status(response.statusCode).json(response);
	} catch (error) {
			next(error);
	}
});

/*
* 19_查询序列号主数据
只查询 返厂仓 598E的数据
* 参数：- 序列号、物料号
* 返回：支持模糊查询 
* */
router.get("/querySerialMasterDataBySerialOrMaterial", async (req, res, next) => {
	try {
			await tokenValidation(req.headers['token']);
			let response = await querySerialMasterDataBySerialOrMaterial(req.query);
			res.status(response.statusCode).json(response);
	} catch (error) {
			next(error);
	}
});


/*
* 08_工单收货
* 参数：- 类型（0：工单收货，1：取消工单收货），工单日期、工单号。二者不能都为空
* 返回：支持模糊查询 
* */
router.get("/querySerialMasterDataByWorkDateOrWorkNo", async (req, res, next) => {
	try {
			await tokenValidation(req.headers['token']);
			let response = await querySerialMasterDataByWorkDateOrWorkNo(req.query);
			res.status(response.statusCode).json(response);
	} catch (error) {
		next(error);
	}
});

//备件库供应商退回
router.post("/vendorMovementBack", async (req, res, next) => {
	try {
		console.log('备件库供应商退回: vendorMovementBack --- ',req.body);
			await tokenValidation(req.headers['token']);
			let response = await vendorSpareBackData(req.body);
			res.status(response.statusCode).json(response);
	} catch (error) {
			next(error);
	}
});


/*
//序列号主数据查询报表
router.post("/serialMasterReport", async (req, res, next) => {
	try {
		console.log('序列号主数据查询报表: serialMasterReport --- ', req.body);
			await tokenValidation(req.headers['token']);
			let response = await serialMasterReport(req.body, req.headers['page'], req.headers['pageSize']);
			res.status(response.statusCode).json(response);
	} catch (error) {
			next(error);
	}
});
*/

//序列号主数据查询报表
router.get("/serialMasterReport", async (req, res, next) => {
	try {
		console.log('序列号主数据查询报表: serialMasterReport --- ', req.query);
			await tokenValidation(req.headers['token']);
			let response = await serialMasterReport(req.query);
			res.status(response.statusCode).json(response);
	} catch (error) {
			next(error);
	}
});

router.post("/productQualityReport", async(req, res, next)=> {
	try {
		await tokenValidation(req.headers['token']);
		const { body: { date_from, date_to, work_number_from, work_number_to, material_number_from, material_number_to, material_desc_from, material_desc_to, release_person, static_type, page, page_size, exported, count, sortField, sortDirection } }=req;
		const { statusCode, data, length } = await productQualityReport(date_from, date_to, work_number_from, work_number_to, material_number_from, material_number_to, material_desc_from, material_desc_to, release_person, static_type, page, page_size, exported, count, sortField, sortDirection);
		res.status(statusCode).json({ length, data });
	} catch (error) {
		next(error);
	}
});

module.exports = router;