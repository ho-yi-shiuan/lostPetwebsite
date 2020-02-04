const fs = require('fs');
const AWS = require('aws-sdk');
var mysql = require("mysql");
var express = require("express");
var multer  = require('multer');
var multerS3 = require('multer-s3');
var bodyparser = require('body-parser');
var app = express();
app.use('/public',express.static('public'));

const s3 = new AWS.S3({
    accessKeyId: "AKIAI4YXVKNLMJDWWJTQ",
    secretAccessKey: "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"
});

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

const con = mysql.createPool({
  host: 'localhost',
  port: '3306',
  user: 'root',
  password: '[hys10130857]',
  database: "person_project"
})//連接到mySQL

app.post('/', upload.single('image'), async function(req, res){
	//待辦:
	//是否要做transaction?
	var lost_data_id;
	var lost_data = {
		category: req.body.category,
		name: req.body.pet_name,
		picture: req.file.key,
		gender: req.body.pet_gender,
		age: req.body.pet_age,
		breed: req.body.pet_breed,
		color: req.body.pet_color,
		lost_location: req.body.lost_address,
		lost_time: req.body.lost_time,
		other: req.body.other
	}
	const insert_lost_pet_promise = new Promise((resolve, reject) => {
		con.query("INSERT INTO lost_pet set?",lost_data,function(err, result){
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
	var create_chat_table = "CREATE TABLE socket"+insert_lost_pet.insertId+"(id bigint(20) NOT NULL AUTO_INCREMENT, name varchar(45) DEFAULT NULL, content varchar(45) DEFAULT NULL, time bigint(20) DEFAULT NULL, PRIMARY KEY (id));";
	con.query(create_chat_table,function(err, result){
		if(err){
			console.log("lost_record api(post, create chat table): \n");
			console.log(err);
		}
		else
		{
			console.log("lost_record api: db新增聊天室table成功");
			res.send("新增走失紀錄成功!");
		}
	});	
	
});

app.get('/', async function(req, res){
	var picture_s3_url = "https://d2h10qrqll8k7g.cloudfront.net/person_project/lost_pet/";
	var select_lost_record = "SELECT * from lost_pet;"
	const lost_record_promise = new Promise((resolve, reject) => {
		con.query(select_lost_record, function(err, result){
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
			id: lost_record[i].id,
			name: lost_record[i].name,
			picture: picture_s3_url+lost_record[i].picture,
			gender: lost_record[i].gender,
			age: lost_record[i].age,
			breed: lost_record[i].breed,
			color: lost_record[i].color,
			lost_location: lost_record[i].lost_location,
			lost_time: lost_record[i].lost_time,
			other: lost_record[i].other
		}
		lost_record_array.push(lost_data_object);
	};
	var data = {
		data:lost_record_array
	}
	res.json(data);
});
	
module.exports = app;