import Express from "express";
import path from "path";
const router = Express.Router();

/*
* 用于下载apk
* */
router.get("/", async (req, res, next) => {
		try {
				res.sendFile(path.join(__dirname,'../client/download/assets/pda.apk'));
		}catch (err) {
				next(err);
		}
});

module.exports = router;