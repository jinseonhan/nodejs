//const { render } = require('express/lib/response');

var router = require('express').Router(); // 라우터 만들때 필수!

const maria = require('../database/connect/maria');

var crypto = require('crypto'); // 암호화

// 회원 가입페이지
router.get('/registPage',function(req,res){
    res.render("registPage.ejs");
  });

// 아이디 중복 체크(sql-maria)
router.post('/idDuplicateChk',function(req,res){
  var id=req.body.id;
  var duplicateChk = "Y";
  // var data ={
  //     id : id,
  // }
  // var sql ='select user_id from nodejs.tb_user_pub where user_id=?';
  var sql ='select count(user_id) as idCount from nodejs.tb_user_pub where user_id=?';
  maria.query(sql,[id],function(err,rows,fields){ // row : data값(배열로), fields :  data정보
    if(!err){
      // console.log(rows);
      // console.log(rows[0].idCount);
      if(rows[0].idCount==0){
        // 중복 아이디가 존재하지 않을 때
        res.send(duplicateChk);
      }else{
        // 중복 아이디가 존재할 때
        duplicateChk ='N';
        res.send(duplicateChk);
      }
    }
  });

  // db.collection('login').find(data).toArray(function(error,result){
  //   for(var i=0; i<result.length;i++){
  //     if(result[i].id==id){
  //         duplicateChk="N";
  //         break;
  //     }
  //   }
  //     res.send(duplicateChk);
  // });
});


router.post('/regist',function(req,res){
    var userId = req.body.id;
    var userPwd = crypto.createHash('sha512').update(req.body.pw).digest('base64');
    var userEmail = crypto.createHash('sha512').update(req.body.email).digest('base64');
    var seq = '';
    //  기능 만들기
    // * pwd, email 암호화
    var seqSql = 'select nextval(nodejs.sq_user_pub) as seq from dual';
    maria.query(seqSql,function(err,rows,fields){ // row : data값(배열로), fields :  data정보
      
      if(!err){
        // console.log(rows);
        // console.log(rows[0].idCount);
        seq = rows[0].seq;
        // console.log("seq : "+seq);
        var params =[
          seq,
          userId,
          userPwd,
          userEmail,
          userId,
          userId
        ];
        var insertSql ='insert into nodejs.tb_user_pub(user_seq,user_id,user_pwd,user_email,reg_id,reg_dt,upt_id,upt_dt) values(?,?,?,?,?,now(),?,now())';
       
        maria.query(insertSql,params,function(err,rows,fields){ // row : data값(배열로), fields :  data정보
          if(!err){
            //console.log(rows);
            // console.log(rows[0].idCount);
            // res.send('success');
            if(rows.affectedRows>0){
              
              res.send('success');
            }else{
              
              res.send('fail');
            }
          }
        });

      }


    });

    
      

    // db.collection('login').insertOne({ id: userId, pw : userPw},function(error,result){
    //     res.redirect('/');
    // });
  });


  module.exports = router; // module.exports = 내보낼 변수명

