import express from 'express'
import Queue from 'bull'
import Redis from 'ioredis'

const REDIS_URL = "redis://:615f5e1534ba4882a798a270e112bd14@usw1-polite-lark-31298.upstash.io:31298";
const redis = new Redis(REDIS_URL); 

export const testApiQueue = new Queue("test_queue", REDIS_URL)
testApiQueue.process(async (job) => {
    try {
        console.log(`Recieved a job: `); 

        const { id, message } = job.data; 
        
        console.log(`JobID: ${id}, Message: ${message}`);
        const redisResult = await redis.incr('test-counter');
        console.log('Done with the job!!');
        
        return Promise.resolve(redisResult);
    } catch (error) {
        Promise.reject(error); 
    }
})

export const hitApi = async (res, req, next) => {
    testApiQueue.add({ 
        id: '1', 
        message: 'hello!'
    });
    console.log('Returned from processing the job')
    next(); 
}


const app = express();

app.get('/', (req, res) => {
    res.send('Hello World!'); 
});

app.use(hitApi); 

app.get('/route1', (req, res) => {
    res.send('Hello from path1');
});
app.get('/route2', (req, res) => {
    res.send('Hello from path2');
});

app.listen(3000, () => console.log('Listening on port 3000')); 