var router = require('express').Router();
var passport = require('passport');
var mongoose = require('mongoose');
var Article = mongoose.model('Article');
var User = mongoose.model('User');
var auth = require('../auth');

/*
CREATE ARTICLE
*/

router.post('/', auth.required, function(req, res, next){
	User.findById(req.payload.id).then(function(user){
		if(!user){ return res.sendStatus(401); }

		var article = new Article(req.body.article);

		article.author = user;

		return article.save().then(function(){
			console.log(article.author)
			return res.json({ article: article.toJSONFor(user)});
		});
	}).catch(next);
});


module.exports = router;
