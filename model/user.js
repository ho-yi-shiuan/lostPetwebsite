const mysql = require("../mysqlcon.js");
const crypto = require('crypto');

module.exports = {
	
	update_user: function(new_data,email){
		return new Promise((resolve, reject) => {
			mysql.con.query("UPDATE user SET? WHERE id = ?", [new_data, email], function(err, res){
				if(err){
					console.log("error message in update user data in signin api: 已註冊過, 更新會員資料");
					reject(error);
				}
				else
				{
					console.log("update user data in signin api: success");
					resolve(res);					
				}
			});
		})	
	},
	
	insert_user: function(signup_data){
		return new Promise((resolve, reject) => {
			mysql.con.query("INSERT INTO user SET?", signup_data, function(err, result){
				if(err){
					console.log("error message of insert user data in signup api: ");
					reject(error);
				}
				else
				{
					console.log("insert user data in signup api: success");		
					resolve(result);
				}
			});
		})		
	},
	
	create_token: function(email){
		let hash = crypto.createHash('sha256');
		hash.update(email);
		const token = hash.digest('hex');
		return token;
	},

	select_user_email: function(email){
		return new Promise((resolve, reject) => {
			mysql.con.query("SELECT * FROM user WHERE email = ?", email, function(error, res){
				if(error){
					console.log("error message of select user email in signin api: ");
					reject(error);
				}else
				{
					console.log("select user email : success");
					resolve(res);
				}
			});
		})
	},
	
	login_by_token: function(token){
		return new Promise((resolve, reject) => {
			mysql.con.query("select * FROM user where access_token = ?", token, function(error, result){
				if(error){
					console.log("error in select user by token in profile api: ");
					reject(error);
				}else
				{
					console.log("select user by token in profile api: login by token success");
					resolve(result);
				}
			});
		})
	},

	search_lost_record: function(id,list_type,status){
		let search_query = "SELECT * from lost_pet where user_id = "+id+" AND post_type = \""+list_type+"\" AND lost_status in (?)";
		return new Promise((resolve, reject) => {
			mysql.con.query(search_query, status, function(error, result){
				if(error){
					console.log("error message of select user's data in lost pet table in profile api: ");
					reject(error);
				}else{
					console.log("select user's data in lost pet table in profile api: success");
					resolve(result);
				}
			});
		})
	},

	select_message: function(id){
		return new Promise((resolve, reject) => {
			mysql.con.query("SELECT * from message where receive_id = ?", id, function(err, result){
				if(err){
					console.log("error message of select user's data in message table in profile api: ");
					reject(error);
				}else{
					console.log("select user's data in message table in profile api: success");
					resolve(result);
				}
			});
		})	
	},

	search_mark: function(id){
		return new Promise((resolve, reject) => {
			mysql.con.query("SELECT * from user_mark where user_id = ?", id, function(err, result){
				if(err){
					console.log("error message of select user's data in user mark table in profile api: ");
					reject(error);
				}
				else
				{
					console.log("select user's data in user mark table in profile api: success");					
					resolve(result);
				}
			});
		})	
	},
	
	insert_mark: function(user_mark){
		return new Promise((resolve, reject) => {
			mysql.con.query("INSERT into user_mark set?", user_mark, function(error, result){
				if(error){
					console.log("error message of insert user mark in user_mark api: ");
					reject(error);
				}else{
					console.log("insert user mark suscessfully!");
					resolve("success");
				}
			});
		})	
	}	
};
