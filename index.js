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
const Xray = require('x-ray');
const x = Xray()


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
app.post("/getSearchResults", (req, res)=>{
  const userId = req.body.userId;
  const query = req.body.query;

  // search recipes table 
  db.query(`select * from recipes where userId = ? and ((instr(?, notes) > 0 or instr(notes, ?) > 0) and notes != "" or instr(?, name) > 0 or instr(name, ?) > 0 or 
    instr(?, convert(duration, char)) > 0 or instr(convert(duration, char), ?) > 0 or instr(?, cuisine) > 0 or instr(cuisine, ?) > 0 ) 
    order by recipeId asc`, [userId, query, query, query, query, query, query,  query, query], async (err, result1) => {
    if (err){console.log(err)}

    else{
      // search ingredients table
      db.query(`select distinct recipes.*, count(ingredients.ingredientId) from recipes inner join ingredients on recipes.recipeId = ingredients.recipeId where recipes.userId = ? and 
        ((instr(?, ingredients.notes) > 0 or instr(ingredients.notes, ?) > 0) and ingredients.notes != "" or instr(?, ingredients.ingredientName) > 0 or instr(ingredients.ingredientName, ?) > 0)  
        group by recipes.recipeId order by recipes.recipeId asc`, [userId, query, query, query, query], async (err, result2) => {
        if (err){console.log(err)}

        else{
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
          res.send({recipes: [...result1]});
        }
      })
    }
  })
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
app.post("/scrapeWebsite", (req, res)=>{
  const recipeLink = req.body.recipeLink;

  x(recipeLink, {div: ['div'], article: ["article"], main: ["main"]})((err, result) => {
    let divCount = 0;
    let articleCount = 0;
    let mainCount = 0;
    // check if any nested content (like divs) and remove it 
    result.div.forEach(div => {divCount += div.length});
    result.article.forEach(article => {articleCount += article.length});
    result.main.forEach(main => {mainCount += main.length});

    console.log("Div: " + divCount + " Article: " + articleCount + " Main: " + mainCount)
  });
})