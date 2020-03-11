function signup_ajax(){
	let signup_data = {
		name: document.getElementById("name").value,
		email: document.getElementById("email").value,
		password: document.getElementById("password").value
	}
	$.ajax({
		contentType :"application/json",
		type: "POST",
		url: "/signup",
		data: JSON.stringify(signup_data),
		success: function(res)
		{
			if(res == "3")
			{
				document.getElementById("fail").innerHTML = "帳號已存在, 請至登入頁登入";
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
		console.log("error message of signup ajax: ");
		console.log(err);
		document.getElementById("fail").innerHTML = "登入發生錯誤, 請稍後再試!";
		document.getElementById("fail").style.display = "block";
	},
	dataType: "json"
	});	
}