const express = require('express');
const router = express.Router();

const multer = require('multer');
const bcrypt = require('bcryptjs'); 
const jwt = require('jsonwebtoken');

var pool = require('../config/db_config.js').pool;
const saltRounds = 10;

router.get('/', function(req, res, next) {
  pool.getConnection(function(err, connection){

    if(err) console.log('getConection error:', err);
    else {
      //클라이언트에서 헤더에 담아 보낸 토큰을 가져옵니다.
      let token = req.headers.token; 
      //보낸 토큰이 유효한 토큰인지 검증합니다.(토큰 발급 시 사용했던 key로);
      //let decoded = jwt.verify(token, req.app.get('jwt-secret')); 
      var decoded_pk = jwt.decode(token, {complete: true});	   
        let query= 'select * from user where pk=?';
        connection.query(query, decoded_pk.payload.pk,function(err, result){      
                    if(err){
                      console.log('query err', err);
                      connection.release();
                    }
                    else{
                    //let speaker_id = result[0].speaker_id;
                    //let id = result[0].id;
                    //let doorlock_pk = result[0].doorlock;
                    let doorlock_id = result[0].doorlock;
            		     if(doorlock_id== null){ 
            		        	res.status(409).send({ result: '아직 도어락이 등록되지 않았습니다.'});
                        }
                     else {
                         //let query2= 'select * from doorlock where doorlock_id=?';
                          let query2 = 'select doorlock.doorlock_id, doorlock.ble_id, doorlock.admin_id, user.speaker_id from doorlock,user where user.pk = ? and user.doorlock = doorlock.ble_id';
                            connection.query(query2,[decoded_pk.payload.pk,doorlock_id], function(err, data){      
                            if(err){
                              console.log('second query err', err);
                              connection.release();
                            }
                            else{
                              //res.status(200).send({result: '등록된 도어락 조회', result_data : data[0], speaker_id : speaker_id, id : id});
                              res.status(200).send({result: '등록된 도어락 조회', result_data : data[0]});
                              connection.release();
                            }
                           });
                        }                        
                    }
              });
          }
     });
});

module.exports = router;
