function signin_ajax(){
	let signup_data = {
		provider:"native",
		email: document.getElementById("email").value,
		password: document.getElementById("password").value
	}
	$.ajax({
		contentType :"application/json",
		type: "POST",
		url: "/signin",
		data: JSON.stringify(signup_data),
		success: function(res)
		{
			if(res == 2)
			{
				document.getElementById("fail").innerHTML = "帳號或密碼錯誤, 請重新輸入";
				document.getElementById("fail").style.display = "block";
			}
			else
			{
				document.getElementById("fail").style.display = "none";
				document.location.href="profile.html";
			}
		},
		error: function(err)
		{
			console.log("error message of signin ajax: ");
			console.log(err);
			document.getElementById("fail").innerHTML = "登入發生錯誤, 請稍後再試!";
			document.getElementById("fail").style.display = "block";
		},
		dataType: "json"
		});	
}
var person = {name: "",picture: "",email: "",provider: "facebook"};
function statusChangeCallback(response){
	if (response.status === 'connected'){
		FB.api("/me?fields=name,email,picture.type(large)",function(userData){
			person.name = userData.name;
			person.email = userData.email;
			person.picture = userData.picture.data.url;
			$.ajax({
				type: "POST",
				url: "/signin",
				data: person,
				success: function(user_data){
					document.getElementById("fail").style.display = "none";
					document.location.href="profile.html";
				},
				error: function(err){
					console.log("error message of facebook singin ajax: ");
					console.log(err);
					document.getElementById("fail").innerHTML = "登入發生錯誤, 請稍後再試!";
					document.getElementById("fail").style.display = "block";
				},
				dataType: "json"
			});			
		});
	} else {
		document.getElementById("fail").innerHTML = "登入發生錯誤, 請稍後再試!";
		document.getElementById("fail").style.display = "block";
	}
  }
function checkLoginState(){
	FB.getLoginStatus(function(response){
		statusChangeCallback(response);
	});
}
window.fbAsyncInit = function() {
	FB.init({
		appId            : '2897888950235941',
		autoLogAppEvents : true,
		xfbml            : true,
		version          : 'v6.0'
	});
};
// 載入 FB SDK
(function(d, s, id) {
	var js, fjs = d.getElementsByTagName(s)[0];
	if (d.getElementById(id)) return;
	js = d.createElement(s);
	js.id = id;
	js.src = "https://connect.facebook.net/zh_TW/sdk.js";
	fjs.parentNode.insertBefore(js, fjs);
}(document, 'script', 'facebook-jssdk'));