const mongoose=require("mongoose")
const taskSchema=new mongoose.Schema({
    assignedToUserId:{
    type:mongoose.Schema.Types.ObjectId,
    ref:"users",
    required:true,
    index:true
    },
    title:{
        type:String,
        required:true
    },
    description:{
        type:String,
        required:true,

    },
    status:{
        type:String,
        enum:['completed','pending'],
        default:'pending',
        index:true
    }
},{collection:"tasks",timestamps:true})
const taskModel=mongoose.model("tasks",taskSchema)
module.exports={taskModel}