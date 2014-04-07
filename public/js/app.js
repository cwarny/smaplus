var l;

var App = Ember.Application.create();

// App.TweetSerializer = DS.RESTSerializer.extend({
// 	extractArray: function(store, type, payload, id, requestType) {
// 		var tweets = payload;
// 		var users = [];
// 		tweets.forEach(function(tweet) {
// 			var user = _.find(users, function(u) { return tweet.user.id == u.id; });
// 			if (!user) {
// 				tweet.user.tweets = [tweet.id];
// 				users.push(tweet.user);
// 			} else {
// 				user.tweets.push(tweet.id);
// 			}
// 			tweet.user = tweet.user.id;
// 		});
// 		payload = { tweets: tweets, users: users };
// 		return this._super(store, type, payload, id, requestType);
// 	}
// });

// App.HashtagSerializer = DS.RESTSerializer.extend({
// 	extractArray: function(store, type, payload, id, requestType) {
// 		var hashtags = payload;
// 		hashtags.forEach(function(hashtag) {
// 			hashtag.id = hashtag._id;
// 			delete hashtag._id;
// 		});
// 		payload = { hashtags: hashtags };
// 		return this._super(store, type, payload, id, requestType);
// 	}
// });

App.Router.map(function() {
	this.resource("tweets"),
	this.resource("users"),
	this.resource("entities")
});

App.TweetsRoute = Ember.Route.extend({
	queryParams: {
		q: {
			refreshModel: true,
			replace: true
		},
		user: {
			refreshModel: true,
			replace: true
		}
	},

	model: function(params) {
		console.log(params);
		return Ember.$.getJSON("/tweets", params).then(function(data) {
			return data;
		});
	},

	setupController: function (controller, model) {
		console.log(model);
		controller.set("tweets", model.tweets);
		controller.set("coordinates", model.coordinates);
		controller.set("timeseries", model.timeseries);
		
		Ember.$.getJSON("/geo/world-110m2.json").then(function(data) {
			controller.set("topology", data);
		});

		// var query = "";
		// console.log(controller.get("user"));
		// if (controller.get("q")) query += "q=" + controller.get("q");
		// if (controller.get("user")) query += "&user=" + controller.get("user");
		// if (query) query = "?" + query;
		// Ember.$.getJSON("/coordinates" + query).then(function(data) {
		// 	controller.set("coordinates", data);
		// });

		// Ember.$.getJSON("/timeseries" + query).then(function(data) {
		// 	controller.set("timeseries", data);
		// });
	},

	actions: {
		search: function() {
			var q = this.get("controller.query").replace(/=/g,"%3D").replace(/,/g,"%2C").replace(/:/g,"%3A").replace(/&/g,"%26");
			this.transitionTo("tweets", {
				queryParams:{
					q:q
				}
			});
		}
	}
});

App.TweetsController = Ember.Controller.extend({
	queryParams: ["q", "user"],

	q: null,
	user: null,

	sortProperties: function () {
		return [this.get("sortingProperty")];
	}.property("sortingProperty"),

	sortAscending: false,

	sortingProperty: "score",

	actions: {
		removeUser: function() {
			this.set("user", null);
		}
	}
});

App.UsersRoute = Ember.Route.extend({
	model: function() {
		return Ember.$.getJSON("/users");
	}
});

App.UsersController = Ember.Controller.extend({
	needs: ["tweets"],
	actions: {
		changeSelectedUser: function(screen_name) {
			this.transitionToRoute("/tweets?user=" + screen_name);
		}
	}
});

App.EntitiesRoute = Ember.Route.extend({
	model: function(params) {
		// return this.store.find("entities", params);
		return Ember.$.getJSON("/entities");
	}
});

App.EntitiesController = Ember.Controller.extend({

	selectedNodeId: function() {
		var k = _.keys(this.get("model.n"))
		return k[Math.round(Math.random()*k.length-1)];
	}.property("model"),

	nodes: function() {
		return _.sortBy(_.values(this.get("model.n")), function(n) {
			return -n.count;
		}).slice(0,100);
	}.property("selectedNodeId"),

	graphData: function() {
		l = this.get("model.l");
		this.get("model.n")[this.get("selectedNodeId")].selected = true;
		var neighborhood = _.keys(bfs(this.get("model.l"), this.get("selectedNodeId"), {}, 0));
		var ll = _.pick(this.get("model.l"), neighborhood);
		var nn = _.pick(this.get("model.n"), neighborhood);
		var nodes = _.values(nn);
		var links = [];
		for (source in ll) {
			for (target in ll[source]) {
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
				links.push({source:source_index,target:target_index,weight:ll[source][target]});
			}
		}
		return { nodes:nodes, links:links };
	}.property("selectedNodeId"),

	actions: {
		changeSelectedNodeId: function(nodeId) {
			this.get("model.n")[this.get("selectedNodeId")].selected = false;
			this.set("selectedNodeId", nodeId);
		}
	}
});

App.TreeMapComponent = Ember.Component.extend({
	renderChart: function() {
		var self = this;
		var treeMap = d3.sma.treeMap()
			.on("customClick", function(screen_name) {
				console.log(screen_name);
				self.sendAction("action", screen_name);
			});

		d3.select("body")
			.datum([this.get("data")])
			.call(treeMap);
	}.observes("data").on("didInsertElement")
});

App.WorldMapComponent = Ember.Component.extend({
	renderChart: function() {
		var worldMap = d3.sma.worldMap();
		
		d3.select("body")
			.datum([this.get("topology"), this.get("data")])
			.call(worldMap);
	}.observes("data", "topology").on("didInsertElement")
});

App.ColumnChartComponent = Ember.Component.extend({
	renderChart: function() {
		var columnChart = d3.sma.columnChart();
		d3.select("body")
			.datum(this.get("data"))
			.call(columnChart);		
	}.observes("data").on("didInsertElement")
});

App.NetworkDiagramComponent = Ember.Component.extend({
	renderChart: function() {
		var chart = d3.sma.network();
		d3.select("body")
			.datum(this.get("data"))
			.call(chart);
	}.observes("data").on("didInsertElement")
});

App.BarChartComponent = Ember.Component.extend({
	renderChart: function() {
		var self = this;
		var barChart = d3.sma.barChart()
			.height(this.get("data").length * 25)
			.on("customClick", function(d) {
				self.sendAction("action", d.id);
			});
		d3.select("body")
			.datum(this.get("data"))
			.call(barChart);
	}.observes("data").on("didInsertElement")
});

App.SortingButtonView = Ember.View.extend({
	tagName: "button",
	attributeBindings: ["type"],
	classNames: ["btn", "btn-default"],
	classNameBindings: ["isActive:active"],
	type: "button",

	isActive: function () {
		return this.get("property") === this.get("controller.sortingProperty");
	}.property("property","controller.sortingProperty"),

	click: function () {
		this.set("controller.sortingProperty", this.get("property"));
	}
});

App.Select = Ember.Select.extend({
	classNames: ["chosen-select"],

	content: ["Holy shit","Wonderful wonderful"],

	attributeBindings: ["content"],
 
	didInsertElement: function() {
		this._super();
		this.$().chosen();
	},
 
	selectionChanged: function() {

	}.observes("selection")
});

App.MultipleSelect = Ember.Select.extend({

	multiple: true,
	value: "Select fields",
 
	classNames: ["uicontrol-multiple-select"],
 
	attributeBindings: ["multiple", "value"],
 
	didInsertElement: function() {
		this._super();
		this.$().chosen();
	},
 
	selectionChanged: function() {
		this.$().trigger("liszt:updated");
	}.observes("selection")
});

// Utilities

function bfs(l, nodeId, marked, c) {
	c++;
	marked[nodeId] = true;
	var neighbors = _.object(_.sortBy(_.pairs(l[nodeId]), function(d) { return -d[1]; }).slice(0,5));
	for (neighbor in neighbors) {
		if (!marked.hasOwnProperty(neighbor) && c < 4) bfs(l, neighbor, marked, c);
	}
	return marked;
}