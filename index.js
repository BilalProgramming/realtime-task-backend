require("dotenv").config()
const express=require("express")
const cors=require("cors")
const http=require("http")
const {Server}=require("socket.io")
const {connectDb}=require("./db")
const userRoutes=require("./Routes/userRoutes")
const taskRoutes=require("./Routes/taskRoutes")

const app=express()
const server=http.createServer(app)

const io=new Server(server,{
    cors:{
        origin:"http://localhost:5174",
        methods:['GET','POST']
    }
})
const secretKet=process.env.SECRET_KEY
if(!secretKet){
    console.log("secret key is missing")
    process.exit(1)

}

connectDb()

app.use(cors())
app.use(express.json())
app.use("/api/user",userRoutes)
app.use("/api/task",taskRoutes(io))

io.on("connection",(socket)=>{
    console.log('A user connected',socket.id);
    socket.on("disconnect",()=>{
        console.log('user disconnected',socket.id);


    })
    
})
const PORT=process.env.PORT
server.listen(PORT,()=>{
    console.log(`Server is running on ${PORT}`);
    
})