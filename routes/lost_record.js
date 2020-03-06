require('dotenv').config();
const fs = require('fs');
const AWS = require('aws-sdk');
var mysql = require("../mysqlcon.js");
var lost_data = require('../model/lost_data');
var express = require("express");
var multer  = require('multer');
var multerS3 = require('multer-s3');
var bodyparser = require('body-parser');
var app = express();
app.use('/public',express.static('public'));

AWS.config.loadFromPath('./s3_config.json');
const s3 = new AWS.S3();

var upload = multer({
  storage: multerS3({
    s3: s3,
    bucket: 'shiuan/person_project/lost_pet',
	contentType: multerS3.AUTO_CONTENT_TYPE,
    key: function (req, file, cb) {
      cb(null, Date.now()+file.originalname);
    }
  })
})

app.post('/', upload.single('image'), async function(req, res){
	//統一輸入顏色
	let color_array;
	if(req.body.pet_color.length > 0){
		color_array = req.body.pet_color.split(/[ ,]+/);	
		for(let i=0; i<color_array.length; i++){
			if(color_array[i].indexOf("色") >= 0){
				let new_element = color_array[i].substring(0, color_array[i].length-1);
				color_array[i] = new_element;
			}
		}
	}
	let pet_data = {
			category: req.body.category,
			pet_name: req.body.pet_name,
			pet_picture: req.file.key,
			gender: req.body.pet_gender,
			age: req.body.pet_age,
			breed: req.body.pet_breed,
			color: JSON.stringify(color_array),
			lost_location: req.body.input_address,
			lost_location_lng: req.body.lost_address_lng,
			lost_location_lat: req.body.lost_address_lat,
			lost_time: req.body.lost_time,
			user_id: req.body.user_id,
			post_type: req.body.post_type,
			title: req.body.title,
			content: req.body.content,
			lost_status: "finding"		
	};
	let lost_data_id;
	let condition_array;
	try{
		lost_data.insert_lost_pet(pet_data).then(function(result){
			lost_data_id = result.insertId;
			return lost_data.create_socket_table(lost_data_id);
		}).then(async function(){
			if(req.body.post_type == "lost"){
				//find near user of lost/find address
				let near_user = await lost_data.select_near_user(req.body.lost_address_lng,req.body.lost_address_lat);
				let near_user_array = [];
				//篩掉重複的user_id
				for(j=0; j<near_user.length; j++){
					near_user_array.push(near_user[j].user_id);
				}
				let new_user_array = near_user_array.filter(function(element, index, arr){
					return arr.indexOf(element)=== index;
				});
				for(let k=0; k<new_user_array.length; k++){
					if(new_user_array[k] != req.body.user_id){
						let insert_message = {
							send_id: 0,
							send_time: Date.now(),
							receive_id: new_user_array[k],
							content: "有寵物在您附近走失, 請點訊息前往",
							link_id: lost_data_id
						}
						lost_data.insert_message(insert_message);
					}
				}
				init_condition_array = [['find']];
			}else if(req.body.post_type == "find"){
				init_condition_array = [['lost']];
			}
			//find current find post which corresspond to lost pet's feature and send message to their profile page
			let compare_query = create_compare_query(req.body,color_array);
			let condition_array = create_compare_array(req.body,init_condition_array);
			lost_data.select_post(compare_query,condition_array).then(function(result){
				let insert_message = {
					send_id: 0,
					send_time: Date.now(),
					content: "出現疑似您的走失寵物, 請點訊息前往",
				}
				if(req.body.post_type == "find"){
					let compared_user_array = [];
					for(let j=0; j<result.length; j++){
						compared_user_array.push(result[j].user_id);
					}
					let new_compare_array = compared_user_array.filter(function(element, index, arr){
						return arr.indexOf(element)=== index;
					});
					for(let k=0; k<new_compare_array.length; k++){
						if(new_compare_array[k] != req.body.user_id){
							insert_message.receive_id = new_compare_array[k];
							insert_message.link_id = lost_data_id;
							lost_data.insert_message(insert_message);				
						}
					}					
				}else if(req.body.post_type == "lost"){
					for(let k=0; k<result.length; k++){
						if(result[k].user_id != req.body.user_id){
							insert_message.receive_id = req.body.user_id;
							insert_message.link_id = new_user_array[k].pet_id;
							lost_data.insert_message(insert_message);
						}
					}					
				}
			})
			res.redirect("/");
		})		
	}catch(error){
		console.log(error);
		res.status(500).send({error:"Database Query Error"});		
	}
});

app.get('/', async function(req, res){
	if(req.query.post_type){
		select_lost_record = "SELECT * from lost_pet where lost_status = \""+req.query.lost_status+"\" AND post_type = \""+req.query.post_type+"\";";			
	}else{
		select_lost_record = "SELECT * from lost_pet where lost_status = \""+req.query.lost_status+"\" ;"		
	}
	try{
		let lost_record = await lost_data.get_all_lost(select_lost_record);
		let lost_record_array = [];
		let lost_data_object;
		for(i=0; i<lost_record.length; i++){
			lost_data_object = {
				id: lost_record[i].pet_id,
				name: lost_record[i].pet_name,
				picture: process.env.CDN_url+"/person_project/lost_pet/"+lost_record[i].pet_picture,
				gender: lost_record[i].gender,
				age: lost_record[i].age,
				breed: lost_record[i].breed,
				color: lost_record[i].color,
				lost_location: lost_record[i].lost_location,
				lost_location_lng: lost_record[i].lost_location_lng,
				lost_location_lat: lost_record[i].lost_location_lat,
				lost_time: lost_record[i].lost_time,
				lost_status: lost_record[i].lost_status,
				post_type: lost_record[i].post_type,
				title: lost_record[i].title,
				content: lost_record[i].content
			}
			lost_record_array.push(lost_data_object);
		};
		let data = {
			data:lost_record_array
		}
		res.json(data);		
	}catch(error){
		console.log(error);
		res.status(500).send({error:"Database Query Error"});		
	}
});

function create_compare_query(body, color_array){
	let query_array = [];
	if(body.category){
		let category_query = " category in (?)";
		query_array.push(category_query);
	}
	if(body.pet_gender){
		let gender_query = " gender in (?)";
		query_array.push(gender_query);
	}
	if(body.pet_breed){
		let pet_breed_query = " breed in (?)";
		query_array.push(pet_breed_query);
	}
	let color_query = " (";			
	for(let i=0; i<color_array.length; i++){
			color_query += "color LIKE '%"+color_array[i]+"%'";
			if(i <color_array.length-1){
				color_query += " OR ";
			}
		}
	color_query += ")";
	query_array.push(color_query);
	if(body.lost_address_lng){
		query_array.push(" lost_location_lng BETWEEN "+body.lost_address_lng+"-0.05 AND "+body.lost_address_lng+"+0.05 AND lost_location_lat BETWEEN "+body.lost_address_lat+"-0.05 AND "+body.lost_address_lat+"+0.05");
	}
	let compare_query = "SELECT * from lost_pet WHERE post_type in (?)";
	if(query_array.length >0){
		compare_query += " AND";
		for(let i=0; i<query_array.length; i++){
			compare_query += query_array[i];
			if(i < query_array.length-1){
				compare_query += " AND";
			}
		}
	}
	return compare_query;
}

function create_compare_array(body, init_array){
	if(body.category){
		init_array.push([body.category]);
	}
	if(body.pet_gender){
		init_array.push([body.pet_gender]);
	}
	if(body.pet_breed){
		init_array.push([body.pet_breed]);
	}
	return init_array;
};

module.exports = app;