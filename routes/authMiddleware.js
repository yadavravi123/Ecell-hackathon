module.exports.isAuth=(req,res,next)=>{
    if(req.isAuthenticated()){
        // res.send('<h1>You are authenticated</h1><p><a href="/logout">Logout and reload</a></p>');
        console.log(`you are succesfully authenticated`);
        next();
    }else{
        // res.status(401).json({msg:"You are not authorized to view this resource"});
        res.redirect("/login");
    }
}
// req.isAuthenticated() is true if user exist
// req.isAdmin() is true if req.isAuthenticated is true and req.user.admin exist

module.exports.isAdmin=(req,res,next)=>{
        if(req.isAuthenticated && req.user.admin){
            res.send(`Admin route`);
        }
        else{
            res.status(401).json({msg:"You are not authorized to view this resource"});
        }
}


