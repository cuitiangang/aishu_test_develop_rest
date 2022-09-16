const express = require("express");
const router = express.Router();
import path from 'path';

router.get("/", (req, res, next) => {
    res.status(200).json({ msg: "Node server is working now!" })
});

module.exports = router;