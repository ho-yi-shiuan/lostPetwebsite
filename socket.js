const express = require('express');
const app = express();
const server = require('http').Server(app);
const io = require('socket.io')(server);
const AWS = require('aws-sdk');
var mysql = require("./mysqlcon.js");
var bodyParser = require('body-parser');
var mysql = require("mysql");

AWS.config.loadFromPath('./s3_config.json');
var s3Bucket = new AWS.S3( { params: {Bucket: 'yssites.com/person_project/socket'} } );

app.use(express.static("public"));// 待改善: 訊息按 enter可直接發送
//新增走失紀錄 api
app.use('/lost_record', require('./routes/lost_record'));
//room 裡面用到的api
app.use('/lost_detail', require('./routes/lost_detail'));
app.use('/lost_mark', require('./routes/lost_mark'));
//會員系統api
app.use('/signup', require('./routes/signup'));

//各房間的user list
var roomInfo = {};

// 當發生連線事件
io.on('connection', async function(socket){
	//拆解網址找出id
	var url = socket.request.headers.referer;
	var splited = url.split('=');
	var room_id = splited[splited.length - 1];
	//加入房間
	socket.join(room_id);
	console.log('有人加入了room ' + room_id);
	//歷史訊息
	const messsage_promise = new Promise((resolve, reject) => {
		con.query("SELECT name, content, content_type, time from socket"+room_id, function(err,res){
			if(err){
				console.log(err);
			}else{
				console.log("select history message of room "+room_id+" successful!");
				resolve(res);
			}
		})
	})
	const history = await messsage_promise;
	console.log("後端送出歷史訊息如下:");
	console.log(history);
	const socketid = socket.id;
	io.to(socketid).emit('history', history);
	
	//接收前端message事件
	socket.on("message_to_backend", function(obj){
		console.log("收到前端: ");
		console.log(obj);
		//把資料新增進db
		var data_text = {
			name:obj.name,
			content:obj.content,
			content_type: "text",
			time:Date.now()
		}
		con.query("INSERT INTO socket" +room_id+ " set?", data_text, function(err,res){
			if(err){
				console.log(err);
			}else{
				console.log("insert message to db successful!");
			}
		})
		
		//回傳給前端
		io.to(room_id).emit("message", data_text);
	});
	//前端上傳圖片給後端
	socket.on('sendImg', (obj) => {
		console.log("socket收到前端圖片");
		var data = {
			name:obj.name,
			content:"",
			type_of_content: "image",
			time:Date.now()
		}
		//s3 code start
		const base64Data = new Buffer.from(obj.img.replace(/^data:image\/\w+;base64,/, ""), 'base64');
		const type = obj.img.split(';')[0].split('/')[1];
		const params = {
			Key: Date.now()+obj.name+"."+type, // type is not required
			Body: base64Data,
			ContentEncoding: 'base64', // required
			ContentType: "image/"+type // required. Notice the back ticks
		  }
		const promise1 = new Promise(function(resolve, reject) {
			s3Bucket.upload(params, function(err, upload_data){
				if(err){ 
					console.log(err);
					console.log('Error uploading data: ', upload_data); 
				}else{
					console.log('succesfully uploaded the image!');
					console.log("Key: "+upload_data.Key);
					resolve(upload_data.Key);
				}
			});	
		});
		promise1.then(function(key) {
			data.content = key;
			con.query("INSERT INTO socket" +room_id+ " set?", data, function(err,res){
				if(err){
					console.log(err);
				}else{
					console.log("insert message(picture) to db successful!");
				}
			})
			io.to(room_id).emit('receiveImg', data);
		});
		//s3 code end
	});
	// 當發生離線事件
	socket.on("disconnect", function(){
		console.log('有人離開了room ' + room_id);
		socket.leave(room_id);
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