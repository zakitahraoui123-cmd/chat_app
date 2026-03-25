import express from 'express'
import pool from '../database/postgrsql.js'

const getMessageRouter=express.Router()
getMessageRouter.get('/getmessage/:id',async(req,res)=>{
    console.log('router hit')
const{id}=req.params
console.log(id)
if(!id){
    return res.status(400).json({message:'no id was founded'})

}
try {
const sendermessage=await pool.query('SELECT * FROM user_message WHERE sender_id=$1 OR receiver_id=$2 ORDER BY id',[id,id])
if(sendermessage.rowCount!==0){
const mymessages=sendermessage.rows
return res.status(200).json({myData:mymessages})
//here we get ouwer message tommoro fetch it and make it look in the front 
// and fix the ui and try to publish it
// then lets focus on database more
}
console.log('what we send',mymessages)
} catch (error) {
    return res.status(500).json({message:'somthing went wrong'})
}
})

export default getMessageRouter;