const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
var passport = require('passport');
var crypto = require('crypto');
var routes = require('./routes');

const port=3000;
const connection = require('./config/database');
const path = require('path');

// Package documentation - https://www.npmjs.com/package/connect-mongo
const MongoStore = require('connect-mongo')(session);


// Need to require the entire Passport config module so app.js knows about it
require('./config/passport');

/**
 * -------------- GENERAL SETUP ----------------
 */

// Gives us access to variables set in the .env file via `process.env.VARIABLE_NAME` syntax
require('dotenv').config();

// Create the Express application

var app = express();
app.set('view engine', 'ejs');
app.use(express.static("public"));
app.use(express.json());
app.use(express.urlencoded({extended: true}));
app.set('views', path.join(__dirname, 'views'));


/**
 * -------------- SESSION SETUP ----------------
 */
const sessionStore=new MongoStore({
    mongooseConnection: connection,
    collection: 'sessions'
});


app.use(session({
    secret:process.env.SECRET,
    resave: false,
    saveUninitialized: true,
    store: sessionStore,
    cookie:{
        maxAge: 24*60*60*1000
    }
}));

// TODO

/**
 * -------------- PASSPORT AUTHENTICATION ----------------
 */

app.use(passport.initialize());
app.use(passport.session());

// app.use((req,res,next)=>{
//     // console.log(req.session);

//     // console.log(req.user);// to get req.user it first check whether req.user exist or not if it exist then it will take that user_id and deserialize function will grab the user info from user's database

//     next();
// })
/**
 * -------------- ROUTES ----------------
 */

// Imports all of the routes from ./routes/index.js
app.use(routes);

/**
 * -------------- SERVER ----------------
 */

// Server listens on http://localhost:3000
app.listen(port,()=>{
    console.log(`server running on port ${port}`);
})