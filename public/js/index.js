function row(){
	$('html, body').animate({
		scrollTop: $(".search_bar").offset().top
	}, 500);
}

$(document).ready(function(){
	$('[name="select_breed"]').multiselect();
	$('[name="select_color"]').multiselect();
});

function initMap(map_id,locate){
	var geocoder = new google.maps.Geocoder();
	var map = new google.maps.Map(document.getElementById(map_id), {
		zoom: 12,
		styles:[
			{
				"featureType": "landscape.man_made",
				"elementType": "geometry",
				"stylers": [
					{
						"color": "#f7f1df"
					}
				]
			},
			{
				"featureType": "landscape.natural",
				"elementType": "geometry",
				"stylers": [
					{
						"color": "#d0e3b4"
					}
				]
			},
			{
				"featureType": "landscape.natural.terrain",
				"elementType": "geometry",
				"stylers": [
					{
						"visibility": "off"
					}
				]
			},
			{
				"featureType": "poi",
				"elementType": "labels",
				"stylers": [
					{
						"visibility": "off"
					}
				]
			},
			{
				"featureType": "poi.business",
				"elementType": "all",
				"stylers": [
					{
						"visibility": "off"
					}
				]
			},
			{
				"featureType": "poi.medical",
				"elementType": "geometry",
				"stylers": [
					{
						"color": "#fbd3da"
					}
				]
			},
			{
				"featureType": "poi.park",
				"elementType": "geometry",
				"stylers": [
					{
						"color": "#bde6ab"
					}
				]
			},
			{
				"featureType": "road",
				"elementType": "geometry.stroke",
				"stylers": [
					{
						"visibility": "off"
					}
				]
			},
			{
				"featureType": "road",
				"elementType": "labels",
				"stylers": [
					{
						"visibility": "off"
					}
				]
			},
			{
				"featureType": "road.highway",
				"elementType": "geometry.fill",
				"stylers": [
					{
						"color": "#ffe15f"
					}
				]
			},
			{
				"featureType": "road.highway",
				"elementType": "geometry.stroke",
				"stylers": [
					{
						"color": "#efd151"
					}
				]
			},
			{
				"featureType": "road.arterial",
				"elementType": "geometry.fill",
				"stylers": [
					{
						"color": "#ffffff"
					}
				]
			},
			{
				"featureType": "road.local",
				"elementType": "geometry.fill",
				"stylers": [
					{
						"color": "black"
					}
				]
			},
			{
				"featureType": "transit.station.airport",
				"elementType": "geometry.fill",
				"stylers": [
					{
						"color": "#cfb2db"
					}
				]
			},
			{
				"featureType": "water",
				"elementType": "geometry",
				"stylers": [
					{
						"color": "#a2daf2"
					}
				]
			}
		],
		mapTypeControl: false,
		fullscreenControl: false,
		rotateControl: false,
		scaleControl: false,
		streetViewControl: false,
		zoomControl: false,
		center: locate
	});
	let marker = new google.maps.Marker({
		map: map,
		position: locate,
		icon: '/images/black_pin.png'
	});
};

var autocomplete;

window.addEventListener('load', () => {
	var input = document.getElementsByName('input_address')[0];
	autocomplete = new google.maps.places.Autocomplete(input);
	google.maps.event.addListener(autocomplete, 'place_changed', function() {
		fillInAddress();
	});		
});

function fillInAddress(){
	var place = autocomplete.getPlace();
	document.getElementsByName("lost_address_lng")[0].value = place.geometry.location.lng();
	document.getElementsByName("lost_address_lat")[0].value = place.geometry.location.lat();
};

document.getElementById("submit").addEventListener('click', function(){	
	if(document.getElementsByName("input_address")[0].value.length > 0){
		if(document.getElementsByName("lost_address_lng")[0].value.length == 0){
			document.getElementById("error_message").style = "color: red; display: block";
		}else{
			ajax_search();
			document.getElementById("error_message").style = "display: none";
		}
	}else{
		ajax_search();
		document.getElementById("error_message").style = "display: none";
	}
});

window.addEventListener('load', () => {
	const xhr = new XMLHttpRequest();
	var url = "/lost_record?lost_status=finding";
	xhr.open("get", url);
	xhr.onload = function(){
		var pets = JSON.parse(this.response);
		if(pets.data.length == 0){
			//顯示目前沒有協尋中寵物
		}else{
			console.log(pets);
			append_data(pets.data);
		}
	}
	xhr.send();
});

$("#image").on("change",function (e) {
	console.log("已選檔案");
	var e = e || window.event;
	var files = e.target.files;
	console.log(files[0].name);
	if(files.length>0){
		var fileName = files[0].name;
		document.getElementById("chose_picture").innerHTML = fileName;
	}else{
		document.getElementById("chose_picture").innerHTML = "以照片搜尋";
	}
});	

function ajax_search(){
	var form = $('form')[0];
	var formData = new FormData(form);
	$.ajax({
		contentType: false,
		cache: false,
		processData: false,
		type: "post",
		url: "/search",
		data: formData,
		success: function(res){
			document.getElementById("image").outerHTML = document.getElementById("image").outerHTML;
			document.getElementById("chose_picture").innerHTML = "以照片搜尋";
			document.getElementsByClassName("post_container")[0].innerHTML = "";
			if(res.string_compare == "no_matched"){
				document.getElementById("image_result").innerHTML = "無符合結果! ";
			}else if(res.image_compare == "no_matched"){
				document.getElementById("image_result").innerHTML = "無符合圖片, 以下為符合文字篩選的刊登文章: ";	
			}
			append_data(res.data);
		},
		error: function(err){
			console.log(err);
			alert(err.responseJSON.error);
		}
	});	
}

function append_data(data){
	for(i=data.length-1; i>=0; i--){
		let link = document.createElement("a");
		link.className = "post_link";
		link.href = "/room?id="+data[i].id;
		let post = document.createElement("div");
		post.className = "post";
		let post_img_container = document.createElement("div");
		post_img_container.className = "post_img_container";
		let post_image = document.createElement("img");
		post_image.className = "post_image";
		post_image.src = data[i].picture;
		post_img_container.appendChild(post_image);
		
		let post_content_container = document.createElement("div");
		post_content_container.className = "post_content_container";
		let post_tag = document.createElement("div");
		post_tag.id = "post_tag";
		if(data[i].post_type == "lost"){
			post_tag.appendChild(document.createTextNode("走失協尋"));
		}else{
			post_tag.appendChild(document.createTextNode("拾獲刊登"));
		}
		post_content_container.appendChild(post_tag);
		let post_content = document.createElement("div");
		post_content.className = "post_content";
		let post_content_title = document.createElement("div");
		post_content_title.id = "post_content_title";
		post_content_title.appendChild(document.createTextNode(data[i].title));
		post_content.appendChild(post_content_title);
		post_content_container.appendChild(post_content);
		let post_flag_container = document.createElement("div");
		post_flag_container.className = "post_flag_container";
		if(data[i].gender){
			let post_flag_gender = document.createElement("div");
			post_flag_gender.className = "post_flag";
			if(data[i].gender == "male"){
				post_flag_gender.appendChild(document.createTextNode("男"));			
			}else{
				post_flag_gender.appendChild(document.createTextNode("女"));			
			}
			post_flag_container.appendChild(post_flag_gender);			
		}			
		if(data[i].age){
			let post_flag_age = document.createElement("div");
			post_flag_age.className = "post_flag";
			post_flag_age.appendChild(document.createTextNode(data[i].age));
			post_flag_container.appendChild(post_flag_age);			
		}
		if(data[i].breed){
			let post_flag_breed = document.createElement("div");
			post_flag_breed.className = "post_flag";
			post_flag_breed.appendChild(document.createTextNode(data[i].breed));
			post_flag_container.appendChild(post_flag_breed);			
		}			
		post_content.appendChild(post_flag_container);
		let post_content_time = document.createElement("div");
		post_content_time.id = "post_content_time";
		let time_stamp = new Date(data[i].lost_time).getTime();
		let format_time = new Date(parseInt(time_stamp)).toLocaleString('chinese', {hour12: true});
		let minute_time = format_time.slice(0,format_time.length-3);		
		post_content_time.appendChild(document.createTextNode("走失時間: "+minute_time));
		post_content.appendChild(post_content_time);
		let post_content_location = document.createElement("div");
		post_content_location.id = "post_content_location";
		post_content_location.appendChild(document.createTextNode("走失地點: "+data[i].lost_location));
		post_content.appendChild(post_content_location);			
		let post_content_text = document.createElement("div");
		post_content_text.id = "post_content_text";
		let content = document.createElement("p");
		content.className = "content";
		content.appendChild(document.createTextNode(data[i].content));
		post_content_text.appendChild(content);
		post_content.appendChild(post_content_text);
		let post_button_container = document.createElement("div");
		post_button_container.className = "post_button_container";
		let index_map = document.createElement("div");
		index_map.className = "index_map";
		index_map.id = "map"+i;
		post_button_container.appendChild(index_map);
		post.appendChild(post_img_container);
		post.appendChild(post_content_container);
		post.appendChild(post_button_container);
		link.appendChild(post);
		document.getElementsByClassName("post_container")[0].appendChild(link);
		let map_id = "map"+i;
		let locate = {
			lat: data[i].lost_location_lat, // 經度
			lng: data[i].lost_location_lng // 緯度
		};
		initMap(map_id,locate);
	}
}