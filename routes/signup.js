const crypto = require('crypto');
const bcrypt = require('bcryptjs');
var mysql = require("../mysqlcon.js");
var express = require("express");
var bodyParser = require('body-parser');
var app = express();
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

function create_token(email){
	let hash = crypto.createHash('sha256');
	hash.update(email);
	const token = hash.digest('hex');
	return token;
}

app.post('/', async function(req, res){
	if(!req.body.email||!req.body.password||!req.body.name){
		res.status(400).send({error:"Permissions Error: email, password are required."});
		return;
	}
	mysql.con.beginTransaction( async function(error){
		if(error){
			reject("Database Query Error");
			return;
		}
		//檢查是否已註冊
		var check_email = "SELECT * FROM user WHERE email = \"" + req.body.email + "\";";
		const check_promise = new Promise((resolve, reject) => {
			mysql.con.query(check_email,function(err, result){
				if(err){
					console.log("error message of select exist signup record in signup api: ");
					console.log(err);
					res.status(500).send({error:"Database Query Error"});
					return mysql.con.rollback(function(){
						throw error;
					});
				}else if(result.length == 0){
					//無人註冊
					resolve(1);
				}else{
					return mysql.con.rollback(function(){
						//有人註冊
						reject("此帳號已註冊過");
						res.end("3");
					});
				}
			});
		})
		let flag = await check_promise;
		if(flag){
			//開始註冊
			//製造token
			var date = Date.now();
			token = create_token(req.body.email+date);
			var time = 3600000;
			var expire = parseInt(date+time);
			//加密password
			const salt_rounds = 10;
			const bcrypt_promise = new Promise((resolve, reject) => {
				const hash = bcrypt.hashSync(req.body.password, salt_rounds);
				resolve(hash);
			})
			let bcrypt_password = await bcrypt_promise;
			var signup_data = {
				provider: "native",
				email: req.body.email,
				password: bcrypt_password,
				name: req.body.name,
				picture: "https://d2h10qrqll8k7g.cloudfront.net/person_project/image/user.png",
				access_token: token,
				access_expired: expire
			}
			mysql.con.query("INSERT INTO user SET?", signup_data, function(err, result){
				if(err){
					console.log("error message of insert user data in signup api: ");
					console.log(err);
					res.status(500).send({error:"Database Query Error"});
					return mysql.con.rollback(function(){
						throw error;
					});
				}
				console.log("insert user data in signup api: 新增user成功");
				mysql.con.commit(function(error){
					if(error){
						reject("Database Query Error: "+erorr);
						return mysql.con.rollback(function(){
							throw error;
						});
					}
					var user_information = {
						id: result.insertId,
						provider: signup_data.provider,
						email: signup_data.email,			
						name: signup_data.name,
						picture: signup_data.picture
					};
					var data = {
						access_token: token,
						access_expired: expire,
						user: user_information
					};
					var list = {
						data: data
					};
					res.cookie("user",token);
					res.send(list);
				})
			});
		}
	})
});

module.exports = app;