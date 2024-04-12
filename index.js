const express = require('express')
const path = require('path')
const {open} = require('sqlite')
const sqlite3 = require('sqlite3')
const bcrypt = require('bcrypt')
const cors = require('cors')
const jwt = require('jsonwebtoken')
const dbPath = path.join(__dirname,"database.db")
const app = express();
app.use(express.json())
app.use(cors())
 
let db = null 

const InitailizeDbserverAndDatabase = async () =>{
    try{
        db = await open({
            filename:dbPath,
            driver:sqlite3.Database,

        });
        app.listen(3001, ()=>{
            console.log(`server nunning at http://localhost:3001`)
        })
    }catch(err){
       console.log(`DB Error: ${err.message}`)
       process.exit(-1)
    }
}

InitailizeDbserverAndDatabase()

app.get('/data',async(req,res)=>{
  const dataDetails = `select * from user`
  const data = await db.all(dataDetails)
  res.send(data)
})
app.post("/register", async (request, response) => {
    const {username,email,password} = request.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const selectUserQuery = `SELECT * FROM user WHERE  username = '${username}'`;
    const dbUser = await db.get(selectUserQuery);
    console.log(dbUser)
    if (dbUser === undefined) {
      const createUserQuery = `
        INSERT INTO 
          user (username,email,password) 
        VALUES 
          (
            '${username}', 
            '${email}',
            '${hashedPassword}'
          )`;
      const dbResponse = await db.run(createUserQuery);
      const newUserId = dbResponse.lastID;
      response.send(`Created new user with ${newUserId}`);
    } else {
      response.status = 400;
      response.send("User already exists");
    }
  });

 app.post('/login', async (request,response)=>{
       const {email,password} = request.body
       const userDataDetails = `SELECT * FROM user WHERE email = "${email}"`
       const dbUser = await db.get(userDataDetails)
       if(dbUser === undefined){
        response.status = 400
        response.send("Invalid user details")
       }else{
           const PasswordMatched = await bcrypt.compare(password,dbUser.password)
           console.log(PasswordMatched)
           if(PasswordMatched){
               const payload = {
                email:email,
               }
               const jwtToken = jwt.sign(payload,"My-secrete-token");
               response.send(jwtToken)
           }else{
            response.status = 400
            response.send("Invalid password details")
           }
       }
 })

  

app.post('/logout', async (request,response) =>{
    let jwtToken;
      const authHeader = request.headers["authorization"];
      if(authHeader !==  undefined){
        jwtToken = authHeader.split(" ")[1]
      } 
      if(authHeader === undefined){
        response.status = 401
        response.send("Invalid Access Token")
      }else{
        jwt.verify(jwtToken,"My-secrete-token",async (err,payload)=>{
            if(err){
                response.send("Invalid Access Token");

            }else{
                request.email = payload.email;
                response.send("User Logout Successfully")
            }
        })
      }
})
