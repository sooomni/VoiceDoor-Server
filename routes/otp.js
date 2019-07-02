const express = require('express');
const router = express.Router();

const multer = require('multer');
const bcrypt = require('bcryptjs'); 
const jwt = require('jsonwebtoken');
const fs = require('fs');

var pool = require('../config/db_config.js').pool;
const saltRounds = 10;

//아두이노에 mqtt로 open 전달
var mqtt = require('mqtt');
//var client  = mqtt.connect({host: '192.168.0.100', port:1883});
var client  = mqtt.connect({host: 'localhost', port:1883});

var stored_id = '';
var stored_doorlock_id = '';
var arduino_string = '';
var check_id = '';

//1. 화자 인증 확인
router.post('/', function(req, res, next) {
	let update_speaker_id = req.body.speaker_id; 
	pool.getConnection(function(err, connection){
    	//클라이언트에서 헤더에 담아 보낸 토큰을 가져옵니다.
    	let token = req.headers.token; 
    	//보낸 토큰이 유효한 토큰인지 검증합니다.(토큰 발급 시 사용했던 key로);
    	let decoded = jwt.verify(token, req.app.get('jwt-secret')); 
    	var decoded_pk = jwt.decode(token, {complete: true});

    	if(err) console.log('getConection error:', err);
    	else {
    		let query = 'select * from user where pk = ?';
    		connection.query(query,decoded_pk.payload.pk, function(err, result){
        	if(err){
                  console.log('query err', err);
                  connection.release(); 
              }
              else{
              	stored_id = result[0].id;
              	if(result[0].speaker_id == null){
					res.status(403).send({result: '사용자를 식별하지 못했습니다. 먼저 보이스를 등록해주세요.'});
	              	connection.release();
              	}
              	else{
	              		if(update_speaker_id == result[0].speaker_id){          		  		
	          			let r1 = random_maker();
			          	//jwt 발급하고 성공메세지 보내주기
			          	let option = {
				            algorithm : 'HS256', //	ECDSA using P-256 curve and SHA-256 hash algorithm
				            expiresIn : 60 * 3 * 1//토큰만료기간 : 하루
					      };

					    let payload = {
					    	r1: r1
					    };				    
					     //인증을 위한 key r1 암호화
					     var encoded_r1 = jwt.sign(payload, req.app.get('jwt-secret'), option);

					    //이후 r1 값의 비교를 위해 파일 입출력해서 저장
						fs.writeFile('../r1_text.txt', encoded_r1, 'utf8', function(err) {
							if(err){
								console.log('파일 쓰기 오류');
							}
						    console.log('파일 쓰기 완료');
						});

						//pw
						//publish_message('auth');
						
						  res.status(201).send({result : '인증되었습니다.', result_data : encoded_r1});		
					      connection.release();						
              		} 
              		else{
              			stored_id = null;
						res.status(402).send({result: '올바른 사용자가 아닙니다.'});
	              		connection.release();
              		}	
              	}	
              }
           }); 
    	}
    });              	
});

//2. 화자 인증 및 otp 생성
router.put('/:doorlock_id', function(req, res, next) {
	let doorlock_id = req.params.doorlock_id;
	pool.getConnection(function(err, connection){
    	if(err) console.log('getConection error:', err);
    	else {
    		let query = 'select doorlock_id from doorlock where doorlock_id = ?';
    		connection.query(query, doorlock_id, function(err, result){
        		if(err){
			      console.log('query err', err);
			      connection.release();
 			 	}
 				else {
 					if(result.length == 0) {
 						res.status(403).send({result: '존재하지 않는 도어락입니다.'});
 						connection.release();	
 					}
 					else {
						stored_doorlock_id = doorlock_id;	
						//안드로이드에서 받아온 D(E(r1+r2))
						let encoded_r2 = req.body.encoded_r2; 
						//let decoded = jwt.verify(encoded_r2, req.app.get('jwt-secret'));					  	
					   	let decoded_r2 = jwt.decode(encoded_r2, {complete: true});
					   	var split_decoded_r2 = decoded_r2.payload.sub.substr(0,4);
					   	//파일로 저장한 D(E(r1))
					   	let data = fs.readFileSync('../r1_text.txt', 'utf8');        
        					let decoded_r1 = jwt.decode(data, {complete: true});
	
						//split_decoded_r2 = '6D05';
						if(decoded_r1.payload.r1 != split_decoded_r2){
					   		res.status(402).send({result: '올바른 사용자가 아닙니다.'});
					   	}
					 	else{						 		
					    	//난수 생성
					    	let r1 = random_maker();
							
					     	//OTP 암호화
		                    let option = {
		                        algorithm : 'HS256', 
		                        expiresIn : 60 * 3 *1 //토큰만료시간 : 3분
		                    };
		               
		                    let payload = {
		                        r1 : r1
		                    };

		                    let encoded_otp = jwt.sign(payload, req.app.get('jwt-secret'), option);
		                    let random_otp = {
		                    	otp : encoded_otp
		                    };

		                    let query2 = 'update doorlock set ? where doorlock_id = ?';
		                	connection.query(query2, [random_otp,doorlock_id], function(err, result){    
		                  		if(err){
							      console.log('query2 err', err);
							      connection.release();
				 			 	}
				 			 	else{
			                    	res.status(200).send({result : 'otp 생성 완료',result_data : encoded_otp});
			                   		connection.release();
			                   	}
		                	});
					 	}

						}

					}
        	   	});
    	    } 
     })
});

//mqtt 전부
var topic = 'topic';
var topic_id = 'id';
var topic_pw = 'pw';
var topic_entry = 'entry';

//id, pw, entry 토픽 구독
client.on('connect', function () {	
	client.subscribe(topic_id, function (err,data) {
		if (err) console.log('subscribe error!');
	    else console.log('id mqtt connected!');	   
		});
		client.subscribe(topic_pw, function (err,data) {
		if (err) console.log('subscribe error!');
	    else console.log('pw mqtt connected!');	   
		});

	client.subscribe(topic_entry, function (err,data) {
		if (err) console.log('subscribe error!');
	    else console.log('entry mqtt connected!');	   
		});

});

client.on('message', function(topic, data){
	if(topic == topic_id){
		arduino_string = data.toString();	
		console.log('#arduino_string_id',arduino_string);		
		//시간 찍고 id 기록해두기

		var arduino_id = arduino_string;
      		//doorlock에 대한 유효성 검사 없음... 도륵....	
      		var query = 'select * from user where id = ?';	
			pool.getConnection(function(err, connection){	
	    	if(err) console.log('getConection error:', err);
	    	else {	
      		connection.query(query, arduino_id, function(err, data){
	        if(err){
	          console.log("first query err: ", err);
	          connection.release();
	        }
	        else{
	          //존재하지 않는 아이디
	          if(data.length==0){
	  			console.log('존재하지 않는 아이디');
	  			//id_
				publish_message('0');
	  			connection.release(); 		
	
	    	} 
	          //아이디 존재. 저장해두기.	
	      	  else{
	      	  	check_id = arduino_id;   	  	
	  			console.log('존재하는 아이디');
				publish_message('1');

				connection.release(); 		   		
		        }
	      	  }
	      	});
      	}
		});	
	}
	else if(topic == topic_pw){
		arduino_string = data.toString();		
		console.log('#arduino_input',arduino_string);	

		//stored_doorlock_id = 33;
		if(stored_doorlock_id!=''){
			var arduino_otp = arduino_string;
			pool.getConnection(function(err, connection){
		    if(err) console.log('getConection error:', err);
		    else {
		    	let query = 'select otp from doorlock where doorlock_id = ?';
		    	connection.query(query, stored_doorlock_id, function(err, result){
		        	if(err){
		                  console.log('query err', err);
		                  connection.release(); 
		              }
		              else{ 
		              	let decoded_otp = jwt.decode(result[0].otp, {complete: true});
						decoded_otp = decoded_otp.payload.r1;
						console.log('arduino_otp',arduino_otp);
						console.log('decoded_otp',decoded_otp);

		              	if (decoded_otp != arduino_otp){
		              		console.log('비밀번호 불일치');		           
							publish_message('0');
		              		connection.release();            		
		              	}
		              	else {	
		              			check_id = stored_id;
		              			console.log('비밀번호 일치 open');	  			
				 				publish_message('1');
								connection.release();

							}
						}
		    		});
		    	}
			});
		}
		else console.log('아직 otp 발급도 안했음.');		
	}
	else if(topic == topic_entry){
		//check_id ="yundu";
		arduino_string = data.toString();	
		console.log('#arduino_string_entry',arduino_string);	

		if(check_id=='') console.log('출입 시도 및 출입 이력 없음');
		else{
			var time = new Date();	
			time = time.getHours() + ":" + time.getMinutes() + ":" + time.getSeconds();

			if(arduino_string == 'open'){
				let query = 'select * from user where id = ?';
				pool.getConnection(function(err, connection){
			    if(err) console.log('getConection error:', err);
			    else{	           
		    	connection.query(query, check_id, function(err, result){
		        	if(err){
		              console.log('query err', err);
		              connection.release();
		            }
		            else{
		            	if(result[0].doorlock == null) console.log('등록된 도어락이 없음');
		            	else{
			            let query2 = 'select doorlock_id from doorlock,user where user.doorlock=? and doorlock.ble_id=user.doorlock';
			            connection.query(query2, result[0].doorlock, function(err, result2){
			        	if(err){
			              console.log('query err', err);
			              connection.release();
			            }
				        else{	
			            	var doorlock_d = result2[0].doorlock_id;
					        	var list = {
				            		doorlock_id : result2[0].doorlock_id, 
									id : check_id,
									name :result[0].name,
									time :time+"",
									is_success : true
				            	}; 
				            	
				            	let query3 = 'insert into list set ?';
						        connection.query(query3, list, function(err, result3){
						            if(err){
						              console.log('query err', err);
						              connection.release();
						            }
						            else{
							            	console.log('문열었음. 출입기록 등록.');
							        		check_id = '';

								        	var d = { 
								        		otp : null
											}	
											let query4 = 'update doorlock set ? where doorlock_id = ?';		
							        		connection.query(query4, [d, doorlock_d], function(err, result4){
								            	if(err){
								             		 console.log('query err', err);
								              		 connection.release
								        		}
								        		else{
								        			console.log('사용한 otp를 삭제합니다.');
								        			connection.release();
								           		 }
					          				});						        
						            }
				          		});
								
				    	}
				    });
				   }
				   }

				});
		    	}
		    	});
			}
			else if(arduino_string == 'close'){
				let query = 'select * from user where id = ?';
				pool.getConnection(function(err, connection){
				    if(err) console.log('getConection error:', err);
				    else{          
			    	    connection.query(query, check_id, function(err, result){
				        	if(err){
				              console.log('query err', err);
				              connection.release();
				            }
				            else{
				            	if(result[0].doorlock == null) console.log('등록된 도어락이 없음');
		            			else{
					            let query2 = 'select doorlock_id from doorlock,user where user.doorlock=? and doorlock.ble_id=user.doorlock';
				           		connection.query(query2, result[0].doorlock, function(err, result2){
						        	if(err){
						              console.log('query err', err);
						              connection.release();
						            }
						            else{
							            	var list = {
						            		doorlock_id : result2[0].doorlock_id, 
											id : check_id,
											name :result[0].name,
											time :time+"",
											is_success : false
						            		}; 
						            	
						            	let query3 = 'insert into list set ?';
								        connection.query(query3, list, function(err, result3){
								            if(err){
								              console.log('query err', err);
								              connection.release();
								            }
								            else{
								        		console.log('문 열지 못함. 출입기록 등록.');
								        		check_id = '';
								        		connection.release();
								            }
						          		});
								    	
							    	}
						    	});
				           	}
						   	}
						});
				    	}
				});
			}
		}
	}
	else console.log('떙');
});

module.exports = router;

function random_maker(){
    var text = "";
    var possible = "ABCD1234567890";

    for( var i=0; i < 4; i++ )
        text += possible.charAt(Math.floor(Math.random() * possible.length));

    return text;
}

function publish_message(message){

//client.on('connect', function () {
	// client.subscribe('fre', function (err) {
	//if (!err) //{console.log('err');}
  	//else 
  		client.publish('fre',message);		
	//	});
//});

}