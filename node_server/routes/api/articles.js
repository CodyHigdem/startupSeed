var router = require('express').Router();
var passport = require('passport');
var mongoose = require('mongoose');
var Article = mongoose.model('Article');
var User = mongoose.model('User');
var auth = require('../auth');


/*
list all articles
*/

router.get('/', auth.optional, function(req, res, next){
	var query = {};
	var limit = 20;
	var offset = 0;

	if(typeof req.query.limit !== 'undefined'){
		limit = req.query.limit;
	}

	if(typeof req.query.offset !== 'undefined'){
		offset = req.query.offset;
	}

	if(typeof req.query.tag !== 'undefined'){
		query.tagLlist = {"$in": [req.query.tag]};
	}

	//First let's see if favorites or author query params were used, then run a user.findone to pass the user data into thep promise all
	//else pass null 
	//then build our query object


	return Promise.all([
		Article.find(query)
			.limit(Number(limit))
			.skip(Number(offset))
			.sort({'createdAt': 'desc'})
			.populate('author')
			.exec(),
		Article.count(query).exec(),
		req.payload ? User.findById(req.payload.id) : null,
	]).then(function(results){
		var articles = results[0];
		var articlesCount = results[1];
		var user = results[2];

		return res.json({
			articles: articles.map(function(article){
				return article.toJSONFor(user);
			}),
			articlesCount: articlesCount
		});
	}).catch(next);
});

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

/*
READ article
*/
router.get('/:article', auth.optional, function(req, res, next){
	Promise.all([
		req.payload ? User.findById(req.payload.id) : null,
		req.article.populate('author').execPopulate()
		]).then(function(results){
			var user = results[0];

			return res.json({ article: req.article.toJSONFor(user)});
		}).catch(next);
});

router.put('/:article', auth.required, function(req, res, next){
	User.findById(req.payload.id).then(function(user){
		if (req.article.author._id.toString() === req.payload.id.toString()){
			if(typeof req.body.article.title !== 'undefined'){
				req.article.title = req.body.article.title;
			}

		if(typeof req.body.article.description !== 'undefined'){
			req.article.description = req.body.article.description;
		}

		if(typeof req.body.article.body !== 'undefined'){
			req.article.body = req.body.article.body;
		}

		req.article.save().then(function(article){
			return res.json({article: article.toJSONFor(user)});
		}).catch(next);
	} else {
		return res.sendStatus(403);
	}
	});
});

//DELETE an ARTICLE
// DELETE /api/articles/:slug

router.delete('/:article', auth.required, function(req, res, next){
	User.findById(req.payload.id).then(function(){
		if(req.article.author._id.toString() === req.payload.id.toString()){
			return req.article.remove().then(function(){
				return res.sendStatus(204);
			});
		} else {
			return res.sendStatus(403);
		}
	});
});

//favoriting route
router.post('/:article/favorite', auth.required, function(req, res, next){
	var articleId = req.article._id;

	User.findById(req.payload.id).then(function(user){
		if (!user) { return res.sendStatus(401); }

		return user.favorite(articleId).then(function(){
			return req.article.updateFavoriteCount().then(function(article){
				return res.json({ article: articl.toJSONFor(user)});
			});
		});
	}).catch(next);
});

//unfavirte an article
router.delete('/:article/favorite', auth.required, function(req, res, next){
	var articleId = req.article._id;

	User.findById(req.payload.id).then(function(user){
		if (!user) {
			return res.sendStatus(401); 
		}

		return user.unfavorite(articleId).then(function(){
			return req.article.updateFavoriteCount().then(function(article){
				return res.json({article: article.toJSONFor(user)});
			});
		});
	}).catch(next);
});

//CREATE A COMMENT ON A GIVENARTICLE
router.post('/:article/comments', auth.required, function(req, res, next){
	User.findById(req.payload.id).then(function(user){
		if(!user){ return res.sendStatus(401); }

		var comment = new Comment(req.body.comment);
		comment.article = req.article;
		comment.author = user;

		return comment.save().then(function(){
			req.article.comments.push(comment);

			return req.article.save().then(function(article){
				res.json({ comment: comment.toJSONFor(user)});
			});
		});
	}).catch(next);
});

//retrieve all comments
router.get('/:article/comments', auth.optional, function(req, res, next){
	Promise.resolve(req.payload ? User.findById(req.payload.id) : null).then(function(user){
		return req.article.populate({
			path: 'comments',
			populate: {
				path: 'author'
			},
			options: {
				sort: {
					createdAt: 'desc'
				}
			}
		}).execPopulate().then(function(article){
			return res.json({comments: req.article.comments.map(function(comment){
				return comment.toJSONFor(user);
			})});
		});
	}).catch(next);
});

//delete comments on ana rticle
router.delete('/:article/comments/:comment', auth.required, function(req, res, next){
	if(req.comment.author.toString() === req.payload.id.toString()){
		req.article.comment.remove(req.comment._id);
		req.article.save()
			.then(Comment.find({
				_id: req.comment._id
			}).remove().exec())
			.then(function(){
				res.sendStatus(204);
			});
	} else {
		res.sendStatus(403);
	}
});

module.exports = router;
