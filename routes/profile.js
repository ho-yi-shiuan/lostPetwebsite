const crypto = require('crypto');
var mysql = require("../mysqlcon.js");
var express = require("express");
var bodyParser = require('body-parser');
var app = express();
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.post("/", async function(req, res){
	console.log(req.body.cookie);
	var token = req.body.cookie;
	var now = Date.now();
	var search_token = "select * from user where access_token = \""+token+"\";";
	const token_promise = new Promise((resolve, reject) => {
		mysql.con.query(search_token,function(err, result){
			if(err){
				console.log(err);
			}
			else if(result.length == 0)
			{
				console.log("token錯誤");
				res.end("token wrong");
			}
			else if(now >= result.access_expired)
			{
				console.log("token已過時效");
				res.end("can't use token, please login by email and password");				
			}
			else
			{
				console.log("登入成功");
				resolve(result);
			}		
		});
	})
	let info = await token_promise;
	var data = {};
	data.id = info[0].id;
	data.provider = info[0].provider;
	data.name = info[0].name;
	data.email = info[0].email;
	data.picture = info[0].picture;
	var list = {};
	list.data = data;
	console.log(list);
	res.send(list);
})

module.exports = app;