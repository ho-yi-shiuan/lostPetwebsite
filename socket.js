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
  password: 'hys10130857',
  database: "person_project"
})//連接到mySQL

app.use(express.static("public"));// 待改善: 訊息按enter可直接發送
//新增走失紀錄api
app.use('/lost_record', require('./routes/lost_record'));

// 當發生連線事件
io.on('connection', async function(socket){
    console.log("user connected");
	console.log(socket.request.headers.referer);
	//歷史訊息
	const messsage_promise = new Promise((resolve, reject) => {
		con.query("SELECT name, content, time from socket", function(err,res){
			if(err){
				console.log(err);
			}else{
				console.log("select history message successful!");
				resolve(res);
			}
		})
	})
	const history = await messsage_promise;
	const socketid = socket.id;
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
		con.query("INSERT INTO socket set?", data, function(err,res){
			if(err){
				console.log(err);
			}else{
				console.log("insert message to db successful!");
			}
		})
		
		//回傳給前端
		io.emit("message", obj);
	});

    // 當發生離線事件
    socket.on("disconnect", function(){
        console.log("user disconnected");
    });
});

// 注意，這邊的 server 原本是 app 
//why???
server.listen(3000, function(){
    console.log("已連線到http://localhost:3000");
});