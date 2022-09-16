import Express from "express";
const path = require("path");
const logger = require("morgan");
const cookieParser = require("cookie-parser");
const bodyParser = require("body-parser");
const compression = require('compression')
import { getEnv } from './utils/utility'

//const jwt = require("./utils/jwt");
const env = getEnv();


// define or import your middle-ware here
// ...

// import routes file here
import index from "./routes/index";
import user from "./routes/user";
import file from "./routes/file";
import barcode from "./routes/barcode";
import serialMovement from './routes/serialMovementData';
import serialMaster from './routes/serialMasterData';
import serialReject from './routes/serialRejectData';
import pda from './routes/pda';

// define node app
const app = Express();
app.use(compression())
app.use(bodyParser.json({ limit: '5mb' }))

// 应用中间件插件
app.use(logger("dev"));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(Express.static(path.join(__dirname, "client/admin")));

app.use('/download', Express.static(path.join(__dirname, "client/download")));

//定义路由模块
app.use("/", index);
app.use("/user", user);
app.use("/pda", pda);
app.use("/file", file);
app.use("/barcode", barcode);
app.use("/serialMovement", serialMovement);
app.use("/serialMaster", serialMaster);
app.use("/serialReject", serialReject);
// to do add more

/*
 * 捕获404页面
 * */
// app.use((req, res, next) => {
//     const err = new Error("Not Found");
//     err.status = 404;
//     next(err);
// });

/*
 * 通用的错误处理
 * */
app.use((err, req, res, next) => {
    res.status(err.statusCode || 500).json(err);
    if (env === "dev") {
        console.log(err);
        return;
    }
});

/*
 * 设置响应header，禁止跨域访问
 * */
app.all('*', function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "X-Requested-With");
    res.header("Access-Control-Allow-Methods", "PUT,POST,GET,DELETE,OPTIONS");
    res.header("X-Powered-By", ' 3.2.1')
    res.header("Content-Type", "application/json;charset=utf-8");
    next();
});

module.exports = app;