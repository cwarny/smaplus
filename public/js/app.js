d3.sma = {};
var l, n;

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
	this.resource("entities")
});

App.TweetsRoute = Ember.Route.extend({
	queryParams: {
		q: {
			refreshModel: true,
			replace: true
		}
	},
	model: function(params) {
		for (var k in params) { if (params[k] === "undefined" || params[k] === "null" || params[k] === null || params[k] === undefined) delete params[k]; };
		// return this.store.findQuery("tweet", params);
		var q;
		if (params.q) q = params.q.replace(/=/g,"%3D").replace(/,/g,"%2C").replace(/:/g,"%3A").replace(/&/g,"%26")
		return Ember.$.getJSON("/tweets?q=" + q).then(function(data) {
			var g = false;
			if (q) g = q.indexOf("group") != -1;
			if (!g) d3.selectAll("svg").remove();
			return { grouped: g , data: data };
		});
	},
	actions: {
		search: function() {
			var q = this.get("controller.query").replace(/=/g,"%3D").replace(/,/g,"%2C").replace(/:/g,"%3A").replace(/&/g,"%26");
			console.log(this.get("controller.query"));
			console.log(q);
			this.transitionTo("/tweets?q=" + q);
		}
	}
});

App.TweetsController = Ember.Controller.extend({
	queryParams: ["q"]
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
		});
	}.property("selectedNodeId"),

	graphData: function() {
		var l = this.get("model.l");
		var n = this.get("model.n");
		n[this.get("selectedNodeId")].selected = true;
		var connectedComponent = _.keys(bfs(this.get("model.l"), this.get("selectedNodeId"), {}));
		var ll = _.pick(this.get("model.l"), connectedComponent);
		var nn = _.pick(this.get("model.n"), connectedComponent);
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
			var n = this.get("model.n");
			n[this.get("selectedNodeId")].selected = false;
			this.set("selectedNodeId", nodeId);
		}
	}
});

App.BasicChartComponent = Ember.Component.extend({
	didInsertElement: function() {
		Ember.run.once(this, "renderChart");
	}
});

App.NetworkDiagramComponent = App.BasicChartComponent.extend({
	renderChart: function() {
		var chart = d3.sma.network();

		d3.select("body")
			.datum(this.get("data"))
			.call(chart);
	}.observes("data")
});

App.BarChartComponent = App.BasicChartComponent.extend({
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
	}.observes("data"),
});





App.MultipleSelect = Ember.Select.extend({
	// init: function() {
	// 	App.Tweet.eachAttribute(function(name, meta) {
	// 		console.log(name, meta);
	// 	});
	// },

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

function bfs(l, nodeId, marked) {
	marked[nodeId] = true;
	for (neighbor in l[nodeId]) {
		if (!marked.hasOwnProperty(neighbor)) bfs(l, neighbor, marked);
	}
	return marked;
}