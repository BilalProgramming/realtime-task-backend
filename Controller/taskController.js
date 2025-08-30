const asyncHandler=require("express-async-handler")
const {taskModel}=require("../Models/Task")
const { userModel } = require("../Models/User")
const cache=new Map()


const createTask=(io)=>asyncHandler(async(req,resp)=>{
   try{
    const user=req.user
  const {title,description,id}=req.body
  
  if(!title ||!description || !id){
    return resp.status(422).json({status:false,message:"Please provide all fields"})
  }  
  const userData=await userModel.findById(id)
  // task not assign to admin
  if(userData.role ==="admin"){
    return resp.status(404).json({status:false,message:"Task cannot assign to admin"})

  }
  if(userData.role==="manager" && user.role==="manager"){
    return resp.status(403).json({status:false,message:"you cannot assign task to Manager"})

  }
  
   const newTask=await taskModel.create({
    title,description,assignedToUserId:id
   })
   //notify specific user
   io.to(id).emit('taskCreated',newTask)
   console.log('emit taskcreated event for user',id);
   
   return resp.status(201).json({status:true,message:"Task created successfully",data:newTask})


   }
   catch(err){
    return resp.status(500).json({status:false,message:"failed to  created task",error:err.message})

   }

})

const getUserTask=asyncHandler(async(req,resp)=>{
    try{
        const id=req.query.id
        const user=req.user
        const email=user.email
        //admin can view all users taks via id
        if(user.role==="admin" || user.role==="manager" &&id){
            const tasks=await taskModel.find({assignedToUserId:id})
            return resp.status(200).json({status:true,message:"Task retrieved successfully",data:tasks})

        }
        
        
        const userData=await userModel.findOne({email})
        console.log("userData",userData);
        
        const assignedToUserId=userData._id
        if(!userData){
            return resp.status(404).json({status:false,message:"user not found"})

        }
        const userTasks=await taskModel.find({assignedToUserId})
        if(userTasks.length===0){
            return resp.status(404).json({status:false,message:"task not found"})

        }
                    return resp.status(200).json({status:true,message:"task retrieved successfuly",data:userTasks})

    
        


    }
    catch(err){
        return resp.status(500).json({status:false,message:"fail to  get task",error:err.message})

    }
})
const getAlluser=asyncHandler(async(req,resp)=>{
    try{ 
     if(cache.has('users')){
        
        return resp.status(200).json({status:true,message:"users retrived successfully from cache",data:cache.get('users')})

     } 
    const allUsers=await userModel.find()
    if(!allUsers){
        return resp.status(404).json({status:false,message:"users not found"})
    }
    cache.set('users',allUsers)
    return resp.status(200).json({status:true,message:"users retrived successfully from  db",data:allUsers})


    }catch(err){
        return resp.status(500).json({status:false,message:"Failed to retrived users"})


    }

})
const tasksStats=asyncHandler(async(req,resp)=>{
    try{
        const user=req.user
        
        const userId=user.id
        //for user
        if(user.role!=="admin" && user.role!=="manager"){
            const tasks=await taskModel.find({assignedToUserId:userId})
            if(!tasks){
            return resp.status(404).json({status:false,message:"Task not found"})
        }  
        // let pendingTasks=0;
       const  pendingTasks= tasks.filter(task=> task.status==="pending")
       const completedTasks=tasks.filter(task=>task.status==="completed")
       const totalTasks=tasks.length
        const totalPendingTask=pendingTasks.length
        const totalCompletedTask=completedTasks.length
        const data={
            totalTasks,
            totalPendingTask,
            totalCompletedTask

        }
        
        return resp.status(200).json({status:true,message:"tasks stats retrived successfully",data})
        }
        //for admin or manager

        const tasks=await taskModel.find()
        if(!tasks){
            return resp.status(404).json({status:false,message:"Task not found"})
        }  
        const pendingTasks=tasks.filter(task=>task.status==="pending")
        const completedTask=tasks.filter(task=>task.status==="completed")
        const totalTasks=tasks.length
        const totalPendingTask=pendingTasks.length
        const totalCompletedTask=completedTask.length
        const  tasksPerUser=await taskModel.aggregate([
             // Group tasks by the assigned user's ID
            {
            $group:{
                _id:"$assignedToUserId",
                count:{$sum:1}
            }
            },
             // Populate the user details using the user ID
             {
                $lookup:{
                    from:"users",
                    localField:"_id",
                    foreignField:"_id",
                    as:"user"
                }
             },
               // Unwind the populated user array
               {
                $unwind:"$user"
               },
               // Final projection to format the output as "user" and "count
               {
                $project:{
                    _id:0,
                    id:"$user._id",
                    user:"$user.name",
                    count:"$count"
                }
               }

        ])
          
        const data={
            totalTasks,
            totalPendingTask,
            totalCompletedTask,
            tasksPerUser

        }
        
        return resp.status(200).json({status:true,message:"tasks stats retrived successfully",data})
        
    }
    catch(err){
        console.log(err);
        
        return resp.status(500).json({status:false,message:"Failed to retrived task"})

    }
    

})

const updateTaskstatus=(io)=>asyncHandler(async(req,resp)=>{
    try{
        
        const user=req.user
        const id=req.params.id
        
        //user update only own task
        const tasks=await taskModel.findById(id) 
        if(user.role!=="admin" && user.role!=="manager"){
            
            if(tasks.assignedToUserId.toString()!==user.id){
                    return resp.status(401).json({status:false,message:"Forbidden"})
            }
           if(tasks.status==="completed"){
            return resp.status(422).json({status:true,message:"Task is already completed"})
           }
           tasks.status="completed"
          const result= await tasks.save()  
             // After successful update, emit a socket event
            //  console.log("Emitting 'taskUpdated' event to aspecific user: done", result); 
                        
             // Notify the specific user
             io.to(user.id).emit('taskUpdated',result)
            // Notify the admin and manager room
            // console.log("Emitting 'taskUpdated' event to admin: done", result); 

             io.to('admin').emit('adminTaskUpdated',result)
            
            return resp.status(200).json({status:true,message:"Task update successfully",data:result})
        }
        //admin and manager can update of all tasks status
        if(tasks.status==="completed"){
            return resp.status(422).json({status:true,message:"Task is already completed"})
           }
           tasks.status="completed"
           const result= await tasks.save() 
           console.log("Emitting 'adminTaskUpdated' to 'admin' room:", result);
           io.to('admin').emit('adminTaskUpdated',result)    
           const assignedUserId=tasks.assignedToUserId.toString() 
           console.log("Emitting 'taskUpdated' to 'user' room:", result);
           io.to(assignedUserId).emit('taskUpdated',result)  
             return resp.status(200).json({status:true,message:"Task update successfully",data:result})
    }
    catch(err){
        console.log(err);
        
        return resp.status(500).json({status:false,message:"Failed to update task status"})
    }


})

module.exports={createTask,getUserTask,getAlluser,tasksStats,updateTaskstatus}