var mysql = require("../mysqlcon.js");
var express = require("express");
var bodyParser = require('body-parser');
var app = express();
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.post("/", function(req, res){
	var url = req.headers.referer;
	var splited = url.split('=');
	var socketid = splited[splited.length - 1];
	var insert_mark = {
		location: req.body.insert_mark,
		description: req.body.insert_info,
		lost_pet_id: socketid
	}
	mysql.con.query("INSERT INTO map SET?", insert_mark, function(err, result){
		if(err){
			console.log("lost_mark api: ");
			console.log(err);
		}else{
			console.log("insert new mark successful!");
			res.json(insert_mark);
		}
	});
});

module.exports = app;