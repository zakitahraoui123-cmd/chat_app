import express from 'express'
import bcrypt from 'bcrypt';
import pool from '../database/postgrsql.js';

const registerRout=express.Router()
registerRout.post('/register',async(req, res) => {
  const { user_number, user_name, user_password } = req.body;

  if (user_number && user_name && user_password) {
    const hashcryptpassword=await bcrypt.hash(user_password,10)
    await pool.query(
        'INSERT INTO user_info(first_name,user_number,password) VALUES ($1,$2,$3)',
        [user_name,user_number,hashcryptpassword]
    )
    res.status(200).json({ message: 'User registered successfully' });
  } else {
    res.status(400).json({ message: 'Missing fields' });
  }
});

export default registerRout;