const app = require('./app');
require('dotenv').config()
const request = require('supertest');
const mysql = require("./mysqlcon.js");

describe('api test', () => {
	test('get all lost record from lost record api', async function(done){
		const response = await request(app)
		console.log(response);
		// .post('/search')
		.get('/lost_record')
		// .send({
			// lost_status:"finding",
			// post_type:["lost","find"],
			// select_breed: "dog",
			// input_address:""
		// })
		// .set('Content-Type', 'application/json')

		expect(response.status).toBe(200);
		done();
	});
})

// test('create search query1', function(done){
	// expect(search.create_query_array({lost_status:"finding",post_type:["lost","find"],select_breed: "dog",input_address:""})).toEqual([["finding"],["lost","find"],["dog"]]);
	// done();
// });

// test('create search query2', function(done){
	// expect(search.create_query_array({lost_status:"finding",post_type:["lost","find"],select_breed: "dog",input_address:"台北市"})).toEqual([["finding"],["lost","find"],["dog"]]);
	// done();
// });

