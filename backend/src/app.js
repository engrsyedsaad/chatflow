const express  =  require("express")
const cookieParser = require("cookie-parser")
const userRoutes = require("./routes/user.routes")
const chatRoutes = require("../src/routes/chat.routes")
const cors = require("cors")
const path = require("path")    


const app = express()

app.use(cors({
    origin:["http://localhost:5173"],
    methods:["GET","POST","PUT","DELETE"],
    credentials:true
}))
app.use(express.json())
app.use(cookieParser())

app.use("/api/auth",userRoutes)
app.use("/api/chat",chatRoutes)
app.use(express.static(path.join(__dirname,"../public")))

app.get("*name", (req, res) => {
    res.sendFile(path.join(__dirname, "../public/index.html"))
});




module.exports = app
