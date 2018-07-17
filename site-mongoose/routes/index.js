const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const https = require('https');
mongoose.connect('mongodb://localhost:27017/test');

const Schema = mongoose.Schema;

const userDataSchema = new Schema({
   title: {type: String, required: true},
   content: String,
   author: String
}, {collection: 'user-data'});

const UserData = mongoose.model('UserData', userDataSchema);

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express', success: req.session.success, errors: req.session.errors });
  req.session.errors = null;
});

//Login with validation
router.post('/submit', function(req, res, next) {
   req.check('email', 'Invalid email address').isEmail();
   req.check('password', 'Password is invalid').isLength({min: 4}).equals(req.body.confirmPassword);

   var errors = req.validationErrors();
   if (errors) {
       req.session.errors = errors;
       req.session.success = false;
   } else {
       req.session.success = true;
   }
   res.redirect('/');
});

/*
ITUNES API INTERACT PAGE *********************************************
 */




//Search page
router.get('/search', function(req, res, next) {
   res.render('search', {searchSuccess: true});
});

//Redirect to results page on form submit
router.post('/search/submit', function(req, res, next) {
    var id = req.body.id;
    res.redirect('/search/' + id)
});

//Search results page
router.get('/search/:id', function(req, res, next) {

    let data = '';

    searchTerm = req.params.id;

    https.get("https://itunes.apple.com/search?term=" + searchTerm +"&media=podcast&limit=3", (resp) => {
        resp.on('data', (chunk) => {
            data += chunk;
        });

        resp.on('end', () => {
            parsedData = JSON.parse(data);
            resultCount = parsedData.resultCount;

            if (resultCount == 0) {
                res.render('search', {searchSuccess: false});
            } else {
                res.render('searchResults', {output: req.params.id, results: parsedData.results});
            }
        });

    }).on("error", (err) => {
        console.log("Error: " + err.message);
    });
});




/*
MONGO DB TESTING************************************************************
 */

//Server interface page
router.get('/server', function(req, res, next) {
    res.render('serverInterface')
});

//Retrieves and displays server data
router.get('/server/get-data', function(req, res, next) {
    UserData.find()
        .then(function(doc) {
            res.render('serverInterface', {items: doc});
        })
});

//Inserts data into the database
router.post('/server/insert', function(req, res, next) {
    var item = {
      title: req.body.title,
      content: req.body.content,
      author: req.body.author
    };

    var data = new UserData(item);
    data.save();

    res.redirect('/server')
});

//Updates data in the database by id
router.post('/server/update', function(req, res, next) {
    var item = {
        title: req.body.title,
        content: req.body.content,
        author: req.body.author
    };
    var id = req.body.id;

    UserData.findById(id, function(err, doc) {
        if(err) {
            console.error('error, no entry found');
        }
        doc.title = req.body.title;
        doc.content = req.body.content;
        doc.author = req.body.author;
        doc.save();
    });
    res.redirect('/server');
});

//Deletes data in the database by id
router.post('/server/delete', function(req, res, next) {
    var id = req.body.id;
    UserData.findByIdAndRemove(id).exec();
    res.redirect('/server');
});




module.exports = router;
