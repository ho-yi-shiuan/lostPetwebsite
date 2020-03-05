const mysql = require("../mysqlcon.js");

module.exports = {

	select_history_message: function(id){
		let history_query = "select a.name, a.content, a.content_type, a.time, b.picture from socket"+id +" as a, user as b where b.id = a.user_id order by a.id;";
		return new Promise((resolve, reject) => {
			mysql.con.query(history_query, function(error,result){
				if(error){
					console.log("error message in select history message in app.js: ");
					reject(error);
				}else{
					console.log("select history message in app.js: successful!");
					resolve(result);
				}
			});
		})
	},
	
	select_user_picture: function(user_id){
		return new Promise((resolve, reject) => {
			mysql.con.query("SELECT picture from user where id = ?", user_id, function(error,result){
				if(error){
					console.log("error message in select user picture in app.js: ");
					reject(error);
				}else{
					console.log("select user picture in app.js: successful!");
					resolve(result);
				}
			})
		})
	},
	
	insert_message: function(room_id,content){
		return new Promise((resolve, reject) => {
			mysql.con.query("INSERT INTO socket" +room_id+ " set?", content, function(error,result){
				if(error){
					console.log("error message in insert message in app.js: ");
					reject(error);
				}else{
					console.log("insert message in app.js: successful!");
					resolve(result);
				}
			});
		})
	},	
	
	send_close_message: function(close_status,close_id){
		var update_status = "UPDATE lost_pet SET lost_status = \""+close_status+"\" where pet_id = "+close_id;
		return new Promise((resolve, reject) => {
			mysql.con.query(update_status, function(error,result){
				if(error){
					console.log("error message in insert message in app.js: ");
					reject(error);
				}else{
					console.log("update lost_status successful!");
					resolve(result);
				}
			});
		})
	}
};
