const fs = require('fs');
const AWS = require('aws-sdk');
var mysql = require("../mysqlcon.js");
var lost_data = require('../model/lost_data');
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

const picture_s3_url = "https://d2h10qrqll8k7g.cloudfront.net/person_project/lost_pet/";
	
app.post('/', upload.single('image'), async function(req, res){
	let select_body = create_query(req.body);
	let condition_array = create_query_array(req.body);
	try{
		let text_matched_array = await lost_data.select_post(select_body,condition_array);
		if(text_matched_array.length == 0){
			//文字結果沒有符合, 無論有無圖片都不會繼續比對
			var data = {
				data:[],
				//image_compare: "no_compare",
				string_compare: "no_matched"
			}
			res.send(data);
		}else{
			if(req.file){
				//先去篩選圖片後再傳到最後組api的function
				compare_image(text_matched_array,request_file).then(function(result){
					res.send(create_api(result));
				})
			}else{
				let result = {
					array: text_matched_array,
					image_compare: "no_compare",
					string_compare: "with_string"
				}
				res.send(create_api(result));
			}
		}
	}catch(error){
		console.log(error);
		return mysql.con.rollback(function(){
			res.status(500).send({error:"Database Query Error"});
		});				
	}
});

function compare_image(array,file){
	//promise(篩選圖片).then(判斷並return 結果跟 situation)
	console.log("search with file");
	s3_compare.then(function(result_array){
		if(result_array.length == 0){
			let result = {
				array: array,
				image_compare: "no_matched",
				string_compare: "with_string"
			}
			return result;				
		}else{
			let result = {
				array: result_array,
				image_compare: "matched",
				string_compare: "with_string"
			}
			return result;				
		}
	})
}

function s3_compare(file){
	let image_matched_array = [];
	return new Promise((resolve, reject) => {
		const select_bucket = 'shiuan';
		const client = new AWS.Rekognition();
		const photo_target  = 'person_project/lost_pet/'+file.key;
		console.log("target: "+photo_target);
		let counter = 0;
		console.log("array.length: "+array.length);
		for(let j=0; j<array.length; j++){
			const photo_source  = 'person_project/lost_pet/'+array[j].pet_picture;
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
					console.log(j+" : error, can't compare");
					console.log(err);
					array[j].image_compare_result = "unmatch";
					counter++;
					console.log("counter = "+counter);
					if(counter == array.length){
						resolve(image_matched_array);
					}
				} else {
					if(response.FaceMatches.length == 0){
						//無error但沒有比對到
						console.log(j+" : no matched data");
						array[j].image_compare_result = "unmatch";
						counter++;
						console.log("counter = "+counter);
						if(counter == array.length){
							resolve(image_matched_array);
						}
					}else{
						//無error有比對到, 組成一個新的array 再把整個組裝api的function拉到外面寫
						response.FaceMatches.forEach(data => {
							let position   = data.Face.BoundingBox
							let similarity = data.Similarity
							image_matched_array.push(j);
							console.log(j+" : matched");
							console.log(`The face at: ${position.Left}, ${position.Top} matches with ${similarity} % confidence`);
							array[j].image_compare_result = "match";
							image_matched_array.push(array[j]);
							counter++;
							console.log("counter = "+counter);
							if(counter == array.length){
								resolve(image_matched_array);
							}
						})
					}
				}
			});
		}
	})
}

function create_query(body){
	let select_array = [];
	if(body.lost_status){
		let lost_status_body = " lost_status in (?)";
		select_array.push(lost_status_body);
	}
	if(body.post_type){
		let post_type_body = " post_type in (?)";
		select_array.push(post_type_body);
	}
	if(body.select_category){
		let category_body = " category in (?)";
		select_array.push(category_body);
	}
	if(body.select_breed){
		let breed_body = " breed in (?)";
		select_array.push(breed_body);
	}
	if(body.select_gender){
		let gender_body = " (gender is null or gender in (?))";
		select_array.push(gender_body);
	}
	//地址篩經緯度
	if(body.lost_address_lng){
		select_array.push(" lost_location_lng BETWEEN "+body.lost_address_lng+"-0.05 AND "+body.lost_address_lng+"+0.05 AND lost_location_lat BETWEEN "+body.lost_address_lat+"-0.05 AND "+body.lost_address_lat+"+0.05");
	}
	//顏色where color like '%黑%' OR '%白%'
	if(typeof(body.select_color) == "object"){
		let color_body = "";
		color_body += " (";
		for(let j=0; j<body.select_color.length; j++){
			color_body += "color LIKE '%"+body.select_color[j]+"%'";
			if(j <body.select_color.length-1){
				color_body += " OR ";
			}
		}
		color_body += ")";
		select_array.push(color_body);
	}else if(typeof(body.select_color) == "string"){
		select_array.push(" color LIKE '%"+body.select_color+"%'");
	}
	let select_body = "SELECT * from lost_pet WHERE lost_status = \"finding\" ";
	if(select_array.length >0){
		for(let i=0; i<select_array.length; i++){
			select_body += " AND";
			select_body += select_array[i];
		}
	}
	return select_body;
};

function create_query_array(body){
	var condition_array = [];
	if(typeof(body.lost_status) == "object"){
		condition_array.push(body.lost_status);
	}else if(typeof(body.lost_status) == "string"){
		condition_array.push([body.lost_status]);
	}
	if(typeof(body.post_type) == "object"){
		condition_array.push(body.post_type);
	}else if(typeof(body.post_type) == "string"){
		condition_array.push([body.post_type]);
	}
	if(typeof(body.select_category) == "object"){
		condition_array.push(body.select_category);
	}else if(typeof(body.select_category) == "string"){
		condition_array.push([body.select_category]);
	}
	if(typeof(body.select_breed) == "object"){
		condition_array.push(body.select_breed);
	}else if(typeof(body.select_breed) == "string"){
		condition_array.push([body.select_breed]);
	}
	if(typeof(body.select_gender) == "object"){
		condition_array.push(body.select_gender);
	}else if(typeof(body.select_gender) == "string"){
		condition_array.push([body.select_gender]);
	}
	return condition_array;
};

function create_api(compare_result){
	//組成新array, 跟else合併
	let lost_record_array = [];
	for(let i=0; i<compare_result.array.length; i++){
		const list = compare_result.array[i];
		var lost_data_object = {
			id: list.pet_id,
			name: list.pet_name,
			picture: picture_s3_url+list.pet_picture,
			gender: list.gender,
			age: list.age,
			breed: list.breed,
			color: list.color,
			lost_location: list.lost_location,
			lost_location_lng: list.lost_location_lng,
			lost_location_lat: list.lost_location_lat,
			lost_time: list.lost_time,
			lost_status: list.lost_status,
			post_type: list.post_type,
			title: list.title,
			content: list.content
		}
		lost_record_array.push(lost_data_object);
	}
	var data = {
		data:lost_record_array,
		image_compare: compare_result.image_compare,
		string_compare: compare_result.string_compare
	}
	console.log(data);
	return data;				
};

module.exports = app;