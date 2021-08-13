import express from 'express'
import Queue from 'bull'
import Redis from 'ioredis'
import bodyParser from 'body-parser'
import fetch from 'fetch'

const REDIS_URL = 'redis://:615f5e1534ba4882a798a270e112bd14@usw1-polite-lark-31298.upstash.io:31298';
const redis = new Redis(REDIS_URL); 

export const testApiQueue = new Queue("test_queue", REDIS_URL)

testApiQueue.process(async (job) => {
    const { timestamp, payload } = job.data; 

    const redisResult = await redis.incr('test-counter');
    const redisResult2 = await redis.incr('test-counter2');
    const redisResult3 = await redis.lpush('test-queue', payload); 

    const fetchResult = await fetch('https://analyticly.hashably.workers.dev/api/sanshit.sagar@gmail.com');
    
    const respBody = {
        message: `The counters are now at: ${redisResult} and ${redisResult2} respectively`,
        data: `${JSON.stringify(fetchResult)}`
    };

    return Promise.resolve(respBody);
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
})

const app = express();

var jsonParser = bodyParser.json()
var urlencodedParser = bodyParser.urlencoded({ extended: false })

app.get('/', (req, res) => {
    res.status(200).send('Hello World!'); 
});

app.get('/route1', jsonParser, async (req, res) => {
    console.log('Recieved a request at route1')

    try {
        const job = await testApiQueue.add({ 
            timestamp: `${new Date().toLocaleTimeString()}`,
            payload: JSON.stringify(req.body, null, 2)
        }); 
        console.log('Done placing it on the queue'); 
        const result = await job.finished(); 
        console.log('The job finished successfully'); 
        res.sendStatus(200);
    } catch(error) {
        res.end(`Recieved an error: ${error.message}`); 
    }
});

app.get('/route2', (req, res) => {
    res.send('Hello from path2');
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