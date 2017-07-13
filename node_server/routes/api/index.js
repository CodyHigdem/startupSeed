var router = require('express').Router();

router.use('/', require('./users'));
router.use('/profiles', require('./profiles'));

//validation errors from Mongoose middleware
router.use(function(err, req, res, next){
	if(err.name === 'ValidationError'){
		return res.status(422).json({
			errors: Object.keys(err.errors).reduce(function(errors, key){
				errors[key].message;

				return errors;
			}, {})
		});
	}

	return next(err);
});


module.exports = router;
