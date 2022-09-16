
const HANA_SERVICE = "YY1_OUTBOUNDREPORT_PDA_CDS/YY1_OutboundReport_PDA?$format=json";
var request = require('request');
var CronJob = require('cron').CronJob;
var mysql      = require('mysql');
let config =  require('./db');       //读取数据库连接信息

let env = config.dev;

var connection = mysql.createConnection({
  host     : env.db.host,
  user     : env.db.user,
  password : env.db.password,
  database : env.db.database
});

const callOutboundReport = async() => {
    try {
        console.log('env: ', JSON.stringify (env));
        const ps = await getHanaToken();
        console.log('password: ', ps);

		let options = {
			headers: {},
			method: "get",
			json: true
        };
        options.url = env.cloud.baseUrl + HANA_SERVICE;
        options.headers["Authorization"] = 'Basic ' + ps ;
        options.headers["Content-Type"] = "application/json";
        options.method = "GET";

        console.log(JSON.stringify(options));

		request(options, (e, r, body) => {
            if (e) {
                console.log (e);
                resolve({ message: "从hana获取信息发生错误", data: {} });
            } else {
                console.log ('#### CLOUD RETURN ####: ', body.d.results.length);
               //remove dup 
               var uSize = removeDuplicatesBy(x => x.DeliveryDocument, body.d.results); 
               console.log ('#### REMOVED DUP ####: ', uSize.length);
               updateDB(uSize);
            }        
        });
	}
	 catch (error) {
		console.log(error);
	}
}

//get hana user basic authentication from db
const getHanaToken = () => {
    try {
        return new Promise((resolve, reject) =>{
            connection.connect(function(err) {
                if (err) {
                    console.error('error connecting: ' + err.stack);
                    return;
                }
                let query = "select * from pda_db.hana_user_info"
                connection.query(query, function (err, results) {
                    const { user_id, password } = results[0];
                    result = new Buffer(user_id + ":" + password).toString("base64"); 
                    if (err) reject(err);
                    else resolve(result);
                })
            });
        });
    } catch (error) {
        return Promise.reject(error);
    }
}

const updateDB = (arr) => {
    try {
        if (arr && arr.length > 0 ){
            connection.beginTransaction(arr, function(err) {
                if (err) { throw err; }
                let arrToUpdate = [];
                //GET MAX DELIVERY DOCUMENT NUMBER
                let query = "select MAX(delivery_document) as max from pda_db.customer_po where delivery_document like '80%'"
                connection.query(query, function (error, results, fields) {
                    if (error) {
                        return connection.rollback(function() {
                            throw error;
                        });
                    }
                    console.log ('#### MAX ####: ', results[0].max);
                    if(results[0].max){
                        arrToUpdate = arr.filter(biggerThan(results[0].max));
                    }
                    else{
                        arrToUpdate = arr; 
                    }
                    console.log ('#### WILL ADD TO DB ####: ', arrToUpdate.length);

                    arrToUpdate.forEach(item => {
                        let last_change_date = '';
                        if(item.LastChangeDate){
                            last_change_date = eval('new ' + item.LastChangeDate.replace(/\//g, ''));
                        }
                        
                        let sql = `INSERT IGNORE INTO pda_db.customer_po
                        (reference_sd_document, purchase_order_by_customer, ship_to_party, business_partner_name, delivery_document, sold_to_party) 
                        VALUES (?,?,?,?,?,?)`;

                        let values = [item.ReferenceSDDocument, item.PurchaseOrderByCustomer,item.ShipToParty,item.IncotermsLocation1,item.DeliveryDocument, item.BusinessPartnerName];

                        connection.query(sql, values, function (error, results, fields) {
                            if (error) {
                                return connection.rollback(function() {
                                    console.log(error);
                                    throw error;
                                });
                            }
                        });
                    });
                });


                connection.commit(function(err) {
                    if (err) { 
                    connection.rollback(function() {
                        throw err;
                    });
                    }
                    console.log('Transaction Complete.');
                    connection.end();
                });

            });
        }
    }
    catch (error) {
		return Promise.reject(error);
	}
}

const removeDuplicatesBy = (keyFn, array) => {
    var mySet = new Set();
    return array.filter(function(x) {
      var key = keyFn(x), isNew = !mySet.has(key);
      if (isNew) mySet.add(key);
      return isNew;
    });
  }


  const biggerThan = (value) => {
    return function(element, index, array) {
      return (element.DeliveryDocument > value);
    }
  }



callOutboundReport();

