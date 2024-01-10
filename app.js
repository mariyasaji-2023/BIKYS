const createError = require('http-errors');
const express = require('express');
const session = require('express-session');
const path = require('path');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const logger = require('morgan');
const mongoose = require('mongoose');
require('dotenv').config();

// mongoose.connect('mongodb://127.0.0.1:27017/CRUD', {
//   useNewUrlParser: true,
//   useUnifiedTopology: true,
// });

// const db = mongoose.connection;
// db.on('error', console.error.bind(console, 'MongoDB connection error'));
// db.once('open', () => {
//   console.log('Connected to MongoDB');
// });

const connectToDatabase=require('./config/database')
connectToDatabase();

const userRouter = require('./routes/users');
const adminRouter = require('./routes/admin');

const app = express();

// View engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// Middleware
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

//declare Sessions

const userSessionConfig = {
  name: 'userSession',
  secret: 'your-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 3600000 }, // Session expires after 1 hour
};

// Configuration for admin sessions
const adminSessionConfig = {
  name: 'adminSession',
  secret: 'your-admin-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 3600000 }, // Session expires after 1 hour
};

// Configure session middleware
app.use('/', session(userSessionConfig));
app.use('/admin', session(adminSessionConfig));

// Add cache control headers
app.use((req, res, next) => {
  res.header('Cache-Control', 'private, no-cache, no-store, must-revalidate');
  next();
});

// Routes
app.use('/', userRouter);
app.use('/admin', adminRouter);

// Handle 404 and render PageNotFound
app.get('*', (req, res) => {
  res.render('PageNotFound');
});

// Error handling
app.use((req, res, next) => {
  next(createError(404));
});

app.use((err, req, res, next) => {
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;

