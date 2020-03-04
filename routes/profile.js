const crypto = require('crypto');
var mysql = require("../mysqlcon.js");
var user = require('../model/user');
var express = require("express");
var bodyParser = require('body-parser');
var app = express();
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.post("/", async function(req, res){
	mysql.con.beginTransaction( async function(error){
		try{
			let token = req.body.cookie;
			let now = Date.now();
			let info = await user.login_by_token(token);
			if(info.length == 0){
				return mysql.con.rollback(function(){
					console.log("select user by token in profile api: token wrong");
					res.send({status: "token_wrong"});
				});				
			}else if(now >= info[0].access_expired){
				console.log("select user by token in profile api: token expired");
				return mysql.con.rollback(function(){
					res.send({status: "token_expired"});
				});				
			}
			let lost_record = await user.search_lost_record(info[0].id,req.body.list_type,req.body.lost_status);
			let message = await user.select_message(info[0].id);
			await user.search_mark(info[0].id).then(function(result){
				mysql.con.commit(function(error){
					if(error){
						throw error;
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
		}catch(error){
			console.log(error);
			return mysql.con.rollback(function(){
				res.status(500).send({error:"Database Query Error"});
			});				
		}
	})
})

module.exports = app;