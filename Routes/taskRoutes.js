const express=require("express")
const router=express.Router()
const {createTask,getUserTask,getAlluser,tasksStats,updateTaskstatus}=require("../Controller/taskController")
const {onlyAdmin}=require('../Middleware/onlyAdmin')
const {verifyToken}=require("../Middleware/verifyToken")
module.exports=(io)=>{
    router.post("/create",onlyAdmin,createTask)
router.put("/status/:id",verifyToken,updateTaskstatus(io))
router.get("/get",verifyToken,getUserTask)
router.get("/getusers",onlyAdmin,getAlluser)
router.get("/stats",verifyToken,tasksStats)
return router

}





