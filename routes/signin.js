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
					var time = 3600;
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
							console.log("更新token成功");
						}
					});
					//輸出
					var user_information = {
						id: user_data[0].id,
						procider: "native",
						name: user_data[0].name,
						email: user_data[0].email,
						picture: null
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
				}else{
					console.log("帳密不符合");
					result.end("2");
				}
			});
	}else{
		result.send("please enter provider");
	}
})

module.exports = app;