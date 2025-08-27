const mongoose=require("mongoose")
const userSchema=new mongoose.Schema({
    name:{
        type:String,
        

    },
    email:{
        type:String,
        required:true,
        unique:true

    },
    password:{
        type:String,
        required:true,

    },
    role:{
        type:String,
        enum:['admin','employee','manager'],
        default:'employee'
    }
},{collection:"users",timestamps:true})
const userModel=mongoose.model("users",userSchema)
module.exports={userModel}