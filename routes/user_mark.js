const crypto = require('crypto');
var mysql = require("../mysqlcon.js");
var express = require("express");
var bodyParser = require('body-parser');
var app = express();
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.post('/', async function(req, res){
	let user_mark = {
		user_id: req.body.user_id,
		location_lng: req.body.insert_lng,
		location_lat: req.body.insert_lat
	}
	mysql.con.query("INSERT into user_mark set?", user_mark, function(err, result){
		if(err){
			console.log("error message of insert user mark in user_mark api: ");
			console.log(err);
			res.status(500).send({error:"Database query error, Please try later"});
		}else{
			console.log("insert user mark suscessfully!");
			res.send(user_mark);
		}
	});
});
	
module.exports = app;