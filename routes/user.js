import Express from "express";
import { login, logout } from "../services/UserService";
import {upload} from "../services/shapeCodeService";
import {getHanaUserInfo, updateHanaUserInfo, getPDAHanaUserInfo, getStorageByFactory} from '../services/userService';
import {tokenValidation} from '../services/JWTService';
import * as contants from '../utils/constants';
const router = Express.Router();

/*
* 用于web端登陆请求
* */
router.post("/login/web", async (req, res, next) => {
		try {
				let response = await login(req.body, contants.WEB);
				res.status(response.statusCode).json(response);
		}catch (err) {
				next(err);
		}
});

/*
* 用户注销登录操作，注销自动删除token信息
* */
router.post("/logout", async (req, res, next) => {
		try {
				let response = await logout(req.body);
				res.status(response.statusCode).json(response);
		}catch (err) {
				next(err);
		}
});

/*
* 用于pda设备登陆
* */
router.post("/login/pda", async (req, res, next) => {
		try {
				let response = await login(req.body, contants.PDA);
				res.status(response.statusCode).json(response);
		}catch (err) {
				next(err);
		}
});

/*
* 查询PDA HANA用户信息（用户名，密码）
* 未加密
* */
router.get("/getPDAHanaUser", async (req, res, next) => {
		try {
				await tokenValidation(req.headers['token']);
				let response = await getPDAHanaUserInfo();
				res.status(response.statusCode).json(response);
		}catch (err) {
				next(err);
		}
});



/*
* 查询HANA用户信息（用户名，密码）
* Made By Richard Jiang
* */
router.get("/getHanaUser", async (req, res, next) => {
	try {
			await tokenValidation(req.headers['token']);
			let response = await getHanaUserInfo();
			res.status(response.statusCode).json(response);
	}catch (err) {
			next(err);
	}
});

/*
* 更新HANA用户信息（用户名，密码）
* Made By Richard Jiang
* */
router.post("/updateHanaUser", async (req, res, next) => {
		try {
				await tokenValidation(req.headers['token'], contants.WEB);
				let response = await updateHanaUserInfo(req.body);
				res.status(response.statusCode).json(response);
		}catch (err) {
				next(err);
		}
});


module.exports = router;