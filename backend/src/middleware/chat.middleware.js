const userModel =  require("../model/user.model")
const jwt = require("jsonwebtoken")


async function chatMiddleware(req,res,next){
    const token = req.cookies.token
    if(!token){
        return res.status(400).json({
            message:"Token Not Found"
        })
    }
    try{
        const decoded = jwt.verify(token,process.env.JWT_SECRET)
        const user  =  await userModel.findById(decoded.id)
        req.user= user
        next()
    }   
    catch(err){
        res.status(400).json({
            message:"Invalid Token"
        })
    }
}

module.exports = chatMiddleware