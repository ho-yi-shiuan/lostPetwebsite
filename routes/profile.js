const crypto = require('crypto');
var mysql = require("../mysqlcon.js");
var express = require("express");
var bodyParser = require('body-parser');
var app = express();
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.post("/", async function(req, res){
	var token = req.body.cookie;
	var now = Date.now();
	var search_token = "select a.*, b.* FROM user as a, lost_pet as b where a.id = b.user_id and access_token = \""+token+"\";";
	const token_promise = new Promise((resolve, reject) => {
		mysql.con.query(search_token,function(err, result){
			if(err){
				console.log(err);
			}
			else if(result.length == 0)
			{
				console.log("token錯誤");
				res.send({status: "wrong"});
			}
			else if(now >= result[0].access_expired)
			{
				console.log(result[0].access_expired);
				console.log("token已過時效");
				res.send({status: "expired"});
			}
			else
			{
				console.log(result);
				console.log(result[0].access_expired);
				console.log("登入成功");
				resolve(result);
			}		
		});
	})
	let info = await token_promise;
	var search_message = "SELECT * from message where receive_id = "+info[0].id+";";
	const message_promise = new Promise((resolve, reject) => {
		mysql.con.query(search_message, function(err, result){
			if(err){
				console.log(err);
			}else{
				console.log("select user message successfully");
				resolve(result);
			}
		});
	})
	let message = await message_promise;
	var picture_s3_url = "https://d2h10qrqll8k7g.cloudfront.net/person_project/lost_pet/";
	var lost_array = [];
	for(i=0; i<info.length; i++){
		lost_array.push({
			id: info[i].pet_id,
			name: info[i].pet_name,
			picture: picture_s3_url+info[i].pet_picture,
			gender: info[i].gender,
			age: info[i].age,
			breed: info[i].breed,
			color: info[i].color,
			lost_location: info[i].lost_location,
			lost_time: info[i].lost_time,
			other: info[i].other
		})
	}
	var message_array = [];
	for(j=0; j<message.length; j++){
		message_array.push({
			send_id: message[j].send_id,
			send_time: message[j].send_time,
			receive_id: message[j].receive_id,
			content: message[j].content
		})
	}
	var data = {
		id: info[0].id,
		provider: info[0].provider,
		name: info[0].name,
		email: info[0].email,
		picture: info[0].picture,
		lost_pet: lost_array,
		message: message_array
	};
	var list = {
		status: "success",
		data: data
	};
	console.log(list);
	res.send(list);
})

module.exports = app;