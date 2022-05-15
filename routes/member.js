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
   
    // 회원정보 수정
    router.get('/editInfomyPage',loginCheck,function(req,res){ // url , 콜백전 실행 함수

        var userId = req.user.userId;
        var myInfoSql = "select user_email as userEmail from nodejs.tb_user_pub where user_id = ?";
        maria.query(myInfoSql,userId,function(err,result){ 
            if(!err){

              var user = new Object();
              user.userEmail = decrypt(result[0].userEmail, encryptKey);
              user.userId = userId;
              console.log(user.userId);
              console.log(user.userEmail);
              res.render('editInfoPage.ejs',{myInfo:user});
            }

        });

    });
   
  });


  module.exports = router; // module.exports = 내보낼 변수명

