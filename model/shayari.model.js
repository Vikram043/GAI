const mongoose=require("mongoose")

// Create a Shayari model schema
const shayariSchema=mongoose.Schema({
   content: String,
    prompt: String
   })

const Shayari = mongoose.model('Shayari',shayariSchema );

module.exports={Shayari}