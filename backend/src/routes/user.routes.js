const express = require("express")

const userRoutes = express.Router()
const {registerUserController,loginUserController} = require("../controller/user.controller")


userRoutes.post("/register",registerUserController)
userRoutes.post("/login",loginUserController)



module.exports = userRoutes