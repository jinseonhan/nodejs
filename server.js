require('dotenv').config();


const express = require('express');
const res = require('express/lib/response');
const app = express();

// mariadb 연결
const maria = require('./database/connect/maria');
maria.connect();

// socket.io lib
const http = require('http').createServer(app);
const {Server} = require('socket.io');
const io = new Server(http);

const bodyParser = require('body-parser');
const methodOverride = require('method-override');
app.use(methodOverride('_method'));

const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const session = require('express-session');
app.use(session({secret:'secretCode', resave:true, saveUninitialized:false}));
app.use(passport.initialize());
app.use(passport.session());

/* S : 유저 객체 */
// const userOjt = function(userSeq,userId,userPwd,userEmail,regId,regDt,uptId,uptDt){
//    this.userSeq = userSeq;
//    this.userId = userId;
//    this.userPwd = userPwd;
//    this.userEmail = userEmail;
//    this.regId = regId;
//    this.regDt = regDt;
//    this.uptId = uptId;
//    this.uptDt = uptDt;
//    this.toString = function(){
//       return 'userSeq : '+userSeq+ ', userId : '+userId+ '\n';
//    }
// }
// global.userOjt = userOjt;
/* E : 유저 객체 */

/*  S : 암호화 모듈 연결 */
const crypto = require('crypto'); // 단방향 암호화
global.crypto = crypto;
const crpyto_js = require('crypto-js'); // 양방향 암호화
/*  E : 암호화 모듈 연결 */

/* S : 암호화 모듈 */
function encrypt(data, key){
  return crpyto_js.AES.encrypt(data,key).toString();
}
function decrypt(data, key){
  return crpyto_js.AES.decrypt(data,key).toString(crpyto_js.enc.Utf8);
}
global.encrypt = encrypt;
global.decrypt = decrypt;

const encryptKey ="jshan"; // 암호화 키값
global.encryptKey = encryptKey;

/* E : 암호화 모듈 */




app.use(bodyParser.urlencoded({extended:true}));
app.set('view engine','ejs');

// public 추가(middle ware)
app.use('/public', express.static('public')); 




// mongodb 설정
const MongoClient = require('mongodb').MongoClient;
MongoClient.connect(process.env.DB_URL,function(error,client){
    // 연결되면 할일
    // db 접근
    db = client.db('todoapp');
    if(error){
        return console.log("에러발생 이유 : "+error);
    }
    http.listen(process.env.PORT,function(){
        console.log("listening on 8080");
       
    });

//    client.close();
});

app.get('/socketChat',function(req,res){
  res.render('socketChat.ejs');
});
io.on('connection',function(socket){
  
  socket.on('joinRoom1',function(data){
    socket.join('room1');
  });
  socket.on('room1-send',function(data){
    io.to('room1').emit('broadcast',data);
  });
  
  socket.on('user-send',function(data){
    io.to(socket.id).emit('broadcast',data);

  });

  
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
// app.get('/editPage/:id',function(req,res){
//     db.collection('post').findOne({_id:parseInt(req.params.id)},function(error,result){
        
//         res.render('editPage.ejs',{data : result});
//     });
// });

app.get('/', function(req,res){
    res.render('index.ejs');
});

// app.get('/pet', function(req,res){
//     res.send('반갑습니다.');
// });








app.put('/edit',function(req,res){
    // form에 담긴 제목, 날짜 데이터를 db.collection에 update
    db.collection('post').updateOne({_id: parseInt(req.body.id)},{$set : {title:req.body.title, date:req.body.date}},function(error,result){
        //console.log('수정완료'); // $set : 없는 값은 insert가 됨
    });
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
    failureRedirect : '/login' // TODO : 여기에 pwd 5번 틀렸을시 로그인 막기
    ,failureMessage : true
    ,
}),function(req,res){
  // TODO : 로그인 로그 기록 저장
  
  res.send('success');
});

app.get('/fail',function(req,res){
    res.render('fail.ejs');
});

// 로그인 검증 로직
passport.use(new LocalStrategy({
    usernameField: 'id', // 유저가 입력한 아아디 , 비번 항목이 무엇인지 정의
    passwordField: 'pw',
    session: true,      // 세션 저장 여부
    passReqToCallback: false,
  }, function (id, pw, done) {
    //console.log(입력한아이디, 입력한비번);
    var userId = id;
    var userPwd = crypto.createHash('sha512').update(pw).digest('base64');

    //console.log("id : "+ userId);
    //console.log("pwd : "+ userPwd);
    var sql = 'SELECT USER_ID as userId,USER_PWD as userPwd FROM nodejs.tb_user_pub WHERE USER_ID = ? AND USER_PWD = ?';
    maria.query(sql,[userId,userPwd],function(err,rows,fields){ // row : data값(배열로), fields :  data정보
      
      if(!err){
        // console.log(rows);
        // console.log("rows.length : "+rows.length);
        if(rows.length===0){
          return done(null,false, {message : '일치하는 정보가 없습니다,'});
        }else{
          return done(null,rows[0]);
          // return done(null,rows);
        }
      }




    // db.collection('login').findOne({ id: id }, function (error, user) {
    //   if (error) return done(error);
  
    //   if (!user) return done(null, false, { message: '존재하지않는 아이디입니다.' });  // 서버에러, 성공시 사용자 db데이터, 에러메시지 
    //   if (crypto.createHash('sha512').update(pw).digest('base64') == user.pw) {
    //     return done(null, user);
    //   } else {
    //     return done(null, false, { message: '비번번호를 잘못입력하셨습니다.' });
    //   }
    });
  }));


  // 로그인 성공시 세션에 id저장 (세션)
  passport.serializeUser(function(user, done){
    //console.log(user);
    // console.log(user.userId);
    // console.log("loginSuccess : "+user);
    done(null, user.userId);
  });
  // 로그인 여부 확인 (세션에 저장된 id를 가지고 로그인 여부 확인)
  passport.deserializeUser(function(id,done){ // id : 세션에 담긴 id(id를 이용하여 로그인 확인)
    var sql = 'SELECT USER_ID as userId FROM nodejs.tb_user_pub WHERE USER_ID = ?';
    maria.query(sql,[id],function(err,rows,fields){ // row : data값(배열로), fields :  data정보
      done(null,rows[0]);
    });
    
    // db에서 위의 user.id로 유저를 찾은 뒤에 유저 정보를 {}에 넣음
    // db.collection('login').findOne({id:id},function(error,result){
        // done(null,result); 
    // });
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
       //console.log(result);
        // index : or 검색, 빠른 검색가능 , '-' : 해당내용 제외, 더블 커텐션 ("") : 정확히 일치하는 것만 검색, 띄어쓰기 기준으로 검색
        res.render('list.ejs',{posts: result});
    });
  });
  var now = new Date();
  var date = now.getFullYear+now.getMonth+now.getDate;
  // TODO : 파일명에 날짜 더하기


  let multer = require('multer');
  // const { path } = require('express/lib/application');
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
    //console.log(req.file);
    res.send('파일 업로드 완료');
  });
    // app.post('/upload', upload.array('profile',10), function(req,res){
    //     res.send('파일 업로드 완료');
    // });

  app.get('/image/:imageName',function(req,res){
      res.sendFile(__dirname+'/public/image/'+req.params.imageName);
  }); 
  
  // 모달페이지
  app.get('/modal',function(req,res){
    res.render("modal.ejs");
  });
  // TODO : 채팅방 들어가기
  // 1. 로그인이 되어있는지 확인
  // 2. 해당 게시물을 작성한 사람과 로그인한 사람의 데이터를 DB에 저장
  

  app.use('/shop',require('./routes/shop.js')); // node.js 에서는 server.js의 현재경로에서 부터 시작하는것이 국룰이란다.
  app.use('/board/sub',require('./routes/board_temp.js')); 
  app.use('/chat',require('./routes/chat.js'));
  app.use('/member',require('./routes/member.js')); 
  app.use('/board',require('./routes/board.js'));
