const express = require('express');
const router = express.Router();

const multer = require('multer');
const bcrypt = require('bcryptjs'); 
const jwt = require('jsonwebtoken');

var pool = require('../config/db_config.js').pool;
const saltRounds = 10;

//회원가입
router.post('/', function(req, res){
  let query = 'select * from user where id = ?';      
  pool.getConnection(function(err, connection){
    if(err) console.log('getConection error:', err);
    else {
      connection.query(query , req.body.id, function(err, data){
        if(err){
          console.log("first query err: ", err);
          connection.release();
        }
        else{
          if(data.length!==0) res.status(409).send({ result : "이미 존재하는 계정입니다."});

          else{
            bcrypt.hash(req.body.pw, saltRounds, function(err, hashed){
            if(err) console.log("Hashing error", err);
            else{

              let user = {
              	id : req.body.id,
                name: req.body.name,
                pw: hashed,
                phone: req.body.phone,
                speaker_id : req.body.speaker_id
              };

              let query2 = 'insert into user set ?';
              connection.query(query2, user, function(err, result){
                    if(err){
                      console.log('second query err', err);
                      connection.release();
                    }
                    else{
                      res.status(201).send({result: '회원가입 완료'});
                    }
                    connection.release();
              });
            }
          });
          }
        }
      });
    }
  });
});

//로그인
router.post('/login', function(req, res){
  pool.getConnection(function(err, connection){
    if(err) console.log('getConnection err : ', err );
    else{
      const id = req.body.id;
      const pw = req.body.pw;
      let query = 'select * from user where id = ?';
        connection.query(query, req.body.id, function(err, data){ // injection 방어 : +가 아니라 , 를 추가
          if(err){
            console.log("query err: ", err);
            connection.release();
          }
          else{
            if(data.length>0){
              bcrypt.compare(req.body.pw, data[0].pw, function(err, result) {
                  if (err)
                      console.log("compare error", err);
                  else {
                      if (result) {
                        //비밀번호 암호화
                        bcrypt.hash(data[0].pw, saltRounds, function(err, hash){
                          if(err) console.log("Hashing error", err);
                          else console.log("myPassword hashed", hash);
                          //jwt 발급하고 성공메세지 보내주기
                          let option = {
                            algorithm : 'HS256', //HMAC using SHA-256 hash algorithm
                            expiresIn : 60 * 60 * 24 * 30 //토큰만료기간 : 한달
                          };
                          let payload = {
                            pk : data[0].pk
                          };
                          //jwt로 토큰 발급
                          let token = jwt.sign(payload, req.app.get('jwt-secret'), option);
                          res.status(200).send({token : token});

                        });
                      } 
                      else {
                        res.status(402).send({result: '아이디나 비밀번호가 올바르지 않습니다'});
                      }
                  }
              });
            }
            else{
                res.status(403).send({result: '존재하지 않는 아이디입니다. 먼저 가입해주세요'});
            }
            connection.release();
          }
        });
      }
  });
});

// 회원정보 수정
router.put('/', function(req, res){
  pool.getConnection(function(err, connection){
    if(err) console.log('getConection error:', err);
    else {
      //클라이언트에서 헤더에 담아 보낸 토큰을 가져옵니다.
      let token = req.headers.token; 
      //보낸 토큰이 유효한 토큰인지 검증합니다.(토큰 발급 시 사용했던 key로);
      let decoded = jwt.verify(token, req.app.get('jwt-secret')); 
      var decoded_pk = jwt.decode(token, {complete: true});
      
      bcrypt.hash(req.body.pw, saltRounds, function(err, hashed){
            if(err) console.log("Hashing error", err);
            else{
              let user = {                 
                pw: hashed,                
                phone : req.body.phone,
                speaker_id : req.body.speaker_id                
              };

             let query2 = 'update user set ? where pk = ?';
             connection.query(query2, [user,decoded_pk.payload.pk] ,function(err, result){      
                    if(err){
                      console.log('second query err', err);
                      connection.release();
                    }
                    else{
                      res.status(200).send({result: '회원정보 수정 완료'});
                    }
                    connection.release();
              });
            }
       });
    }
  });
});

//회원가입 삭제_async/await로 재작성하기
router.delete('/', function(req, res){
  pool.getConnection(function(err, connection){

   if(err) console.log('getConection error:', err);
    else {
      let token = req.headers.token; 
      //보낸 토큰이 유효한 토큰인지 검증합니다.(토큰 발급 시 사용했던 key로);
      let decoded = jwt.verify(token, req.app.get('jwt-secret')); 
      var decoded_pk = jwt.decode(token, {complete: true});
//          bcrypt.hash(req.body.pw, saltRounds, function(err, hashed){
//            if(err) console.log("Hashing error", err);
            //else{
          let query2 = 'delete from user where pk=?';
          connection.query(query2,decoded_pk.payload.pk, function(err, result){
                 if(err){
                    console.log('delete query err', err);
                    connection.release();
                  }
                  else{ 
                    res.status(200).send({result: '회원 정보 삭제 완료'});
                  }
                  connection.release();
          });
  //            }
//          });
        }
      });
  });

module.exports = router;