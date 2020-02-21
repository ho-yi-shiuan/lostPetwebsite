const fs = require('fs');
const AWS = require('aws-sdk');
var mysql = require("../mysqlcon.js");
var express = require("express");
var multer  = require('multer');
var multerS3 = require('multer-s3');
var bodyParser = require('body-parser');
var app = express();
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
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
	console.log(req.file);
	//篩選類別, 品種, 性別
	var select_array = [];
	var body_array = [];
	var condition_array = [];
	if(typeof(req.body.lost_status) == "object"){
		let lost_status_body = " lost_status in (?)";
		condition_array.push(req.body.lost_status);
		select_array.push(lost_status_body);
	}else if(typeof(req.body.lost_status) == "string"){
		let lost_status_body = " lost_status in (?)";
		condition_array.push([req.body.lost_status]);
		select_array.push(lost_status_body);
	}
	if(typeof(req.body.post_type) == "object"){
		let post_type_body = " post_type in (?)";
		condition_array.push(req.body.post_type);
		select_array.push(post_type_body);
	}else if(typeof(req.body.post_type) == "string"){
		let post_type_body = " post_type in (?)";
		condition_array.push([req.body.post_type]);
		select_array.push(post_type_body);
	}
	if(typeof(req.body.select_category) == "object"){
		let category_body = " category in (?)";
		condition_array.push(req.body.select_category);
		select_array.push(category_body);
	}else if(typeof(req.body.select_category) == "string"){
		let category_body = " category in (?)";
		condition_array.push([req.body.select_category]);
		select_array.push(category_body);
	}
	if(typeof(req.body.select_breed) == "object"){
		let breed_body = " breed in (?)";
		condition_array.push(req.body.select_breed);
		select_array.push(breed_body);
	}else if(typeof(req.body.select_breed) == "string"){
		let breed_body = " breed in (?)";
		condition_array.push([req.body.select_breed]);
		select_array.push(breed_body);
	}
	if(typeof(req.body.select_gender) == "object"){
		let gender_body = " (gender is null or gender in (?))";
		condition_array.push(req.body.select_gender);
		select_array.push(gender_body);
	}else if(typeof(req.body.select_gender) == "string"){
		let gender_body = " (gender is null or gender in (?))";
		condition_array.push([req.body.select_gender]);
		select_array.push(gender_body);
	}
	//地址篩經緯度
	if(req.body.lost_address_lng){
		select_array.push(" lost_location_lng BETWEEN "+req.body.lost_address_lng+"-0.05 AND "+req.body.lost_address_lng+"+0.05 AND lost_location_lat BETWEEN "+req.body.lost_address_lat+"-0.05 AND "+req.body.lost_address_lat+"+0.05");
	}
	//顏色where color like '%黑%' OR '%白%'
	if(typeof(req.body.select_color) == "object"){
		var color_body = "";
		color_body += " (";
		var color_body;
		for(j=0; j<req.body.select_color.length; j++){
			color_body += "color LIKE '%"+req.body.select_color[j]+"%'";
			if(j <req.body.select_color.length-1){
				color_body += " OR ";
			}
		}
		color_body += ")";
		select_array.push(color_body);
		console.log(color_body);
	}else if(typeof(req.body.select_color) == "string"){
		select_array.push(" color LIKE '%"+req.body.select_color+"%'");
	}	
	
	var select_body = "SELECT * from lost_pet ";
	if(select_array.length >0){
		select_body += "where";
		for(i=0; i<select_array.length; i++){
			select_body += select_array[i];
			if(i < select_array.length-1){
				select_body += " AND";
			}
		}
	}
	console.log(select_body);
	console.log(condition_array);
	const lost_record_promise = new Promise((resolve, reject) => {
	mysql.con.query(select_body, condition_array, function(err, result){
			if(err){
				console.log("lost_record api(get): \n");
				console.log(err);
			}else{
				resolve(result);
			}
		});
	})
	let lost_record = await lost_record_promise;
	//以上為純文字篩選結果, 要抓他們的圖片名稱去比對
	if(req.file){
		console.log(req.file.key);
		const select_bucket = 'shiuan';
		const client = new AWS.Rekognition();
		const photo_target  = 'person_project/lost_pet/'+req.file.key;
		console.log("target: "+photo_target);
		for(j=0; j<lost_record.length; j++){
			const photo_source  = 'person_project/lost_pet/'+lost_record[j].pet_picture;
			console.log("source: "+photo_source);
			const params = {
				SourceImage: {
					S3Object: {
						Bucket: select_bucket,
						Name: photo_source
					},
				},
				TargetImage: {
					S3Object: {
						Bucket: select_bucket,
						Name: photo_target
					},
				},
				SimilarityThreshold: 70
			}
			client.compareFaces(params, function(err, response) {
				console.log("開始比對");
				if (err) {
					console.log(err, err.stack); // an error occurred
				} else {
					response.FaceMatches.forEach(data => {
						let position   = data.Face.BoundingBox
						let similarity = data.Similarity
						console.log(`The face at: ${position.Left}, ${position.Top} matches with ${similarity} % confidence`)
					}) // for response.faceDetails
				} // if
			});		
		}		
	}
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