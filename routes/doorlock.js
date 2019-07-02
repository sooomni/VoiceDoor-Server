var express = require('express');
var router = express.Router();
const multer = require('multer');
const bcrypt = require('bcryptjs'); 
const jwt = require('jsonwebtoken');
var pool = require('../config/db_config.js').pool;

const saltRounds = 10;

//도어락 정보 입력(admin 전용) 
router.post('/', function(req, res){
  pool.getConnection(function(err, connection){
    if(err) console.log('getConection error:', err);
    else {  
       //도어락 등록 전, 이미 있는 도어락인지 확인      
       let query = 'select * from doorlock where ble_id = ?';
       connection.query(query, req.body.ble_id, function(err, data){
        if(err){
          console.log('first query err', err);
          connection.release();
        }
        else{
            if(data.length!==0) res.status(409).send({ result : "이미 존재하는 도어락입니다."});
            else{
              let token = req.headers.token; 
              //보낸 토큰이 유효한 토큰인지 검증합니다.(토큰 발급 시 사용했던 key로);
              let decoded = jwt.verify(token, req.app.get('jwt-secret')); 
              let decoded_pk = jwt.decode(token, {complete: true});
              
              //토큰의 pk로 id 조회
              let query2 = 'select id from user where pk = ?';      
              connection.query(query2, decoded_pk.payload.pk ,function(err, result){      
                if(err){
                  console.log("second query err: ", err);
                  connection.release();
                  }
                else{                  
                  var stored_id = result[0].id;  
                  let doorlock = { 
                    //doorlock_id : req.body.doorlock_id,             
                    ble_id : req.body.ble_id,
                    admin_id : result[0].id

                  };
                  //도어락 등록
                  let query3 = 'insert into doorlock set ?';
                  connection.query(query3, doorlock, function(err, result){
                        if(err){
                          console.log('third query err', err);
                          connection.release();
                        }
                        else{                          
                            let doorlock2 = {
                              doorlock : req.body.ble_id
                            };
                            //user에 도어락 지정, ble id
                            let query4 = 'update user set ? where id= ?';
                            connection.query(query4, [doorlock2, stored_id], function(err, result){
                              if(err){
                                    console.log('forth query err', err);
                                    connection.release();                              
                                  }
                              else{
                                //app에 보내주 도어락 정보 확인. 무조건 마지막에 나와야.
                                let query5 = 'select doorlock_id, ble_id, admin_id from doorlock where doorlock.ble_id = ?';     
                                connection.query(query5, req.body.ble_id, function(err, result){
                                if(err){
                                  console.log('fifth query err', err);
                                  connection.release();
                                } 
                                else{
                                  res.status(201).send({result: '도어락 정보 입력 완료', result_data : result[0]});                               
                                  connection.release();
                                }                          
                           });
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
});

//도어락 정보 수정
router.put('/:doorlock_id', function(req, res, next) {
  pool.getConnection(function(err, connection){
      let doorlock_id = req.params.doorlock_id;
			  if(err) console.log('getConection error:', err);           
			  else{
				let query = 'select * from doorlock where doorlock_id=?'
				connection.query(query,doorlock_id, function(err,data){
				  if(err){
					  console.log('query err', err);
					  connection.release();
				  }
				  else{
					if(data.length == 0){res.status(403).send({ result: '존재하지 않는 도어락입니다.'});}
				  else{
						let doorlock= {
							admin_id : req.body.admin_id,
							ble_id : req.body.ble_id
						};
				 
				 let query = 'update doorlock set ? where doorlock_id=?';
				   connection.query(query,[doorlock,doorlock_id],function(err,data){
				  if(err){
					  console.log('query err', err);
					  connection.release();
				  }
				  else{res.status(200).send({ result: '도어락 정보 수정 완료'});}
						connection.release();
					});
				}
				}   
			   });
			   
				}
      });
});

//도어락 삭제
router.delete('/:doorlock_id', function(req, res){
  pool.getConnection(function(err, connection){
    let doorlock_id = req.params.doorlock_id;
    if(err) console.log('getConection error:', err);           
    else{
      let query = 'select * from doorlock where doorlock_id=?'
      connection.query(query,doorlock_id, function(err,data){
        if(err){
            console.log('query err', err);
            connection.release();
        }
        else{
          if(data.length == 0){res.status(403).send({ result: '존재하지 않는 도어락입니다.'});}
        else{
        let query2 = 'delete from doorlock where doorlock_id=?';
        connection.query(query2,doorlock_id,function(err,data){
        if(err){
            console.log('query err', err);
            connection.release();
        }
        else{res.status(200).send({ result: '도어락 정보 삭제 완료'});}
              connection.release();
          });
      }
      }   
     });
     
      }
      
    });
});

//출입기록조회
router.get('/list/:doorlock_id', function(req, res, next) {
  let doorlock_id = req.params.doorlock_id;
  pool.getConnection(function(err, connection){
      if(err) console.log('getConection error:', err);
      else {
        let query = 'select * from doorlock where doorlock_id = ?';
        connection.query(query, doorlock_id, function(err, result){
            if(err){
            console.log('query err', err);
            connection.release();
             }
        else {
          if(result.length == 0) {
            res.status(409).send({result: '존재하지 않는 도어락입니다.'});
            connection.release(); 
          }
          else {
              let query2 = 'select name, is_success, time from list where doorlock_id = ?';
                connection.query(query2, doorlock_id, function(err, result){
                    if(err){
                    console.log('second query err', err);
                    connection.release();
                }
                else {                 
                    if(result.length == 0){
                      res.status(403).send({result: '출입기록이 존재하지 않습니다.'});
                      connection.release();                                  
                     }
                     else{
                       res.status(200).send({result: '출입기록 조회', entry_list : result});
                      connection.release();
                     }
                }
          
            });
          }
        }
      });
    }
  });
});  

module.exports = router;
