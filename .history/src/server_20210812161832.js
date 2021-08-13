import express from 'express'
import Queue from 'bull'
import Redis from 'ioredis'

const REDIS_URL = 'redis://:615f5e1534ba4882a798a270e112bd14@usw1-polite-lark-31298.upstash.io:31298';
const redis = new Redis(REDIS_URL); 

export const testApiQueue = new Queue("test_queue", REDIS_URL)

testApiQueue.process(async (job) => {
    const { timestamp } = job.data; 
    const redisResult = await redis.incr('test-counter');
    const redisResult2 = await redis.incr(`test-counter2`);
    return Promise.resolve(`The counters are now at: ${redisResult} and ${redisResult2} respectively`);
})



const app = express();

app.get('/', (req, res) => {
    res.send('Hello World!'); 
});

app.get('/route1', async (req, res) => {
    try {
        const job = await testApiQueue.add({ 
            timestamp: `${new Date().toLocaleTimeString()}`,
        }); 
        const result = await job.finished(); 
        res.sendStatus(200);
    } catch(error) {
        res.sendStatus(500); 
    }
});

app.get('/route2', (req, res) => {
    res.send('Hello from path2');
});

app.use((error, req, res, next) => {
    console.log(`Error Handling Middleware called from ${req.path}`)
    console.error('Error: ', error)
   
    if (error.type == 'time-out') { 
        // arbitrary condition check
        res.status(408).send(error)
    } else {
        res.status(500).send(error)
    }
}) 

app.listen(3000, () => console.log('Listening on port 3000')); 