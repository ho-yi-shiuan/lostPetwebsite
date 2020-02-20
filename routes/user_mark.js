const crypto = require('crypto');
var mysql = require("../mysqlcon.js");
var express = require("express");
var bodyParser = require('body-parser');
var app = express();
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.post('/', async function(req, res){
	console.log(req.body);
	var user_mark = {
		user_id: req.body.user_id,
		location_lng: req.body.insert_lng,
		location_lat: req.body.insert_lat
	}
//	const user_mark_promise = new Promise((resolve, reject) => {
		mysql.con.query("INSERT into user_mark set?", user_mark, function(err, result){
			if(err){
				console.log(err);
			}else{
				console.log("insert user mark suscessfully!");
				res.send(user_mark);
			}
		});
	//})
});

app.get('/', async function(req, res){
	
});
	
module.exports = app;