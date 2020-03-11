var map;
function initMap() {
	geocoder = new google.maps.Geocoder();
	map = new google.maps.Map(document.getElementById('success_page_map'), {
		zoom: 7.7,
		center: {
		  lat: 23.8, 
		  lng: 120.978684
		},
		mapTypeControl: false,
		fullscreenControl: false,
		rotateControl: false,
		scaleControl: false,
		streetViewControl: false,
		zoomControl: false,
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
		]
	});
	//ajax 送出表單 code start*/
	window.addEventListener('load', () => {
		var request_status = {
			post_type: "lost",
			lost_status: "end_found"
		}
		const xhr = new XMLHttpRequest();
		var url = "/lost_record?post_type=lost&lost_status=end_found";
		xhr.open("get", url);
		xhr.onload = function(){
			var pets = JSON.parse(this.response);
			if(pets.data.length == 0){
				//顯示目前沒有協尋成功的寵物
			}else{
				append_data(pets.data);
			}
		}
		xhr.send();
	});
}

function append_data(data){
	for(i=data.length-1; i>=0; i--){
		let time_stamp = new Date(data[i].lost_time).getTime();
		let format_time = new Date(parseInt(time_stamp)).toLocaleString('chinese', {hour12: true});
		let minute_time = format_time.slice(0,format_time.length-3);
		let mark_content = "<div style=\"display: flex; flex-direction: row;\"><div><img id=\"mark_image\" style=\"display: block; margin:0 auto; height: 100px; width: 100px; object-fit: cover;\" src=\""+data[i].picture+"\"></img></div>";
		mark_content += "<div style=\"margin-left: 10px; position: relative;\"><div>姓名: "+data[i].name+"</div>";
		mark_content += "<div style=\"margin-top: 5px;\">走失時間: "+minute_time+"</div>";
		mark_content += "<div style=\"margin-top: 5px;\">走失地點: "+data[i].lost_location+"</div>";
		mark_content += "<div style=\"margin-top: 5px; border: 1px solid black; width: 80px; height: 20px; line-height: 20px; text-align: center; position: absolute; bottom: 0px; right: 0px;\">";
		mark_content += "<a style=\"text-decoration: none; color: black;\" href=\"/room?id="+data[i].id+"\">點我看更多</a></div>";
		mark_content += "</div></div>";
		let locate = {
			lat: data[i].lost_location_lat, // 經度
			lng: data[i].lost_location_lng // 緯度
		};
		let marker = new google.maps.Marker({
			map: map,
			position: new google.maps.LatLng(locate),
			icon: '/images/placeholder.png'
		});
		let infowindow = new google.maps.InfoWindow({
			content: mark_content
		});
		marker.addListener('click', function() {
			infowindow.open(map, marker);
		});			
	}
}