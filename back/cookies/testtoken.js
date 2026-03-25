// import Dotenv from "dotenv"
// import jwt from "jsonwebtoken"
// Dotenv.config();

// function verfyToken(req,res,next) {
//     const token = req.cookies?.token
//     console.log(token)
//     if (!token) {
//         return res.status(401).json({ message: 'No token provided' })
//     }

//     try {
//         const decode = jwt.verify(token, process.env.JWT_SECRET)
//         req.user = decode  
//         next()
//     } catch (error) {
//         return res.status(403).json({ message: 'Invalid or expired token' })
//     }
// }

// export default verfyToken