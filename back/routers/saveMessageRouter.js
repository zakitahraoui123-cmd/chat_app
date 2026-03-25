import express from 'express'
import pool from '../database/postgrsql.js'

const messageRouter=express.Router()

messageRouter.post('/message',async(req,res)=>{
    const{sender_id,receiver_id,message}=req.body
    if(!sender_id||!receiver_id||!message){
        return res.status(400).json({message:'we didnt get any data'})
         } 
     try {
        console.log('we get the message from the front',req.body.sender_id)
        await pool.query('INSERT INTO user_message(sender_id,receiver_id,message) VALUES($1,$2,$3)',[sender_id,receiver_id,message])
       return res.status(200).json({message:'message saved'})
    } catch (error) {
        console.error(error)
        res.status(500).json({message:'somthing went wrong'})
    }
})


export default messageRouter;