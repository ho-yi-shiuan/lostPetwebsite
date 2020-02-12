const crypto = require('crypto');
var mysql = require("../mysqlcon.js");
var express = require("express");
var bodyParser = require('body-parser');
var app = express();
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.post('/', async function(req, res){
	console.log(req.body);
	var update_status = "UPDATE lost_pet SET lost_status = \""+req.body.close_status+"\" where pet_id = "+req.body.close_id;
	console.log(update_status);
	mysql.con.query(update_status, function(err,result){
		if(err){
			console.log("close_case api: ");
			console.log(err);
		}else{
			console.log("update lost_status successful!");
			res.send({status: "success"});
		}
	});
});
	
module.exports = app;