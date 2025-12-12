
require("dotenv").config()
const app = require("./src/app")
const connectToDb = require("./src/db/db")
const createServer = require("./src/sockets/sockets.service")

const PORT = process.env.PORT || 3000;
//socket io 
const http = require("http");
const httpServer = http.createServer(app);




createServer(httpServer)
// connect with DB
connectToDb()

//connecting with server


httpServer.listen(PORT, () => {
  console.log("Server running on port", PORT);
});


