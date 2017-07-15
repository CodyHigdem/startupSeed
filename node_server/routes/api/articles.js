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

/*
router.param to intercept :articles
*/
router.param('article', function(req, res, next, slug){
	Article.findOne({ slug: slug })
	.populate('author')
	.then(function (article){
		if(!article){ return res.sendStatus(404); }

		req.article = article;

		return next();
	}).catch(next);
});

module.exports = router;
