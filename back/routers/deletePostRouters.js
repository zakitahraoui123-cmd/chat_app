import express from 'express'
import pool from '../database/postgrsql.js';

const deleteRouter=express.Router();
deleteRouter.delete('/dropAvatar/:id',async(req,res)=>{
if(req.params){
    const id=req.params.id
    try {
       await pool.query("SELECT delete_avatar($1)",[id]);
       return res.status(200).json({message:'the avatar has been deleted'}) 
    } catch (error) {
        res.status(500).json({message:'somthing went wrong'})
    }
}
    
})

export default deleteRouter;