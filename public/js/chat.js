var socket;
function init_socket(user_info){
	socket = io.connect();
	socket.on('connect', function (){
		socket.emit('join', user_info);
	});
	socket.on('history', function(history_obj){
		if (history_obj.length > 0) {
			appendData(history_obj);
		}
	});
	socket.on('receiveImg', (obj) => {
		appendData(obj);
	})
	socket.on('message', function(message_obj){
		appendData(message_obj);
	});
	socket.on('error', function(error_obj){
		console.log(error_obj);
		appendData(error_obj);
	});	
}

let user_name;
let user_picture;
let user_id;
let cookiesend = {
	list_type: "lost",
	lost_status: ["finding"]	
};
function getcookie()
{
	let cookies = document.cookie.split(";");
	for(i=0;i<cookies.length;i++)
	{
		let c = cookies[i].trim();
		if(c.indexOf("user=") >= 0)
		{
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
			if(res.status == "token_expired"){
				alert('Token 已過期, 請重新登入');
				document.location.href = "/signin.html";
			}else if(res.status == "token_wrong"){
				alert('無登入紀錄, 請登入');
				document.location.href = "/signin.html";
			}else{
				user_picture = res.data.picture;
				user_name = res.data.name;
				user_id = res.data.id;
				let url = location.href;
				let room_id = url.split('=');
				let user_info = {
					user_name: res.data.name,
					room_id: room_id[1]
				}
				init_socket(user_info);
			}
		},
		error: function(err)
		{
			console.log(err);
			alert(err.responseJSON.error);
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
		user_id: user_id
	};
	socket.emit('message_to_backend', data);
	document.querySelector('#content').value = '';
}

function sendPicture(){
	let Imginput = document.getElementById('socket_picture');
	let file = Imginput.files[0];
	let reader = new FileReader();
	reader.readAsDataURL(file);
	reader.onload =function(){
		var data = {
			name: user_name,
			img: this.result,
			user_id: user_id
		};
		socket.emit('sendImg', data);
	}	
}

var picture_s3_url = "https://d2h10qrqll8k7g.cloudfront.net/";
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
	user_picture_file.src = obj.picture;
	user_picture_container.appendChild(user_picture_file);
	name_content.appendChild(user_picture_container);
	group.appendChild(name_content);
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
		user_picture_file.src = element.picture;
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

var autocomplete;
window.addEventListener('load', () => {
	var input = document.getElementById('insert_mark');
	autocomplete = new google.maps.places.Autocomplete(input);
});

var map;
var geocoder;
function initMap() {
	geocoder = new google.maps.Geocoder();
	polyline = new google.maps.Polygon();
	map = new google.maps.Map(document.getElementById('map'), {
		zoom: 15
	});

	let urlParams = new URLSearchParams(window.location.search);
	let id = urlParams.get('id')
	const xhr = new XMLHttpRequest();
	var url = "/lost_detail?id="+id;
	xhr.open("get", url);
	xhr.onload = async function(){
		if (xhr.status == 500) {
			alert("Database Query Error");		
		}
		var detail = JSON.parse(this.response);
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
		if(detail.age == ""){
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
		if(detail.breed == ""){
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
		let time_stamp = new Date(detail.lost_time).getTime();
		let format_time = new Date(parseInt(time_stamp)).toLocaleString('chinese', {hour12: true});
		let minute_time = format_time.slice(0,format_time.length-3);
		lost_time_value.appendChild(document.createTextNode(minute_time));
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
		let address = detail.lost_location;
		let polygonPathPoints = [];
		let gmarkers = [];
		let lost_point;
		geocoder.geocode( { 'address': address}, function(results, status) {
			if (status == 'OK') {
				map.setCenter(results[0].geometry.location);
				var marker = new google.maps.Marker({
					map: map,
					position: results[0].geometry.location,
					icon: '/images/placeholder.png',
				});
				if(detail.post_type == "find"){
					var infowindow = new google.maps.InfoWindow({
						content: "發現地"
					});				
				}else{
					var infowindow = new google.maps.InfoWindow({
						content: "走失地"
					});	
					polygonPathPoints.push({
						lat:results[0].geometry.location.lat(),
						lng:results[0].geometry.location.lng()
					});	
					lost_point = {
						lat:results[0].geometry.location.lat(),
						lng:results[0].geometry.location.lng()
					}
					gmarkers.push(marker);
				}
				infowindow.open(map, marker);
				marker.addListener('click', function() {
					infowindow.open(map, marker);
				});
			} else {
				console.log("地址轉換成經緯度: "+status);
			}
		});
		let point_promise = new Promise((resolve, reject) => {
			let counter = 0;
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
						gmarkers.push(marker);
						var infowindow = new google.maps.InfoWindow({
							content: infowindow_content
						});
						marker.addListener('click', function() {
							infowindow.open(map, marker);
						});
						counter++;
						if(counter == detail.markers.length){
							resolve("success");
						}
					} else {
						console.log("地址轉換成經緯度: "+status);
					}
				});
				//google map mark(db current mark) code end
			}		
		})
		point_promise.then(function(){
			//畫連線面積
			if(detail.lost_status == "end_found"){
				var points = [];
				var hullPoints = [];
				var polyline;
				var farest_distance = 0;
				var farest_index;
				for (let i = 0; i < polygonPathPoints.length; i++) {
					var point = new google.maps.LatLng(polygonPathPoints[i].lat,polygonPathPoints[i].lng);
					points.push(point);
					//最遠距離計算
					let start = new google.maps.LatLng(lost_point);
					let end = new google.maps.LatLng(polygonPathPoints[i]);
					let distance = google.maps.geometry.spherical.computeDistanceBetween(start, end);
					if(distance >  farest_distance){
						farest_distance = distance;
						farest_index = i;
					}
				}
				//最遠點跟走失點連線
				polyline = new google.maps.Polygon({
					map: map,
					paths: [lost_point,polygonPathPoints[farest_index]],
					strokeColor: "rgba(255,255,0)",
					strokeWidth: 6,
					zIndex: 100
				});					
				let farest_report = document.createTextNode(" : 最遠曾移動至距離走失地點"+(farest_distance/1000).toFixed(1)+"公里處 ");
				let farest_line = document.createElement("img");
				farest_line.src = "/images/line.png";
				document.getElementsByClassName("mark_information")[0].appendChild(farest_line);
				document.getElementsByClassName("mark_information")[0].appendChild(farest_report);
				document.getElementById("farest_report").style = "margin-top: 10px;";
				let range_image = document.createElement("img");
				range_image.src = "/images/range.png";
				document.getElementsByClassName("mark_information")[0].appendChild(range_image);
				document.getElementsByClassName("mark_information")[0].appendChild(document.createTextNode(" : 走失期間移動範圍"));
				calculateConvexHull();
				function calculateConvexHull() {
					for (var i = 0; i < gmarkers.length; i++) {
						points.push(gmarkers[i].getPosition());
					}
					points.sort(sortPointY);
					points.sort(sortPointX);
					DrawHull();
				}

				function sortPointX(a, b) {
					return a.lng() - b.lng();
				}

				function sortPointY(a, b) {
					return a.lat() - b.lat();
				}

				function DrawHull() {
					hullPoints = [];
					//畫中間面積
					chainHull_2D(points, points.length, hullPoints);
					//面外圍線
					polyline = new google.maps.Polygon({
						map: map,
						paths: hullPoints,
						fillColor: "#FF0000",
						strokeWidth: 2,
						fillOpacity: 0.3,
						strokeColor: "#000000",
						strokeOpacity: 0.7
					});
				}
				
				function sortPointX(a, b) {
					return a.lng() - b.lng();
				}

				function sortPointY(a, b) {
					return a.lat() - b.lat();
				}

				function isLeft(P0, P1, P2) {
					return (P1.lng() - P0.lng()) * (P2.lat() - P0.lat()) - (P2.lng() - P0.lng()) * (P1.lat() - P0.lat());
				}
				// chainHull_2D(): A.M. Andrew's monotone chain 2D convex hull algorithm
				// http://softsurfer.com/Archive/algorithm_0109/algorithm_0109.htm
				//     Input:  P[] = an array of 2D points 
				//                   presorted by increasing x- and y-coordinates
				//             n = the number of points in P[]
				//     Output: H[] = an array of the convex hull vertices (max is n)
				//     Return: the number of points in H[]
				function chainHull_2D(P, n, H) {
					// the output array H[] will be used as the stack
					var bot = 0,
						top = (-1); // indices for bottom and top of the stack
					var i; // array scan index
					// Get the indices of points with min x-coord and min|max y-coord
					var minmin = 0,
						minmax;

					var xmin = P[0].lng();
					for (i = 1; i < n; i++) {
						if (P[i].lng() != xmin) {
							break;
						}
					}

					minmax = i - 1;
					if (minmax == n - 1) { // degenerate case: all x-coords == xmin 
						H[++top] = P[minmin];
						if (P[minmax].lat() != P[minmin].lat()) // a nontrivial segment
						H[++top] = P[minmax];
						H[++top] = P[minmin]; // add polygon endpoint
						return top + 1;
					}

					// Get the indices of points with max x-coord and min|max y-coord
					var maxmin, maxmax = n - 1;
					var xmax = P[n - 1].lng();
					for (i = n - 2; i >= 0; i--) {
						if (P[i].lng() != xmax) {
							break;
						}
					}
					maxmin = i + 1;

					// Compute the lower hull on the stack H
					H[++top] = P[minmin]; // push minmin point onto stack
					i = minmax;
					while (++i <= maxmin) {
						// the lower line joins P[minmin] with P[maxmin]
						if (isLeft(P[minmin], P[maxmin], P[i]) >= 0 && i < maxmin) {
							continue; // ignore P[i] above or on the lower line
						}

						while (top > 0) { // there are at least 2 points on the stack
							// test if P[i] is left of the line at the stack top
							if (isLeft(H[top - 1], H[top], P[i]) > 0) {
								break; // P[i] is a new hull vertex
							} else {
								top--; // pop top point off stack
							}
						}

						H[++top] = P[i]; // push P[i] onto stack
					}

					// Next, compute the upper hull on the stack H above the bottom hull
					if (maxmax != maxmin) { // if distinct xmax points
						H[++top] = P[maxmax]; // push maxmax point onto stack
					}

					bot = top; // the bottom point of the upper hull stack
					i = maxmin;
					while (--i >= minmax) {
						// the upper line joins P[maxmax] with P[minmax]
						if (isLeft(P[maxmax], P[minmax], P[i]) >= 0 && i > minmax) {
							continue; // ignore P[i] below or on the upper line
						}

						while (top > bot) { // at least 2 points on the upper stack
							// test if P[i] is left of the line at the stack top
							if (isLeft(H[top - 1], H[top], P[i]) > 0) {
								break; // P[i] is a new hull vertex
							} else {
								top--; // pop top point off stack
							}
						}

						H[++top] = P[i]; // push P[i] onto stack
					}

					if (minmax != minmin) {
						H[++top] = P[minmin]; // push joining endpoint onto stack
					}

					return top + 1;
				}		
			}		
		})
	}
	xhr.send();

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
			error: function(err)
			{
				console.log(err);
				alert(err.responseJSON.error);
			},
			dataType: "json"
		});
	}
}