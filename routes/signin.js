const crypto = require('crypto');
const bcrypt = require('bcryptjs');
var mysql = require("../mysqlcon.js");
var express = require("express");
var bodyParser = require('body-parser');
var app = express();
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

function createtoken(email){
	let hash = crypto.createHash('sha256');
	hash.update(email);
	const token = hash.digest('hex');
	return token;
}

app.post('/', async function(req, result){
	if(req.body.provider == "native"){
		if(!req.body.email||!req.body.password){
			result.status(400).send({error:"Permissions Error: email, password are required."});
			return;
		}
		mysql.con.beginTransaction( async function(error){
			if(error){
				reject("Database Query Error");
				return;
			}
			var select_query = "SELECT * FROM user WHERE email = \"" + req.body.email +"\"";
			const user_promise = new Promise((resolve, reject) => {
				mysql.con.query(select_query,function(err, result){
					if(err){
						console.log("error message of select user email in signin api: ");
						console.log(err);
						res.status(500).send({error:"Database Query Error"});
						return mysql.con.rollback(function(){
							throw error;
						});
					}else
					{
						console.log("select user email in signin api: 已找出資料庫內目前密碼");
						resolve(result);
					}
				});
			});
			let user_data = await user_promise;
			bcrypt.compare(req.body.password, user_data[0].password).then(function(res){
				if(res){
					//製造新token
					var date = Date.now();
					var time = 3600000;
					var expire = parseInt(date+time);
					token = createtoken(req.body.email+date);
					//更新mysql內的token
					var update_query = "update user set access_token = \""+token+"\", access_expired = \""+expire+"\" where id = "+user_data[0].id+";";
					mysql.con.query(update_query, function(err, res){
						if(err){
							console.log("error message of update user data in signin api: ");
							console.log(err);
							res.status(500).send({error:"Database Query Error"});
							return mysql.con.rollback(function(){
								throw error;
							});
						}
						console.log("update user data in signin api: 登入(native), 更新token成功");
						mysql.con.commit(function(error){
							if(error){
								res.status(500).send({error:"Database Query Error"});
								return mysql.con.rollback(function(){
									throw error;
								});
							}
							//輸出
							var user_information = {
								id: user_data[0].id,
								procider: "native",
								name: user_data[0].name,
								email: user_data[0].email,
								picture: user_data[0].picture
							};		
							var data = {
								access_token: token,
								access_expired: expire,
								user: user_information
							};
							var list = {
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
			});
		})
	}else if(req.body.provider == "facebook"){
		if(!req.body.email||!req.body.name){
			result.status(400).send({error:"Permissions Error: name, email are required."});
			return;
		}
		//以fb登入
		mysql.con.beginTransaction( async function(error){
			if(error){
				reject("Database Query Error");
				return;
			}
			var search_data = "select * from user where email = \""+req.body.email+"\";";
			const check_promise = new Promise((resolve, reject) => {
				mysql.con.query(search_data, function(err, res){
					if(err){
						console.log("error message in signin api(facebook): 找出是否已註冊過");
						console.log(err);
						result.status(500).send({error:"Database Query Error"});
						return mysql.con.rollback(function(){
							throw error;
						});
					}else{
						//已註冊, 找出其他資訊
						console.log("signin api(facebook): select user facebook login history successful!");
						resolve(res);
					}
				});
			})
			let user_data = await check_promise;
			if(user_data.length == 0){//沒有註冊過, 註冊資料
				//製造token
				var date = Date.now();
				token = createtoken(req.body.email+date);
				var time = 3600000;
				var expire = parseInt(date+time);
				var new_data = {
					provider: "facebook",
					email: req.body.email,
					name: req.body.name,
					picture: req.body.picture,
					access_token: token,
					access_expired: expire
				}
				mysql.con.query("INSERT INTO user SET?", new_data, function(err, res){
					if(err){
						console.log("error message in signin api(facebook): 無註冊過, 新增會員資料");
						console.log(err);
						res.status(500).send({error:"Database Query Error"});
						return mysql.con.rollback(function(){
							throw error;
						});
					}
					mysql.con.commit(function(error){
						if(error){
							reject("Database Query Error: "+erorr);
							return mysql.con.rollback(function(){});
						}
						console.log("signin api(facebook): 無註冊過, 新增 user 成功");
						var user_information = {
							id: res.insertId,
							procider: "facebook",
							name: new_data.name,
							email: new_data.email,
							picture: new_data.picture
						};		
						var data = {
							access_token: token,
							access_expired: expire,
							user: user_information
						};
						var list = {
							data: data
						};
						result.cookie("user",token);
						result.send(list);						
					});
				})
			}
			else if(user_data.length > 0){//已註冊, 找出其他資訊
				//製造新token
				var date = Date.now();
				var time = 3600000;
				var expire = parseInt(date+time);
				token = createtoken(req.body.email+date);
				//更新mysql內的token
				var new_data = {
					provider: "facebook",
					name: req.body.name,
					picture: req.body.picture,
					access_token: token,
					access_expired: expire
				}
				mysql.con.query("UPDATE user SET? WHERE email = ?", [new_data, req.body.email], function(err, res){
					if(err){
						console.log("error message in signin api(facebook): 已註冊過, 更新會員資料");
						console.log(err);
						res.status(500).send({error:"Database Query Error"});
						return mysql.con.rollback(function(){
							throw error;
						});
					}
					mysql.con.commit(function(error){
						if(error){
							reject("Database Query Error: "+erorr);
							return mysql.con.rollback(function(){});
						}
						console.log("signin api(facebook): 已註冊過, 更新 user 成功");
						var user_information = {
							id: user_data[0].id,
							provider: "facebook",
							email: new_data.name,			
							name: new_data.email,
							picture: new_data.picture
						};
						var data = {
							access_token: token,
							access_expired: expire,
							user: user_information
						};
						var list = {
							data: data
						};
						result.cookie("user",token);
						result.send(list);		
					});
				})
			}else{
				return mysql.con.rollback(function(){
					result.send("please enter provider");
				});
			}
		})
	}
})

module.exports = app;