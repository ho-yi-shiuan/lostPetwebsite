var mysql = require("mysql");
var express = require("express");
var bodyParser = require('body-parser');
var app = express();
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

const con = mysql.createPool({
  host: 'localhost',
  port: '3306',
  user: 'root',
  password: '[hys10130857]',
  database: "person_project"
})//連接到mySQL

app.post("/", function(req, res){
	var url = req.headers.referer;
	var splited = url.split('=');
	var socketid = splited[splited.length - 1];
	var insert_mark = {
		location: req.body.insert_mark,
		description: req.body.insert_info,
		lost_pet_id: socketid
	}
	con.query("INSERT INTO map SET?", insert_mark, function(err, result){
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