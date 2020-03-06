require('dotenv').config();
const fs = require('fs');
var mysql = require("../mysqlcon.js");
var lost_data = require('../model/lost_data');
var express = require("express");
var bodyparser = require('body-parser');
var app = express();
app.use('/public',express.static('public'));

app.get('/', async function(req, res){
	try{
		let lost_detail = await lost_data.select_lost_detail(req.query.id);
		let map = await lost_data.select_map(req.query.id);		
		let markers = [];
		for(i=0; i<map.length; i++){
			markers.push({
				marker_location: map[i].location,
				marker_description: map[i].description
			});
		}
		let data = {
			id: lost_detail[0].pet_id,
			name: lost_detail[0].pet_name,
			picture: process.env.CDN_url+"/person_project/lost_pet/"+lost_detail[0].pet_picture,
			gender: lost_detail[0].gender,
			age: lost_detail[0].age,
			breed: lost_detail[0].breed,
			color: lost_detail[0].color,
			lost_location: lost_detail[0].lost_location,
			lost_time: lost_detail[0].lost_time,
			post_type: lost_detail[0].post_type,
			lost_status: lost_detail[0].lost_status,
			title: lost_detail[0].title,
			content: lost_detail[0].content,
			markers: markers
		}
		res.json(data);
	}catch(error){
		console.log(error);
		res.status(500).send({error:"Database Query Error"});		
	}
});
	
module.exports = app;