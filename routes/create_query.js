function create_query_array(body){
	let condition_array = [];
	if(typeof(body.lost_status) == "object"){
		condition_array.push(body.lost_status);
	}else if(typeof(body.lost_status) == "string"){
		condition_array.push([body.lost_status]);
	}
	if(typeof(body.post_type) == "object"){
		condition_array.push(body.post_type);
	}else if(typeof(body.post_type) == "string"){
		condition_array.push([body.post_type]);
	}
	if(typeof(body.select_category) == "object"){
		condition_array.push(body.select_category);
	}else if(typeof(body.select_category) == "string"){
		condition_array.push([body.select_category]);
	}
	if(typeof(body.select_breed) == "object"){
		condition_array.push(body.select_breed);
	}else if(typeof(body.select_breed) == "string"){
		condition_array.push([body.select_breed]);
	}
	if(typeof(body.select_gender) == "object"){
		condition_array.push(body.select_gender);
	}else if(typeof(body.select_gender) == "string"){
		condition_array.push([body.select_gender]);
	}
	return condition_array;
};

module.exports = create_query_array;