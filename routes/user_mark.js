const crypto = require('crypto');
var user = require('../model/user');
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
	try{
		user.insert_mark(user_mark).then(function(){
			res.send(user_mark);
		})
	}catch(error){
		console.log(error);
		return mysql.con.rollback(function(){
			res.status(500).send({error:"Database Query Error"});
		});				
	}
});
	
module.exports = app;