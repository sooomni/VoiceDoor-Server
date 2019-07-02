var mysql = require('mysql');


var pool = mysql.createPool({
							host: 'localhost',
							port: '3306',
							user: 'root',
							password: 'soo123',
							database: 'fre_db',
							connectionLimit:10,
							waitForConnections:false //true : Pool내에 가용한 Connection이 없을 경우 Connection이 반납되기를 기다리고, 
				});
exports.pool = pool;