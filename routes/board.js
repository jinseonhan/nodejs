const { render } = require('express/lib/response');
var router = require('express').Router(); // 라우터 만들때 필수!

const maria = require('../database/connect/maria');
let multer = require('multer');
const path = require('path');
const storage = multer.diskStorage({
    destination : function(req,file,cb){
        cb(null, './public/image'); // 파일경로 설정
    },
    filename : function(req,file,cb){
        let newFileName = new Date().valueOf()+path.extname(file.originalname);
        cb(null,newFileName); // 파일명 설정
    },
    filefilter : function (req, file, callback) { // 확장자 제한
          var ext = path.extname(file.originalname);
          if(ext !== '.png' && ext !== '.jpg' && ext !== '.jpeg') {
              return callback(new Error('PNG, JPG만 업로드하세요'));
          }
          callback(null, true);
    },
    limits:{ // 파일사이즈 제한
      fileSize: 1024 * 1024
  }
}); // ROM에 저장

var upload = multer({storage:storage});
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
    var selectSql1 = 'select B.fav as fav,	A.board_seq as boardSeq,	A.title as title,	A.view_count as viewCount,	A.reg_id as regId, A.favorite_count as favoriteCount, DATE_FORMAT( A.upt_dt, "%Y-%m-%d") as uptDt from nodejs.tb_user_board A left join ( select board_seq, count(fav) as fav from nodejs.tb_board_favorite group by board_seq )B on A.board_seq = B.board_seq where A.reg_id <> ? order by A.upt_dt desc;';
    
    maria.query(selectSql1,params,function(err,result){
        if(!err){
            if(result.length>0){
                // 나의 좋아요 리스트
                var selectSql2 = 'select board_seq as boardSeq,fav as fav from nodejs.tb_board_favorite where favorite_name =?'; 
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

router.post('/boardAdd', upload.single('image'),(req,res)=>{   
    var boardSeq;
    var seqSql = 'select nextval(nodejs.sq_user_board) as boardSeq from dual';
    maria.query(seqSql,function(err,rows,fields){
        boardSeq = rows[0].boardSeq;
        var userId=req.user.userId;
        var title=req.body.title;
        var category = req.body.category;
        var content = req.body.content;
        var params =[
            boardSeq,
            title,
            content,
            category,
            userId,
            userId
          ];
        var insertSql = 'INSERT INTO nodejs.tb_user_board(board_seq,title,content,category,reg_dt,reg_id,upt_dt,upt_id) values(?,?,?,?,now(),?,now(),?)';
        maria.query(insertSql,params,function(err,rows,fields){  // board table insert

            if(!err){
                    
                    // console.log(req.file);
                    var originalname = req.file.originalname;
                    var filename = req.file.filename;
                    var fileParam = [boardSeq,originalname,filename,userId,userId];
                    var fileInsertQuery = "insert into nodejs.tb_file_list(board_seq, file_origin_name, file_name,del_yn, reg_dt, reg_id, upt_dt,upt_id) values(?,?,?,'N',now(),?,now(),?)";
                    res.writeHead(200,{'Content-Type':'text/html; charset=utf-8;'});
                    maria.query(fileInsertQuery,fileParam,function(err,rows,fields){
                        if(!err){
                            res.write("<script>alert('글 작성 완료!');location.href='/board/list';</script>");
                               
                        }else{
                            res.write("<script>alert('글 작성 실패!');</script>");

                        } 
                    });

                
              }
        });
       

    });
   
    
   
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
router.post('/fav', function(req,res,next){
    var userId=req.user.userId;
    var param=req.body.param; // 좋아요 취소/추가
    var boardSeq=req.body.boardSeq; 
    var params =[boardSeq,userId];
    // console.log("back");
    var selectSql = 'select count(*) as cnt from nodejs.tb_board_favorite where board_seq =? and favorite_name =?';
    maria.query(selectSql,params,function(err,result){
        // console.log("select");
        if(!err){
            if(result[0].cnt < 1){
                // 기존 데이터가 없을 때는 insert 처리
                var params2 = [boardSeq,userId,param,userId,userId];
                // console.log(params2);
                var insertSql = 'insert into nodejs.tb_board_favorite(board_seq, favorite_name, fav, reg_dt, reg_id, upt_dt, upt_id) values(?,?,?,now(),?,now(),?)';
                maria.query(insertSql,params2,function(err,rows,fields){
                    // console.log("insert");
                    // console.log(rows);
                    // console.log(rows.affectedRows);
                    // //console.log(fields);
                    
                    if(err){
                        res.send({message: 'fail'});

                        return next(err);
                      }

                        res.send({message: "succes"});
                      
                      
                });
            }else{
                // 기존 데이터가 있을 때는 update 처리
                var params3 = [boardSeq,userId,param,userId,boardSeq,userId];
                var updateSql = 'update nodejs.tb_board_favorite set board_seq = ?, favorite_name = ?, fav = ? ,upt_dt=now(), upt_id = ? where board_seq=? and favorite_name=?';
                maria.query(updateSql,params3,function(err,rows,fields){
                    // console.log("update");
                    // console.log(rows);
                    // console.log(fields);
                    if(err){
                        res.send({message: 'fail'});

                        return next(err);
                      }

                        res.send({message:"success"});
                      
                });
            }
           
        }
    });

   

   
    
});

// 게시판 상세보기
router.post('/detail', function(req,res,next){
    var userId=req.user.userId;
    var boardSeq = req.body.boardSeq;


});

module.exports = router; // module.exports = 내보낼 변수명