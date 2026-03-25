import express from 'express'

const logoutRouter=express.Router()

logoutRouter.post('/logout',(req,res)=>{
    res.clearCookie('token',{
        httpOnly:true,
        sameSite:'lax'
    })

    res.status(200).json({message:'Logout ok'})
})

export default logoutRouter;