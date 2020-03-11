require('dotenv').config();
const redis = require('redis');
const client = redis.createClient(); 
const express = require('express');
const app = express();
const server = require('http').Server(app);
const io = require('socket.io')(server);
const AWS = require('aws-sdk');
var mysql = require("./mysqlcon.js");
var chat = require('./model/chat');
var bodyParser = require('body-parser');
var mysql = require("./mysqlcon.js");

AWS.config.loadFromPath('./s3_config.json');
var s3Bucket = new AWS.S3( { params: {Bucket: 'shiuan/person_project/socket'} } );

client.on('connect', () => {
  console.log('Redis client connected');
});

app.use(express.static("public"));
//新增走失紀錄 api
app.use('/lost_record', require('./routes/lost_record'));
app.use('/search', require('./routes/search'));
//room 裡面用到的api
app.use('/lost_detail', require('./routes/lost_detail'));
app.use('/lost_mark', require('./routes/lost_mark'));
//會員系統api
app.use('/signup', require('./routes/signup'));
app.use('/signin', require('./routes/signin'));
app.use('/profile', require('./routes/profile'));
app.use('/user_mark', require('./routes/user_mark'));

//各房間的user list
var roomInfo = {};

// 當發生連線事件
io.on('connection', async function(socket){
	var room_id;
	const error_message = [{
		name: "system manager",
		picture: process.env.CDN_url+"/person_project/image/close.png",
		content: "Database query error, please refresh page and try later",
		content_type: "text",
		time: Date.now(),
		user_id: 0
	}]
	
	socket.on("join", async function(obj){
		room_id = obj.room_id;
		socket.join(room_id);
		console.log("app.js: "+obj.user_name + " entered " + room_id);
		//歷史訊息
		try{
			const history = await chat.select_history_message(room_id);			
			io.to(room_id).emit('history', history);
		}catch(error){
			console.log(error);
			io.to(room_id).emit('error', error_message);
		}
	});	
	
	//接收前端message事件
	socket.on("message_to_backend", async function(obj){
		console.log("received message from front-end: "+obj.content);
		let data_text = {
			name: obj.name,
			content: obj.content,
			content_type: "text",
			time: Date.now(),
			user_id: obj.user_id
		}
		mysql.con.beginTransaction( async function(error){
			try{
				let user_picture = await chat.select_user_picture(obj.user_id);
				await chat.insert_message(room_id,data_text).then(function(){
					mysql.con.commit(function(error){
						if(error){
							throw error;
						}
						data_text.picture = user_picture[0].picture;
						io.to(room_id).emit("message", [data_text]);
					})					
				})
			}catch(error){
				console.log(error);
				return mysql.con.rollback(function(){
					io.to(room_id).emit('error', error_message);
				});				
			}
		})
	});
	
	//前端上傳圖片給後端
	socket.on('sendImg', async function(obj){
		try{
			console.log("received image from front-end");
			let data_image = {
				name:obj.name,
				content:"",
				content_type: "image",
				time:Date.now(),
				user_id: obj.user_id
			}
			const base64Data = new Buffer.from(obj.img.replace(/^data:image\/\w+;base64,/, ""), 'base64');
			const type = obj.img.split(';')[0].split('/')[1];
			const params = {
				Key: Date.now()+obj.name+"."+type,
				Body: base64Data,
				ContentEncoding: 'base64',
				ContentType: "image/"+type 
			}
			const upload_image_promise = new Promise(function(resolve, reject) {
				s3Bucket.upload(params, function(err, upload_data){
					if(err){ 
						console.log("error message in upload image to s3Bucket in app.js: ");
						reject(error);
					}else{
						console.log("upload image to s3Bucket: success");
						resolve(upload_data.Key);
					}
				});	
			});
			upload_image_promise.then(function(key) {
				data_image.content = key;
				return chat.select_user_picture(obj.user_id);
			}).then(function(user_picture) {
					data_image.picture = user_picture[0].picture;
					return chat.insert_message(room_id,data_image);
			}).then(function(){
				io.to(room_id).emit('receiveImg', [data_image]);				
			})
		}catch(error){
			console.log(error);
			io.to(room_id).emit('error', [error_message]);
		}
	});
	
	socket.on("disconnect", function(){
		console.log("app.js: user left room" + room_id);
		socket.leave(room_id);
	});
	
	socket.on("close_room",async function(obj){
		try{
			await chat.send_close_message(obj.close_status,obj.close_id).then(function(){
				io.emit("redirect");
			})
		}catch(error){
			console.log(error);
			io.to(room_id).emit('error', error_message);
		}
	})
});

app.get('/room', async function(req, res){
	res.sendFile(__dirname + '/public/socket.html');
});

server.listen(3000, function(){
    console.log("connected to port 3000");
});

module.exports = app;