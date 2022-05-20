const { render } = require('express/lib/response');

var router = require('express').Router(); // 라우터 만들때 필수!

const maria = require('../database/connect/maria');

function loginCheck(req,res,next){
  // 로그인 상태 확인
  // console.log(req);
  if(req.user){
      next();
  }else{
      res.send('재 로그인 해주세요.');
      
  }
}




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
    var userEmail = encrypt(req.body.email,encryptKey);
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


  /* 마이페이지 영역 */
  router.get('/myPage',loginCheck,function(req,res){ // url , 콜백전 실행 함수
     // 1. 아아디 불러오기
    var userId = req.user.userId;
    var myBoardCount;
    var myBoardCountsql = 'select count(board_seq) as cnt from nodejs.tb_user_board where reg_id = ? ';
    // 2. 등록된 게시물 갯수
    maria.query(myBoardCountsql,userId,function(err,result){ // row : data값(배열로), fields :  data정보
      
          myBoardCount = result[0].cnt;  
      
    });
    
    // 3. 게시물들 불러오기(list와 동일)
    var myboardListSql='select B.fav as fav,	A.board_seq as boardSeq,A.title as title,	A.view_count as viewCount,A.reg_id as regId,	A.favorite_count as favoriteCount,	DATE_FORMAT( A.upt_dt, "%Y-%m-%d") as uptDt, C.category_name as categoryName, D.file_seq as fileSeq, D.file_name as fileName 	from	nodejs.tb_user_board A left join (	select		board_seq,		count(fav) as fav from		nodejs.tb_board_favorite group by		board_seq )B on	A.board_seq = B.board_seq left JOIN 	(select 		category_seq,		category_name,		category_comment from	nodejs.tb_board_category) C	on A.category = C.category_seq left join (select file_seq, board_seq, file_name from nodejs.tb_file_list) D on	A.board_seq = D.board_seq  where A.reg_id = ? order by A.upt_dt desc';

    maria.query(myboardListSql,userId,function(err2,result2){ // row : data값(배열로), fields :  data정보
          // result2 는 배열로 받게됨
          // console.log(myBoardCount);
          res.render('myPage.ejs',{userId:userId,myBoardCount:myBoardCount,listResult:result2});
      
    });
   
    // 회원정보 수정 페이지
    router.get('/editInfomyPage',loginCheck,function(req,res){ // url , 콜백전 실행 함수

        var userId = req.user.userId;
        var myInfoSql = "select user_email as userEmail from nodejs.tb_user_pub where user_id = ?";
        maria.query(myInfoSql,userId,function(err,result){ 
            if(!err){

              var user = new Object();
              user.userEmail = decrypt(result[0].userEmail, encryptKey);
              user.userId = userId;
              // console.log(user.userId);
              // console.log(user.userEmail);
              res.render('editInfoPage.ejs',{myInfo:user});
            }

        });

    });
   
  });

  // 회원정보수정하기
  router.post('/update',function(req,res){
    var userId = req.user.userId;
    var userEmail = encrypt(req.body.email,encryptKey);
    
    var params =[
      userEmail
      ,userId
    ];
    var updateSql ='update nodejs.tb_user_pub set user_email = ? where user_id = ?';
    maria.query(updateSql,params,function(err,rows,fields){ // row : data값(배열로), fields :  data정보
      // console.log(rows);
      if(!err){
        if(rows.affectedRows>0){
              
          res.send('success');
        }else{
          
          res.send('fail');
        }
      }else{
        res.send('fail');
      }


    });
  });
  // pwd 변경 페이지
  router.get('/editPwd',function(req,res){
      res.render("editPwd.ejs");
      // console.log("들어옴")
  });

  // pwd 변경
  router.post('/editPwd',function(req,res){
    var userId = req.user.userId;
    var originPwd = crypto.createHash('sha512').update(req.body.originPwd).digest('base64');
    var changePwd1 = crypto.createHash('sha512').update(req.body.changePwd1).digest('base64');
    var params =[    
      userId,
      originPwd
    ];
    // 1. 아이디와 비밀번호가 일치하는 것이 있는지
    var selectSql1 ='select user_pwd as userPwd from nodejs.tb_user_pub  where user_id = ? and user_pwd = ?';
    maria.query(selectSql1,params,function(err,rows,fields){ // row : data값(배열로), fields :  data정보
      var userPwd = rows[0].userPwd;
      if(err){
        console.log("err");

        res.send('fail'); 
      }else{
        if(userPwd != originPwd){
          res.send('notExist')
        }
      }
    });

    // 2. 이전 pwd, 현재 pwd와 비교하여 같은 것이면 안됨
    var selectSql2 ='select B.prev_pwd as prevPwd, B.new_pwd as newPwd from nodejs.tb_user_pub A left join nodejs.tb_pwd_hist B on A.user_seq = B.user_seq where A.user_id = ?';
    maria.query(selectSql2,[userId],function(err2,rows2,fields2){ // row : data값(배열로), fields :  data정보
      if(err2){
        console.log("err2");
        res.send('fail'); 
      }else{
        // 입력된 pwd와 prevPwd, newPwd 값이 같은것이 있는지 확인
        if(changePwd1 == rows2[0].prevPwd || changePwd1 == rows2[0].newPwd){
          res.send('duplicate');
        }
      }
    });

    // 3. 위의 2가지 조건을 만족하면 현재 pwd를 변경하고, pwd history 테이블의 값도 업데이트한다.
    var updateParams = [
      changePwd1,
      changePwd1,
      userId,
      userId,
      userId
    ];
    var updateSql ='UPDATE  nodejs.tb_user_pub A, nodejs.tb_pwd_hist B SET  A.user_pwd  = ?, B.prev_pwd = B.new_pwd, B.new_pwd = ?, B.upt_dt = now(), A.upt_dt  = now(), A.upt_id = ?, B.upt_id = ? WHERE A.user_id = ?';
    maria.query(updateSql,updateParams,function(err3,rows3,fields3){ // rows : data값(배열로), fields :  data정보
      if(err3){
        console.log("err3");

        res.send('fail'); 
      }else{
        res.send('success');
      }
      
    });


  });

  module.exports = router; // module.exports = 내보낼 변수명

