const express= require('express')
const cors=require("cors")
const { Configuration, OpenAIApi }= require('openai')
const rateLimit=require("express-rate-limit")
const { Shayari } = require('./model/shayari.model')
const { connection } = require('./config/config')
require('dotenv').config()


const configuration = new Configuration({
apiKey: process.env.OPEN_API_KEY
});

const openai = new OpenAIApi(configuration);

const app = express()

const limiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // 100 requests per minute
});

app.use(limiter);
app.use(cors())
app.use(express.json())

app.get('/', async (req, res) => {
  res.status(200).send({
    message: 'Hello from Vikram'
  })
})

app.post('/', async (req, res) => {
  try {
    const prompt = req.body.prompt;

    // Check if Shayari exists in MongoDB
    const existingShayari = await Shayari.findOne({ prompt });
    if (existingShayari) {
      return res.status(200).send({
        bot: existingShayari.content,
      });
    }

    const response = await makeRequestWithRetry(async () => {
      return await openai.createCompletion({
        model: "text-davinci-003",
        prompt: `write a shayari on ${prompt}`,
        temperature: 0,
        max_tokens: 100,
        top_p: 1,
        frequency_penalty: 0.5,
        presence_penalty: 0,
      });
    });

    const newShayariText = response.data.choices[0].text;
    
    // Save new Shayari to MongoDB
    const newShayari = new Shayari({ content: newShayariText, prompt });
    await newShayari.save();

    res.status(200).send({
      bot: newShayariText,
    });

  } catch (error) {
    console.error(error);
    res.status(500).send(error || 'Something went wrong');
  }
});



const makeRequestWithRetry = async (requestFunction, retries = 3, delay = 1000) => {
  try {
    return await requestFunction();
  } catch (error) {
    if (retries > 0 && error.response && error.response.status === 429) {
      console.warn('Rate limited. Retrying in ' + delay + 'ms...');
      await new Promise((resolve) => setTimeout(resolve, delay));
      return makeRequestWithRetry(requestFunction, retries - 1, delay * 2);
    } else {
      throw error;
    }
  }
};

const port=process.env.PORT || 3001

app.listen(port, async() =>{
  try {
    await connection
    console.log(`AI server started on port :${port} `)
  } catch (error) {
    console.log(error.message)
  }
})