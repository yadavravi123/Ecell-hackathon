const router = require('express').Router();
const passport = require('passport');
const genPassword = require('../lib/passwordUtils').genPassword;
const connection = require('../config/database')
const User = connection.models.User;
const Class=connection.models.Class;
const isAuth=require('./authMiddleware').isAuth;
const isAdmin=require('./authMiddleware').isAdmin;
const axios=require("axios");
const { application } = require('express');
const { connect } = require('mongoose');
const uuid = require('uuid');

/**
 * -------------- POST ROUTES ----------------
 */

 // TODO
 router.post('/login',passport.authenticate('local', {
    successRedirect: '/studentDashboard',
    failureRedirect: '/login',
  }),(req,res,next)=>{
    console.log('kdjfk');
  });

 // TODO
 router.post('/register', (req, res, next) => {
    const saltHash=genPassword(req.body.password);
    const salt=saltHash.salt;
    const hash=saltHash.hash;
    const newUser= new User({
        username: req.body.username,
        hash: hash, 
        salt:salt,
        admin:false,
    });

   newUser.save()
    .then((user)=>{
        console.log(user);
    })
    .catch((e)=>{
        console.log('error while saving ',e);
    })

    
    res.redirect("/login");
 });

 router.post('/register-admin',(req,res,next)=>{
    const saltHash=genPassword(req.body.password);
    const salt=saltHash.salt;
    const hash=saltHash.hash;
    const newUser= new User({
        username: req.body.username,
        hash: hash, 
        salt:salt,
        admin:true,
    });

   newUser.save()
    .then((user)=>{
        console.log(user);
    })
  
    res.redirect("/login");
 })


// student  join a class

router.get("/join/:id",isAuth,async(req,res)=>{

    // const stu_id=req.user._id.toHexString();
    // const stu_name=req.user.username;
    // console.log(req.user);
    // Class.updateOne({"id":req.params.id},{$push:{"student":{"name":stu_name,"id":stu_id}}},{upsert:true}) 
    // .then((ack)=>{
    //    console.log(ack);
    // })
    // .catch((err)=>{
    //    console.log(err);
    // })
    console.log(req.user);
  
    res.json("ok");
   
})

router.get("/createClass",isAuth,async(req,res)=>{
    res.render("basicForm.ejs");
})
// teacher will create a class which will have unique id

router.post("/createClass",isAuth,async(req,res)=>{

    const class_name=req.body.class_name;
    const classId=uuid.v4();
    const teacherName=req.user.username;
    console.log('teacher',teacherName);
    const newClass=new Class({
        id:classId,
        class_name:class_name,
        teacher_name:teacherName,
        student:[],
    })
    const result=await newClass.save();
})


 /**
 * -------------- GET ROUTES ----------------
 */

router.get('/', async(req, res, next) => {

    res.send('<h1>Home</h1><p>Please <a href="/register">register</a> ,<a href="/register-admin">register as admin</a>,<a href="/login">login</a> </p>');
//     console.log(req.user);
//    res.render("Home.ejs");
    

});

// student dashboard

router.get("/studentDashboard",async(req,res)=>{
    res.send("<h1>success</h1>")
})

router.get("/register-teacher", async(req,res)=>{
    res.render("register_login.ejs",{
        type:"register-teacher"
    })
})
router.get('/login',  (req, res, next) => {
   
    // const form = '<h1>Login Page</h1><form method="POST" action="/login">\
    // Enter Username:<br><input type="text" name="username">\
    // <br>Enter Password:<br><input type="password" name="password">\
    // <br><br><input type="submit" value="Submit"></form> <a href="/register">register</a>';
    // res.send(form);
    res.render("register_login.ejs",{
        type:"login"
    });
});

// When you visit http://localhost:3000/register, you will see "Register Page"
router.get('/register', (req, res, next) => {

    // const form = '<h1>Register Page</h1><form method="post" action="register">\
    //                 Enter Username:<br><input type="text" name="username">\
    //                 <br>Enter Password:<br><input type="password" name="password">\
    //                 <br><br><input type="submit" value="Submit"></form>';

    // res.send(form);
    res.render("register_login.ejs",{
        type:"register"
    });

});
router.get("/register-admin",(req,res,next)=>{
//     const form = '<h1>Register Page</h1><form method="post" action="register-admin">\
//     Enter Username:<br><input type="text" name="username">\
//     <br>Enter Password:<br><input type="password" name="password">\
//     <br><br><input type="submit" value="Submit"></form>';
// res.send(form);
    res.render("register_login.ejs",{
        type:"register-admin"
    })
})
/**
 * Lookup how to authenticate users on routes with Local Strategy
 * Google Search: "How to use Express Passport Local Strategy"
 * 
 * Also, look up what behaviour express session has without a maxage set
 */
router.get('/protected-route',isAuth, (req, res, next) => {
    
    // This is how you check if a user is authenticated and protect a route.  You could turn this into a custom middleware to make it less redundant
    if (req.isAuthenticated()) {
        // if(req.session.passport.user property exist then user will be authenticated otherwise not)
        res.send('<h1>You are authenticated</h1><p><a href="/logout">Logout and reload</a></p>');
    } else {
        res.send('<h1>You are not authenticated</h1><p><a href="/login">Login</a></p>');
    }
});
router.get('/admin-route',isAdmin,(req,res,next)=>{

})

// Visiting this route logs the user out
router.get('/logout', (req, res, next) => {
    req.logout(function(err) {
        if (err) { return next(err); }
        res.redirect('/login');
      });
});

router.get('/login-success', (req, res, next) => {
    res.send('<p>You successfully logged in. --> <a href="/protected-route">Go to protected route</a></p>');
});

router.get('/login-failure', (req, res, next) => {
    res.send('You entered the wrong password.');
});
// --------------------Blog Routes--------------------------------------

// get posts

router.get('/posts',isAuth,async(req,res,next)=>{
    try{
        // show only if user is authenticated
    const arr=await posts.find();
    
    res.render("index.ejs",{posts:arr,username:req.user.username});
    } catch(err){
        console.log(`error while getting posts`);
    }
})


module.exports = router;