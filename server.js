var express = require("express"),
	app = express(),
	path = require("path"),
	mongodb = require("mongodb"),
	uu = require("underscore");

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
	console.log(req.query.q);
	var pipeline = buildPipeline(req.query.q);
	console.log(pipeline);
	tweets.aggregate(pipeline,
		function(err, results) {
			res.json(results);
		}
	);
});

app.get("/entities", function(req, res) {
	tweets.find(
		{
			$where:"this.entities.hashtags.length > 1 || this.entities.user_mentions.length > 1 || this.entities.urls > 1"
			// $where: function() { 
			// 	var entities = [].concat(
			// 		this.entities.hashtags.map(function(ht) {
			// 			return {
			// 				id:ht.text,
			// 				type:"hashtag"
			// 			}
			// 		}),
			// 		this.entities.user_mentions.map(function(um) {
			// 			return {
			// 				id:um.screen_name,
			// 				type:"user_mention"
			// 			}
			// 		}),
			// 		this.entities.urls.map(function(url) {
			// 			return {
			// 				id:url.expanded_url,
			// 				type:"url"
			// 			}
			// 		})
			// 	);
			// 	return entities.length > 0;
			// }
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
						id:ht.text,
						type:"hashtag"
					}
				}),
				d.entities.user_mentions.map(function(um) {
					return {
						id:um.screen_name,
						type:"user_mention"
					}
				}),
				d.entities.urls.map(function(url) {
					return {
						id:url.expanded_url,
						type:"url"
					}
				})
			);
			for (var i=0; i<d.entities.length-1; i++) {
				var e1 = d.entities[i];
				if (!n.hasOwnProperty(e1.id)) {
					// e1.index = c;
					n[e1.id] = e1;
					// c++;
				}
				for (var j=i+1; j<d.entities.length; j++) {
					var e2 = d.entities[j];
					if (e1.id !== e2.id) {
						if (e1.id < e2.id) {
							if (l.hasOwnProperty(e1.id)) {
								if (l[e1.id].hasOwnProperty(e2.id)) {
									l[e1.id][e2.id] += 1;
								} else {
									l[e1.id][e2.id] = 1;
								}
							} else {
								l[e1.id] = {};
								l[e1.id][e2.id] = 1
							}
						} else {
							if (l.hasOwnProperty(e2.id)) {
								if (l[e2.id].hasOwnProperty(e1.id)) {
									l[e2.id][e1.id] += 1;
								} else {
									l[e2.id][e1.id] = 1;
								}
							} else {
								l[e2.id] = {};
								l[e2.id][e1.id] = 1
							}
						}
					}		
				}	
			}
			if (!n.hasOwnProperty(d.entities[d.entities.length-1])) {
				// d.entities[d.entities.length-1].index = c;
				n[d.entities[d.entities.length-1].id] = d.entities[d.entities.length-1];
				// c++;
			}
		});
		
		var links = [],
			nodes = [];
		// for (source in l) {
		// 	for (target in l[source]) {
		// 		links.push({source:n[source].index, target:n[target].index, weight:l[source][target]});
		// 	}
		// }
		// for (var node in n) {
		// 	nodes.push(n[node]);
		// }

		nodes = uu.values(n);

		for (source in l) {
			for (target in l[source]) {
				var source_index = 0;
				for (var i=0; i<nodes.length; i++) {
					if (nodes[i].id == source) {
						source_index = i;
						break;
					}
				}
				var target_index = 0;
				for (var i=0; i<nodes.length; i++) {
					if (nodes[i].id == target) {
						target_index = i;
						break;
					}
				}
				links.push({source:source_index,target:target_index,weight:l[source][target]});
			}
		}

		res.json({nodes:nodes,links:links});
	});
});

function buildPipeline(query) {
	var pipeline = [];

	var re = /(?:filter:([^,]+))*,*(?:group:([^,]+))*,*(?:sort:([^,]+))*/g;
	var commands = re.exec(query);
	var filter,
		group,
		sort;
	if (commands) {
		filter = commands[1];
		group = commands[2];
		sort = commands[3];
	}

	if (filter) {
		var params = {};
		filter.split("&").forEach(function(param) {
			var re = /(.+)=(.+)/;
			var result = re.exec(param);
			params[result[1]] = result[2];
		});
			
		pipeline.push({ $match: params });
	}

	if (group) {
		var re = /(?:var=([^&]+)&)?by=([^&]+)(?:&how=([^&]+))?/g;
		var result = re.exec(group);
		var v = result[1];
		var by = result[2];
		var how = result[3];
		var unwind = /(.+)\.(.+)$/.exec(by);
		if (unwind) pipeline.push({ $unwind: "$" + unwind[1] });
		else pipeline.push({ $unwind: "$" + by });

		var p = {};
		if (unwind) p["_" + unwind[2]] = "$" + by;
		else p["_" + by] = "$" + by;

		pipeline.push({ $project: p });

		if (how && v) {
			var g = { _id: "$" + Object.keys(p)[0] };
			var h = {};
			h["$" + how] = "$" + v;
			g[v + "_" + how] = h;
			pipeline.push({ $group: g });
		} else {
			pipeline.push({ $group: { _id: "$" + Object.keys(p)[0] , count: { $sum: 1 } } });
		}
	}

	if (sort) {
		var re = /(?:by=([^&]+))*&*dir=([^&]+)/g;
		var result = re.exec(sort);
		var by = result[1];
		var dir = result[2];
		dir = dir === "asc" ? 1 : -1;
		if (by) {
			var s = {};
			if (by) s[by] = dir;
			else s[v + "_" + how] = dir;
			pipeline.push({ $sort: s });
		} else if (group) {			
			if (how && v) {
				var s = {};
				s[v + "_" + how] = dir;
				pipeline.push({ $sort: s });
			} else {
				pipeline.push({ $sort: { count : dir } });
			}
		}
	}

	pipeline.push({$limit: 100});

	return pipeline;
}
