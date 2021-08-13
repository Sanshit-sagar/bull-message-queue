import express from 'express'
import Queue from 'bull'
import Redis from 'ioredis'
import bodyParser from 'body-parser'

// const API_ENDPOINT = 'https://analyticly.hashably.workers.dev/api/sanshit.sagar@gmail.com'
const REDIS_URL = 'redis://:615f5e1534ba4882a798a270e112bd14@usw1-polite-lark-31298.upstash.io:31298';
const redis = new Redis(REDIS_URL); 

export const testApiQueue = new Queue("test_queue", REDIS_URL)

testApiQueue.process(async (job) => {
    const { logEntry, requestHeaders, responseHeaders, timestamp } = job.data;

    const redisResult1 = await redis.lpush('eventlog', logEntry); 
    const redisResult2 = await redis.lpush('clickstream', JSON.stringify(requestHeaders));
    const redisResult3 = await redis.lpush('clickstream.response_headers', JSON.stringify(responseHeaders));

    return Promise.resolve(`Done, finished in: ${(new Date().getTime()) - parseInt(timestamp)}`);
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
    console.log(`Recieved a request at /clicks @ ${new Date(parseInt(timestamp)).toLocaleString()}`);
    console.log(`${JSON.stringify(Object.keys(req.body))}`);

    try {
        const job = await testApiQueue.add({
            logEntry: req.body.logEntry,
            requestHeaders: req.body.requestHeaders,
            responseHeaders: req.body.responseHeaders,
            cfRay: req.body.cfRay,
            visitorIp: req.body.requestIp,
            responseStatus: req.body.responseStatus,
            responseTime: req.body.responseTime,
            owner: req.body.owner,
            destination: req.body.destination,
            timestamp: timestamp,

        });
        const result = await job.finished(); 
        console.log(result); 
        res.status(200).end(result); 
    } catch(error) {
        console.log(`Recieved an error: ${error.message}`); 
        res.status(500).end(`Recieved an error: ${error.message}`); 
    }    
});

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