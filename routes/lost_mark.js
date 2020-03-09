const redis = require('redis');
const client = redis.createClient(); 
var mysql = require("../mysqlcon.js");
var lost_data = require('../model/lost_data');
var express = require("express");
var bodyParser = require('body-parser');
var app = express();
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.post("/", async function(req, res){
	let url = req.headers.referer;
	let splited = url.split('=');
	let socketid = splited[splited.length - 1];
	let insert_mark = {
		location: req.body.insert_mark,
		description: req.body.insert_info,
		lost_pet_id: socketid
	}
	try{
		await lost_data.insert_map(insert_mark).then(function(){
			client.del("lost_detail"+socketid, function (err, success) {
				if(err){
					throw err;
				}
				console.log("delete lost detail of id"+socketid+" in cache");
			});			
			res.json(insert_mark);
		})
	}catch(error){
		console.log(error);
		res.status(500).send({error:"Database Query Error"});			
	}
});

module.exports = app;