var router = require('express').Router(); // 라우터 만들때 필수!

// require('/shop.js'); // 


  router.get('/sports',function(req,res){
    res.send('스포츠 게시판');
  });

  router.get('/game',function(req,res){
    res.send('게임 게시판');
  });

  module.exports = router; // module.exports = 내보낼 변수명