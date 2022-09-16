/*
* Made By Richard Jiang
* */
const fs = require('fs');
const getSqlContentMap = require('./util/get-sql-content-map');
const executeSqlAction = require('./util/general');

// 获取所有sql脚本内容
let sqlContentMap = getSqlContentMap('sql');

executeSqlAction(sqlContentMap);