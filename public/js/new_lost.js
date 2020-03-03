//google map code start
console.log("開始執行map script");
var map;
function initMap() {
	console.log("執行init map");
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
	var input = document.getElementsByName('input_address')[0];
	autocomplete = new google.maps.places.Autocomplete(input);
	google.maps.event.addListener(autocomplete, 'place_changed', function() {
		fillInAddress();
	});		
});
// 地址的輸入框，值有變動時執行
function fillInAddress(){
	var place = autocomplete.getPlace();
	console.log(place.geometry.location.lng());
	console.log(place.formatted_address);
	document.getElementsByName("lost_address_lng")[0].value = place.geometry.location.lng();
	document.getElementsByName("lost_address_lat")[0].value = place.geometry.location.lat();
	if(place.geometry){
		let search_center = place.geometry.location;
		map.panTo(search_center);
		// 在搜尋結果的地點上放置標記
		let marker = new google.maps.Marker({
			position: search_center,
			map: map
		});
		// info window
		let infowindow = new google.maps.InfoWindow({
			content: place.formatted_address
		});
		marker.addListener('click', function() {
			infowindow.open(map, marker);
		});
	}
};
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
				document.getElementsByName("user_id")[0].value = res.data.id;
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
//找出使用者資料code end
