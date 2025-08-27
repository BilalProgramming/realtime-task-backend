const jwt=require("jsonwebtoken")
const verifyToken=(req,resp,next)=>{  
    
    const token=req.headers['authorization']?.split(" ")[1]
    
    if(!token){
        return resp.status(401).json({status:false,message:"No token provided"})
    }
   
  
   try{
    const decoded=jwt.verify(token,process.env.SECRET_KEY)
    
    if(!decoded){
        return resp.status(401).json({status:false,message:"unauthorized"})
    }
    req.user=decoded
   return next()
   }
   catch(err){
    if (err.name === "TokenExpiredError") {
        return resp.status(401).json({ status: false, message: "session expired.Login again to continue" });
    }
    return resp.status(401).json({status:false,message:"unauthorized",error:err.message})

   }

}
module.exports={verifyToken}