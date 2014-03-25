var App = Ember.Application.create();

App.TweetSerializer = DS.RESTSerializer.extend({
	extractArray: function(store, type, payload, id, requestType) {
		var tweets = payload;
		var users = [];
		tweets.forEach(function(tweet) {
			var user = _.find(users, function(u) { return tweet.user.id == u.id; });
			if (!user) {
				tweet.user.tweets = [tweet.id];
				users.push(tweet.user);
			} else {
				user.tweets.push(tweet.id);
			}
			tweet.user = tweet.user.id;
		});
		payload = { tweets: tweets, users: users };
		return this._super(store, type, payload, id, requestType);
	}
});

App.HashtagSerializer = DS.RESTSerializer.extend({
	extractArray: function(store, type, payload, id, requestType) {
		var hashtags = payload;
		hashtags.forEach(function(hashtag) {
			hashtag.id = hashtag._id;
			delete hashtag._id;
		});
		payload = { hashtags: hashtags };
		return this._super(store, type, payload, id, requestType);
	}
});

App.Router.map(function() {
	this.resource("tweets"),
	this.resource("hashtags")
});

App.ApplicationController = Ember.Controller.extend({
	needs: ["tweets"],
});

App.TweetsRoute = Ember.Route.extend({
	queryParams: {
		q: {
			refreshModel: true,
			replace: true
		}
	},
	model: function(params) {
		console.log(params);
		for (var k in params) { if (params[k] === "undefined" || params[k] === "null" || params[k] === null || params[k] === undefined) delete params[k]; };
		console.log(params);
		return this.store.findQuery("tweet", params);
	},
	actions: {
		search: function() {
			// var params = {};
			// this.get("controller.query").split("&").forEach(function(param) {
			// 	var item = param.split("=");
			// 	params[item[0]] = item[1];
			// });
			// console.log(params);
			// this.transitionTo({ queryParams: params });
			var q = this.get("controller.query").replace(/=/g,"%3D").replace(/,/g,"%2C").replace(/:/g,"%3A").replace(/&/g,"%26");
			console.log(this.get("controller.query"));
			console.log(q);
			console.log("/tweets?q=" + q);
			this.transitionTo("/tweets?q=" + q);
		}
	}
});

App.TweetsController = Ember.ArrayController.extend({
	queryParams: ["q"],
	// filteredTweets: function() {
	// 	var user = this.get("user");
	// 	var lang = this.get("lang");
	// 	console.log(lang);
	// 	var tweets = this.get("model");
	// 	if (user) return tweets.filter(function(tweet) {
	// 		return tweet.user.screen_name === user && tweet.lang === lang;
	// 	});
	// 	else return tweets;
	// }.property("user", "lang", "model")
});

App.HashtagsRoute = Ember.Route.extend({
	model: function(params) {
		return this.store.find("hashtag", params);
	}
});

App.HashtagsController = Ember.ArrayController.extend({
	queryParams: ["user", "lang"]
});

App.BarChartComponent = Ember.Component.extend({
	didInsertElement: function() {
		Ember.run.once(this, "renderChart");
	},
	renderChart: function() {
		var barChart = d3.sma.barChart()
			.height(this.get("data").content.length * 25);
		d3.select("body")
			.datum(this.get("data").content)
			.call(barChart);
	}.observes("data")
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