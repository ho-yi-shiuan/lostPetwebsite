const mysql = require("../mysqlcon.js");

module.exports = {

	select_map: function(pet_id){
		return new Promise((resolve, reject) => {
			mysql.con.query("SELECT location, description from map where lost_pet_id =?", pet_id, function(error, result){
				if(error){
					console.log("error message in select map data in lost detail api: ");
					reject(error);
				}else{
					console.log("select map data in lost detail api: success");
					resolve(result);	
				}
			});
		})	
	},
	
	select_lost_detail: function(pet_id){
		return new Promise((resolve, reject) => {
			mysql.con.query("SELECT * from lost_pet where pet_id =?", pet_id, function(error, result){
				if(error){
					console.log("error message in select lost pet detail data in lost detail api: ");
					reject(error);
				}else{
					console.log("select lost pet detail data in lost detail api: success");
					resolve(result);
				}
			});			
		})
	},
	
	insert_map: function(mark){
		return new Promise((resolve, reject) => {
			mysql.con.query("INSERT INTO map SET?", mark, function(error, result){
				if(error){
					console.log("error message in insert map mark in lost detail api: ");
					reject(error);
				}else{
					console.log("insert map mark in lost detail api: success");
					resolve(result);					
				}
			});			
		})
	},
	
	insert_lost_pet: function(pet_data){
		return new Promise((resolve, reject) => {
			mysql.con.query("INSERT INTO lost_pet set?",pet_data,function(error, result){
				if(error){
					console.log("error message in insert new lost pet in lost record api: ");
					reject(error);
				}
				else
				{
					console.log("insert new lost pet in lost record api: success");
					resolve(result);
				}
			});			
		})
	},
	
	create_socket_table: function(room_id){
		return new Promise((resolve, reject) => {
			let query = "CREATE TABLE socket"+room_id+"(id bigint(20) NOT NULL AUTO_INCREMENT, name varchar(45) DEFAULT NULL, content varchar(255) DEFAULT NULL, content_type varchar(20), time bigint(20) DEFAULT NULL, user_id bigint(20), PRIMARY KEY (id));";
			mysql.con.query(query,function(error, result){
				if(error){
					console.log("error message in create new socket table in lost record api: ");
					reject(error);
				}
				else
				{
					console.log("create new socket table in lost record api: success");
					resolve("success");
				}
			});				
		})
	},
	
	select_near_user: function(lng,lat){
		var select_mark = "SELECT user_id from user_mark WHERE location_lng BETWEEN "+lng+"-0.05 AND "+lng+"+0.05 AND location_lat BETWEEN "+lat+"-0.05 AND "+lat+"+0.05;";
		return new Promise((resolve, reject) => {
			mysql.con.query(select_mark, function(error, result){
				if(error){
					console.log("error message in select nearby user of lost address in lost record api: ");
					reject(error);
				}else{
					console.log("select nearby user of lost address in lost record api: success");
					resolve(result);
				}
			});			
		})
	},
	
	insert_message: function(message){
		return new Promise((resolve, reject) => {
			mysql.con.query("INSERT INTO message set?", message, function(error, result){
				if(error){
					console.log("error message in insert message to near user of lost address in lost record api: ");
					reject(error);
				}else{
					console.log("insert message to near user of lost address in lost record api: success");
					resolve(result);
				}
			});			
		})
	},	

	select_post: function(query,condition){
		return new Promise((resolve, reject) => {
			mysql.con.query(query, condition, function(error, result){
				if(error){
					console.log("error message in compare current find post for new lost pet in lost record api: ");
					reject(error);
				}else{
					console.log("compare current find post for new lost pet in lost record api: success");
					resolve(result);
				}
			});			
		})
	},
	
	get_all_lost: function(query){
		return new Promise((resolve, reject) => {
			mysql.con.query(query, function(error, result){
				if(error){
					console.log("error message in select all lost data in lost record api: ");
					reject(error);
				}else{
					resolve(result);
				}
			});
		})
	}
};