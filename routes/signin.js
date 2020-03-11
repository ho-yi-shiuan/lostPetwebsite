const crypto = require('crypto');
const bcrypt = require('bcryptjs');
var mysql = require("../mysqlcon.js");
var user = require('../model/user');
var express = require("express");
var bodyParser = require('body-parser');
var app = express();
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.post('/', async function(req, result){
	//製造新token
	let date = Date.now();
	let time = 3600000;
	let expire = parseInt(date+time);
	let token = user.create_token(req.body.email+date);
	if(req.body.provider == "native"){
		if(!req.body.email||!req.body.password){
			result.status(400).send({error:"Permissions Error: email, password are required."});
			return;
		}
		mysql.con.beginTransaction(async function(error){
			try{
				let user_data = await user.select_user_email(req.body.email);
				const password_promise = new Promise((resolve, reject) => {
					resolve(bcrypt.compare(req.body.password, user_data[0].password));
				});
				let psw = await password_promise;
				if(psw){
					//更新mysql內的token
					let new_token = {
						access_token:token,
						access_expired:expire
					}
					await user.update_user(new_token,user_data[0].id).then(function(){
						mysql.con.commit(function(error){
							if(error){
								throw error;
							}
							//輸出
							let user_information = {
								id: user_data[0].id,
								procider: "native",
								name: user_data[0].name,
								email: user_data[0].email,
								picture: user_data[0].picture
							};		
							let data = {
								access_token: token,
								access_expired: expire,
								user: user_information
							};
							let list = {
								data: data
							};
							result.cookie("user",token);
							result.send(list);
						});						
					})
				}else{
					console.log("signin api: 登入(native), 帳密不符合");
					return mysql.con.rollback(function(){
						result.end("2");
					});
				}
			}catch(error){
				console.log("catched error");
				console.log(error);
				return mysql.con.rollback(function(){
					result.status(500).send({error:"Database Query Error"});
				});				
			}
		})
	}else if(req.body.provider == "facebook"){
		if(!req.body.email||!req.body.name){
			result.status(400).send({error:"Permissions Error: name, email are required."});
			return;
		}
		//以fb登入
		mysql.con.beginTransaction( async function(error){
			let new_data = {
				provider: "facebook",
				email: req.body.email,
				name: req.body.name,
				picture: req.body.picture,
				access_token: token,
				access_expired: expire
			}
			try{
				let user_data = await user.select_user_email(req.body.email);
				if(user_data.length == 0){//沒有註冊過, 註冊資料
					await insert_user(new_data).then(function(res){
						mysql.con.commit(function(error){
							if(error){
								throw error;
							}
							let user_information = {
								id: res.insertId,
								procider: "facebook",
								name: new_data.name,
								email: new_data.email,
								picture: new_data.picture
							};
							let data = {
								access_token: token,
								access_expired: expire,
								user: user_information
							};
							let list = {
								data: data
							};
							result.cookie("user",token);
							result.send(list);						
						});						
					})
				}
				else if(user_data.length > 0){//已註冊, 找出其他資訊
					//更新mysql內的token
					await user.update_user(new_data,user_data[0].id).then(function(){
						if(error){
							throw error;
						}
						let user_information = {
							id: user_data[0].id,
							provider: "facebook",
							email: new_data.name,			
							name: new_data.email,
							picture: new_data.picture
						};
						let data = {
							access_token: token,
							access_expired: expire,
							user: user_information
						};
						let list = {
							data: data
						};
						result.cookie("user",token);
						result.send(list);
					})
				}else{
					return mysql.con.rollback(function(){
						result.send("please enter provider");
					});
				}				
			}catch(error){
				return mysql.con.rollback(function(){
					result.status(500).send({error:"Database Query Error"});
				});				
			}
		})
	}
})

module.exports = app;