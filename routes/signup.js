const crypto = require('crypto');
const bcrypt = require('bcryptjs');
var mysql = require("../mysqlcon.js");
var express = require("express");
var bodyParser = require('body-parser');
var app = express();
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.post('/', async function(req, res){
	console.log("進到signup api !");
	//檢查是否已註冊
	var email = req.body.email;
	var check_email = "SELECT * FROM user WHERE email = \"" + req.body.email + "\";";
	const check_promise = new Promise((resolve, reject) => {
		mysql.con.query(check_email,function(err, result){
			if(result.length == 0){
				//無人註冊
				resolve(1);
			}else{
				//有人註冊
				reject("此帳號已註冊過");
				res.end("3");
			}
		});
	})
	let flag = await check_promise;
	if(flag){
		//開始註冊
		//製造token
		var date = Date.now();
		function createtoken(email){
			let hash = crypto.createHash('sha256');
			hash.update(email);
			const token = hash.digest('hex');
			return token;
		}
		token = createtoken(req.body.email+date);
		var time = 360000;
		var expire = parseInt(date+time);
		//加密password
		const saltRounds = 10;
		const bcrypt_promise = new Promise((resolve, reject) => {
			const hash = bcrypt.hashSync(req.body.password, saltRounds);
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
		console.log(signup_data);
		const insert_signup_promise = new Promise((resolve, reject) => {
			mysql.con.query("INSERT INTO user SET?", signup_data, function(err, result){
				if(err){
					console.log("signup api: ");
					console.log(err);
				}
				else
				{				
					console.log("signup api: 新增user成功");
					resolve(result);
				}
			});
		})
		let insert_signup_result = await insert_signup_promise;
		var user_information = {
			id: insert_signup_result.insertId,
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
		console.log(list);
		res.cookie("user",token);
		res.cookie("name",signup_data.name);
		res.cookie("user_id",insert_signup_result.insertId);
		res.cookie("picture",signup_data.picture);
		res.send(list);
	}
	});

module.exports = app;