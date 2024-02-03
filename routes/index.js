const router = require('express').Router();
const passport = require('passport');
const genPassword = require('../lib/passwordUtils').genPassword;
const connection = require('../config/database')
const User = connection.models.User;
const Class=connection.models.Class;
const Students=connection.models.Students;
const Assignments=connection.models.Assignments;
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

router.post("/createSubject",async(req,res)=>{
   
    const subject_name=req.body.subject_name;
    const subject_id=uuid.v4().substring(0,5);
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
        subject_name:subject_name,
        teacher_name:teacherName,
    })
    const ack2=await Subject.save();
    console.log(ack2);
    res.redirect("teacherDashboard");

})

router.post("/join",isAuth,async(req,res)=>{

    const subject_name=req.body.subject_name;

    const ob=await Subjects.findOne({subject_name:subject_name});
  
    const student_id=req.user._id.toHexString();

    const student_name=req.user.username;

    const ack=await Students.updateOne({student_id:student_id,student_name:student_name},{$push:{"Subjects":{name:subject_name,id:subject_name}}},{upsert:true});
   
    const ack2=await Teachers.updateOne({subject_name:subject_name},{$push:{"students":{name:student_name,id:student_id}}},{upsert:true});
  
    res.redirect("studentDashboard");
})

router.get("/post",async(req,res)=>{
    res.render("post_log_teach.ejs");
})

router.post("/add-assignment/:subject_name",async(req,res)=>{
    
    const sub_name=req.params.subject_name;

    const Assignment=new Assignments({
        title:"title",
        due_date:"4.30",
        grade:"4.5",
        subject_name:"AI",
    })

    const ack=await Assignment.save();
    console.log(ack);
    res.json("added assignment");
})

 /**
 * -------------- GET ROUTES ----------------
 */

router.get('/', async(req, res, next) => {

    res.send('<h1>Home</h1><p>Please <a href="/register">register</a> ,<a href="/register-admin">register as admin</a>,<a href="/login">login</a> </p>');
//     console.log(req.user);
//    res.render("Home.ejs");
    

});



// teacher dashboard
// res.render('post_log_teach',{course:data,name:currTeacher.fName});
router.get("/teacherDashboard",async(req,res)=>{
    const teacherName=req.user.username;
    const teacher_arr=await Teachers.find({teacher_name:teacherName});
    const course=[];
    for(let i=0;i<teacher_arr.length;i++){
        course.push(teacher_arr[i].subject_name);
    }
    res.render("teacherDashboard",{course:course,name:teacherName});
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

router.post("/teachersubject",async(req,res)=>{
    const teacher_name=req.body.teacher_name;
    const subject_name=req.body.subject_name;
    const student_arr=[];
    var temp=await Teachers.findOne({teacher_name:teacher_name,subject_name:subject_name});
     temp=temp.students;
    for(let i=0;i<temp.length;i++){
        student_arr.push(temp[i]);
    }
   
    const assignment_arr=await Assignments.find({subject_name:subject_name});
    console.log(assignment_arr);


    res.render("subject_student.ejs",{student_arr:student_arr,teacher_name:teacher_name,subject_name:subject_name,assignment_arr:assignment_arr});
   
   
})

// student dashboard

router.get('/studentDashboard', async (req, res) => {
    try {
       
        const student_name=req.user.username;
        
        const student = await Students.findOne({student_name:student_name});
        console.log(student);
        const teacher=[];
        const subjects=student.Subjects;
        for(let i=0;i<subjects.length;i++){
            const sub_name=subjects[i].name;
            const temp=await Subjects.findOne({subject_name:sub_name});
            teacher.push(temp.teacher_name);
        }
      
        res.render('studentDashboard', { subjects: student.Subjects, name: student.student_name , teacher:teacher});
  
    } catch (error) {
        console.error('error while showing students subjects');
    }
});

router.get("/open_subject/:subject_name",async(req,res)=>{
        const student_name=req.user.username;
        const subject_name=req.params.subject_name;
        
        res.render("stud_subject.ejs",{subject_name:subject_name});
})

router.get("/assignment/:subject_name", async(req,res)=>{

        const student_name=req.user.username;
        const subject_name=req.params.subject_name;

        const assgnment_arr=[];
        const ass=await Assignments.find({subject_name:subject_name});
        for(let i=0;i<ass.length;i++){
            let assignment={
                title:ass[i].title,
                due_date:ass[i].due_date,
                grade:ass[i].grade,
            }
            assgnment_arr.push(assignment);
        }
        // assgnment_arr contains all assignments of a given subject
        const data=[];
        const labels=[];

        for(let i=1;i<=4;i++){
            labels.push("Ass"+i);
        }
        const chartData={
            subject:subject_name,
            labels:labels,
            grades:[9,4,2,7],
        }
        data.push(chartData);
        res.render("graphs.ejs",{data});

})
router.get("/add-assignment/:subject_name",async(req,res)=>{
   
    res.render("add-assignment.ejs",{subject_name:req.params.subject_name});
})
router.post("/add-assignment", async(req,res)=>{
    const assgnment={
        title:req.body.title,
        due_date:req.body.due_date,
        total_score:req.body.total_score,
        subject_name:req.body.subject_name,
    }
    const Ass=new Assignments(assgnment);
    const ack=Ass.save();
    console.log('ack');
    res.json("added assignment");
})




module.exports = router;