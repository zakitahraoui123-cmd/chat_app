import express, { raw } from 'express'
import bcrypt from 'bcrypt';
import pool from '../database/postgrsql.js';
// import jwt from 'jsonwebtoken'
import Dotenv from "dotenv";

Dotenv.config();

const loginRout=express.Router()
loginRout.post('/login',async(req, res) => {
  const { user_number,user_password } = req.body;
  if(!user_number||!user_password){
    return res.status(400).json({message:'id or password not found'})
  }
  try {
const user = await pool.query(
`SELECT 
user_info.first_name,
user_info.id,
user_info.password,
profile_picture.avatar
FROM user_info
LEFT JOIN profile_picture 
ON profile_picture.user_id = user_info.id
WHERE user_info.user_number = $1`,
[user_number]
);
if(user.rowCount===0){
        return res.status(403).json({message:'user was not found'})
    } 
const db_user= user.rows[0]
const comparpassword=await bcrypt.compare(user_password,db_user.password)
if(comparpassword===true){
  
    res.status(200).json({
    message:'user correct',
    userName:db_user.first_name,
    userId:db_user.id,
    image:db_user.avatar
    })
 
}else {
    res.status(400).json({message:'user not allwod'})
}
    
    
  } catch (error) {
    res.status(500).json({message:'somthing went wrong'})
  }
 
});

export default loginRout;