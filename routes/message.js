const fs = require('fs');
var mysql = require("../mysqlcon.js");
var express = require("express");
var bodyparser = require('body-parser');
var app = express();
app.use('/public',express.static('public'));

app.post('/', async function(req, res){
	
});

app.get('/', async function(req, res){
	
});
	
module.exports = app;
