const userModel = require("../model/user.model")
const jwt = require("jsonwebtoken")
const  bcrypt = require("bcryptjs")


async function registerUserController(req,res){
    const {email,fullName:{firstName,lastName},password}  = req.body
    const isUser = await userModel.findOne({email})
    if(isUser){
        return res.status(400).json({
            message:"Already Register User"
        })
    }
    const hashPassword = await bcrypt.hash(password,10)

    const user = await userModel.create({
        email,
        fullName:{
            firstName,
            lastName
        },
        password :hashPassword
    })
    const token = jwt.sign({id:user._id},process.env.JWT_SECRET)
    res.cookie("token",token)
    res.status(200).json({
        message:"User Successfully Register",
        user:{
            email,
            firstName,
            lastName
        },
        createdAt:user.createdAt
    })
    
}

async function loginUserController(req,res){
    const {email,password} = req.body
    const user = await userModel.findOne({email})
    if(!user){
        return res.status(400).json({
            message:"Invalid UserName"
        })
    }
    const isInvalidPassword =  await bcrypt.compare(password,user.password)
    if(!isInvalidPassword){
        return res.status(400).json({
            message:"Invalid Password"
        })
    }
    const token = jwt.sign({id:user._id},process.env.JWT_SECRET)
    res.cookie("token",token)
    res.status(200).json({
        message:"Successfully Login",
        user:{
            email: user.email,
            firstName: user.fullName.firstName,
            lastName: user.fullName.lastName,
            _id: user._id
        }
    })
}

module.exports = {
    registerUserController,
    loginUserController
}