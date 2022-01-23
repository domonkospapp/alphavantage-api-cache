import express from "express"
import fetch from "node-fetch"
import { createClient } from 'redis';
import dotenv from 'dotenv'

dotenv.config()
const PORT = process.env.PORT || 3000
const REDIS_PORT = process.env.REDIS_PORT || 6379
const ALPHA_VANTAGE_API_KEY = process.env.ALPHA_VANTAGE_API_KEY || "demo"
const CACHE_EXPIRY = process.env.CACHE_EXPIRY || 5

const redisClient = createClient(REDIS_PORT);
redisClient.on('error', (err) => console.log('Redis Client Error', err));
redisClient.on('connect', () => console.log('Connected!'));
await redisClient.connect();

const cache = async(req, res, next) => {
    const { companyName } = req.params;
    const data = await redisClient.get(companyName);
    data ? res.send(data) : next()
}

const getCompany = async (req, res, next) => {
    try{
        const { companyName } = req.params;
        const response = await fetch(`https://www.alphavantage.co/query?function=OVERVIEW&symbol=${companyName}&apikey=${ALPHA_VANTAGE_API_KEY}`)
        const data = await response.json();

        if(data.Symbol === companyName){
            redisClient.setEx(companyName, CACHE_EXPIRY, JSON.stringify(data));
            res.send(data);
        }else{
            res.send("Wrong ticker!");
            res.status(500);
        }
        
    } catch(err){
        console.error(err);
        res.status(500);
    }
}

const app = express()

app.get('/:companyName', cache, getCompany);

app.listen(PORT, ()=>{
    console.log(`App listening on port ${PORT}`)
})