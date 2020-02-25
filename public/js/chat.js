//socket code start
console.log("開始執行socket script");
var socket;
function init_socket(user_info){
	socket = io.connect();
	socket.on('connect', function (){
		socket.emit('join', user_info);
	});
	//顯示歷史訊息
	socket.on('history', function(history_obj){
		console.log("前端收到歷史訊息");
		console.log(history_obj);
		if (history_obj.length > 0) {
			appendData(history_obj);
		}
	});
	//收到後端傳來的圖片處理
	socket.on('receiveImg', (obj) => {
		console.log(obj);
		appendImage(obj);
	})
	//收到後端傳來的訊息如何處理
	socket.on('message', function(message_obj){
		console.log(message_obj);
		appendData([message_obj]);
	});
}
//socket code end
//google map code start
console.log("開始執行map script");
var map;
var geocoder;
function initMap() {
	console.log("執行init map");
	geocoder = new google.maps.Geocoder();
	map = new google.maps.Map(document.getElementById('map'), {
		zoom: 15
	});
}
var autocomplete;
window.addEventListener('load', () => {
	var input = document.getElementById('insert_mark');
	autocomplete = new google.maps.places.Autocomplete(input);
});
//googlt map code end
//找出使用者資料code start
var user_name;
var user_picture;
var cookiesend = {};
function getcookie()
{
	var cookies = document.cookie.split(";");
	console.log(cookies);
	for(i=0;i<cookies.length;i++)
	{
		var c = cookies[i].trim();//去空白
		if(c.indexOf("user=") >= 0)//回傳找到的第一個
		{
			//找到user cookie, 直接拿token去登入, 回傳會員資料
			cookiesend.cookie = c.substring(5,c.length);
			return("2");
		}
	}
}

var cookieresult = getcookie();
if(cookieresult == "2")
{
	$.ajax({
		contentType :"application/json",
		type: "POST",
		url: "/profile",
		data: JSON.stringify(cookiesend),
		success: function(res)
		{
			if(res.status == "expired"){
				alert('Token 已過期, 請重新登入');
				document.location.href = "/signin.html";
			}else if(res.status == "wrong"){
				alert('無登入紀錄, 請登入');
				document.location.href = "/signin.html";
			}else{
				console.log(res);
				user_picture = res.data.picture;
				user_name = res.data.name;
				//拆解網址找出id
				var url = location.href;
				var room_id = url.split('=');
				console.log("room_id = "+room_id[1]);
				var user_info = {
					user_name: res.data.name,
					room_id: room_id[1]
					//應該要傳roomId
				}
				init_socket(user_info);
			}
		},
		error: function(err)
		{
			console.log(err);
		},
		dataType: "json"
		});
}
else{
	document.location.href="/signin.html";
}

function keyLogin(){
	if (event.keyCode==13){//enter的鍵值為13
		document.getElementById("submit_message").click(); //觸動按鈕的點擊			
	}
}
document.getElementById("submit_message").addEventListener('click', function(){
	Send();
});
function Send() {
	let content = document.querySelector('#content').value;
	if (!content && !name) {
		alert('請輸入訊息');
		return;
	}
	let data = {
		name: user_name,
		content: content,
	};
	//傳訊息給後端
	console.log(data);
	socket.emit('message_to_backend', data);
	document.querySelector('#content').value = '';
}
//傳送圖片檔
function sendPicture(){
	let Imginput = document.getElementById('socket_picture');
	let file = Imginput.files[0];
	let reader = new FileReader();
	reader.readAsDataURL(file);
	reader.onload =function(){
		var data = {
			name: user_name,
			img: this.result
		};
		//let data = {img: this.result};
		socket.emit('sendImg', data);
	}	
}
var picture_s3_url = "https://d2h10qrqll8k7g.cloudfront.net/";
//var local_member_picture = "https://d2h10qrqll8k7g.cloudfront.net/person_project/image/";
function appendImage(obj){		
	var chat = document.createElement("div");
	chat.className = "chat";
	var group = document.createElement("div");
	group.className = "group";
	var name_content = document.createElement("div");
	name_content.className = "name_content";
	var user_picture_container = document.createElement("div");
	user_picture_container.className = "user_picture";	
	var user_picture_file = document.createElement("img");
	user_picture_file.className = "user_picture_file";
	user_picture_file.src = user_picture;
	user_picture_container.appendChild(user_picture_file);
	//把照片跟訊息內容append進一個container, 其flex row
	name_content.appendChild(user_picture_container);
	group.appendChild(name_content);//把container append進group
	var name = document.createElement("div");
	name.className = "name";
	var element_name = document.createTextNode(obj.name);
	name.appendChild(element_name);
	name_content.appendChild(name);
	var content = document.createElement("img");
	content.className = "chat_picture_file";
	content.src = picture_s3_url+obj.content;
	name_content.appendChild(content);
	group.appendChild(name_content);
	var time_container = document.createElement("div");
	time_container.className = "time_container";
	var time = document.createElement("div");
	time.className = "time";
	var element_time = document.createTextNode(moment(obj.time).fromNow());
	time.appendChild(element_time);
	time_container.appendChild(time);
	chat.appendChild(group);
	chat.appendChild(time_container);
	document.getElementsByClassName("chats")[0].appendChild(chat);
	scrollWindow();
}

function appendData(obj){
	obj.forEach(function(element){
		var chat = document.createElement("div");
		chat.className = "chat";
		var group = document.createElement("div");
		group.className = "group";
		var name = document.createElement("div");
		var name_content = document.createElement("div");
		name_content.className = "name_content";
		name.className = "name";
		if(element.content_type == "text"){
			var content = document.createElement("div");
			content.className = "content";
			var element_content = document.createTextNode(element.content);
			content.appendChild(element_content);			
		}else{
			var content = document.createElement("img");
			content.className = "chat_picture_file";
			content.src = picture_s3_url+element.content;			
		}
		var element_name = document.createTextNode(element.name);
		name.appendChild(element_name);
		var user_picture_container = document.createElement("div");
		user_picture_container.className = "user_picture";	
		var user_picture_file = document.createElement("img");
		user_picture_file.className = "user_picture_file";
		user_picture_file.src = user_picture;
		user_picture_container.appendChild(user_picture_file);
		group.appendChild(user_picture_container);
		var time_container = document.createElement("div");
		time_container.className = "time_container";
		var time = document.createElement("div");
		time.className = "time";
		var element_time = document.createTextNode(moment(element.time).fromNow());
		time.appendChild(element_time);
		time_container.appendChild(time);
		name_content.appendChild(name);
		name_content.appendChild(content);
		group.appendChild(name_content);
		chat.appendChild(group);
		chat.appendChild(time_container);
		document.getElementsByClassName("chats")[0].appendChild(chat);
	});
	scrollWindow();
}

function scrollWindow(){
	let h = document.querySelector('.chats');//回傳第一個找到的class
	h.scrollTo(0, h.scrollHeight);
}

//ajax code start
let urlParams = new URLSearchParams(window.location.search);
let id = urlParams.get('id')
const xhr = new XMLHttpRequest();
var url = "/lost_detail?id="+id;
xhr.open("get", url);
xhr.onload = function(){
	var detail = JSON.parse(this.response);
	console.log(detail);
	document.getElementById("post_title").innerHTML = detail.title;
	var post_content_text = document.createElement("div");
	post_content_text.id = "post_content_text";
	post_content_text.appendChild(document.createTextNode(detail.content));
	document.getElementsByClassName("post_content")[0].appendChild(post_content_text);
	var picture_file = document.createElement("img");
	picture_file.className = "picture_file";
	picture_file.src = detail.picture;
	document.getElementsByClassName("picture")[0].appendChild(picture_file);
	var table_key = document.createElement("tr");
	var table_value = document.createElement("tr");
	var name = document.createElement("td");
	name.className = "column_name";
	name.appendChild(document.createTextNode("姓名"));
	var name_value = document.createElement("td");
	if(detail.name == null){
		name_value.appendChild(document.createTextNode("未知"));		
	}else{
		name_value.appendChild(document.createTextNode(detail.name));		
	}
	var name_tr = document.createElement("tr");
	table_key.appendChild(name);
	table_value.appendChild(name_value);
	var gender = document.createElement("td");
	gender.className = "column_name";
	gender.appendChild(document.createTextNode("性別"));
	var gender_value = document.createElement("td");
	if(detail.gender == null){
		gender_value.appendChild(document.createTextNode("未知"));		
	}else if(detail.gender == "female"){
		gender_value.appendChild(document.createTextNode("女"));		
	}else if(detail.gender == "male"){
		gender_value.appendChild(document.createTextNode("男"));
	}
	var gender_tr = document.createElement("tr");
	table_key.appendChild(gender);
	table_value.appendChild(gender_value);
	var age = document.createElement("td");
	age.className = "column_name";
	age.appendChild(document.createTextNode("年齡"));
	var age_value = document.createElement("td");
	if(detail.age == null){
		age_value.appendChild(document.createTextNode("未知"));		
	}else{
		age_value.appendChild(document.createTextNode(detail.age));	
	}
	var age_tr = document.createElement("tr");
	table_key.appendChild(age);
	table_value.appendChild(age_value);
	var breed = document.createElement("td");
	breed.className = "column_name";
	breed.appendChild(document.createTextNode("品種"));
	var breed_value = document.createElement("td");
	if(detail.breed == null){
		breed_value.appendChild(document.createTextNode("未知"));		
	}else{
		breed_value.appendChild(document.createTextNode(detail.breed));
	}
	var breed_tr = document.createElement("tr");
	table_key.appendChild(breed);
	table_value.appendChild(breed_value);
	var color = document.createElement("td");
	color.className = "column_name";
	color.appendChild(document.createTextNode("顏色"));
	var color_value = document.createElement("td");
	if(detail.color == null){
		color_value.appendChild(document.createTextNode("未知"));		
	}else{
		color_value.appendChild(document.createTextNode(JSON.parse(detail.color)));
	}
	var color_tr = document.createElement("tr");
	table_key.appendChild(color);
	table_value.appendChild(color_value);
	var lost_location = document.createElement("td");
	lost_location.className = "column_name";
	lost_location.appendChild(document.createTextNode("走失地點"));
	var lost_location_value = document.createElement("td");
	lost_location_value.appendChild(document.createTextNode(detail.lost_location));
	var lost_location_tr = document.createElement("tr");
	table_key.appendChild(lost_location);
	table_value.appendChild(lost_location_value);
	var lost_time = document.createElement("td");
	lost_time.className = "column_name";
	lost_time.appendChild(document.createTextNode("走失時間"));
	var lost_time_value = document.createElement("td");
	lost_time_value.appendChild(document.createTextNode(detail.lost_time));
	var lost_time_tr = document.createElement("tr");
	table_key.appendChild(lost_time);
	table_value.appendChild(lost_time_value);
	document.getElementsByClassName("information")[0].appendChild(table_key);
	document.getElementsByClassName("information")[0].appendChild(table_value);
	if(detail.post_type == "lost"){
		if(detail.lost_status == "end_unfound" || detail.lost_status == "end_found"){
			document.getElementById("chatroom_title").innerHTML = "走失期間回報訊息";
			document.getElementById("chatroom_welcome_message").style = "display: none;";
			document.getElementsByClassName("message")[0].style="display: none;";
			let closed_message = document.createElement("div");
			closed_message.style = "text-align: center; line-height: 50px;";
			closed_message.appendChild(document.createTextNode("感謝您參與尋找, 協尋已關閉, 目前無法留言"));
			document.getElementsByClassName("message_container")[0].appendChild(closed_message);
			document.getElementsByClassName("add_mark")[0].style="display: none";			
		}
	}
	if(detail.post_type == "find"){
		document.getElementsByClassName("add_mark")[0].style="display: none";
		document.getElementById("map_title").innerHTML = "發現地點";
		document.getElementsByClassName("mark_information")[0].style="display: none";
	}
	//google map mark(db current mark) code start
	var address = detail.lost_location;
	geocoder.geocode( { 'address': address}, function(results, status) {
		if (status == 'OK') {
			map.setCenter(results[0].geometry.location);
			var marker = new google.maps.Marker({
				map: map,
				position: results[0].geometry.location,//new google.maps.LatLng(22.991965, 120.202518),
				icon: '/images/placeholder.png'
			});
			if(detail.post_type == "find"){
				var infowindow = new google.maps.InfoWindow({
					content: "發現地"
				});				
			}else{
				var infowindow = new google.maps.InfoWindow({
					content: "走失地"
				});					
			}
			infowindow.open(map, marker);
			marker.addListener('click', function() {
				infowindow.open(map, marker);
			});
		} else {
			console.log("地址轉換成經緯度: "+status);
		}
	});
	var polygonPathPoints = [];
	for(i=0; i<detail.markers.length; i++){
		let infowindow_content = detail.markers[i].marker_description;
		geocoder.geocode( { 'address': detail.markers[i].marker_location}, function(results, status) {
			if (status == 'OK') {
				polygonPathPoints.push({
					lat:results[0].geometry.location.lat(),
					lng:results[0].geometry.location.lng()
				});
				var marker = new google.maps.Marker({
					map: map,
					position: results[0].geometry.location,//new google.maps.LatLng(22.991965, 120.202518),
					icon: '/images/pin.png'
				});
				var infowindow = new google.maps.InfoWindow({
					content: infowindow_content
				});
				marker.addListener('click', function() {
					infowindow.open(map, marker);
				});
			} else {
				console.log("地址轉換成經緯度: "+status);
			}
		});
	}
	//google map mark(db current mark) code end
	//畫連線面積
	if(detail.lost_status == "end_found"){
		var polygonPathPoints = [
			{lat: 22.9904444, lng: 120.2043056},
			{lat: 22.9929299, lng: 120.2008873},
			{lat: 22.9899117, lng: 120.1979533},
			{lat: 22.990087, lng: 120.2059868},
			{lat: 22.9896681, lng: 120.2010486},
			{lat: 22.987102, lng: 120.1973454},
			{lat: 22.9917925, lng: 120.2025232}
		]		
		console.log(polygonPathPoints);
		var polygonPath = new google.maps.Polygon({
			paths: polygonPathPoints,
			strokeColor: '#0c0',
			strokeOpacity: .5,
			strokeWeight: 20,
			strokePosition: google.maps.StrokePosition.CENTER,
			fillColor: '#f00',
			fillOpacity: 0.35,
			map: map
		});  		
	}
}
xhr.send();
//ajax code end
//存取目前位置code start
document.getElementById("select_current_spot").addEventListener('click', function(){
	get_spot();
});
function get_spot(){
	navigator.geolocation.getCurrentPosition(function(position) {
		var pos = position.coords.latitude+", "+position.coords.longitude;
		console.log(pos);
		document.getElementById("insert_mark").value = pos;
	});
}
//存取目前位置code end
//ajax send mark code start
document.getElementById("submit_mark").addEventListener('click', function(){
	insert_mark();
});
function insert_mark(){
	var new_mark = {
		insert_mark:document.getElementById("insert_mark").value,
		insert_info:document.getElementById("insert_info").value
	}
	$.ajax({
		contentType :"application/json",
		type: "POST",
		url: "/lost_mark",
		data: JSON.stringify(new_mark),
		success: function(res)
			{
				document.getElementById("insert_mark").value = "";
				insert_info:document.getElementById("insert_info").value = "";
				geocoder.geocode( { 'address': res.location}, function(results, status) {
					if (status == 'OK') {
						var marker = new google.maps.Marker({
							map: map,
							position: results[0].geometry.location,
							icon: '/images/pin.png'
						});
						var infowindow = new google.maps.InfoWindow({
							content: res.description
						});
						marker.addListener('click', function() {
							infowindow.open(map, marker);
						});
					} else {
						console.log("地址轉換成經緯度: "+status);
					}
				});
			},
		dataType: "json"
		});
}
//ajax send mark code end