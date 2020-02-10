const crypto = require('crypto');
var mysql = require("../mysqlcon.js");
var express = require("express");
var bodyParser = require('body-parser');
var app = express();
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.post('/', async function(req, res){
	console.log(req.body);
	var delete_case = "DELETE FROM lost_pet WHERE pet_id="+req.body.delete_id+";";
	var delete_room = "DROP TABLE socket"+req.body.delete_id+";";
	mysql.con.query(delete_case, function(err, result){
		if(err){
			console.log(err);
		}else{
			console.log("delete row from lost_pet suscessfully!");
		}
	});	
	mysql.con.query(delete_room, function(err, result){
		if(err){
			console.log(err);
		}else{
			console.log("delete room suscessfully!");
		}
	});
	res.send({delete_result: "success"});
});
	
module.exports = app;