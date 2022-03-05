//const { render } = require('express/lib/response');

var router = require('express').Router(); // 라우터 만들때 필수!

// 아이디 중복 체크
router.post('/idDuplicateChk',function(req,res){
    var id=req.body.id;
    var duplicateChk = "Y";
    var data ={
        id : id,
    }
    db.collection('login').find(data).toArray(function(error,result){
      for(var i=0; i<result.length;i++){
        if(result[i].id==id){
            duplicateChk="N";
            break;
        }
      }
        res.send(duplicateChk);
    });
});

router.post('/regist',function(req,res){
    var userId = req.body.id;
    var userPw = req.body.pw;    
    //  기능 만들기
    
        // 1. 아이디 저장전 중복 체크
        // 2. id가 정해진 형식대로 작성되었는지
         // 3. pwd는 암호화 했나

    db.collection('login').insertOne({ id: userId, pw : userPw},function(error,result){
        res.redirect('/');
    });
  });


  

  module.exports = router; // module.exports = 내보낼 변수명