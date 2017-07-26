/*
slug
title
body
description
favoritesCount
tagList
author
*/

var mongoose = require('mongoose');
var uniqueValidator = require('mongoose-unique-validator');
var slug = require('slug')
var User = mongoose.model('User');

var ArticleSchema = new mongoose.Schema({
	slug: {type: String, lowercase: true, unique: true},
	title: String,
	description: String,
	body: String,
	favoritesCount: { type: Number, default: 0 },
	favorited: user ? user.isFavorite(this._id) : false,
	tagList: [{type: String }],
	author: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

ArticleSchema.plugin(uniqueValidator, {message: 'is already taken'});


/*
slug generator
*/

ArticleSchema.methods.slugify = function(){
	this.slug = slug(this.title) + '-' + (Math.random() * Math.pow(36, 6) | 0).toString(36);
};

/*
Generate slug BEFORE mongoose tries to validate the model
*/

ArticleSchema.pre('validate', function(next){
	if(!this.slug){
		this.slugify();
	}

	next();
});

/*
Make a method for returning proper json output from api endpoint
*/

ArticleSchema.methods.toJSONFor = function(user){
	return {
		slug: this.slug,
		title: this.title,
		description: this.description,
		body: this.body,
		createdAt: this.createdAt,
		updatedAt: this.updatedAt,
		tagList: this.tagList,
		favoritesCount: this.favoritesCount,
		author: this.author.toProfileJSONFor(user) //toprofilejsonfor should provide us the basic authorfield data- WOOT!!!
	};
};

//Count article favorites
ArticleSchema.methods.updateFavoriteCount = function(){
	var article = this;

	return User.count({ favorites: { $in: [article._id ]}}).then(function(count){
		article.favoritesCount = count;

		return article.save();
	});
};

mongoose.model('Article', ArticleSchema);