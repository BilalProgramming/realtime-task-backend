const jwt=require("jsonwebtoken")
const onlyAdmin=(req,resp,next)=>{
    
    const token=req.headers['authorization']?.split(" ")[1]
    
    if(!token){
        return resp.status(401).json({status:false,message:"No token provided"})
    }
  
   try{
    const decoded=jwt.verify(token,process.env.SECRET_KEY)
    
    if(decoded.role!=="admin" && decoded.role!=="manager"){
        return resp.status(401).json({status:false,message:"only admin and manager can access this routes"})
    }
    req.user=decoded
   return next()
   }
   catch(err){
    return resp.status(401).json({status:false,message:"unauthorized",error:err.message})

   }

}
module.exports={onlyAdmin}