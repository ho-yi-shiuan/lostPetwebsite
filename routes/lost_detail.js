require('dotenv').config();
const redis = require('redis');
const client = redis.createClient(); 
const fs = require('fs');
var mysql = require("../mysqlcon.js");
var lost_data = require('../model/lost_data');
var express = require("express");
var bodyparser = require('body-parser');
var app = express();
app.use('/public',express.static('public'));

app.get('/', async function(req, res){
	try{
		client.get("lost_detail"+req.query.id,async function(err, result){
			if(err){
				throw err;
			}
			else if(result !== null)//get data from cache
			{
				console.log("found lost pet detail data in cache");
				res.json(JSON.parse(result));
			}
			else//get data from db and update cache
			{
				let lost_detail = await lost_data.select_lost_detail(req.query.id);
				let map = await lost_data.select_map(req.query.id);		
				let markers = [];
				let detail = lost_detail[0];
				for(i=0; i<map.length; i++){
					markers.push({
						marker_location: map[i].location,
						marker_description: map[i].description
					});
				}
				let data = {
					id: detail.pet_id,
					name: detail.pet_name,
					picture: process.env.CDN_url+"/person_project/lost_pet/"+lost_detail[0].pet_picture,
					gender: detail.gender,
					age: detail.age,
					breed: detail.breed,
					color: detail.color,
					lost_location: detail.lost_location,
					lost_time: detail.lost_time,
					post_type: detail.post_type,
					lost_status: detail.lost_status,
					title: detail.title,
					content: detail.content,
					markers: markers
				}
				client.set("lost_detail"+req.query.id, JSON.stringify(data), redis.print);
				res.json(data);
			}
		})
	}catch(error){
		console.log(error);
		res.status(500).send({error:"Database Query Error"});		
	}
});
	
module.exports = app;