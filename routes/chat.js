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

// 
router.get('/message/:parent',function(req,res){
 
    res.writeHead(200, {
        "Connection": "keep-alive",
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
      });
      
    //  res.write('event: test\n');
    //  res.write('data: 안녕하세여\n\n');
    
    db.collection('message').find({parent:req.params.parent}).toArray().then((result)=>{
          res.write('event: test\n'); // event: << 붙여써야함
          res.write('data:'+ JSON.stringify(result) +'\n\n'); // data:  붙여써야함
         
     });

    
});
// 채팅방 입장
router.post('/chatroom',function(req,res){
    var target = req.body.target;
    var data ={
        title : '채팅방1',
        member : [target,req.user.id],
        date : new Date()
    }

    // 판매자와 구매자 기준이기 때문에 대화 상대가 같다고 하더라도 방을 새로 생성해야 한다.
    db.collection('chatroom').find({member:req.user.id}).toArray().then((result)=>{
       if(Object.keys(result).length>0){
            // 기존 데이터가 존재할 때
            // console.log('기존 데이터 존재');

            // TODO : target과의 대화내용가지고 view로 이동

            res.render('chatMain.ejs',{data : result,target : target});
       }else{
            // console.log('기존 데이터 없음');
            // 기존 데이터가 없을 때
            db.collection('chatroom').insertOne(data).then((result)=>{
                     
                   if(result.acknowledged){
                       // 성공 
                       db.collection('chatroom').find({member:req.user.id}).toArray().then((result)=>{
                           //console.log(result);
                           res.render('chatMain.ejs',{data : result,target : target});
                       });
                   }else{
                       // 실패
                       res.send('채팅방 입장 실패!');
                   }
           
            });
       }
    });
   

   


});

router.get('/chatMain',function(req,res){

    db.collection('chatroom').find({member:req.user.id}).toArray().then((result)=>{
        //console.log(result);
        res.render('chatMain.ejs',{data : result});
    });


});

router.post('/msg',function(req,res){
    var data = {
        parent : req.body.parent,
        content : req.body.content,
        userId : req.user.id,
        date : new Date()
    }

    db.collection('message').insertOne(data).then((result)=>{
       // console.log(result);
        res.send('저장 성공');
    }).catch(()=>{
        res.send('저장 실패');
    });

});

// router.post('/chatroom',function(req,res){
//     var targetId = req.body.targetId;
//     var userId = req.user.id;
//     // 1. 기존 진행되고 있는 채팅방이 있었는지 확인 
//     db.collection('chatroom').find({targetId:targetId,userId:userId}).toArray(function(error,result){
//         // 2. 없다면 신규 생성해준다.
//         console.log(result);
//          // 3. 그 방으로 이동시킨다.
//          res.render('chatroom.ejs',{chat:result,userId:userId,targetId:targetId});

//     });
// });

// 채팅 내용 저장
// router.post('/memoSubmit',function(req,res){
//     var chat = req.body.chat;
//     var targetId = req.body.targetId;
//     var userId = req.user.id;
//     // TODO : 날짜 수정
//     var data = {chat:chat, targetId:targetId, userId:userId,date:new Date(),title:userId+"_"+targetId}
//     db.collection('chatroom').insertOne(data,function(error,result){
//         if(error){
//             res.send({message: 'fail', error:error});

//         }else{
//             res.send({message: 'success', error:error});

//         }

//     });
// });
  
module.exports = router; // module.exports = 내보낼 변수명