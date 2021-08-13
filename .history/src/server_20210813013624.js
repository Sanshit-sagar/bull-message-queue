import express from 'express'
import Queue from 'bull'
import Redis from 'ioredis'
// import redis from './lib/redis'
import bodyParser from 'body-parser'
import axios from 'axios'

const REDIS_URL = 'redis://:615f5e1534ba4882a798a270e112bd14@usw1-polite-lark-31298.upstash.io:31298';
const API_ENDPOINT = 'https://analyticly.hashably.workers.dev/api/sanshit.sagar@gmail.com'

const redis = new Redis(REDIS_URL); 

export const testApiQueue = new Queue("test_queue", REDIS_URL)

testApiQueue.process(async (job) => {
    const { requestData, responseData, payload, timestamp } = job.data;

    const redisResult3 = await redis.lpush('test-queue', payload); 
    const redisResult4 = await redis.lpush('test-queue-requests', JSON.stringify(requestData));
    const redisResult5 = await redis.lpush('test-queue-responses', JSON.stringify(responseData));

    console.log(`Done, finished in: ${(new Data().getTime()) - parseInt(timestamp)}`)

    return Promise.resolve(`The counters are now at: ${redisResult} and ${redisResult2} respectively`);
});

testApiQueue.on('error', function (error) {
    console.log(`Job errored out: ${error}`);
});
testApiQueue.on('active', function (job, jobPromise) {
    console.log('Job is active');
});
testApiQueue.on('stalled', function (job) {
    console.log('Job stalled');
});
testApiQueue.on('completed', function (job, result) {
    console.log('Job is completed');
});

const app = express();

app.use(bodyParser.json({ type: 'application/json' }))

app.get('/', (req, res) => {
    res.status(200).send('Hello World!'); 
});

app.post('/clicks', async (req, res) => {
    let timestamp = new Date().getTime().toString();
    console.log(`Recieved a request at /clicks @ ${timestamp}`);
    console.log(req); 
    
    try {
        const job = await testApiQueue.add({
            requestData: req.body.metadata.request,
            responseData: req.body.metadata.response,
            payload: req.body.log_entry,
            timestamp: timestamp
        });
        const result = await job.finished(); 
        res.status(200).end(result); 
    } catch(error) {
        res.status(500).end(`Recieved an error: ${error.message}`); 
    }    
});

// app.get('/testing-bp', jsonParser, (req, res, next) => {
//     console.log(`Recieved data: ${JSON.stringify(req.body)}`)
//     res.json({ message: 'success!'})
//     next(); 
// })

app.use((error, req, res, next) => {
    console.log(`Error Handling Middleware called from ${req.path}`)
    console.error('Error: ', error)
   
    if (error.type == 'time-out') { 
        res.status(408).send(error)
    } else {
        res.status(500).send(error)
    }
}) 

app.listen(3000, () => console.log('Listening on port 3000')); 