import express from 'express'
import Queue from 'bull'
import redis from './lib/redis';

export const testApiQueue = new Queue("test_queue", 'redis://615f5e1534ba4882a798a270e112bd14@usw1-polite-lark-31298.upstash.io:31298')
testApiQueue.process(async (job) => {
    try {
        console.log(`Recieved a job: `); 
        const { jobId, message } = job;data; 
        console.log(`JobID: ${jobId}, Message: ${message}`);

        const redisResult = await redis.incr('test-counter');
        return Promise.resolve(redisResult);
    } catch (error) {
        Promise.reject(error); 
    }
})

export const hitApi = async (res, req, next) => {
    testApiQueue.add({ 
        jobId: '1', 
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