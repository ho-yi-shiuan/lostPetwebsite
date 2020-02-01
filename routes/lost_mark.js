var mysql = require("mysql");
var express = require("express");
var bodyparser = require('body-parser');
var app = express();
app.use('/public',express.static('public'));

const con = mysql.createPool({
  host: 'localhost',
  port: '3306',
  user: 'root',
  password: '[hys10130857]',
  database: "person_project"
})//連接到mySQL

app.post('/', async function(req, res){
	console.log(req.body);
/*	var url = req.headers.referer;
	var splited = url.split('=');
	var socketid = splited[splited.length - 1];
	
	var insert_mark = {
		location: req.body.insert_mark,
		description: req.body.insert_info,
		lost_pet_id: socketid
	}
	console.log(req.headers.referer);
	console.log("網址: "+url);
*/
});

module.exports = app;