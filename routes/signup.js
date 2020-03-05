const crypto = require('crypto');
const bcrypt = require('bcryptjs');
var mysql = require("../mysqlcon.js");
var user = require('../model/user');
var express = require("express");
var bodyParser = require('body-parser');
var app = express();
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.post('/', async function(req, res){
	if(!req.body.email||!req.body.password||!req.body.name){
		res.status(400).send({error:"Permissions Error: email, password are required."});
		return;
	}
	mysql.con.beginTransaction( async function(error){
		try{
			//檢查是否已註冊
			let flag = await user.select_user_email(req.body.email);
			if(flag.length == 0){
				//開始註冊
				//製造token
				let date = Date.now();
				token = user.create_token(req.body.email+date);
				let time = 3600000;
				let expire = parseInt(date+time);
				//加密password
				const salt_rounds = 10;
				const bcrypt_promise = new Promise((resolve, reject) => {
					const hash = bcrypt.hashSync(req.body.password, salt_rounds);
					resolve(hash);
				})
				let bcrypt_password = await user.bcrypt_promise;
				let signup_data = {
					provider: "native",
					email: req.body.email,
					password: bcrypt_password,
					name: req.body.name,
					picture: "https://d2h10qrqll8k7g.cloudfront.net/person_project/image/user.png",
					access_token: token,
					access_expired: expire
				}
				await user.insert_user(signup_data).then(function(result){
					mysql.con.commit(function(error){
						if(error){
							throw error;
						}
						let user_information = {
							id: result.insertId,
							provider: signup_data.provider,
							email: signup_data.email,			
							name: signup_data.name,
							picture: signup_data.picture
						};
						let data = {
							access_token: token,
							access_expired: expire,
							user: user_information
						};
						let list = {
							data: data
						};
						res.cookie("user",token);
						res.send(list);
					})
				})
			}else{
				console.log("signup api: user exist");
				res.send("3");
			}
		}catch(error){
			console.log("catched error");
			console.log(error);
			return mysql.con.rollback(function(){
				res.status(500).send({error:"Database Query Error"});
			});				
		}
	})
});

module.exports = app;