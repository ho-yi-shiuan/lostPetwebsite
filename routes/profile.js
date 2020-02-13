const crypto = require('crypto');
var mysql = require("../mysqlcon.js");
var express = require("express");
var bodyParser = require('body-parser');
var app = express();
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.post("/", async function(req, res){
	//改成先拿user 資料, 再拿lost_pet資料, 不要一起拿
	console.log("後端收到的token為: "+req.body.cookie);
	var token = req.body.cookie;
	var now = Date.now();
	var search_token = "select * FROM user where access_token = \""+token+"\";";
	console.log(search_token);
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
	var search_lost_record = "SELECT * from lost_pet where user_id = "+info[0].id+";";
	const search_lost_record_promise = new Promise((resolve, reject) => {
		mysql.con.query(search_lost_record, function(err, result){
			if(err){
				console.log(err);
			}else{
				console.log("select user's lost pet data successfully");
				resolve(result);
			}
		});
	})
	let lost_record = await search_lost_record_promise;
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
	var search_user_mark = "SELECT * from user_mark where user_id = "+info[0].id+";";
	const mark_promise = new Promise((resolve, reject) => {
		mysql.con.query(search_user_mark, function(err, result){
			if(err){
				console.log(err);
			}else{
				console.log("select user mark successfully");
				resolve(result);
			}
		});
	})
	let mark = await mark_promise;
	var mark_array = [];
	for(k=0; k<mark.length; k++){
		var location_mark = mark[k].location_lat+", "+mark[k].location_lng;
		console.log(location_mark);
		mark_array.push(location_mark);
	}
	var picture_s3_url = "https://d2h10qrqll8k7g.cloudfront.net/person_project/lost_pet/";
	var lost_array = [];
	for(i=0; i<lost_record.length; i++){
		lost_array.push({
			id: lost_record[i].pet_id,
			name: lost_record[i].pet_name,
			picture: picture_s3_url+lost_record[i].pet_picture,
			gender: lost_record[i].gender,
			age: lost_record[i].age,
			breed: lost_record[i].breed,
			color: lost_record[i].color,
			lost_location: lost_record[i].lost_location,
			lost_time: lost_record[i].lost_time,
			other: lost_record[i].other,
			lost_status: lost_record[i].lost_status
		})
	}
	var message_array = [];
	for(j=0; j<message.length; j++){
		message_array.push({
			send_id: message[j].send_id,
			send_time: message[j].send_time,
			receive_id: message[j].receive_id,
			content: message[j].content,
			link_id: message[j].link_id
		})
	}
	var data = {
		id: info[0].id,
		provider: info[0].provider,
		name: info[0].name,
		email: info[0].email,
		picture: info[0].picture,
		lost_pet: lost_array,
		message: message_array,
		mark: mark_array
	};
	var list = {
		status: "success",
		data: data
	};
	res.cookie("user",token);
	console.log(list);
	console.log("後端在profile page更新token為"+token);
	res.send(list);
})

module.exports = app;