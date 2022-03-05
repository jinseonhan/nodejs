require('dotenv').config();


const express = require('express');
const res = require('express/lib/response');
const app = express();
const bodyParser = require('body-parser');
const methodOverride = require('method-override');
app.use(methodOverride('_method'));

const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const session = require('express-session');
app.use(session({secret:'secretCode', resave:true, saveUninitialized:false}));
app.use(passport.initialize());
app.use(passport.session());




app.use(bodyParser.urlencoded({extended:true}));
app.set('view engine','ejs');

// public 추가(middle ware)
app.use('/public', express.static('public')); 

// db 설정
const MongoClient = require('mongodb').MongoClient;
MongoClient.connect(process.env.DB_URL,function(error,client){
    // 연결되면 할일
    // db 접근
    db = client.db('todoapp');
    if(error){
        return console.log("에러발생 이유 : "+error);
    }
    app.listen(process.env.PORT,function(){
        console.log("listening on 8080");
    });

//    client.close();
});

// return : error check
function errorCheck(error){
    if (err instanceof AuthenticationError) {
        return res.status(401).send('not authenticated')
      }
      
      if (err instanceof UnauthorizedError) {
        return res.status(403).send('forbidden')
      }
      
      if (err instanceof InvalidInputError) {
        return res.status(400).send('bad request')
      }
      
      if (err instanceof DuplicateKeyError) {
        return res.status(409).send('conflict. entity already exists')
      }
}

// detail 로 접속하면 상세페이지 detail.ejs를 보여줌
app.get('/detail/:id',function(req,res){ // :id : parameter

    db.collection('post').findOne({_id:parseInt(req.params.id)},function(error,result){
       
        res.render('detail.ejs',{data : result});
    });
   
});

// edit
app.get('/editPage/:id',function(req,res){
    db.collection('post').findOne({_id:parseInt(req.params.id)},function(error,result){
        
        res.render('editPage.ejs',{data : result});
    });
});

app.get('/', function(req,res){
    res.render('index.ejs');
});

app.get('/pet', function(req,res){
    res.send('반갑습니다.');
});

app.get('/write', function(req,res){
    res.render('write.ejs');
});



// EJS사용(jstl과 비슷)
// get 요청 : /list 로 접속하면 html에서 db의 데이터를 보여줌
app.get('/list', function(req,res){

    // db애 저장된 post라는 collection안의 데이터 꺼내기
    db.collection('post').find().toArray(function(error,result){
      
      res.render('list.ejs',{posts: result});

    });
 
});




app.put('/edit',function(req,res){
    // form에 담긴 제목, 날짜 데이터를 db.collection에 update
    db.collection('post').updateOne({_id: parseInt(req.body.id)},{$set : {title:req.body.title, date:req.body.date}},function(error,result){
        console.log('수정완료'); // $set : 없는 값은 insert가 됨
    });
});

app.get('/myPage',loginCheck,function(req,res){ // url , 콜백전 실행 함수
    console.log(req.user); // string값을 붙이면 데이터값들이 찍히지 않고 (String값+[obj:obj])로 나온다.
    res.render('myPage.ejs',{data:req.user});
});

function loginCheck(req,res,next){
    // 로그인 상태 확인
    if(req.user){
        next();
    }else{
        res.send('재 로그인 해주세요.');
        
    }
}

app.get('/login',function(req,res){
    res.render('login.ejs');
});

app.post('/login',passport.authenticate('local',{
    failureRedirect : '/fail'
}),function(req,res){
    res.redirect('/');
});

app.get('/fail',function(req,res){
    res.render('fail.ejs');
});

// TODO : 암호화 해야함
// 로그인 검증 로직
passport.use(new LocalStrategy({
    usernameField: 'id', // 유저가 입력한 아아디 , 비번 항목이 무엇인지 정의
    passwordField: 'pw',
    session: true,      // 세션 저장 여부
    passReqToCallback: false,
  }, function (id, pw, done) {
    //console.log(입력한아이디, 입력한비번);
    db.collection('login').findOne({ id: id }, function (error, result) {
      if (error) return done(error)
  
      if (!result) return done(null, false, { message: '존재하지않는 아이디입니다.' });  // 서버에러, 성공시 사용자 db데이터, 에러메시지 
      if (pw == result.pw) {
        return done(null, result);
      } else {
        return done(null, false, { message: '비번번호를 잘못입력하셨습니다.' });
      }
    })
  }));


  // 로그인 성공 (세션)
  passport.serializeUser(function(user, done){
    done(null, user.id);
  });
  // 로그인 관련 (세션) 정보 해석
  passport.deserializeUser(function(id,done){ // 세션에 담긴 id
    // db에서 위의 user.id로 유저를 찾은 뒤에 유저 정보를 {}에 넣음
    db.collection('login').findOne({id:id},function(error,result){
        done(null,result); 
    });
  });

  app.post('/add', (req,res)=>{    
    db.collection('counter').findOne({name: '게시물갯수'},function(error,result){
        let title = req.body.title;
        let date = req.body.date;
        let register = req.user.id;
    
        let totalPost = result.totalPost;
        db.collection('post').insertOne({_id:totalPost+1, title : title, date : date, regUser : register },function(error,result){
            db.collection('counter').updateOne({name:'게시물갯수'},{$inc:{totalPost:+1}},function(error,result){
                // 콜백함수
                if(error){return console.log(error);}


            });
        });
    });
 
    res.send("전송완료"); 
   
});
app.delete('/delete',function(req,res){
    // 요청.body에 담겨온 게시물번호를 가진 글을 db에서 찾아서 삭제 
    var deleteData = {_id : parseInt(req.body._id), regUser : req.user.id}    
    
    db.collection('post').deleteOne(deleteData,function(error,result){
        console.log('삭제완료');
        // 200, 400, 500 에러 분기처리해야 함
        if(result) {console.log(result)}
        res.status(200).send({message: 'success', error:error});

        // res.status(400).send({message: 'success', error:error}); // 에러는 값을 전송할 수 없음.

    });

});


  app.post('/register',function(req,res){
        //  기능 만들기
        // 1. 아이디 저장전 중복 체크
        // 2. id가 정해진 형식대로 작성되었는지
         // 3. pwd는 암호화 했나

    db.collection('login').insertOne({ id: req.body.id, pw : req.body.pw},function(error,result){
        res.redirect('/');
    });
  });



  // list - 검색기능
  app.get('/search',(req,res)=>{ // app.get보다 db.collection내부가 먼저 실행된다.
  //  console.log("콘솔이 더 늦게 찍히나?"+req.query); // queryString -> obj로 변환 { value: 'dlekRrl' }
  //  console.log(req.query.value); // obj에서 꺼내기
  var searchCondition = [
    {
        $search : {
            index : 'titleSearch',
            text :{
                query : req.query.value,
                path : 'title' // 제목날짜 둘다 찾고싶으면 [ '제목', '날짜' ]
            }
        }
     },
     {$project : {title : 1, _id:0,score:{$meta:"searchScore"}}} // 검색조건 필터 + 스코어
    //  {$sort:{_id : 1}}, // 검색조건 : 정렬
    //  {$limit : 3}    // 검색조건 : 상위 3개
    ];
    db.collection('post').aggregate(searchCondition).toArray(function(error,result){
       console.log(result);
        // index : or 검색, 빠른 검색가능 , '-' : 해당내용 제외, 더블 커텐션 ("") : 정확히 일치하는 것만 검색, 띄어쓰기 기준으로 검색
        res.render('list.ejs',{posts: result});
    });
  });
  var now = new Date();
  var date = now.getFullYear+now.getMonth+now.getDate;
  // TODO : 파일명에 날짜 더하기


  let multer = require('multer');
  var storage = multer.diskStorage({
      destination : function(req,file,cb){
        cb(null, './public/image'); // 파일경로 설정
      },
      filename : function(req,file,cb){
        cb(null,file.originalname); // 파일명 설정
      },
      filefilter : function (req, file, callback) { // 확장자 제한
            var ext = path.extname(file.originalname);
            if(ext !== '.png' && ext !== '.jpg' && ext !== '.jpeg') {
                return callback(new Error('PNG, JPG만 업로드하세요'))
            }
            callback(null, true)
      },
      limits:{ // 파일사이즈 제한
        fileSize: 1024 * 1024
    }
  }); // ROM에 저장

  var upload = multer({storage:storage});

  // var storage2 = multer.memoryStorage({}); // RAM에 저장(휘발)
   
  app.get('/upload',function(req,res){
    res.render('upload.ejs');
  });
// npm install multer 라이브러리 적용
  app.post('/upload', upload.single('profile'), function(req,res){
    res.send('파일 업로드 완료');
  });
    // app.post('/upload', upload.array('profile',10), function(req,res){
    //     res.send('파일 업로드 완료');
    // });

  app.get('/image/:imageName',function(req,res){
      res.sendFile(__dirname+'/public/image/'+req.params.imageName);
  }); 

  // TODO : 채팅방 들어가기
  // 1. 로그인이 되어있는지 확인
  // 2. 해당 게시물을 작성한 사람과 로그인한 사람의 데이터를 DB에 저장
  

  app.use('/shop',require('./routes/shop.js')); // node.js 에서는 server.js의 현재경로에서 부터 시작하는것이 국룰이란다.
  app.use('/board/sub',require('./routes/board.js')); 
  app.use('/chat',require('./routes/chat.js'));
