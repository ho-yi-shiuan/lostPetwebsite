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
	let picture_s3_url = "https://d2h10qrqll8k7g.cloudfront.net/person_project/lost_pet/";
	let select_body = create_query(req.body);
	let condition_array = create_query(req.body);
	select_post(select_body,condition_array).then(function(lost_record){
		
	})
	//以上為純文字篩選結果, 要抓他們的圖片名稱去比對
	if(req.file){
		var matched_array = [];
		console.log("search with file");
		let image_compare_promise = new Promise((resolve, reject) => {
			const select_bucket = 'shiuan';
			const client = new AWS.Rekognition();
			const photo_target  = 'person_project/lost_pet/'+req.file.key;
			console.log("target: "+photo_target);
			var counter = 0;
			console.log("lost_record.length: "+lost_record.length);
			for(let j=0; j<lost_record.length; j++){
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
						console.log(j+" : error, can't compare");
						console.log(err);
						lost_record[j].image_compare_result = "unmatch";
						counter++;
						console.log("counter = "+counter);
						if(counter == lost_record.length){
							resolve("finished");
						}
					} else {
						if(response.FaceMatches.length == 0){
							//無error但沒有比對到
							console.log(j+" : no matched data");
							lost_record[j].image_compare_result = "unmatch";
							counter++;
							console.log("counter = "+counter);
							if(counter == lost_record.length){
								resolve("finished");
							}
						}else{
							//無error有比對到, 組成一個新的array 再把整個組裝api的function拉到外面寫
							response.FaceMatches.forEach(data => {
								let position   = data.Face.BoundingBox
								let similarity = data.Similarity
								matched_array.push(j);
								console.log(j+" : matched");
								console.log(`The face at: ${position.Left}, ${position.Top} matches with ${similarity} % confidence`);
								lost_record[j].image_compare_result = "match";
								counter++;
								console.log("counter = "+counter);
								if(counter == lost_record.length){
									resolve("finished");
								}
							})
						}
					}
				});
			}
		})
		image_compare_promise.then(function(){
			console.log(matched_array);
			if(matched_array.length > 0 ){
				//組成新array, 跟else合併
				var matched_lost_record_array = [];
				for(let i=0; i<lost_record.length; i++){
					if(lost_record[i].image_compare_result == "match"){
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
							lost_status: lost_record[i].lost_status,
							post_type: lost_record[i].post_type,
							title: lost_record[i].title,
							content: lost_record[i].content,
							image_compare_result: lost_record[i].image_compare_result
						}
						matched_lost_record_array.push(lost_data_object);
						console.log(i+" : push to match");
					}
				}
				var data = {
					data:matched_lost_record_array,
					image_compare: "matched"
				}
				if(select_array.length == 0){
					//無文字條件但有圖片
					data.string_compare = "no_string";
				}else{
					//有文字且有圖片搜尋
					data.string_compare = "with_string";
				}
				console.log("圖片搜尋且有比對到");
				console.log(data);
				res.json(data);	
			}else{
				var unmatch_lost_record_array = [];
				for(let i=0; i<lost_record.length; i++){
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
						lost_status: lost_record[i].lost_status,
						post_type: lost_record[i].post_type,
						title: lost_record[i].title,
						content: lost_record[i].content,
						image_compare_result: lost_record[i].image_compare_result
					}
					unmatch_lost_record_array.push(lost_data_object);
					console.log(i+" : push to unmatch");
				};
				var data = { 
					data:unmatch_lost_record_array,
					image_compare: "no_matched"
				}
				if(select_array.length == 0){
					//無文字條件但有圖片
					data.string_compare = "no_string";
				}else{
					//有文字且有圖片搜尋
					data.string_compare = "with_string";
				}
				console.log("圖片搜尋沒有比對到");
				console.log(data);
				res.json(data);					
			}		
		})	
	}else{
		console.log("search without file");
		let lost_record_array = [];
		for(let i=0; i<lost_record.length; i++){
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
				lost_status: lost_record[i].lost_status,
				post_type: lost_record[i].post_type,
				title: lost_record[i].title,
				content: lost_record[i].content,
				image_compare_result: "no_upload"
			}
			lost_record_array.push(lost_data_object);
			console.log(i+" : push without match");
		};
		var data = {
			data:lost_record_array,
			image_compare: "no_compare",
		}
		if(select_array.length == 0){
			//無文字條件但有圖片
			data.string_compare = "no_string";
		}else{
			//有文字且有圖片搜尋
			data.string_compare = "with_string";
		}
		console.log("沒有使用圖片搜尋");
		console.log(data);
		res.json(data);		
	}
});

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
	
module.exports = app;