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

router.use(loginCheck);

// EJS사용(jstl과 비슷)
// get 요청 : /list 로 접속하면 html에서 db의 데이터를 보여줌
router.get('/list', function(req,res){

    // db애 저장된 post라는 collection안의 데이터 꺼내기
    db.collection('post').find().toArray(function(error,result){
      res.render('list.ejs',{posts: result});

    });
 
});

router.get('/write', function(req,res){
    res.render('write.ejs');
});

router.post('/boardAdd', (req,res)=>{   
    var seq;
    var seqSql = 'select nextval(nodejs.sq_user_board) as seq from dual';
    maria.query(seqSql,function(err,rows,fields){
        seq = rows[0].seq;
        var userId=req.user.userId;
        var title=req.body.title;
        var category = req.body.category;
        var content = req.body.content;
        var params =[
            seq,
            title,
            content,
            category,
            userId,
            userId
          ];
        var insertSql = 'INSERT INTO nodejs.tb_user_board(board_seq,title,content,category,reg_dt,reg_id,upt_dt,upt_id) values(?,?,?,?,now(),?,now(),?)';
        maria.query(insertSql,params,function(err,rows,fields){
            if(!err){
                //console.log(rows);
                // console.log(rows[0].idCount);
                // res.send('success');
                res.writeHead(200,{'Content-Type':'text/html; charset=utf-8;'});
                if(rows.affectedRows>0){
                    // 글 작성 성공!
                    
                    res.write("<script>alert('글 작성 완료!');location.href='/board/list';</script>");
                    
                    
                   // res.render('list.ejs');
                }else{
                  
                  res.write("<script>alert('글 작성 실패!');</script>");
                }
              }
        });
       
    });
    
    // db.collection('counter').findOne({name: '게시물갯수'},function(error,result){
    //     let title = req.body.title;
    //     let date = req.body.date;
    //     let register = req.user.id;
    
    //     let totalPost = result.totalPost;
    //     db.collection('post').insertOne({_id:totalPost+1, title : title, date : date, regUser : register },function(error,result){
    //         db.collection('counter').updateOne({name:'게시물갯수'},{$inc:{totalPost:+1}},function(error,result){
    //             // 콜백함수
    //             if(error){return console.log(error);}


    //         });
    //     });
    // });
 
    
   
  });
router.delete('/delete',function(req,res){
    // 요청.body에 담겨온 게시물번호를 가진 글을 db에서 찾아서 삭제 
    var deleteData = {_id : parseInt(req.body._id), regUser : req.user.id}    
    
    db.collection('post').deleteOne(deleteData,function(error,result){
        // console.log('삭제완료');
        // 200, 400, 500 에러 분기처리해야 함
        // if(result) {console.log(result)}
        res.status(200).send({message: 'success', error:error});

        // res.status(400).send({message: 'success', error:error}); // 에러는 값을 전송할 수 없음.

    });

});
 

module.exports = router; // module.exports = 내보낼 변수명