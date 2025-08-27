const mongoose=require("mongoose")
const URL=process.env.MONGOOSE_URL

const connectDb=async()=>{
    try{
  await mongoose.connect(URL)
  console.log("Mongo db  connected successfully");
  
    }
    catch(err){
        console.log("error while connecting to db",err);
        

    }

}
module.exports={connectDb}


