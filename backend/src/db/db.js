const mongoose = require("mongoose")

function connectToDb(){
    
    mongoose.connect(process.env.MONGODB_URI).then(()=>{
        console.log("Connected to MongoDB")
    })
    .catch((err)=>{
        console.log("cannot connect to DB",err)

    })
}



module.exports = connectToDb