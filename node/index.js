require('dotenv').config()
const jwt =require('jsonwebtoken')
const express=require('express')
const cors=require('cors')
const { MongoClient } = require("mongodb");

const uri = process.env.MONGODB_URI

const app=express()
app.use(cors())
app.use(express.json())


async function connectToCluster(uri) {
    let mongoClient;
 
    try {
        mongoClient = new MongoClient(uri);
        await mongoClient.connect();
        return mongoClient;
    } catch (error) {
        process.exit();
    }
 }

app.post('/registration',async(req,res)=>{
    let mongoClient
    const userInfo=req.body
    try{
        mongoClient=await connectToCluster(uri)
        const db = mongoClient.db('users');
        const collection = db.collection('registered');
        const loginFetchedData=await collection.findOne({userName:userInfo.userName})
        loginFetchedData?res.send({status:false}):
        await collection.insertOne(userInfo);

    }finally{
        await mongoClient.close()
    }
})

app.post('/login',async(req,res)=>{
    const loginCred=req.body

    try{
        mongoClient=await connectToCluster(uri)
        const db = mongoClient.db('users');
        const collection = db.collection('registered');
        const loginFetchedData=await collection.findOne(loginCred);

        if(loginFetchedData){
            const accessToken=jwt.sign({userName:loginCred.userName,password:loginCred.password},process.env.ACESS_KEY_JWT)
            res.send(
                {
                    userName:loginFetchedData.userName,
                    password:loginFetchedData.password,
                    accessToken
                })
        }else{
            res.send({"userName":null,"password":null})
        }

    }finally{
        await mongoClient.close()
    }
})

const verifyJWT=(req,res,next)=>{
    const authHeader=req.headers['authorization']
    const token=authHeader.split(" ")[1]
    
    if(token===null) return res.sendStatus(401)
    jwt.verify(token,process.env.ACESS_KEY_JWT,(err,user)=>{
        if(err) return res.sendStatus(403)
        req.user=user
        next()
    })
}

app.post('/details',verifyJWT,async(req,res)=>{
    const loginCred={
        userName:req.user.userName,
        password:req.user.password
    }

    try{
        mongoClient=await connectToCluster(uri)
        const db = mongoClient.db('users');
        const collection = db.collection('registered');
        const loginFetchedData=await collection.findOne(loginCred);

        if(loginFetchedData){
            res.send(
                {
                   name:loginFetchedData.name,
                   hobbies:loginFetchedData.checkBoxes,
                   gender:loginFetchedData.gender

                })
        }

    }finally{
        await mongoClient.close()
    }

})

app.listen(3030, () => {
    console.log(`Listening on port 3030`)
  })


