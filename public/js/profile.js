var user_id;
function get_token(){
	var cookies = document.cookie.split(";");
	for(i=0;i<cookies.length;i++)
	{
		var c = cookies[i].trim();//去空白
		if(c.indexOf("user=") >= 0)//回傳找到的第一個
		{
			token = c.substring(5,c.length);
			return(token);
		}
	}
}

var token = get_token();

if(token)
{
	get_lost("lost",["finding"],"profile_list_lost");
}
else{
	document.location.href="/signin.html";
}

var autocomplete;
window.addEventListener('load', () => {
	var input = document.getElementById('input_address');
	autocomplete = new google.maps.places.Autocomplete(input);
	google.maps.event.addListener(autocomplete, 'place_changed', function() {
		fill_address();
	});
});

// 地址的輸入框，值有變動時執行
function fill_address(){
	var place = autocomplete.getPlace();
	document.getElementsByName("lost_address_lng")[0].value = place.geometry.location.lng();
	document.getElementsByName("lost_address_lat")[0].value = place.geometry.location.lat();
};

//存取目前位置
function get_spot(){
	navigator.geolocation.getCurrentPosition(function(position) {
		document.getElementsByName("lost_address_lng")[0].value = position.coords.longitude;
		document.getElementsByName("lost_address_lat")[0].value = position.coords.latitude;	
		document.getElementById("input_address").value = "已存取目前位置";
	});
}

document.getElementById("select_current_spot").addEventListener('click', function(){
	document.getElementById("error_message").style = "display: none";
	get_spot();
});

document.getElementById("submit_mark").addEventListener('click', function(){
	if(document.getElementsByName("lost_address_lng")[0].value.length == 0){
		//輸入地址且地址錯誤
		document.getElementById("error_message").style = "color: white; display: block";
	}else{
		insert_mark();
		document.getElementById("error_message").style = "display: none";
	}
});

var map;
function initMap() {
	console.log("執行init map");
	geocoder = new google.maps.Geocoder();
	map = new google.maps.Map(document.getElementById('profile_map'), {
		zoom: 15,
		center: {
		  lat: 25.0374865,
		  lng: 121.5647688
		}
	});
	function insert_mark(){
		var user_mark = {
			user_id: user_id,
			insert_lng: document.getElementsByName("lost_address_lng")[0].value,
			insert_lat: document.getElementsByName("lost_address_lat")[0].value,
		}
		$.ajax({
			contentType :"application/json",
			type: "POST",
			url: "/user_mark",
			data: JSON.stringify(user_mark),
			success: function(res)
			{
				document.getElementById("input_address").value = "";
				var location = res.location_lat+", "+res.location_lng;
				geocoder.geocode( { 'address': location}, function(results, status) {
					if (status == 'OK') {
						map.panTo(results[0].geometry.location);
						var marker = new google.maps.Marker({
							map: map,
							position: results[0].geometry.location,//new google.maps.LatLng(22.991965, 120.202518),
							icon: '/images/placeholder.png'
						});
						var infowindow = new google.maps.InfoWindow({
							content: "新增之標記"
						});
						marker.addListener('click', function() {
							infowindow.open(map, marker);
						});
					} else {
						console.log("新增User標記: "+status);
					}
				});
			},
			error: function(err)
			{
				console.log(err.responseJSON.error);
				alert(err.responseJSON.error);
			},
			dataType: "json"
		});
	};
}

function get_lost(list_type,lost_status,display_title){
	var get_type = {
		cookie: token,
		list_type: list_type,
		lost_status: lost_status		
	};
	change_title(display_title);
	ajax_list(get_type);
}

function change_title(display_title){
	document.getElementById("profile_list_lost").style="";
	document.getElementById("profile_list_find").style="";
	document.getElementById("profile_list_lost_record").style="";
	document.getElementById(display_title).style=" background-color: rgba(0,0,0,.5); border: 1px solid rgba(0,0,0,.25); color: white;";
}

function signout(){
	var exp = new Date();
	exp.setTime(exp.getTime() - 1);
	document.cookie = "expires="+exp.toGMTString();
}

function ajax_list(get_type){
	$.ajax({
		contentType :"application/json",
		type: "POST",
		url: "/profile",
		data: JSON.stringify(get_type),
		success: function(res)
		{
			if(res.status == "token_expired"){
				document.location.href = "/signin.html";
			}else if(res.status == "token_wrong"){
				document.location.href = "/signin.html";
			}else{
				document.getElementsByClassName("nameline")[0].innerHTML = res.data.name;
				document.getElementsByClassName("emailline")[0].innerHTML = res.data.email;
				user_id = res.data.id;
				document.getElementsByClassName("user_lost_list")[0].innerHTML = "";
				append_data(res.data.lost_pet);
				document.getElementById("message_time_list").innerHTML = "";
				document.getElementById("message_content_list").innerHTML = "";
				document.getElementsByClassName("hide_display_container")[0].innerHTML = "";
				append_message(res.data.message);					
				for(i=0; i<res.data.mark.length; i++){
					geocoder.geocode( { 'address': res.data.mark[i] }, function(results, status) {
						if (status == 'OK') {
							map.panTo(results[0].geometry.location);
							var marker = new google.maps.Marker({
								map: map,
								position: results[0].geometry.location,
								icon: '/images/placeholder.png'
							});
							var infowindow = new google.maps.InfoWindow({
								content: "新增之標記"
							});
							marker.addListener('click', function() {
								infowindow.open(map, marker);
							});
						} else {
							console.log("新增User標記: "+status);
						}
					});					
				}
			}
		},
		error: function(err)
		{
			console.log(err.responseJSON.error);
			alert(err.responseJSON.error);
		},
		dataType: "json"
	});	
}

function append_data(res){
	if(res.length > 0){
		for(i=0; i<res.length; i++){
			let profile_container = document.createElement("div");
			profile_container.className = "profile_container";	
			let profile_image_container = document.createElement("div");
			profile_image_container.className = "profile_image_container";
			let profile_image = document.createElement("img");
			profile_image.id = "profile_image";
			profile_image.src = res[i].picture;
			profile_image_container.appendChild(profile_image);
			var profile_image_link = document.createElement("a");
			profile_image_link.href = "/room?id="+res[i].id;
			profile_image_link.appendChild(profile_image_container);		
			profile_container.appendChild(profile_image_link);
			let profile_lost_content = document.createElement("div");
			profile_lost_content.className = "profile_lost_content";
			if(res[i].post_type == "lost" && res[i].lost_status == "finding"){
				let close = document.createElement("div");
				close.className = "close";
				close.appendChild(document.createTextNode("關閉協尋"));
				profile_lost_content.appendChild(close);
				close.setAttribute("onclick", "display_close("+res[i].id+")");					
			}
			let name = document.createElement("div");
			name.className = "profile_content_li profile_content_li"+res[i].id;
			name.id = "profile_content_name";
			if(res[i].name == null){
				name.appendChild(document.createTextNode("姓名: 未知"));
			}else{
				name.appendChild(document.createTextNode("姓名: "+res[i].name));		
			}
			profile_lost_content.appendChild(name);
			let gender = document.createElement("div");
			gender.className = "profile_content_li profile_content_li"+res[i].id;
			if(res[i].gender == null){
				gender.appendChild(document.createTextNode("性別: 未知"));
			}else if(res[i].gender == "male"){
				gender.appendChild(document.createTextNode("性別: 男"));		
			}else if(res[i].gender == "female"){
				gender.appendChild(document.createTextNode("性別: 女"));		
			}
			profile_lost_content.appendChild(gender);
			let age = document.createElement("div");
			age.className = "profile_content_li profile_content_li"+res[i].id;
			if(res[i].age == null){
				age.appendChild(document.createTextNode("年齡: 未知"));
			}else{
				age.appendChild(document.createTextNode("年齡: "+res[i].age));		
			}				
			profile_lost_content.appendChild(age);
			let breed = document.createElement("div");
			breed.className = "profile_content_li profile_content_li"+res[i].id;
			if(res[i].breed == null){
				breed.appendChild(document.createTextNode("品種: 未知"));
			}else{
				breed.appendChild(document.createTextNode("品種: "+res[i].breed));		
			}
			profile_lost_content.appendChild(breed);
			let color = document.createElement("div");
			color.className = "profile_content_li profile_content_li"+res[i].id;
			if(res[i].color == null){
				color.appendChild(document.createTextNode("顏色: 未知"));
			}else{
				color.appendChild(document.createTextNode("顏色: "+JSON.parse(res[i].color)));		
			}
			profile_lost_content.appendChild(color);
			let time = document.createElement("div");
			time.className = "profile_content_li profile_content_li"+res[i].id;
			//時間格式轉換
			let time_stamp = new Date(res[i].lost_time).getTime();
			let format_time = new Date(parseInt(time_stamp)).toLocaleString('chinese', {hour12: true});
			let minute_time = format_time.slice(0,format_time.length-3);
			if(res[i].post_type == "find"){
				time.appendChild(document.createTextNode("發現時間: "+minute_time));					
			}else{
				time.appendChild(document.createTextNode("走失時間: "+minute_time));		
			}
			profile_lost_content.appendChild(time);
			let location = document.createElement("div");
			location.className = "profile_content_li profile_content_li"+res[i].id;
			if(res[i].post_type == "find"){
				location.appendChild(document.createTextNode("發現地點: "+res[i].lost_location));				
			}else{
				location.appendChild(document.createTextNode("走失地點: "+res[i].lost_location));			
			}		
			profile_lost_content.appendChild(location);
			let title = document.createElement("div");
			title.className = "profile_content_li profile_content_li"+res[i].id;
			title.appendChild(document.createTextNode("標題: "+res[i].title));
			profile_lost_content.appendChild(title);
			let content = document.createElement("div");
			content.className = "profile_content_li profile_content_li"+res[i].id;
			content.id = "profile_content_text";
			let text = document.createElement("p");
			text.id = "text";
			text.appendChild(document.createTextNode("內文: "+res[i].content));
			content.appendChild(text);
			profile_lost_content.appendChild(content);				
			profile_container.appendChild(profile_lost_content);
			document.getElementsByClassName("user_lost_list")[0].appendChild(profile_container);
			if(res[i].post_type == "lost" && res[i].lost_status == "finding"){
				let close_container = document.createElement("div");
				close_container.className = "close_container";
				close_container.id = "close_container"+res[i].id;
				close_container.style = "display: none";
				let close_title = document.createElement("div");
				close_container.appendChild(close_title);
				let close_content = document.createElement("div");
				close_content.style = "margin-top: 50px;";
				close_content.appendChild(document.createTextNode("傳送訊息通知聊天室成員"));
				close_container.appendChild(close_content);
				let close_text = document.createElement("textarea");
				close_text.id = "close_message"+res[i].id;
				close_text.style = "border-radius: 4px; border: 1px solid #787878; height: 100px; width: 80%; padding: 5px; margin-top: 5px;";
				close_text.placeholder = "ex: 寵物已找到, 非常感謝大家的幫忙!!";
				close_container.appendChild(close_text);
				let send_message = document.createElement("div");
				send_message.style = "margin-top: 5px;";
				send_message.appendChild(document.createTextNode("請問寵物最後是否成功協尋? "));
				close_container.appendChild(send_message);					
				var radio_form = document.createElement("form");
				radio_form.id = "radio_form"+res[i].id;
				radio_form.style = "margin-top: 5px;";
				var found = document.createElement("input");
				found.type = "radio";
				var found_text = document.createTextNode("寵物已找到");
				found.name = "pet_found";
				found.value = "end_found";
				var unfound = document.createElement("input");
				unfound.type = "radio";
				var unfound_text = document.createTextNode("寵物未找到");
				unfound.name = "pet_found";
				unfound.value = "end_unfound";
				radio_form.appendChild(found);
				radio_form.appendChild(found_text);
				radio_form.appendChild(unfound);
				radio_form.appendChild(unfound_text);
				close_container.appendChild(radio_form);
				var send_button = document.createElement("button");
				send_button.id = "send_close";
				send_button.setAttribute("onclick", "message_to_room("+res[i].id+")");
				var button_value = document.createTextNode("送出");
				send_button.appendChild(button_value);
				close_container.appendChild(send_button);
				profile_lost_content.appendChild(close_container);				
			}
		}
	}else{
		var no_data = document.createElement("div");
		var no_data_text = document.createTextNode("-目前無資料-");
		no_data.appendChild(no_data_text);
		no_data.style="text-align: center;";
		document.getElementsByClassName("user_lost_list")[0].appendChild(no_data);
	}
};

function display_close(id){
	$(".profile_content_li"+id).toggle(500,function(){});
	$("#close_container"+id).toggle(500,function(){});
}

function append_message(message){
	if(message.length <= 3){
		//直接append
		for(j=message.length-1; j>=0; j--){
			var send_time = document.createElement("div");
			send_time.className = "send_time";
			var message_time = document.createTextNode(moment(message[j].send_time).format('YYYY-MM-DD'));
			send_time.appendChild(message_time);
			document.getElementById("message_time_list").appendChild(send_time);
			var content = document.createElement("div");
			content.className = "send_content";
			content.style = "text-align: center";
			var message_content = document.createTextNode(message[j].content);
			content.appendChild(message_content);
			if(message[j].link_id){
				var content_link = document.createElement("a");
				content_link.className = "message_link";
				content_link.href = "/room?id="+message[j].link_id;
				content_link.style = "text-decoration: none; color: black; text-align: center";
				content_link.appendChild(content);
				document.getElementById("message_content_list").appendChild(content_link);			
			}else{
				document.getElementById("message_content_list").appendChild(content);
			}
		}
	}else{
		//先append 3筆
		for(j=message.length-1; j>=message.length-3; j--){
			var send_time = document.createElement("div");
			send_time.className = "send_time";
			var message_time = document.createTextNode(moment(message[j].send_time).format('YYYY-MM-DD'));
			send_time.appendChild(message_time);
			document.getElementsByClassName("message_time")[0].appendChild(send_time);
			var content = document.createElement("div");
			content.className = "send_content";
			content.style = "text-align: center";
			var message_content = document.createTextNode(message[j].content);
			content.appendChild(message_content);
			if(message[j].link_id){
				var content_link = document.createElement("a");
				content_link.className = "message_link";
				content_link.href = "/room?id="+message[j].link_id;
				content_link.style = "text-decoration: none; color: black; text-align: center";
				content_link.appendChild(content);
				document.getElementsByClassName("message_content")[0].appendChild(content_link);			
			}else{
				document.getElementsByClassName("message_content")[0].appendChild(content);
			}				
		}
		//剩下display none
		for(j=message.length-4; j>=0; j--){
			var send_time = document.createElement("div");
			send_time.className = "send_time";
			var message_time = document.createTextNode(moment(message[j].send_time).format('YYYY-MM-DD'));
			send_time.appendChild(message_time);
			send_time.style = "display: none;";
			document.getElementsByClassName("message_time")[0].appendChild(send_time);
			var content = document.createElement("div");
			content.className = "send_content";
			content.style = "text-align: center;";
			var message_content = document.createTextNode(message[j].content);
			content.appendChild(message_content);
			if(message[j].link_id){
				var content_link = document.createElement("a");
				content_link.className = "message_link";
				content_link.href = "/room?id="+message[j].link_id;
				content_link.style = "text-decoration: none; color: black; text-align: center; display: none;";
				content_link.appendChild(content);
				document.getElementsByClassName("message_content")[0].appendChild(content_link);			
			}else{
				content.style = "display: none;";
				document.getElementsByClassName("message_content")[0].appendChild(content);
			}					
		}
		//加一個div, 按下去會把剩下的顯示出來
		var display_message = document.createElement("div");
		display_message.id = "display_message";
		display_message.appendChild(document.createTextNode("查看更多"));
		display_message.style="text-align: center; margin-bottom: 5px; cursor: pointer;";
		document.getElementsByClassName("hide_display_container")[0].appendChild(display_message);
		display_message.addEventListener('click', function(){
			document.getElementById("display_message").style = "display: none;";
			for(i=0; i<message.length; i++){
				document.getElementsByClassName("send_time")[i].style = "display: block;";				
				document.getElementsByClassName("send_content")[i].style = "text-align: center;";
				document.getElementsByClassName("message_link")[i].style = "text-decoration: none; color: white; text-align: center;";
			}
		});	
	}
}
function message_to_room(room_id){
	var status = {
		close_id: room_id
	};
	var form = document.getElementById("radio_form"+room_id);
	for(var i=0; i<form.pet_found.length;i++){
		if(form.pet_found[i].checked){
			status.close_status = form.pet_found[i].value;
			console.log("form radio status = "+form.pet_found[i].value);
		}
	}
	//整個ajax 拿掉, 改成用socket做
	var user_info = {
		user_name: document.getElementsByClassName("nameline")[0].innerHTML,
		room_id: room_id
	}
	var socket = io.connect();
	socket.on('connect', function (){
		socket.emit('join', user_info);
	});
	socket.emit('close_room', status);
	let data = {
		name: document.getElementsByClassName("nameline")[0].innerHTML,
		content: document.getElementById("close_message"+room_id).value,
		user_id: user_id
	};
	socket.emit('message_to_backend', data);
	socket.on('redirect', function(obj){
		console.log("update_success!");
		document.location.href = "/profile.html";
	})
}