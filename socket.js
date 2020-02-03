const express = require('express');
const app = express();
const server = require('http').Server(app);
const io = require('socket.io')(server);
var bodyParser = require('body-parser');
var mysql = require("mysql");

const con = mysql.createPool({
  host: 'localhost',
  port: '3306',
  user: 'root',
  password: '[hys10130857]',
  database: "person_project"
})//連接到mySQL

app.use(express.static("public"));// 待改善: 訊息按enter可直接發送
//新增走失紀錄api
app.use('/lost_record', require('./routes/lost_record'));
app.use('/lost_detail', require('./routes/lost_detail'));
app.use('/lost_mark', require('./routes/lost_mark'));

//各房間的user list
var roomInfo = {};

// 當發生連線事件
io.on('connection', async function(socket){
	//拆解網址找出id
	var url = socket.request.headers.referer;
	var splited = url.split('=');
	var socketid = splited[splited.length - 1];
	//加入房間
	socket.join(socketid);
	console.log('有人加入了room ' + socketid);
	//歷史訊息
	const messsage_promise = new Promise((resolve, reject) => {
		con.query("SELECT name, content, time from socket"+socketid, function(err,res){
			if(err){
				console.log(err);
			}else{
				console.log("select history message of room "+socketid+" successful!");
				console.log("history message: ");
				console.log(res);
				resolve(res);
			}
		})
	})
	const history = await messsage_promise;
	io.to(socketid).emit('history', history);
	
	//接收前端message事件
	socket.on("message", function(obj){
		console.log("收到前端: ");
		console.log(obj);
		//把資料新增進db
		var data = {
			name:obj.name,
			content:obj.content,
			time:Date.now()
		}
		con.query("INSERT INTO socket" +socketid+ " set?", data, function(err,res){
			if(err){
				console.log(err);
			}else{
				console.log("insert message to db successful!");
			}
		})
		
		//回傳給前端
		io.to(socketid).emit("message", obj);
	});

	// 當發生離線事件
	socket.on("disconnect", function(){
		console.log('有人離開了room ' + socketid);
		socket.leave(socketid);
	});
});


app.get('/room', async function(req, res){
	socketid = req.query.id;
	res.sendFile(__dirname + '/public/socket.html');
});

// 注意，這邊的 server 原本是 app 
//why???
server.listen(3000, function(){
    console.log("已連線到http://localhost:3000");
});