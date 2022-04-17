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
    var userId=req.user.userId;

    // db애 저장된 post라는 collection안의 데이터 꺼내기
    // db.collection('post').find().toArray(function(error,result){
    //   res.render('list.ejs',{posts: result});
    // });
    var params = [userId, userId];
    // 내가쓴 글을 제외한 전체 리스트
    var selectSql1 = 'select board_seq as boardSeq, title as title, view_count as viewCount, reg_id as reqId, favorite_count as favoriteCount, upt_dt as uptDt from nodejs.tb_user_board where reg_id <> ? order by	upt_dt desc';
    
    maria.query(selectSql1,params,function(err,result){
        if(!err){
            if(result.length>0){
                // 나의 좋아요 리스트
                var selectSql2 = 'select board_seq as boardSeq from nodejs.tb_board_favorite where favorite_name =?'; 
                maria.query(selectSql2,params,function(err2,result2){
                      if(!err2){
                        res.render('list.ejs',{listResult:result,favResult:result2});
                      }  
                });
                
               // res.render('list.ejs');
            }else{
              // TODO : 에러시 에러 페이지로 이동

            }
          }
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

// 좋아요 클릭
router.post('/fav', function(req,res){
    var userId=req.user.userId;
    var param=req.body.param; // 좋아요 취소/추가
    var boardSeq=req.body.boardSeq; 
    var params =[boardSeq,userId];
    console.log("back");
    var selectSql = 'select count(*) as cnt from nodejs.tb_board_favorite where board_seq =? and favorite_name =?';
    maria.query(selectSql,params,function(err,result){
        console.log("select");
        if(!err){
            if(result[0].cnt < 1){
                // 기존 데이터가 없을 때는 insert 처리
                var params2 = [boardSeq,userId,param,userId,userId];
                console.log(params2);
                var insertSql = 'insert into nodejs.tb_board_favorite(board_seq, favorite_name, fav, reg_dt, reg_id, upt_dt, upt_id) values(?,?,?,now(),?,now(),?)';
                maria.query(insertSql,params2,function(err,rows,fields){
                    console.log("insert");
                    console.log(rows);
                    console.log(fields);
                    if(!err){
                        
                        res.writeHead(200,{'Content-Type':'text/html; charset=utf-8;'});
                        if(rows.affectedRows>0){
                            // 글 작성 성공!
                            
                            res.write("<script>alert('좋아요 완료!');location.href='/board/list';</script>");
                            
                            
                           // res.render('list.ejs');
                        }else{
                          
                          res.write("<script>alert('좋아요 실패!');</script>");
                        }
                      }
                });
            }else{
                // 기존 데이터가 있을 때는 update 처리
                var params3 = [boardSeq,userId,param,userId,boardSeq,userId];
                var updateSql = 'update nodejs.tb_board_favorite set board_seq = ?, favorite_name = ?, fav = ? ,upt_dt=now(), upt_id = ? where board_seq=? and favorite_name=?';
                maria.query(updateSql,params3,function(err,rows,fields){
                    console.log("update");
                    console.log(rows);
                    console.log(fields);
                    if(!err){
                       
                        res.writeHead(200,{'Content-Type':'text/html; charset=utf-8;'});
                        if(rows.affectedRows>0){
                            // update 성공!
                            
                            res.write("<script>alert('좋아요 완료!');location.href='/board/list';</script>");                            
                            
                        }else{
                            // update 실패!
                          res.write("<script>alert('좋아요 실패!');</script>");
                        }
                      }
                });
            }
           
        }
    });

   

   
    
});


module.exports = router; // module.exports = 내보낼 변수명