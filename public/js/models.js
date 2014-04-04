App.Tweet = DS.Model.extend({
	text: DS.attr("string"),
	// created_at: DS.attr("string"),
	// id_str: DS.attr("string"),
	// entities: DS.hasMany("entity"),
	// user: DS.belongsTo("user"),
	retweet_count: DS.attr("number"),
	favorite_count: DS.attr("number"),
	// location: DS.attr("string"),
	// favorited: DS.attr("string"),
	// in_reply_to_status_id: DS.attr("string"),
	// retweeted_status: DS.attr("string"),
	// lang: DS.attr("string"),
	score: DS.attr("number"),
	screen_name: DS.attr("string"),
	name: DS.attr("string"),
	profile_image_url: DS.attr("string")
});

App.User = DS.Model.extend({
	profile_image_url: DS.attr("string"),
	screen_name: DS.attr("string"),
	name: DS.attr("string"),
	followers_count: DS.attr("number"),
	friends_count: DS.attr("number")
});

// App.Entity = DS.Model.extend({

// });

// App.Hashtag = DS.Model.extend({
// 	text: DS.attr("string"),
// 	count: DS.attr("number")
// });