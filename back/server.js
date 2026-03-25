import express from "express";
import cors from "cors";
import Dotenv from "dotenv";
import registerRout from "./routers/registerRouter.js";
import pool from "./database/postgrsql.js";
import loginRout from "./routers/login.js";
import cookieParser from "cookie-parser";
import dashRouter from "./routers/dashRouter.js";
import logoutRouter from "./routers/logout.js";
import userPostRouter from "./routers/userpostRouter.js";
import deleteRouter from "./routers/deleteRouter.js";
import http from 'http'
import { Server } from "socket.io";
import router from "./routers/searchusersRouter.js";
import messageRouter from "./routers/saveMessageRouter.js";
import getMessageRouter from "./routers/sendmessageRouter.js";

const app = express();
const server=http.createServer(app)
const io=new Server(server,{
  cors:{ origin:true
  }
})
app.use(cookieParser())

Dotenv.config();
app.use(express.json());

app.use(
  cors({
    origin:true,
    credentials: true
  })
);

io.on('connection',(socket)=>{
  console.log(socket.id,'user connected')
  socket.on('join_user',(data)=>{
  socket.join(data)
  console.log('user join',data)
  })
  socket.on('send_message',(data)=>{
    io.to(data.receiver_id).emit('receive_message',data)

   
  })
  socket.on('offer',(data)=>{
    io.to(data.to).emit('offer',{offer:data.offer,from:data.from})
  })
  socket.on('answer',(data)=>{
    io.to(data.to).emit('answer',{answer:data.answer,myid:data.from})
  })
socket.on('candidate',(data)=>{
  io.to(data.to).emit('candidate',{candidate:data.candidate,from:data.from})
})
socket.on('call_end',(data)=>{
  io.to(data.to).emit('call_end',{message:data.message})
})
  

  socket.on('disconnect',()=>{
    console.log(socket.id,"user disconnect")
  })
})


app.use("/auth", registerRout);
app.use('/auth',loginRout);
app.use('/auth',dashRouter)
app.use('/auth',logoutRouter)
app.use('/auth',userPostRouter)
app.use('/auth',deleteRouter)
app.use('/auth',router)
app.use('/auth',messageRouter)
app.use('/auth',getMessageRouter)
app.use('/multer', express.static('multer'))
async function testpostgrsql(){
    try {
        await pool.query('SELECT 1')
        console.log('postgrsql connect')
        server.listen(5000, "0.0.0.0", () => {
  console.log("Server running on 5000");
});
    } catch (error) {
        console.error(error)
        console.log('postgrsql didnt connect')
        process.exit(1)
    }
}
testpostgrsql()
// tomorow we will back to sockit io and webrtc 
