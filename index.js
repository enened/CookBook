const express = require("express");
const app = express();
var mysql = require('mysql');
const cors = require('cors');
const bodyParser = require('body-parser')
const session = require("express-session");
const cookieParser = require('cookie-parser');
const bcrypt = require("bcrypt");
const saltRounds = 5;

// database connection
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'password',
    database: 'cookbook'
});

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
    const email = req.body.email;
    const password = req.body.password;

    db.query("select email, password, userId from login where binary email = ? and password is not null", [email, password], (err, result) => {
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
          res.send("Wrong email")
        }
      })
})

// sign up if no account
app.post("/signup", (req, res)=>{
    const email = req.body.email;
    const password = req.body.password;

    // check whether username already exists
    db.query("select userId from login where binary email = ?", [email], (err, result)=>{
        if (err){console.log(err)}

        if (result.length == 0){

            // encrypt password
            bcrypt.hash(password, saltRounds, (err, hash)=>{

                if (err){console.log(err)}

                // add encrypted password to database
                db.query("insert into login(email, password) values(?, ?)", [email, hash], (err, result)=>{
                if (err){console.log(err)}

                // create session for user and send userId
                req.session.user = {userId: result.insertId, email: email};
                res.send({user: {userId: result.insertId, email: email}})
                })

            })
        }
        else{
            res.send("email in use")
        }
    })
})