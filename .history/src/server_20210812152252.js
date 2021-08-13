import express from 'express'
import Queue from 'bull'
import Redis from 'ioredis'

const REDIS_URL = 'redis://:615f5e1534ba4882a798a270e112bd14@usw1-polite-lark-31298.upstash.io:31298';
const redis = new Redis(process.env.REDIS_URL); 

export const testApiQueue = new Queue("test_queue", process.env.REDIS_URL)

testApiQueue.process(async function(job, done) {
    try {
        console.log(`Recieved a job: `); 

        const { id, message } = job.data; 

        console.log(`JobID: ${id}, Message: ${message}`);
        const redisResult = await redis.incr('test-counter');
        console.log('Done with the job!');
        
        return Promise.resolve(redisResult);
    } catch (error) {
        return Promise.reject(error); 
    }
})

const hitApi = async (res, req, next) => {
    
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