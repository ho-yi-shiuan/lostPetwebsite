const fs = require('fs');
const AWS = require('aws-sdk');
var mysql = require("../mysqlcon.js");
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
    bucket: 'yssites.com/person_project/lost_pet',
	contentType: multerS3.AUTO_CONTENT_TYPE,
    key: function (req, file, cb) {
      cb(null, Date.now()+file.originalname);// 檔案命名要重新想!!!!是否綁room id?? 這樣前端比較好叫
    }
  })
})

app.post('/', upload.single('image'), async function(req, res){
	console.log(req.body);
	//待辦:
	//是否要做transaction?
	var lost_data_id;
	var lost_data = {
		category: req.body.category,
		pet_name: req.body.pet_name,
		pet_picture: req.file.key,
		gender: req.body.pet_gender,
		age: req.body.pet_age,
		breed: req.body.pet_breed,
		color: req.body.pet_color,
		lost_location: req.body.input_address,
		lost_location_lng: req.body.lost_address_lng,
		lost_location_lat: req.body.lost_address_lat,
		lost_time: req.body.lost_time,
		other: req.body.other,
		user_id: req.body.user_id
	}
	const insert_lost_pet_promise = new Promise((resolve, reject) => {
		mysql.con.query("INSERT INTO lost_pet set?",lost_data,function(err, result){
			if(err){
				console.log("lost_record api(post): \n");
				console.log(err);
			}
			else
			{
				resolve(result);
				lost_data_id = result.isertId;
				console.log("lost_record api: db新增走失紀錄成功");
			}
		});
	})
	const insert_lost_pet = await insert_lost_pet_promise;
	var create_chat_table = "CREATE TABLE socket"+insert_lost_pet.insertId+"(id bigint(20) NOT NULL AUTO_INCREMENT, name varchar(45) DEFAULT NULL, content varchar(45) DEFAULT NULL, content_type varchar(20), time bigint(20) DEFAULT NULL, PRIMARY KEY (id));";
	mysql.con.query(create_chat_table,function(err, result){
		if(err){
			console.log("lost_record api(post, create chat table): \n");
			console.log(err);
		}
		else
		{
			console.log("lost_record api: db新增聊天室table成功");
			res.redirect("/");
		}
	});	
	//1. 篩出db裡會員經緯度在一定範圍內的
	//2. 幫他們insert message
	//lost_location_lng: req.body.lost_address_lng,
	//lost_location_lat: req.body.lost_address_lat,	
	//一度經緯度距離約為111 km, 撈經度± 0.1,緯度± 0.1
	var select_mark = "SELECT user_id from user_mark WHERE location_lng BETWEEN "+req.body.lost_address_lng+"-0.1 AND "+req.body.lost_address_lng+"+0.1 AND location_lat BETWEEN "+req.body.lost_address_lat+"-0.1 AND "+req.body.lost_address_lat+"+0.1;";
	const mark_promise = new Promise((resolve, reject) => {
		mysql.con.query(select_mark, function(err, result){
			if(err){
				console.log("lost_record api(mark): \n");
				console.log(err);
			}else{
				console.log("找出經緯度±0.1的會員成功");
				resolve(result);
			}
		});
	})	
	let near_user = await mark_promise;	
	let near_user_array = [];
	for(j=0; j<near_user.length; j++){
		//篩掉重複的user_id
		//insert message
		near_user_array.push(near_user[j].user_id);
	}
	console.log("array: "+near_user_array);
	var result = near_user_array.filter(function(element, index, arr){
		return arr.indexOf(element)=== index;
	});
	console.log(result);
	for(k=0; k<result.length; k++){
		if(result[k] != req.body.user_id){
			var insert_message = {
				send_id: 0,
				send_time: Date.now(),
				receive_id: result[k],
				content: "有寵物在您附近走失, 請點訊息前往",
				link_id: insert_lost_pet.insertId
			}
			mysql.con.query("INSERT INTO message set?", insert_message, function(err, result){
				if(err){
					console.log("lost_record api(mark): \n");
					console.log(err);
				}else{
					console.log("找出經緯度±0.1的會員成功");
				}
			});					
		}
	}
});

app.get('/', async function(req, res){
	var picture_s3_url = "https://d2h10qrqll8k7g.cloudfront.net/person_project/lost_pet/";
	var select_lost_record = "SELECT * from lost_pet;"
	const lost_record_promise = new Promise((resolve, reject) => {
		mysql.con.query(select_lost_record, function(err, result){
			if(err){
				console.log("lost_record api(get): \n");
				console.log(err);
			}else{
				resolve(result);
			}
		});
	})
	let lost_record = await lost_record_promise;
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
		}
		lost_record_array.push(lost_data_object);
	};
	var data = {
		data:lost_record_array
	}
	res.json(data);
});
	
module.exports = app;