const fs = require('fs');
var mysql = require("../mysqlcon.js");
var express = require("express");
var bodyparser = require('body-parser');
var app = express();
app.use('/public',express.static('public'));

app.get('/', async function(req, res){
	console.log(req.query);
	//篩選類別, 品種, 性別
	var select_array = [];
	if(typeof(req.query.select_category) == "object"){
		let category_query = " category in (?)";
		let category_array = [category_query,req.query.select_category];
		select_array.push(category_array);
	}else if(typeof(req.query.select_category) == "string"){
		let category_query = " category in (?)";
		let category_array = [category_query,[req.query.select_category]];
		select_array.push(category_array);
	}
	if(typeof(req.query.select_breed) == "object"){
		let breed_query = " breed in (?)";
		let breed_array = [breed_query,req.query.select_breed];
		select_array.push(breed_array);
	}else if(typeof(req.query.select_breed) == "string"){
		let breed_query = " breed in (?)";
		let breed_array = [breed_query,[req.query.select_breed]];
		select_array.push(breed_array);
	}
	if(typeof(req.query.select_gender) == "object"){
		let gender_query = " gender in (?)";
		let gender_array = [gender_query,req.query.select_gender];
		select_array.push(gender_array);
	}else if(typeof(req.query.select_gender) == "string"){
		let gender_query = " gender in (?)";
		let gender_array = [gender_query,[req.query.select_gender]];
		select_array.push(gender_array);
	}
	var select_query = "SELECT * from lost_pet ";
	var condition_array = [];
	if(select_array.length >0){
		select_query += "where";
		for(i=0; i<select_array.length; i++){
			condition_array.push(select_array[i][1]);
			select_query += select_array[i][0];
			if(i < select_array.length-1){
				select_query += " AND";
			}
		}
	}
	//地址篩經緯度
	if(req.query.lost_address_lng){
		select_query += " AND lost_location_lng BETWEEN "+req.query.lost_address_lng+"-0.1 AND "+req.query.lost_address_lng+"+0.1 AND lost_location_lat BETWEEN "+req.query.lost_address_lat+"-0.1 AND "+req.query.lost_address_lat+"+0.1 ";
	}
	//顏色where color like '%黑%' OR '%白%'
	if(typeof(req.query.select_color) == "object"){
		select_query += " AND "		
		for(j=0; j<req.query.select_color.length; j++){
			select_query += "color LIKE '%"+req.query.select_color[j]+"%'";
			if(j <req.query.select_color.length-1){
				select_query += " OR ";
			}
		}
	}else if(typeof(req.query.select_color) == "string"){
		select_query += " AND color LIKE '%"+req.query.select_color+"%'";
	}	
	console.log(select_query);	
	const lost_record_promise = new Promise((resolve, reject) => {
	mysql.con.query(select_query, condition_array, function(err, result){
			if(err){
				console.log("lost_record api(get): \n");
				console.log(err);
			}else{
				resolve(result);
			}
		});
	})
	let lost_record = await lost_record_promise;
	var picture_s3_url = "https://d2h10qrqll8k7g.cloudfront.net/person_project/lost_pet/";
	var lost_record_array = [];
	for(i=0; i<lost_record.length; i++){
		var lost_data_object = {
			id: lost_record[i].pet_id,
			name: lost_record[i].pet_name,
			picture: picture_s3_url+lost_record[i].pet_picture,
			gender: lost_record[i].gender,
			age: lost_record[i].age,
			breed: lost_record[i].breed,
			color: lost_record[i].color,
			lost_location: lost_record[i].lost_location,
			lost_time: lost_record[i].lost_time,
			other: lost_record[i].other,
			lost_status: lost_record[i].lost_status
		}
		lost_record_array.push(lost_data_object);
	};
	var data = {
		data:lost_record_array
	}
	res.json(data);
});
	
module.exports = app;