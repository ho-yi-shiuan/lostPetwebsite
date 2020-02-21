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
    bucket: 'shiuan/person_project/lost_pet',
	contentType: multerS3.AUTO_CONTENT_TYPE,
    key: function (req, file, cb) {
      cb(null, Date.now()+file.originalname);// 檔案命名要重新想!!!!是否綁room id?? 這樣前端比較好叫
    }
  })
})

app.post('/', upload.single('image'), async function(req, res){
	//以空格跟逗號拆解
	if(req.body.pet_color.length > 0){
		var color_array = req.body.pet_color.split(/[ ,]+/);
		console.log(color_array);
		//去掉顏色中的色, 才能做LIKE
		for(i=0; i<color_array.length; i++){
			if(color_array[i].indexOf("色") >= 0){
				var new_element = color_array[i].substring(0, color_array[i].length-1);
				color_array[i] = new_element;
			}
		}
	console.log(color_array);
	}
	console.log(req.body);
	//待辦:
	//是否要做transaction?
	var lost_data_id;
	var lost_data;
	if(req.body.post_type == "lost"){
		lost_data = {
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
			other: req.body.other,
			user_id: req.body.user_id,
			lost_status: "finding",
			post_type: req.body.post_type,
			title: req.body.title,
			content: req.body.content
		}		
	}else if(req.body.post_type == "find"){
		lost_data = {
			category: req.body.category,
			pet_picture: req.file.key,
			gender: req.body.pet_gender,
			age: req.body.pet_age,
			breed: req.body.pet_breed,
			color: JSON.stringify(color_array),
			lost_location: req.body.input_address,
			lost_location_lng: req.body.lost_address_lng,
			lost_location_lat: req.body.lost_address_lat,
			lost_time: req.body.lost_time,
			other: req.body.other,
			user_id: req.body.user_id,
			lost_status: "finding",
			post_type: req.body.post_type,
			title: req.body.title,
			content: req.body.content
		}			
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
	
	//要改成只有選擇post lost的時候才做 //要測試
	if(req.body.post_type == "lost"){
		var select_mark = "SELECT user_id from user_mark WHERE location_lng BETWEEN "+req.body.lost_address_lng+"-0.05 AND "+req.body.lost_address_lng+"+0.05 AND location_lat BETWEEN "+req.body.lost_address_lat+"-0.05 AND "+req.body.lost_address_lat+"+0.05;";
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
		//文字比對
		var condition_array = [['find']];
		var query_array = [];
		if(req.body.category){
			let category_query = " category in (?)";
			query_array.push(category_query);
			condition_array.push([req.body.category]);
		}
		if(req.body.pet_gender){
			let gender_query = " gender in (?)";
			query_array.push(gender_query);
			condition_array.push([req.body.pet_gender]);
		}
		if(req.body.pet_breed){
			let pet_breed_query = " breed in (?)";
			query_array.push(pet_breed_query);
			condition_array.push([req.body.pet_breed]);
		}
		console.log(condition_array);
		//顏色
		//組成LIKE
		var color_query = " (";			
		for(i=0; i<color_array.length; i++){
				color_query += "color LIKE '%"+color_array[i]+"%'";
				if(i <color_array.length-1){
					color_query += " OR ";
				}
			}
		color_query += ")";
		query_array.push(color_query);
		console.log(query_array);
		//地址篩經緯度
		if(req.body.lost_address_lng){
			query_array.push(" lost_location_lng BETWEEN "+req.body.lost_address_lng+"-0.05 AND "+req.body.lost_address_lng+"+0.05 AND lost_location_lat BETWEEN "+req.body.lost_address_lat+"-0.05 AND "+req.body.lost_address_lat+"+0.05");
		}
		var compare_query = "SELECT * from lost_pet WHERE post_type in (?)";
		if(query_array.length >0){
			compare_query += " AND";
			for(i=0; i<query_array.length; i++){
				compare_query += query_array[i];
				if(i < query_array.length-1){
					compare_query += " AND";
				}
			}
		}
		console.log(compare_query);
		console.log();
		const compare_promise = new Promise((resolve, reject) => {
			mysql.con.query(compare_query, condition_array, function(err, result){
					if(err){
						console.log("lost_record api(post): \n");
						console.log("新增走失後比對目前已刊登的發現案例");
						console.log(err);
					}else{
						resolve(result);
					}
			});
		})
		let compare_result = await compare_promise;
		for(k=0; k<compare_result.length; k++){
			if(compare_result[k].user_id != req.body.user_id){
				var insert_message = {
					send_id: 0,
					send_time: Date.now(),
					receive_id: req.body.user_id,
					content: "出現疑似您的走失寵物, 請點訊息前往",
					link_id: compare_result[k].pet_id
				}
				mysql.con.query("INSERT INTO message set?", insert_message, function(err, result){
					if(err){
						console.log("lost_record api(mark): \n");
						console.log(err);
					}else{
						console.log("找出符合通報條件的走失寵物成功");
					}
				});					
			}
		}		
	}else if(req.body.post_type == "find"){
		//文字比對
		var condition_array = [['lost']];
		var query_array = [];
		if(req.body.category){
			let category_query = " category in (?)";
			query_array.push(category_query);
			condition_array.push([req.body.category]);
		}
		if(req.body.pet_gender){
			let gender_query = " gender in (?)";
			query_array.push(gender_query);
			condition_array.push([req.body.pet_gender]);
		}
		if(req.body.pet_breed){
			let pet_breed_query = " breed in (?)";
			query_array.push(pet_breed_query);
			condition_array.push([req.body.pet_breed]);
		}
		console.log(condition_array);
		//顏色
		//組成LIKE
		var color_query = " (";			
		for(i=0; i<color_array.length; i++){
				color_query += "color LIKE '%"+color_array[i]+"%'";
				if(i <color_array.length-1){
					color_query += " OR ";
				}
			}
		color_query += ")";
		query_array.push(color_query);
		console.log(query_array);
		//地址篩經緯度
		if(req.body.lost_address_lng){
			query_array.push(" lost_location_lng BETWEEN "+req.body.lost_address_lng+"-0.05 AND "+req.body.lost_address_lng+"+0.05 AND lost_location_lat BETWEEN "+req.body.lost_address_lat+"-0.05 AND "+req.body.lost_address_lat+"+0.05");
		}
		var compare_query = "SELECT * from lost_pet WHERE post_type in (?)";
		if(query_array.length >0){
			compare_query += " AND";
			for(i=0; i<query_array.length; i++){
				compare_query += query_array[i];
				if(i < query_array.length-1){
					compare_query += " AND";
				}
			}
		}
		console.log(compare_query);
		console.log();
		const compare_promise = new Promise((resolve, reject) => {
			mysql.con.query(compare_query, condition_array, function(err, result){
					if(err){
						console.log("lost_record api(post): \n");
						console.log(err);
					}else{
						resolve(result);
					}
			});
		})
		let compare_result = await compare_promise;
		let compared_user_array = [];
		for(j=0; j<compare_result.length; j++){
			//篩掉重複的user_id
			//insert message
			compared_user_array.push(compare_result[j].user_id);
		}
		console.log("compared user: "+compared_user_array);
		var result = compared_user_array.filter(function(element, index, arr){
			return arr.indexOf(element)=== index;
		});
		console.log(result);
		for(k=0; k<result.length; k++){
			if(result[k] != req.body.user_id){
				var insert_message = {
					send_id: 0,
					send_time: Date.now(),
					receive_id: result[k],
					content: "出現疑似您的走失寵物, 請點訊息前往",
					link_id: insert_lost_pet.insertId
				}
				mysql.con.query("INSERT INTO message set?", insert_message, function(err, result){
					if(err){
						console.log("lost_record api(mark): \n");
						console.log(err);
					}else{
						console.log("找出符合通報條件的走失寵物成功");
					}
				});					
			}
		}		
	}
});

app.get('/', async function(req, res){
	var picture_s3_url = "https://d2h10qrqll8k7g.cloudfront.net/person_project/lost_pet/";
	var select_lost_record = "SELECT * from lost_pet where lost_status = \"finding\" ;"
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
			lost_location_lng: lost_record[i].lost_location_lng,
			lost_location_lat: lost_record[i].lost_location_lat,
			lost_time: lost_record[i].lost_time,
			other: lost_record[i].other,
			lost_status: lost_record[i].lost_status,
			post_type: lost_record[i].post_type,
			title: lost_record[i].title,
			content: lost_record[i].content
		}
		lost_record_array.push(lost_data_object);
	};
	var data = {
		data:lost_record_array
	}
	res.json(data);
});

module.exports = app;