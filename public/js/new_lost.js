var map;
function initMap() {
	geocoder = new google.maps.Geocoder();
	map = new google.maps.Map(document.getElementById('map'), {
		zoom: 15,
		center: {
		  lat: 25.0374865,
		  lng: 121.5647688
		}
	});
}

var autocomplete;
window.addEventListener('load', () => {
	let input = document.getElementsByName('input_address')[0];
	autocomplete = new google.maps.places.Autocomplete(input);
	google.maps.event.addListener(autocomplete, 'place_changed', function() {
		fillInAddress();
	});		
});

function fillInAddress(){
	var place = autocomplete.getPlace();
	document.getElementsByName("lost_address_lng")[0].value = place.geometry.location.lng();
	document.getElementsByName("lost_address_lat")[0].value = place.geometry.location.lat();
	if(place.geometry){
		let search_center = place.geometry.location;
		map.panTo(search_center);
		let marker = new google.maps.Marker({
			position: search_center,
			map: map
		});
		let infowindow = new google.maps.InfoWindow({
			content: place.formatted_address
		});
		marker.addListener('click', function() {
			infowindow.open(map, marker);
		});
	}
};

let cookiesend = {
	list_type: "lost",
	lost_status: ["finding"]	
};
function getcookie()
{
	let cookies = document.cookie.split(";");
	for(i=0;i<cookies.length;i++)
	{
		let c = cookies[i].trim();//去空白
		if(c.indexOf("user=") >= 0)//回傳找到的第一個
		{
			cookiesend.cookie = c.substring(5,c.length);
			return("2");
		}
	}
}

let cookieresult = getcookie();
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
				document.getElementsByName("user_id")[0].value = res.data.id;
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
