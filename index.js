const express = require("express");
const app = express();
const mysql = require('mysql2');
const cors = require('cors');
const bodyParser = require('body-parser')
const session = require("express-session");
const cookieParser = require('cookie-parser');
const axios = require("axios");
const util = require('util');
const bcrypt = require("bcrypt");
const saltRounds = 5;
const multer = require('multer')
const ytdl = require("@distube/ytdl-core");
const fs = require('fs');
const { Readable } = require('stream');
const { unlink } = require('node:fs');

const storage = multer.memoryStorage()
const upload = multer({ storage: storage })
const apiKey = ""        
const OpenAI  = require('openai');
const openai = new OpenAI({apiKey: apiKey});
let count = 0;

// database connection
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'password',
  database: 'cookbook'
});

const query = util.promisify(db.query).bind(db);

app.listen(30015, ()=> {console.log(`Server started on port 30015`)});
app.use(bodyParser.urlencoded({extended: true}))
app.use(cookieParser());
app.use(express.json())
app.use(cors({origin: ["http://localhost:3000"], methods: ["GET", "POST"], credentials: true}))
app.use(session({key: "userLogin", secret: "rfr4rtu43yrhfkiuh4r343wyhr4hri7432yrwefjnixzbclaidscxcnvedhj", resave: false, saveUninitialized: false, cookie: {expires: (60*60*24*60)}}))

// get session if it exists
app.get("/login", (req, res)=>{
    res.send({user: req.session.user})
})

// login
app.post("/login", (req, res)=>{
  const username = req.body.username;
  const password = req.body.password;

  if (!req.body.googleLogin){
    db.query("select * from login where binary username = ? and password is not null", [username, password], (err, result) => {
      if(err){console.log(err)}

      if (result.length > 0){
  
        bcrypt.compare(password, result[0].password, (err, response)=>{
          if (err){console.log(err)}
    
          if (response){
    
            req.session.user = result[0];
            res.send({user: result[0]})
          }
    
          else{
            res.send("Wrong combo")
          }
        })
      }
  
      else{
        res.send("Wrong username")
      }
    })
  }

  else{
    db.query("select * from login where binary username = ? and password is null", [username], (err, result) => {
      if (result.length > 0){
        req.session.user = result[0];
        res.send({user: {...result[0]}})
      }
  
      else{
        axios.post("http://localhost:30015/signup", {username: username}).then((response) => {
          req.session.user = response.data.user;
          res.send({user: response.data.user})
        })
      }
    })
  }
})

// sign up if no account
app.post("/signup", (req, res)=>{
  const username = req.body.username;
  const password = req.body.password;

  // check whether username already exists
  db.query("select userId from login where binary username = ? and password is not null", [username], async (err, result)=>{
    if (err){console.log(err)}

    if (result.length == 0){

      let hash = null;
      
      // encrypt password
      if (password){
        hash = await bcrypt.hash(password, saltRounds);
      }

      // add encrypted password to database
      db.query("insert into login(username, password) values(?, ?)", [username, hash], (err, result)=>{
        if (err){console.log(err)}

        // create session for user and send userId
        req.session.user = {userId: result.insertId, username: username};
        res.send({user: {userId: result.insertId, username: username}})
      })
    }

    else{
      res.send("username in use")
    }
  })
})

// signout of session
app.post("/signout", (req, res)=>{
  req.session.user = null;
  res.send("ok")
})

// get recipes made by user
app.post("/getRecipes", (req, res)=>{
  const userId = req.body.userId;

  db.query("select * from recipes where userId = ?", [userId], (err, result) => {
    if (err){console.log(err)}

    else{
      res.send({recipes: result});
    }
  })
})

// change user password
app.post("/changePassword", (req, res)=>{
  const userId = req.body.userId;
  const currentPass = req.body.currentPass;
  const newPass = req.body.newPass;

  db.query("select password from login where userId = ?", [userId], (err, result) => {
    if (err){console.log(err)}

    bcrypt.compare(currentPass, result[0].password, async (err, response)=>{
      if (err){console.log(err)}

      if (response){
        let hash = await bcrypt.hash(newPass, saltRounds);
        
        db.query("update login set password = ? where userId = ?", [hash, userId], (err, result) => {
          if (err){console.log(err)}
      
          res.send({recipes: result});
        })
      }

      else{
        res.send("Wrong password")
      }
    })
  })
})

// add recipe info to database
app.post("/createRecipe", (req, res)=>{
  const userId = req.body.userId;
  const name = req.body.name;
  const notes = req.body.notes;
  const duration = req.body.duration;
  const cuisine = req.body.cuisine;
  const ingredients = req.body.ingredients;
  const instructions = req.body.instructions;

  db.query("insert into recipes (userId, name, notes, duration, cuisine) values(?, ?, ?, ?, ?)", [userId, name, notes, duration, cuisine], async (err, result) => {
    if (err){console.log(err)}

    else{
      let recipeId = result.insertId

      for (let i = 0; i < ingredients.length; i++) {
        await query("insert into ingredients (recipeId, ingredientName, amount, unit, notes) values(?, ?, ?, ?, ?)", [recipeId, ingredients[i].ingredientName,  ingredients[i].amount ? ingredients[i].amount : null,  ingredients[i].unit ? ingredients[i].unit : null, ingredients[i].notes]);
      }

      for (let i = 0; i < instructions.length; i++) {
        await query("insert into instructions (recipeId, instruction, notes, step) values(?, ?, ?, ?)", [recipeId, instructions[i].instruction, instructions[i].notes, instructions[i].step]);
      }

      res.send("ok")
    }
  })
})

// get info on one recipe
app.post("/getRecipeInfo", (req, res)=>{
  const recipeId = req.body.recipeId;

  db.query("select * from recipes where recipeId = ? order by duration asc", [recipeId], async (err, result) => {
    if (err){console.log(err)}

    else{
      if (result[0]){
        const ingredients = await query("select * from ingredients where recipeId = ?", [recipeId]);
        const instructions = await query("select * from instructions where recipeId = ? order by step asc", [recipeId]);
        res.send({recipeInfo: result[0], ingredients: ingredients, instructions: instructions})
      }
      else{
        res.send("Recipe not found");
      }
    }
  })
})

// edit recipe in database
app.post("/editRecipe", (req, res)=>{
  const userId = req.body.userId;
  const name = req.body.name;
  const notes = req.body.notes;
  const duration = req.body.duration;
  const cuisine = req.body.cuisine;
  const ingredients = req.body.ingredients;
  const instructions = req.body.instructions;
  const deletedInstructions = req.body.deletedInstructions;
  const deletedIngredients = req.body.deletedIngredients;
  const recipeId = req.body.recipeId;

  // check whether user has permissions to edit recipe
  db.query("select * from recipes where recipeId = ?", [recipeId], async (err, result) => {
    if (err){console.log(err)}

    else{
      if (result[0]){
        if (result[0].userId == userId){
          db.query("update recipes set name = ?, notes = ?, duration = ?, cuisine = ? where recipeId = ?", [name, notes, duration, cuisine, recipeId], async (err, result) => {
            if (err){console.log(err)}
        
            else{
              
              // insert or update ingredients and instructions into database based on whether an ID exists
              for (let i = 0; i < ingredients.length; i++) {
                if (!ingredients[i].ingredientId){
                  await query("insert into ingredients (recipeId, ingredientName, amount, unit, notes) values(?, ?, ?, ?, ?)", [recipeId, ingredients[i].ingredientName,  ingredients[i].amount ? ingredients[i].amount : null,  ingredients[i].unit ? ingredients[i].unit : null, ingredients[i].notes]);
                }
                else{
                  await query("update ingredients set ingredientName = ?, amount = ?, unit = ?, notes = ? where ingredientId = ?", [ingredients[i].ingredientName,  ingredients[i].amount ? ingredients[i].amount : null,  ingredients[i].unit ? ingredients[i].unit : null, ingredients[i].notes, ingredients[i].ingredientId]);
                }
              }
        
              for (let i = 0; i < instructions.length; i++) {
                if (!instructions[i].instructionId){
                  await query("insert into instructions (recipeId, instruction, notes, step) values(?, ?, ?, ?)", [recipeId, instructions[i].instruction, instructions[i].notes, i + 1]);
                }
                else{
                  await query("update instructions set instruction = ?, notes = ?, step = ? where instructionId = ?", [instructions[i].instruction,  instructions[i].notes,  i + 1, instructions[i].instructionId]);
                }
              }


              // remove deleted ingredients and instructions from database based on IDs
              for (let i = 0; i < deletedIngredients.length; i++) {
                await query("delete from ingredients where ingredientId = ?", [deletedIngredients[i]]);
              }   
              
              for (let i = 0; i < deletedInstructions.length; i++) {
                await query("delete from instructions where instructionId = ?", [deletedInstructions[i]]);
              }     
              

              res.send("ok")
        
            }
          })
        }
        else{
          res.send("Unauthorized access");
        }
      }
      else{
        res.send("Recipe not found");
      }
    }
  })
})

// search for recipes matching query
app.post("/getSearchResults", async (req, res)=>{
  // const userId = req.body.userId;
  const userQuery = req.body.query;
  let keyWords = []
  let searchResults = []
  let tries = 0;
  
  // use AI to generate related key words to check database for
  while (true){
    console.log(tries)
    tries += 1;
    if (tries == 5){
      console.log("Error generating key words")
      break;
    }
    try{
      let jsonGood = true;
      // generate keywords
      console.log(`Generate keywords relating to ${userQuery}`)
      const content = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [{role: "system", content: `given a query, create an array of related key words related to foods, recipes, durations, ingredients
         etc and return it in the JSON format {keyWords: [keyWords]}. Case sensitive and
         response must be valid JSON using the exact same key as example. If it is a duration, return it in minutes. For example, if 1 hour as 60 minutes. `}, 
        {role: "user", content: `Generate keywords relating to ${userQuery}`}],
      });

      // check if the proper key is present
      let jsonContent = JSON.parse(content.choices[0].message.content);
      console.log(jsonContent)

      if (!jsonContent.keyWords){
        if (!jsonContent.KeyWords){
          if (!jsonContent.keywords){
            jsonGood = false
          }
          else{
            jsonContent.keyWords = jsonContent.keywords
          }
        }
        else{
          jsonContent.keyWords = jsonContent.KeyWords
        }
      }
      
      if(jsonGood){
        keyWords = jsonContent.keyWords;
        break;
      }
    }
    catch (error){console.log(error);}
  }
  keyWords.push(userQuery)

  // search database using query and AI generated related keywords
  for (let k = 0; k < keyWords.length; k++) {

    // search recipes table 
    let result1 = await query(`select * from recipes where ((instr(?, notes) > 0 or instr(notes, ?) > 0) and notes != "" or instr(?, name) > 0 or instr(name, ?) > 0 or 
    instr(?, convert(duration, char)) > 0 or instr(convert(duration, char), ?) > 0 or instr(?, cuisine) > 0 or instr(cuisine, ?) > 0 ) order by recipeId asc`, 
    [keyWords[k], keyWords[k], keyWords[k], keyWords[k], keyWords[k], keyWords[k],  keyWords[k], keyWords[k]]);

    // search ingredients table
    let result2 = await query(`select distinct recipes.*, count(ingredients.ingredientId) from recipes inner join ingredients on recipes.recipeId = ingredients.recipeId where 
    ((instr(?, ingredients.notes) > 0 or instr(ingredients.notes, ?) > 0) and ingredients.notes != "" or instr(?, ingredients.ingredientName) > 0 or instr(ingredients.ingredientName, ?) > 0)  
    group by recipes.recipeId order by recipes.recipeId asc`, [keyWords[k], keyWords[k], keyWords[k], keyWords[k]])

    // check for any duplicates in arrays and merge into one array
    for (let i = 0; i < result2.length; i++) {
      for (let y = 0; y < result1.length; y++) {
        if (result1[y].recipeId == result2[i].recipeId){
          break
        }
        if (result1[y].recipeId > result2[i].recipeId || y == result1.length - 1){
          result1.push(result2[i])
          break
        }
      }
      if (result1.length == 0){
        result1 = result2;
      }
    }

    for (let i = 0; i < result1.length; i++) {
      for (let y = 0; y < searchResults.length; y++) {
        if (searchResults[y].recipeId == result1[i].recipeId){
          break
        }
        if (searchResults[y].recipeId > result1[i].recipeId || y == searchResults.length - 1){
          searchResults.splice(y, 0, result1[i])
          break
        }
      }
      if (searchResults.length == 0){
        searchResults = result1;
      }
    }
  }

  // sort and filter results using AI
  tries = 0;
  while (true){
    console.log(tries)
    tries += 1;
    if (tries == 5){
      console.log("Error filtering search results")
      break;
    }
    try{
      let jsonGood = true;
      
      // filter search results
      console.log(`Given the query ${userQuery} and the array ${searchResults}, return the most relevant elements sorted based on relevancy.`)
      const content = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [{role: "system", content: `Given a query and an array of recipes, return an array sorted based on how relevant it is to the query and remove elements 
          that don't match the query in the JSON format {array: [...elements]}. Make sure to give PROPER JSON and follow the format. Also make sure the element info are the 
          same as the input.`}, 
        {role: "user", content: `Given the query ${userQuery} and the array ${JSON.stringify(searchResults)}, return the most relevant elements sorted based on relevancy.`}],
      });

      // check if the proper key is present
      let jsonContent = JSON.parse(content.choices[0].message.content);
      console.log(jsonContent)

      if (!jsonContent.array){
        if (!jsonContent.Array){
          jsonGood = false
        }
        else{
          jsonContent.array = jsonContent.Array
        }
      }
      
      // convert to json and send to front end
      if(jsonGood){
        res.send({recipes: jsonContent.array})
        break;
      }
    }
    catch (error){console.log(error);}
  }
})

// get user info for profile using userId
app.post("/getUserInfo", (req, res)=>{
  const userId = req.body.userId;

  db.query("select * from login where userId = ?", [userId], async (err, result) => {
    if (err){console.log(err)}

    else{
      res.send({userInfo: result[0]});
    }
  })
})

// update user display mode in database
app.post("/setUserDisplay", (req, res)=>{
  const userId = req.body.userId;
  const display = req.body.display;

  db.query("update login set display = ? where userId = ?", [display, userId], async (err, result) => {
    if (err){console.log(err)}

    else{
      res.send("ok");
    }
  })
})

// delete recipe from database
app.post("/deleteRecipe", (req, res)=>{
  const userId = req.body.userId;
  const recipeId = req.body.recipeId;

  db.query("select recipeId from recipes where userId = ? and recipeId = ?", [userId, recipeId], async (err, result) => {
    if (err){console.log(err)}

    else if(result.length > 0){
      await query("delete from ingredients where recipeId = ?", [recipeId]);
      await query("delete from instructions where recipeId = ?", [recipeId]);
      await query("delete from recipes where recipeId = ?", [recipeId]);
      res.send("ok")
    }
    else{
      res.send("Unauthorized access")
    }
  })
})

// scrape website for recipe
app.post("/scrapeWebsite", async (req, res)=>{
  const recipeLink = req.body.recipeLink;
  let tries = 0;
  
  while (true){
    console.log(tries)
    tries += 1;
    if (tries == 5){
      res.send({"error":"Error generating recipe, please try again later"});
      break;
    }
    try{
      let jsonGood = true;
      // get recipe info from website
      const content = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [{role: "system", content: `Search a website for recipe info and return the info in the JSON format {name: max 100 characters, duration: int minutes, cuisine: 
        max 100 characters, notes: optional max 2000 characters, ingredients: [{ingredientName: max 500 characters, amount: no fractions only decimal(20,2) , 
        unit: max 50 characters, notes: max 1000 characters}], instructions: [{instruction: max 5000 characters, notes: max 2000 characters, step: instruction step number}]}}, 
        all keys should be the same as example and be valid JSON, no fractions. If there is no recipe info in the website, or you cannot get complete recipe 
        information, return the error message in the JSON format {error: shortErrorMessage}. 
        Only ever give JSON and use the exact same keys as the example (case-sensitive)`}, 
        {role: "user", content: `Give recipe information from ${recipeLink}`}],
      });

      // check if all the proper keys are present
      let jsonContent = JSON.parse(content.choices[0].message.content);
      console.log(jsonContent)
      if (!jsonContent.error && !jsonContent.Error){

        if (!jsonContent.name){
          if(jsonContent.Name){
            jsonContent.name = jsonContent.Name;
          }
          else{
            console.log("name")
            continue;
          }
        }

        if (!jsonContent.ingredients){
          if(jsonContent.Ingredients){
            jsonContent.ingredients = jsonContent.Ingredients;
          }
          else{
            console.log("ingredients")
            continue;
          }
        }

        if (!jsonContent.instructions){
          if(jsonContent.Instructions){
            jsonContent.instructions = jsonContent.Instructions;
          }
          else{
            console.log("instructions")
            continue;
          }
        }

        for (let i = 0; i < jsonContent.ingredients.length; i++) {
          if (!jsonContent.ingredients[i].ingredientName){
            if(jsonContent.ingredients[i].IngredientName){
              jsonContent.ingredients[i].ingredientName = jsonContent.ingredients[i].IngredientName;
            }
            else{
              console.log("ingredients ingredientName")
              jsonGood = false;
            }
          }
        }

        for (let i = 0; i < jsonContent.instructions.length; i++) {
          if (!jsonContent.instructions[i].instruction){
            if(jsonContent.ingredients[i].Instruction){
              jsonContent.ingredients[i].instruction = jsonContent.ingredients[i].Instruction;
            }
            else{
              console.log("instructions instruction")
              jsonGood = false;
            }
          }

          if (!jsonContent.instructions[i].step){
            if(jsonContent.ingredients[i].Step){
              jsonContent.ingredients[i].step = jsonContent.ingredients[i].Step;
            }
            else{
              console.log("instructions steps")
              jsonGood = false;
            }
          }
        }
      }

      else if(jsonContent.Error){
        jsonContent.error = jsonContent.Error;
      }
      else if(!jsonContent.error){
        console.log("error error")
        continue;
      }

      // convert to json and send to front end
      if(jsonGood){
        res.send({recipe: jsonContent});
        break;
      }
    }
    catch (error){console.log(error);}
  }
})

// generate a new recipe given query
app.post("/generateRecipe", async (req, res)=>{
  const generatedRecipeQuery = req.body.generatedRecipeQuery;
  const currRecipe = req.body.currRecipe;
  let tries = 0;

  while (true){
    console.log(tries)
    tries += 1;
    if (tries == 5){
      res.send({"error":"Error generating recipe, please try again later"});
      break;
    }
    try{
      let jsonGood = true;
      // generate recipe
      console.log(`Generate a recipe ${"relating to " + generatedRecipeQuery} based on ${JSON.stringify(currRecipe)} \n`)
      const content = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [{role: "system", content: `Based on a JSON info of a recipe generate a recipe return in the JSON format {name: max 100 characters, duration: int minutes,
        cuisine: max 100 characters, notes: optional max 2000 characters, ingredients: [{ingredientName: max 500 characters, amount: no fractions only decimal(20,2) , 
        unit: max 50 characters, notes: max 1000 characters}], instructions: [{instruction: max 5000 characters, notes: max 2000 characters, step: instruction step number}] 
        REQUIRED, include all necessary instructions to make dish (detailed)}}, all keys should be the same as example and be valid JSON, no fractions.  
        Only ever give JSON and use the exact same keys as the example (case-sensitive) and make sure all fields are filled out and a proper new recipe is created with 
        ingredients (can add more or remove), INSTRUCTIONS (REQUIRED), and other blank information`}, 
        {role: "user", content: `Generate a recipe ${generatedRecipeQuery} fill out this ${JSON.stringify(currRecipe)}`}],
      });

      // check if all the proper keys are present
      let jsonContent = JSON.parse(content.choices[0].message.content);
      console.log(jsonContent)
      if (!jsonContent.error && !jsonContent.Error){

        if (!jsonContent.name){
          if(jsonContent.Name){
            jsonContent.name = jsonContent.Name;
          }
          else{
            console.log("name")
            continue;
          }
        }

        if (!jsonContent.ingredients){
          if(jsonContent.Ingredients){
            jsonContent.ingredients = jsonContent.Ingredients;
          }
          else{
            console.log("ingredients")
            continue;
          }
        }

        if (!jsonContent.instructions){
          if(jsonContent.Instructions){
            jsonContent.instructions = jsonContent.Instructions;
          }
          else{
            console.log("instructions")
            continue;
          }
        }

        for (let i = 0; i < jsonContent.ingredients.length; i++) {
          if (!jsonContent.ingredients[i].ingredientName){
            if(jsonContent.ingredients[i].IngredientName){
              jsonContent.ingredients[i].ingredientName = jsonContent.ingredients[i].IngredientName;
            }
            else{
              console.log("ingredients ingredientName")
              jsonGood = false;
            }
          }
        }

        for (let i = 0; i < jsonContent.instructions.length; i++) {
          if (!jsonContent.instructions[i].instruction){
            if(jsonContent.ingredients[i].Instruction){
              jsonContent.ingredients[i].instruction = jsonContent.ingredients[i].Instruction;
            }
            else{
              console.log("instructions instruction")
              jsonGood = false;
            }
          }
          if (!jsonContent.instructions[i].step){
            if(jsonContent.ingredients[i].Step){
              jsonContent.ingredients[i].step = jsonContent.ingredients[i].Step;
            }
            else{
              console.log("instructions steps")
              jsonGood = false;
            }
          }
        }
      }

      else if(jsonContent.Error){
        jsonContent.error = jsonContent.Error;
      }
      else if(!jsonContent.error){
        console.log("error error")
        continue;
      }

      // convert to json and send to front end
      if(jsonGood){
        res.send({recipe: jsonContent});
        break;
      }
    }
    catch (error){console.log(error);}
  }
})

app.post("/scrapeVideo",  upload.single("file"), async (req, res)=>{
  const recipeVideoLink = req.body.recipeVideoLink;
  const recipeVideo = req.file;
  let videoName;

  if(recipeVideoLink){
    videoName = count + '.mp3';
    count += 1;
    if (ytdl.validateURL(recipeVideoLink)) {
      const stream = ytdl(recipeVideoLink,  {
        filter: "audioonly",
        fmt: "mp3",
      })
      const writeStream = fs.createWriteStream(videoName);
      stream.pipe(writeStream)
      writeStream.on('finish', async () => {
        const formData = new FormData();
        formData.append("model", "whisper-1");
        formData.append("file", fs.createReadStream(videoName));

        try {
          const transcription = await openai.audio.transcriptions.create({
            file: fs.createReadStream(videoName),
            model: "whisper-1",
          });

          unlink(videoName, (err) => {
            if (err) throw err;
            console.log(videoName + ' was deleted');
          }); 

          let recipe = await getRecipeFromTranscript(transcription.text);
          console.log(recipe)
          res.send(recipe);
        } 
        catch (err) {
          console.error("Error posting to OpenAI API:", err);
          res.send({error: "Please try again later"})
        }
      });

      writeStream.on('error', (err) => {
        console.error("Error writing to file:", err);
        res.send({error: "Please try again later"})
      });
      
    } 
    else {
      res.send({error: "Invalid YouTube URL"})
    }
  }

  else{
    videoName = count + '.mp4';
    count += 1;
    const writeStream = fs.createWriteStream(videoName);

    const buffer = recipeVideo.buffer
    const readable = new Readable()
    readable._read = () => {} 
    readable.push(buffer)
    readable.push(null)
    readable.pipe(writeStream)


    writeStream.on('finish', async () => {
      const formData = new FormData();
      formData.append("model", "whisper-1");
      formData.append("file", fs.createReadStream(videoName));

      try {
        const transcription = await openai.audio.transcriptions.create({
          file: fs.createReadStream(videoName),
          model: "whisper-1",
        });
      
        let recipe = await getRecipeFromTranscript(transcription.text);
        console.log(recipe)
        res.send(recipe);

        unlink(videoName, (err) => {
          if (err) throw err;
          console.log(videoName + ' was deleted');
        }); 
      } catch (err) {
        console.log("Error posting to OpenAI API:", err);
        res.send({error: "Please try again later"})
      }
    });
  }
})

async function  getRecipeFromTranscript (transcript) {
  let tries = 0;

  while (true){
    console.log(tries)
    tries += 1;
    if (tries == 5){
      return {"error":"Error generating recipe, please try again later"};
    }
    try{
      let jsonGood = true;
      // generate recipe
      console.log(`Create a recipe JSON based on ${transcript}} \n`)
      const content = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [{role: "system", content: `Based on a transcript of a recipe, format the recipe into the JSON format {name: max 100 characters, duration: int minutes,
        cuisine: max 100 characters, notes: optional max 2000 characters, ingredients: [{ingredientName: max 500 characters, amount: no fractions only decimal(20,2) , 
        unit: max 50 characters, notes: max 1000 characters}], instructions: [{instruction: max 5000 characters, notes: max 2000 characters, step: instruction step number}] 
        REQUIRED, include all necessary instructions to make dish (detailed)}}, all keys should be the same as example and be valid JSON, no fractions.  
        Only ever give JSON and use the exact same keys as the example (case-sensitive). If there is a error return it in the format {error: errorMessage}. Make sure it is 
        proper JSON and all keys conform to the examples.`}, 
        {role: "user", content: `Create a recipe JSON based on ${transcript}}`}],
      });

      // check if all the proper keys are present
      let jsonContent = JSON.parse(content.choices[0].message.content);
      console.log(jsonContent)
      if (!jsonContent.error && !jsonContent.Error){

        if (!jsonContent.name){
          if(jsonContent.Name){
            jsonContent.name = jsonContent.Name;
          }
          else{
            console.log("name")
            continue;
          }
        }

        if (!jsonContent.ingredients){
          if(jsonContent.Ingredients){
            jsonContent.ingredients = jsonContent.Ingredients;
          }
          else{
            console.log("ingredients")
            continue;
          }
        }

        if (!jsonContent.instructions){
          if(jsonContent.Instructions){
            jsonContent.instructions = jsonContent.Instructions;
          }
          else{
            console.log("instructions")
            continue;
          }
        }

        for (let i = 0; i < jsonContent.ingredients.length; i++) {
          if (!jsonContent.ingredients[i].ingredientName){
            if(jsonContent.ingredients[i].IngredientName){
              jsonContent.ingredients[i].ingredientName = jsonContent.ingredients[i].IngredientName;
            }
            else{
              console.log("ingredients ingredientName")
              jsonGood = false;
            }
          }
        }

        for (let i = 0; i < jsonContent.instructions.length; i++) {
          if (!jsonContent.instructions[i].instruction){
            if(jsonContent.ingredients[i].Instruction){
              jsonContent.ingredients[i].instruction = jsonContent.ingredients[i].Instruction;
            }
            else{
              console.log("instructions instruction")
              jsonGood = false;
            }
          }
          if (!jsonContent.instructions[i].step){
            if(jsonContent.ingredients[i].Step){
              jsonContent.ingredients[i].step = jsonContent.ingredients[i].Step;
            }
            else{
              console.log("instructions steps")
              jsonGood = false;
            }
          }
        }
      }

      else if(jsonContent.Error){
        jsonContent.error = jsonContent.Error;
      }
      else if(!jsonContent.error){
        console.log("error error")
        continue;
      }

      // convert to json and send to front end
      if(jsonGood){
        return {recipe: jsonContent};
      }
    }
    catch (error){console.log(error);}
  }
}