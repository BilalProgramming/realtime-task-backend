const asyncHandler=require("express-async-handler")
const {userModel}=require("../Models/User")
const bcrypt=require("bcryptjs")
const jwt=require("jsonwebtoken")
const axios=require("axios")
const QUOTE_API=process.env.QUOTE_API_KEY
const getQuote=async()=>{
    try{
        const response=await axios.get(QUOTE_API)
        console.log("response",response.data.fact);
        
        return response.data.fact

    }
    catch(err){
    console.log("failed to ftech queotes");
    

    }
}
const userSignup=asyncHandler(async(req,resp)=>{
    try{
        const {name,email,password}=req?.body
        console.log("api hit");
        
        if(!name || !email || !password){
            return resp.status(422).json({status:false,message:"Please provide all fields"})
        }
        if(name.length<=5){
            return resp.status(422).json({status:false,message:"Name must be Atleast 5 chnaracters"})

        }
        if(!email.includes('@')){
            return resp.status(422).json({status:false,message:"Invalid Email"})
        }
        const existingUser=await userModel.findOne({email})
        if(existingUser){
            return resp.status(422).json({status:false,message:"Email Already Exist"})

        }
        const hashPassword=await bcrypt.hash(password,10)

        const newUser=await userModel.create({
            name,email,
            password:hashPassword
        })        
        return resp.status(200).json({status:true,data:newUser,message:"user register successfully"})


       
    }
    catch(err){
        return resp.status(500).json({status:false,message:"Failed to sign up"})

    }
   

})
const userLogin=asyncHandler(async(req,resp)=>{
 try{
    const {email,password}=req?.body
    if(!email || !password){
        return resp.status(422).json({status:false,message:"Please provide all fields"})
    }
    const userData=await userModel.findOne({email})
    if(!userData){
        return resp.status(404).json({status:false,message:"user not found"})

    }
    const isPassword=await bcrypt.compare(password,userData.password)
    if(!isPassword){
        return resp.status(422).json({status:false,message:"Invalid crendentials"})

    }
  
    const token=jwt.sign({email,role:userData.role,id:userData._id},process.env.SECRET_KEY,{'expiresIn':"7d"})
    const quoteOfDay=await getQuote()
    console.log("quoteOfDay",quoteOfDay);
    

    const userWithoutPassword={
        id:userData._id,
        name:userData.name,
        email:userData.email,
        role:userData.role,
        quoteOfDay
    }
    
    return resp.status(200).json({status:true,message:"login successfully",data:userWithoutPassword,token})
 }catch(err){
    console.log("error",err);
    
    return resp.status(500).json({status:false,message:"Failed to login"})

 }


})


module.exports={userSignup,userLogin}