var router = require('express').Router(); // 라우터 만들때 필수!

function loginCheck(req,res,next){
    // 로그인 상태 확인
    if(req.user){
        next();
    }else{
        res.send('재 로그인 해주세요.');
        
    }
}

router.use(loginCheck);

router.post('/chatroom',function(req,res){
    var targetId = req.body.targetId;
    var userId = req.user.id;
    // 1. 기존 진행되고 있는 채팅방이 있었는지 확인 
    db.collection('chatroom').find({member:{targetId,userId}}).toArray(function(error,result){
        // 2. 없다면 신규 생성해준다.
       
         // 3. 그 방으로 이동시킨다.
         res.render('chatroom.ejs',{chat:result,userId:userId});

    });
});



  
module.exports = router; // module.exports = 내보낼 변수명