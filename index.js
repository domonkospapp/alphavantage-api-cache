import express from "express"
import fetch from "node-fetch"
import { createClient } from 'redis';

const PORT = process.env.PORT || 3000
const REDIS_PORT = process.env.REDIS_PORT || 6379

const redisClient = createClient(REDIS_PORT);
redisClient.on('error', (err) => console.log('Redis Client Error', err));
redisClient.on('connect', () => console.log('Connected!'));
await redisClient.connect();

const cache = async(req, res, next) => {
    const data = await redisClient.get('IBM');
    data ? res.send(data) : next()
}

const getCompany = async (req, res, next) => {
    try{
        const response = await fetch(`https://www.alphavantage.co/query?function=OVERVIEW&symbol=IBM&apikey=demo`)
        const data = await response.json();

        redisClient.setEx("IBM", 5, JSON.stringify(data));
        res.send(data);
    } catch(err){
        console.error(err);
        res.status(500);
    }
}

const app = express()

app.get('/', cache, getCompany);

app.listen(PORT, ()=>{
    console.log(`App listening on port ${PORT}`)
})