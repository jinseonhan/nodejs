var router = require('express').Router(); // 라우터 만들때 필수!

// require('/shop.js'); // 
function loginCheck(req,res,next){
    // 로그인 상태 확인
    if(req.user){
        next();
    }else{
        res.send('재 로그인 해주세요.');
        
    }
}

//router.use(loginCheck); // 미들웨어로 아래 모든 소스에 로그인 체크 적용하기
router.use('/shirts',loginCheck); // 특정 페이지에만 로그인 체크하기

  router.get('/shirts',function(req,res){
    res.send('셔츠파는 페이지');
  });

  router.get('/pants',function(req,res){
    res.send('바지파는 페이지');
  });


  module.exports = router; // module.exports = 내보낼 변수명