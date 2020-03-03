const crypto = require('crypto');
var mysql = require("../mysqlcon.js");
var express = require("express");
var bodyParser = require('body-parser');
var app = express();
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.post("/", async function(req, res){
	mysql.con.beginTransaction( async function(error){
		if(error){
			reject("Database Query Error");
			return;
		}
		let token = req.body.cookie;
		let now = Date.now();
		let search_token = "select * FROM user where access_token = \""+token+"\";";
		const token_promise = new Promise((resolve, reject) => {
			mysql.con.query(search_token, function(err, result){
				if(err){
					console.log("error message of select user by token in profile api: ");
					console.log(err);
					res.status(500).send({error:"Database query error, Please try later"});
					return mysql.con.rollback(function(){
						throw error;
					});
				}
				else if(result.length == 0)
				{
					console.log("select user by token in profile api: token wrong");
					return mysql.con.rollback(function(){
						res.send({status: "token_wrong"});
					});
				}
				else if(now >= result[0].access_expired)
				{
					console.log("select user by token in profile api: token expired");
					return mysql.con.rollback(function(){
						res.send({status: "token_expired"});
					});
				}
				else
				{
					console.log("select user by token in profile api: login by token success");
					resolve(result);
				}
			});
		})
		let info = await token_promise;
		let search_lost_record = "SELECT * from lost_pet where user_id = "+info[0].id+" AND post_type = \""+req.body.list_type+"\" AND lost_status in (?)";
		const search_lost_record_promise = new Promise((resolve, reject) => {
			mysql.con.query(search_lost_record, req.body.lost_status, function(err, result){
				if(err){
					console.log("error message of select user's data in lost pet table in profile api: ");
					console.log(err);
					res.status(500).send({error:"Database query error, Please try later"});
					return mysql.con.rollback(function(){
						throw error;
					});
				}else{
					console.log("select user's data in lost pet table in profile api: success");
					resolve(result);
				}
			});
		})
		let lost_record = await search_lost_record_promise;
		let search_message = "SELECT * from message where receive_id = "+info[0].id+";";
		const message_promise = new Promise((resolve, reject) => {
			mysql.con.query(search_message, function(err, result){
				if(err){
					console.log("error message of select user's data in message table in profile api: ");
					console.log(err);
					res.status(500).send({error:"Database query error, Please try later"});
					return mysql.con.rollback(function(){
						throw error;
					});
				}else{
					console.log("select user's data in message table in profile api: success");
					resolve(result);
				}
			});
		})
		let message = await message_promise;
		let search_user_mark = "SELECT * from user_mark where user_id = "+info[0].id+";";
		mysql.con.query(search_user_mark, function(err, result){
			if(err){
				console.log("error message of select user's data in user mark table in profile api: ");
				console.log(err);
				res.status(500).send({error:"Database query error, Please try later"});
				return mysql.con.rollback(function(){
					throw error;
				});				
			}
			console.log("select user's data in user mark table in profile api: success");
			mysql.con.commit(function(error){
				if(error){
					res.status(500).send({error:"Database query error, Please try later"});
					return mysql.con.rollback(function(){
						throw error;
					});
				}			
				var mark_array = [];
				for(k=0; k<result.length; k++){
					let location_mark = result[k].location_lat+", "+result[k].location_lng;
					mark_array.push(location_mark);
				}
				let picture_s3_url = "https://d2h10qrqll8k7g.cloudfront.net/person_project/lost_pet/";
				let lost_array = [];
				for(i=0; i<lost_record.length; i++){
					lost_array.push({
						id: lost_record[i].pet_id,
						name: lost_record[i].pet_name,
						picture: picture_s3_url+lost_record[i].pet_picture,
						gender: lost_record[i].gender,
						age: lost_record[i].age,
						breed: lost_record[i].breed,
						color: [lost_record[i].color],
						lost_location: lost_record[i].lost_location,
						lost_time: lost_record[i].lost_time,
						lost_status: lost_record[i].lost_status,
						post_type: lost_record[i].post_type,
						title: lost_record[i].title,
						content: lost_record[i].content
					})
				}
				let message_array = [];
				for(j=0; j<message.length; j++){
					message_array.push({
						send_id: message[j].send_id,
						send_time: message[j].send_time,
						receive_id: message[j].receive_id,
						content: message[j].content,
						link_id: message[j].link_id
					})
				}
				let data = {
					id: info[0].id,
					provider: info[0].provider,
					name: info[0].name,
					email: info[0].email,
					picture: info[0].picture,
					lost_pet: lost_array,
					message: message_array,
					mark: mark_array
				};
				let list = {
					status: "success",
					data: data
				};
				res.cookie("user",token);
				res.send(list);
			})
		})
	})
})

module.exports = app;