const mongoose=require('mongoose')
require('dotenv').config()
// Connect to MongoDB
const connection=mongoose.connect(process.env.MONGO_URL, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});


module.exports={connection}