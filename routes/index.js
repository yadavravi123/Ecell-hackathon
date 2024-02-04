const router = require('express').Router();
const passport = require('passport');
const genPassword = require('../lib/passwordUtils').genPassword;
const connection = require('../config/database')
const User = connection.models.User;
const Class=connection.models.Class;
const Students=connection.models.Students;
const Assignments=connection.models.Assignments;

const Submitted=connection.models.Submitted;
const NSubmitted=connection.models.NSubmitted;

const Teachers=connection.models.Teachers;
const Subjects=connection.models.Subjects;
const isAuth=require('./authMiddleware').isAuth;
const isAdmin=require('./authMiddleware').isAdmin;
const axios=require("axios");
const { application } = require('express');
const { connect } = require('mongoose');
const uuid = require('uuid');

const { exec } = require('child_process');
const { ocrSpace } = require('ocr-space-api-wrapper');
const { Copyleaks } = require('plagiarism-checker');
const request = require('request');
const fs = require('fs');
const path = require('path');
const { GoogleGenerativeAI } = require("@google/generative-ai");

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
    // const subject_id=uuid.v4().substring(0,5);
    const subject_id=subject_name;
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

    const student_name=req.user.username;
    const student_id=student_name;
    const ack=await Students.updateOne({student_id:student_id,student_name:student_name},{$push:{"Subjects":{name:subject_name,id:subject_name}}},{upsert:true});
   
    const ack2=await Teachers.updateOne({subject_name:subject_name},{$push:{"students":{name:student_name,id:student_id}}},{upsert:true});
  
    res.redirect("studentDashboard");
})

router.get("/post",async(req,res)=>{
    res.render("post_log_teach.ejs");
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

    res.render("subject_student.ejs",{student_arr:student_arr,teacher_name:teacher_name,subject_name:subject_name,assignment_arr:assignment_arr});
   
   
})

// student dashboard

router.get('/studentDashboard', async (req, res) => {
    
    try {

        const student_name=req.user.username;
        
        const student = await Students.findOne({student_name:student_name});
        // console.log('student',student);
        const teacher=[];
        console.log('stu',student.Subjects);
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

        const assignment_arr=await Assignments.find({subject_name:subject_name});

        const sm_arr=await Submitted.find({student_name:student_name,subject_name:subject_name});
        const nsm_arr=await NSubmitted.find({student_name:student_name,subject_name:subject_name});
        const sub_arr=[];
        const nsub_arr=[];
        for(let i=0;i<nsm_arr.length;i++){
            let ass_id=nsm_arr[i].ass_id;
            const ass=await Assignments.findOne({ass_id:ass_id});
            // console.log('ass',ass);
            const assn={
                ass_id:ass.ass_id,
                title:ass.title,
                due_date:ass.due_date,
                total_score:ass.total_score,
                subject_name:ass.subject_name,
            }
            nsub_arr.push(assn);
        }

        for(let i=0;i<sm_arr.length;i++){
            let ass_id=sm_arr[i].ass_id;
            const ass=await Assignments.findOne({ass_id:ass_id});
            // console.log('ass',ass);
            const assn={
                ass_id:ass.ass_id,
                title:ass.title,
                due_date:ass.due_date,
                total_score:ass.total_score,
                subject_name:ass.subject_name,
            }
            sub_arr.push(assn);
        }

        
        res.render("stud_subject.ejs",{subject_name:subject_name,sub_arr:sub_arr,nsub_arr:nsub_arr});

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
    let uid=uuid.v4().substring(0,3);
    const assgnment={
        ass_id:uid,
        title:req.body.title,
        due_date:req.body.due_date,
        total_score:req.body.total_score,
        subject_name:req.body.subject_name,
    }
    const Ass=new Assignments(assgnment);
    const ack=await Ass.save();
    // console.log('ack',ack);
   
    const tobj=await Teachers.find({subject_name:req.body.subject_name,teacher_name:req.user.username});
 
    const stu_arr=tobj[0].students;
    for(let i=0;i<stu_arr.length;i++){
        const nsm={
            student_name:stu_arr[i].name,
            ass_id:uid,
            subject_name:req.body.subject_name,
        }
        const nnsm=new NSubmitted(nsm);
        const ack=await nnsm.save();
       
    }


    const teacher_name=req.user.username;
    const subject_name=req.body.subject_name;
    const student_arr=[];
    var temp=await Teachers.findOne({teacher_name:teacher_name,subject_name:subject_name});
     temp=temp.students;
    for(let i=0;i<temp.length;i++){
        student_arr.push(temp[i]);
    }
   
    const assignment_arr=await Assignments.find({subject_name:subject_name});
    // console.log(assignment_arr);

    res.render("subject_student.ejs",{student_arr:student_arr,teacher_name:teacher_name,subject_name:subject_name,assignment_arr:assignment_arr});

})

router.post("/submit-ass", async(req,res)=>{

    const subject_name=req.body.subject_name;
    // console.log(subject_name);
    res.render("submit_assignment.ejs",{subject_name:subject_name});


        // const student_name=req.user.username;
        // const subject_name=req.body.subject_name;
        // const ass_id=req.body.ass_id;
        // const ass=await Assignments.findOne({ass_id:ass_id});
        // const asgn={
        //     ass_id:ass_id,
        //     subject_name:ass.subject_name,
        //     student_name:student_name
        // }
        // const ASS=new Submitted(asgn);
        // const ack2=await ASS.save();
        // const ack3=await NSubmitted.deleteOne({subject_name:subject_name,student_name:student_name,ass_id:ass_id});
    
        // res.redirect(`/open_subject/${subject_name}`);
})

router.post('/submitAssignment', async (req, res) => {
    const subject_name=req.body.subject_name;
    // const { text1, text2} = req.body; // Extract form data
    const { assignment } = req.body;
    // var text_1 = text1.replace(/\r\n+\r\n/g, '');
    // var text_2 = text2.replace(/\r\n+\r\n/g, '');

    const ass_path = `./${assignment}`
    console.log(ass_path)
    async function main() {
        try {
            // Using the OCR.space default free API key (max 10reqs in 10mins) + remote file
            // const res1 = await ocrSpace('http://dl.a9t9.com/ocrbenchmark/eng.png');

            // Using your personal API key + base64 image + custom language
            // const res3 = await ocrSpace('data:image/png;base64...', { apiKey: '<API_KEY_HERE>', language: 'ita' });

            // Using your personal API key + local file
            const res2 = await ocrSpace(ass_path, { apiKey: 'K89006073388957' });
            // console.log("res2",res2);
            const queryText = res2.ParsedResults[0].ParsedText;

            // console.log(queryText)

            const data = {
                key: 'bd805efcc737239f4ec19deb93da054453040444',
                query: queryText
            };


            axios.post('https://www.prepostseo.com/apis/checkSentence', data)
                .then(response => {
                    console.log('Response:', response.data.unique);
                    const unique = response.data.unique;

                    if (unique == true) {
                        console.log("unique")

                        const genAI = new GoogleGenerativeAI("AIzaSyDPlHYg54PQjvK4FBWrqkP9WjG3Jkaqweg");
                        // var submission = fs.readFileSync('dumb.txt', 'utf8');
                        var submission = queryText;
                        var question = fs.readFileSync('question.txt', 'utf8');
                        var content_know = 20
                        var org_struc = 10
                        var clarity_cohes = 10
                        var originality_creativity = 10
                        var research_evidence = 10
                        var critical_thinking_analysis = 10
                        var language_analysis = 10
                        var presentation_solution = 20



                        async function run() {
                            // For text-only input, use the gemini-pro model
                            const model = genAI.getGenerativeModel({ model: "gemini-pro" });

                            const prompt = ` 
                                    Give output as a number which is the overall grade
                                    This prompt is given by a Highschool subject Teacher. You need to assess the assignment submitted by students for the question I gave them i.e, ${question}. 
                                    The criteria for judging their assignment is ${content_know}%  Content Knowledge, ${org_struc}%  Organization & Structure, ${clarity_cohes}% 
                                    Clarity & Cohesiveness, ${originality_creativity}% Originality & Creativity, ${research_evidence}% Research & Evidence, ${critical_thinking_analysis}% 
                                    Critical Thinking & Analysis, ${language_analysis}% Language & Analysis, and ${presentation_solution}% Presentation of Solution.
                                    The overall grade is calculated out of 10.
                                    The submission of student is:${submission}`


                            const result = await model.generateContent(prompt);
                            const response = await result.response;
                            const text = response.text();
                            const grade = parseFloat(text);
                            console.log(grade);
                            console.log(text);
                        }

                        run();
                    }

                    else {
                        // give grade zero for that assignment
                        console.log("copied")
                    }
                })
                .catch(error => {
                    console.error('Error:', error.response.data);
                });


        } catch (error) {
            console.error("error",error);
        }
    }

    main();







    //  for ocr iamge to text


    // console.log(text_1)
    // console.log(text_2)
    // //  plag local between 2 files
    // const pythonScriptPath = './app.py';
    // exec(`python ${pythonScriptPath} "${text_1}" "${text_2}"`, (error, stdout, stderr) => {
    //     if (error) {
    //         console.error(`Error executing Python script: ${error}`);
    //         return res.status(500).json({ error: 'Internal Server Error' });
    //     }

    //     // Process Python script output
    //     const result = stdout;
    //     console.log(result)
    //     res.redirect('/submitAssignment');
    // });
    
    res.redirect(`/open_subject/${subject_name}`);
});





module.exports = router;