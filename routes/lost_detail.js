const fs = require('fs');
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

app.get('/', async function(req, res){
	var picture_s3_url = "https://d2h10qrqll8k7g.cloudfront.net/person_project/lost_pet/";
	var select_lost_detail = "SELECT a.*, b.location, b.description FROM lost_pet as a, map as b where a.id = b.lost_pet_id and a.id = "+req.query.id+";"
	const lost_detail_promise = new Promise((resolve, reject) => {
		con.query(select_lost_detail, function(err, result){
			if(err){
				console.log("lost_detail api: \n");
				console.log(err);
			}else{
				resolve(result);
			}
		});
	})
	let lost_detail = await lost_detail_promise;
	var markers = [];
	for(i=0; i<lost_detail.length; i++){
		markers.push({
			marker_location: lost_detail[i].location,
			marker_description: lost_detail[i].description
		});
	}
	var data = {
		id: lost_detail[0].id,
		name: lost_detail[0].name,
		picture: picture_s3_url+lost_detail[0].picture,
		gender: lost_detail[0].gender,
		age: lost_detail[0].age,
		breed: lost_detail[0].breed,
		color: lost_detail[0].color,
		lost_location: lost_detail[0].lost_location,
		lost_time: lost_detail[0].lost_time,
		other: lost_detail[0].other,
		markers: markers
	}
	res.json(data);
});
	
module.exports = app;