var mysql = require("../mysqlcon.js");
var express = require("express");
var bodyParser = require('body-parser');
var app = express();
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.post('/', async function(req, res){
	console.log("(socket profile api)前端傳來的資料為: ");
	console.log(req.body);
	const select_user_promise = new Promise((resolve, reject) => {
		mysql.con.query("select * from user where id = "+req.body.token, function(err, result){
			if(err){
				console.log("socket profile api: 找出使用者資料, 以便前端聊天訊息可以綁定");
				console.log(err);
			}else{
				console.log("(socket profile api)select user data successful!");
				resolve(result);
			}
		});
	})
	let user_data = await select_user_promise;
	let user_information = {
		id: user_data[0].id,
		name: user_data[0].name,
		picture: user_data[0].picture
	}
	console.log("目前使用此間聊天室的使用者資料為: ");
	console.log(user_information);
	res.send(user_information);
});
	
module.exports = app;