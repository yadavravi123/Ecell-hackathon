const router = require('express').Router();
const passport = require('passport');
const genPassword = require('../lib/passwordUtils').genPassword;
const connection = require('../config/database')
const User = connection.models.User;
const Class=connection.models.Class;
const Students=connection.models.Students;
const Testing=connection.models.Testing;
const Teachers=connection.models.Teachers;
const Subjects=connection.models.Subjects;
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
//  {

//     successRedirect: '/studentDashboard',
//     failureRedirect: '/login',
//   }
 router.post('/login',passport.authenticate('local'),(req,res,next)=>{
        if(req.user.admin){
            res.redirect("/teacherDashboard");
        }
        else{
            res.redirect("/studentDashboard");
        }
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

    const stu_id=req.user._id.toHexString();
    const stu_name=req.user.username;
    console.log(req.user);
    Class.updateOne({"id":req.params.id},{$push:{"student":{"name":stu_name,"id":stu_id}}},{upsert:true}) 
    .then((ack)=>{
       console.log(ack);
    })
    .catch((err)=>{
       console.log(err);
    })

    res.json("joined");
   
})

router.get("/createSubject",isAuth,async(req,res)=>{
    res.render("createSubject.ejs");
})

// teacher will create a class which will have unique id

router.post("/createSubject",isAuth,async(req,res)=>{

    const subject_name=req.body.subject_name;
    const subject_id=uuid.v4();
    const teacherName=req.user.username;
    
    const Teacher=new Teachers({
        teacher_name:teacherName,
        teacher_id:req.user.id,
        subject_name:subject_name,
        subject_id:subject_id,
        students:[]
    })
    const ack1= await Teacher.save();
    console.log(ack1);
    const Subject=new Subjects({
        id:subject_id,
        name:subject_name,
    })
    const ack2=await Subject.save();
    console.log(ack2);
    res.json("created class");

})
router.get("/join",isAuth,async(req,res)=>{
    res.render("joinClass.ejs");
})
router.post("/join",isAuth,async(req,res)=>{

    // const classId=req.body.classId;
    // const stu_name=req.user.username;
    // const stu_id=req.user._id.toHexString();
    const subject_id=req.body.subject_id;
   
    const ob=await Subjects.findOne({id:subject_id});
    const subject_name=ob.name;
    const student_id=req.user._id.toHexString();
    const student_name=req.user.username;

    const ack=await Students.updateOne({student_id:student_id,student_name:student_name},{$push:{"Subjects":{name:subject_name,id:subject_id}}},{upsert:true});
    console.log('1',ack);
    const ack2=await Teachers.updateOne({subject_id:subject_id},{$push:{"students":{name:student_name,id:student_id}}},{upsert:true});
    console.log('2',ack2);
    res.json("joined the class");
})

router.get("/post",async(req,res)=>{
    res.render("post_log_teach.ejs");
})

router.get("/testing",async(req,res)=>{
    
    const obj={
        name:"utsav",
        id:"563"
    }
    const filter={teacher_name:"rasool",subject_name:"AI"};
    const ack=await Teachers.updateOne(filter,{$push:{"students":obj}},{upsert:true});
    console.log(ack);
   res.json("done");
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
    res.send("<h1>student dashboard</h1>")
})

// teacher dashboard
router.get("/teacherDashboard",async(req,res)=>{
    res.send("<h1>teacher dashboard</h1>");
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
router.get('/protected-route',isAdmin, (req, res, next) => {
    
    // This is how you check if a user is authenticated and protect a route.  You could turn this into a custom middleware to make it less redundant
    if (req.isAdmin()) {
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