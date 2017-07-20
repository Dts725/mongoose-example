let mongoose = require('mongoose'),
express = require('express'),
http = require('http'),
bodyParser = require('body-parser'),
morgan = require('morgan'),
session = require('express-session'),
jade = require('jade');

// create application/json parser
var jsonParser = bodyParser.json()
// create application/x-www-form-urlencoded parser
var urlencodedParser = bodyParser.urlencoded({ extended: false });

let app = express();
app.use(morgan(function (tokens, req, res) {
  return [
    tokens.method(req, res),
    tokens.url(req, res),
    tokens.status(req, res),
    tokens.res(req, res, 'content-length'), '-',
    tokens['response-time'](req, res), 'ms'
  ].join(' ')
}));
app.use(urlencodedParser);
app.use(bodyParser.json());
app.use(session({
	secret: 'my-website',
	resave: false,
	saveUninitialized: true
}));
app.set('view engine', 'jade');//different at lower version express
app.set('views', __dirname + '/views');
app.use((req, res, next) => {
	if(req.session.loggedIn){
		res.locals.authenticated = true;
		User.findById(req.session.loggedIn, (err, doc) => {
			if(err) return next(err);
			res.locals.me = doc;
			next();
		})
	} else {
		res.locals.authenticated = false;
		next();
	}
});

/**
* router
*/
app.get('/', (req, res) => {
	console.log('before render');
	res.render('index');
});
app.get('/login', (req, res) => {
	res.render('login');
});
app.get('/signup', (req, res) => {
	res.render('signup');
});
app.get('/logout', (req, res) => {
	req.session.loggedIn = null;
	res.redirect('/');
});
app.get('/login/:signupEmail', (req, res) => {
	res.render('login', { signupEmail: req.params.signupEmail });
});


/**
* signup handler
*/
app.post('/signup', (req, res, next) => {
	new User(req.body).save().then(doc => {
		res.redirect('/login/' + doc.email);
	}).catch(err => next(err.message))
});

/**
 *login handler
 */
app.post('/login', (req, res) => {
	User.findOne(req.body).then(doc=>{
		if(! doc)
			res.send('user no found!');
		else {
			req.session.loggedIn = doc._id;
			res.redirect('/');
		}
	}).catch(err => next(err));
});

/**
 * database
 */
mongoose.connect('mongodb://127.0.0.1/my-website');
let db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function() {
  console.log('database has connected.');
});
//Schema defination
let Schema = mongoose.Schema;
let User = mongoose.model('User', new Schema({
	first: String,
	last: String,
	email: {
		type: String,
		unique: true,
	},
	password: {
		type: String,
		index: true,
	}
}));

//lanuch server
http.createServer(app).listen(3000,() => {
	console.log('server is listening on port 3000.');
})