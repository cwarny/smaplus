var express = require("express"),
	app = express(),
	path = require("path"),
	mongodb = require("mongodb"),
	uu = require("underscore"),
	async = require("async");

var MONGODB_URI = "mongodb://localhost/tweets",
	db,
	tweets;

app.configure(function() {
	app.set("port", process.env.PORT || 3000);
	app.use(express.static(path.join(__dirname, "public")));
	app.use(express.favicon());
	app.use(express.logger());
	app.use(express.bodyParser());
	app.use(express.cookieParser());
	app.use(express.methodOverride());
	app.use(express.session({secret: "keyboard cat"}));
	app.use(app.router);
});

mongodb.MongoClient.connect(MONGODB_URI, function(err, database) {
	if (err) throw err;
	db = database;
	tweets = db.collection("bieber");
	var server = app.listen(process.env.PORT || 3000);
	console.log("Express server started on port %s", server.address().port);
});

app.get("/", function(req, res) {
	res.sendfile("index.html");
});

app.get("/tweets", function(req, res) {
	console.log(req.query);
	var pipeline1 = [],
		pipeline2 = [],
		pipeline3 = [];

	var filter1 = {},
		filter2 = {};

	if (req.query.user && req.query.user !== "null" && req.query.user !== null && req.query.user !== "undefined" && req.query.user !== undefined) {
		filter1["user.screen_name"] = req.query.user;
		filter2["user.screen_name"] = req.query.user;
	}
	if (req.query.q && req.query.q !== "null" && req.query.q !== null && req.query.q !== "undefined" && req.query.q !== undefined) {
		filter1["$text"] = { $search: req.query.q };
		filter2["$text"] = { $search: req.query.q };
	}

	pipeline1.push({ $match:filter1 });
	pipeline3.push({ $match:filter1 });
	filter2["coordinates.type"] = "Point";
	pipeline2.push({ $match:filter2 });

	pipeline1.push({
		$project:{
			screen_name:"$user.screen_name",
			name:"$user.name",
			profile_image_url:"$user.profile_image_url",
			text:1,
			retweet_count:1,
			favorite_count:1,
			id:1,
			random:1,
			score:{
				$meta:"textScore"
			}
		}
	});

	pipeline2.push({
		$project: {
			coords: "$coordinates.coordinates",
			random:1,
			score:{
				$meta:"textScore"
			}
		}
	});

	pipeline3.push({
		$project: {
			created_at: 1,
			_id: 0,
			random:1,
			score:{
				$meta:"textScore"
			}
		}
	});

	if (req.query.q && req.query.q !== "null" && req.query.q !== null && req.query.q !== "undefined" && req.query.q !== undefined) {
		pipeline1.push({ $sort: {score:-1}});
		pipeline2.push({ $sort: {score:-1}});
		pipeline3.push({ $sort: {score:-1}});
	} else {
		pipeline1.push({$sort: {random:-1} });
		pipeline2.push({$sort: {random:-1} });
		pipeline3.push({$sort: {random:-1} });
	}

	pipeline1.push({ $limit:100 });
	pipeline2.push({ $limit:500 });
	pipeline3.push({ $limit:500 });

	async.parallel([
			function(cb) {
				tweets.aggregate(
					pipeline1, function(err,results) {
						if (req.query.q && req.query.q !== "null" && req.query.q !== null && req.query.q !== "undefined" && req.query.q !== undefined) results.forEach(function(d) { d.score = d.score.toFixed(2); });
						cb(err, results);
					}
				);
			},
			function(cb) {
				tweets.aggregate(
					pipeline2, function(err, results) {
						cb(err, results);
					}
				);
			},
			function(cb) {
				tweets.aggregate(
					pipeline3, function(err, results) {
						var output = uu.chain(results)
								.countBy(function(d) {
									var date = new Date(d.created_at);
									date.setHours(date.getHours() + Math.round(date.getMinutes()/60));
									date.setMinutes(0); date.setSeconds(0); date.setMilliseconds(0);
									return date;
								})
								.pairs()
								.map(function(d) {
									return { time: d[0], count: d[1] };
								})
								.filter(function(d) {
									return d.time !== "Invalid Date";
								})
								.value();

						cb(err, output);

					}
				);
			}
		], function(err, results) {
			res.json({tweets: results[0], coordinates: results[1], timeseries: results[2]})
		}
	);
	
});

// app.get("/coordinates", function(req, res) {
// 	var pipeline = [];
// 	var filter = {};
// 	if (req.query.user && req.query.user !== "null" && req.query.user !== null) filter["user.screen_name"] = req.query.user;
// 	if (req.query.q && req.query.q !== "null" && req.query.q !== null) filter["$text"] = { $search: req.query.q };
// 	filter["coordinates.type"] = "Point";
// 	pipeline.push({
// 		$match:filter
// 	});
// 	pipeline.push({
// 		$project: {
// 			coords: "$coordinates.coordinates",
// 			random:1,
// 			score:{
// 				$meta:"textScore"
// 			}
// 		}
// 	});
// 	if (req.query.q && req.query.q !== "null" && req.query.q !== null) pipeline.push({ $sort: {score:-1}});
// 	else pipeline.push({$sort: {random:-1} });
// 	pipeline.push({ $limit:1000 });

// 	tweets.aggregate(
// 		pipeline, function(err, results) {
// 			res.json(results);
// 		}
// 	);
// });

// app.get("/timeseries", function(req, res) {
// 	var pipeline = [];
// 	var filter = {};
// 	if (req.query.user && req.query.user !== "null" && req.query.user !== null) filter["user.screen_name"] = req.query.user;
// 	if (req.query.q && req.query.q !== "null" && req.query.q !== null) filter["$text"] = { $search: req.query.q };
// 	pipeline.push({
// 		$match:filter
// 	});
// 	pipeline.push({
// 		$project: {
// 			created_at: 1,
// 			_id: 0,
// 			random:1,
// 			score:{
// 				$meta:"textScore"
// 			}
// 		}
// 	});
// 	if (req.query.q && req.query.q !== "null" && req.query.q !== null) pipeline.push({ $sort: {score:-1}});
// 	else pipeline.push({$sort: {random:-1} });
// 	pipeline.push({ $limit:1000 });

// 	tweets.aggregate(
// 		pipeline, function(err, results) {
// 			var output = uu.chain(results)
// 					.countBy(function(d) {
// 						var date = new Date(d.created_at);
// 						date.setHours(date.getHours() + Math.round(date.getMinutes()/60));
// 						date.setMinutes(0); date.setSeconds(0); date.setMilliseconds(0);
// 						return date;
// 					})
// 					.pairs()
// 					.map(function(d) {
// 						return { time: d[0], count: d[1] };
// 					})
// 					.filter(function(d) {
// 						return d.time !== "Invalid Date";
// 					})
// 					.value();

// 			res.json(output);

// 		}
// 	);
// });

app.get("/users", function(req, res) {
	tweets.aggregate([
			{
				$project: {
					name: "$user.screen_name",
					pic: "$user.profile_image_url"
				}
			},
			{
				$group: {
					_id: "$name",
					size: {
						$sum:1
					},
					pic: {
						$first: "$pic"
					}
				}
			},
			{
				$sort: {
					size: -1
				}
			},
			{
				$limit: 500
			}
		], function(err, results) {
			res.json({name:"root",children:results});
		}
	);
});

app.get("/entities", function(req, res) {
	tweets.find(
		{
			hasEntities:true
		},
		{
			"entities.hashtags":1,
			"entities.user_mentions":1,
			"entities.urls":1
		}
	).toArray(function(err,results) {
		var l = {},
			n = {};

		var c = 0;
		results.forEach(function(d) {
			d.entities = [].concat(
				d.entities.hashtags.map(function(ht) {
					return {
						id: ht.text,
						type: "hashtag",
						count: 1
					}
				}),
				d.entities.user_mentions.map(function(um) {
					return {
						id: um.screen_name,
						type: "user_mention",
						count: 1
					}
				}),
				d.entities.urls.map(function(url) {
					return {
						id: url.url,
						type: "url",
						count: 1
					}
				})
			);
			d.entities.forEach(function(e1) {
				if (!n.hasOwnProperty(e1.id)) n[e1.id] = e1;
				else n[e1.id].count++;
				d.entities.forEach(function(e2) {
					if (e1.id !== e2.id) {
						if (l.hasOwnProperty(e1.id)) {
							if (l[e1.id].hasOwnProperty(e2.id)) l[e1.id][e2.id] += 1;
							else l[e1.id][e2.id] = 1;
						} else {
							l[e1.id] = {};
							l[e1.id][e2.id] = 1
						}
					}		
				});
			});
		});

		res.json({n:n,l:l});
	});
});
