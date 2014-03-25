App.Tweet = DS.Model.extend({
	text: DS.attr("string"),
	created_at: DS.attr("string"),
	id_str: DS.attr("string"),
	entities: DS.attr(),
	retweet_count: DS.attr("number"),
	user: DS.belongsTo("user")
});

App.User = DS.Model.extend({
	profile_image_url: DS.attr("string"),
	screen_name: DS.attr("string"),
	name: DS.attr("string"),
	followers_count: DS.attr("number"),
	tweets: DS.hasMany("tweet")
});

App.Hashtag = DS.Model.extend({
	text: DS.attr("string"),
	count: DS.attr("number")
});