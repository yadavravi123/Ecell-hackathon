const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const connection = require('./database');
const User = connection.models.User;
const validPassword=require('../lib/passwordUtils').validPassword;
const mongoose=require("mongoose");
// TODO: passport.use();

const customFields={
    usernameField:'username',
    passwordField:'password'
};

const verifyCallback=(username,password,done)=>{
          User.findOne({ username: username })
          .then((user)=>{
            if(!user){ return done(null,false);}
            const isValid=validPassword(password,user.hash,user.salt);
            if(isValid){
                return done(null,user); 
            }
            else{
                return done(null,false);
            }
          })
          .catch((err)=>{
            done(err);  
          })
    }
    const strategy= new LocalStrategy(customFields,verifyCallback);

    passport.use(strategy); // for setup

// if the user is verified and it is valid then serializeUser will be called which will put that user_id to req.session.passport.user
//
    passport.serializeUser(function (user, done) {
        console.log(`serialize`);
        // let date=new Date();
        // console.log(date);
        done(null, user.id);
      });

// after serializeUser is done deserialization part comes now,
// now it extracts the user_id from req.session.passport.user which was added by serializUser and now retrieves the complete user object from database using that user-id and attaches this user_obj to req.user for this session

      passport.deserializeUser(function (id, done) {
        console.log(`deserialize`); 
        // let date=new Date();
        // console.log(date);
        // User.findById(id, function (err, user) {
        //   if (err) {
        //     return done(err);
        //   }
        //   done(null, user);
        // });
      
        User.findById(id)
        .then((user)=>{
          return done(null,user);
        })
        .catch((err)=>{
          return done(err);
        })

      }); 