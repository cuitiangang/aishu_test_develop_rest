const mysql = require('mysql')
let config =  require('../../config/db');       //读取数据库连接信息
const env = process.argv.slice(2)[0].split('=')[1]; //获取环境
const dbConfig = config[env];

//创建连接池
const pool = mysql.createPool({
		host     :  dbConfig.host,
		user     :  dbConfig.user,
		password :  dbConfig.password,
		database :  dbConfig.database,
})


let query = function( sql, values ) {
		
		return new Promise(( resolve, reject ) => {
				pool.getConnection(function(err, connection) {
						if (err) {
								console.log( err )
								resolve( err )
						} else {
								connection.query(sql, values, ( err, rows) => {
										if ( err ) {
												console.log( err )
												reject( err )
										} else {
												resolve( rows )
										}
										connection.release()
								})
						}
				})
		})
		
}


module.exports = {
		query
}