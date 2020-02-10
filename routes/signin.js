const crypto = require('crypto');
const bcrypt = require('bcryptjs');
var mysql = require("../mysqlcon.js");
var express = require("express");
var bodyParser = require('body-parser');
var app = express();
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.post('/', async function(req, result){
	if(req.body.provider == "native"){
		var email = req.body.email;
		var pwd = req.body.password;
		var selectSQL = "SELECT * FROM user WHERE email = \"" + email +"\"";
		const user_promise = new Promise((resolve, reject) => {
			mysql.con.query(selectSQL,function(err, result){
				if(err){
					console.log(err);
				}else
				{
					console.log("已找出資料庫內目前密碼");
					resolve(result);
				}
			});
		});
		let user_data = await user_promise;
		bcrypt.compare(pwd, user_data[0].password).then(function(res){
			if(res){
				console.log("帳密符合");
				//製造新token
				var date = Date.now();
				var time = 3600000;
				var expire = parseInt(date+time);
				function createtoken(email){
					let hash = crypto.createHash('sha256');
					hash.update(email);
					const token = hash.digest('hex');
					return token;
				}
				token = createtoken(req.body.email+date);
				//更新mysql內的token
				var updatesql = "update user set access_token = \""+token+"\", access_expired = \""+expire+"\" where id = "+user_data[0].id+";";
				mysql.con.query(updatesql,function(err, result){
					if(err){
						console.log(err);
					}
					else
					{
						console.log("登入(native), 更新token成功");
					}
				});
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
				result.cookie("user_id",user_data[0].id);
				result.send(list);
			}else{
				console.log("帳密不符合");
				result.end("2");
			}
		});
	}else if(req.body.provider == "facebook"){
		console.log("執行登入: "+req.body.provider);
		console.log("前端傳來: ");
		console.log(req.body);
		//以fb登入
		var search_data = "select * from user where email = \""+req.body.email+"\";";
		const check_promise = new Promise((resolve, reject) => {
			mysql.con.query(search_data, function(err, result){
				if(err){
					console.log("signin api(facebook): 找出是否已註冊過");
					console.log(err);
				}else{
					//已註冊, 找出其他資訊
					console.log("select user facebook login history successful!");
					resolve(result);
				}
			});
		})
		let user_data = await check_promise;
		console.log("db內fb登入記錄如下:");
		console.log(user_data);
		if(user_data.length == 0){//沒有註冊過, 註冊資料
			console.log("無fb登入紀錄, 新增資料");
				//製造token
				var date = Date.now();
				function createtoken(email){
					let hash = crypto.createHash('sha256');
					hash.update(email);
					const token = hash.digest('hex');
					return token;
				}
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
				const insert_signup_promise = new Promise((resolve, reject) => {
					mysql.con.query("INSERT INTO user SET?", new_data, function(err, result){
						if(err){
							console.log(err);
						}
						else
						{
							console.log("新增user(facebook)成功");
							resolve(result);
						}
					});
				})
				let facebook_signup = await insert_signup_promise;
				var user_information = {
					id: facebook_signup.insertId,
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
				console.log(list);
				result.cookie("user",token);
				result.cookie("user_id",facebook_signup.insertId);
				result.send(list);
		}
		else if(user_data.length > 0){//已註冊, 找出其他資訊
			console.log("fb登入過, 更新資料");
			var email = req.body.email;
			var name = req.body.name;
			//製造新token
			var date = Date.now();
			var time = 3600000;
			var expire = parseInt(date+time);
			function createtoken(email){
				let hash = crypto.createHash('sha256');
				hash.update(email);
				const token = hash.digest('hex');
				return token;
			}
			token = createtoken(req.body.email+date);
			//更新mysql內的token
			var new_data = {
				provider: "facebook",
				name: req.body.name,
				picture: req.body.picture,
				access_token: token,
				access_expired: expire
			}
			mysql.con.query("UPDATE user SET? WHERE email = ?", [new_data, req.body.email], function(err, result){
				if(err){
					console.log(err);
				}
				else
				{
					console.log("登入(facebook), 更新token成功");
				}
			});
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
			result.cookie("user_id",user_data[0].id);
			result.send(list);		
			console.log(list);			
		}		
	}else{
		result.send("please enter provider");
	}
})

module.exports = app;