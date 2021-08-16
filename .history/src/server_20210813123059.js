import express from 'express'
import Queue from 'bull'
import Redis from 'ioredis'
import bodyParser from 'body-parser'

// const API_ENDPOINT = 'https://analyticly.hashably.workers.dev/api/sanshit.sagar@gmail.com'
const REDIS_URL = 'redis://:615f5e1534ba4882a798a270e112bd14@usw1-polite-lark-31298.upstash.io:31298';
const redis = new Redis(REDIS_URL); 

export const testApiQueue = new Queue("test_queue", REDIS_URL)

function serializeParams(jobData) {
    return JSON.stringify({ ...jobData });
}

function createLexicographicalKey(timestamp, hashFragments) {
    return `${timestamp}:${hashFragments.join(':')}`;
}

function createLexicographicalKeySet(owner, slug, cfRay, timestamp) {
    const fragments = [`${cfRay}`, `${slug.substring(1)}`];
    const lexKey = createLexicographicalKey(timestamp, fragments);
    const userFragments = [...fragmentsArr, `${owner}`];
    const userLexKey = createLexicographicalKey(timestamp, userFragments);
    const slugFragments = [...fragmentsArr, `${slug}`, `${owner}`]; 
    const slugLexKey = createLexicographicalKey(timestamp, slugFragments); 

    console.log(`${lexKey}`);
    console.log(`${userLexKey}`);
    console.log(`${slugLexKey}`);
}

function generateExitMessage(timestamp) {
    return `Done, finished in: ${(new Date().getTime()) - parseInt(timestamp)}`; 
}

function generateUnknownError(error) {
    return `Recieved an error: ${error.message}`;
}

testApiQueue.process(async (job) => {
    const { slug, cfRay, owner, logEntry, timestamp } = job.data;
    const { lexKey, userLexKey, slugLexKey } = lex; 
    const clickstreamPayload = serializeParams(job.data);
    const lex = createLexicographicalKeySet(owner, slug, cfRay, timestamp); 

    try {
        const multiPromise = await redis.multi()
            .lpush('eventlog', logEntry)
            .lpush('clickstream', clickstreamPayload)
            .lpush(`clickstream.user.${owner}`, clickstreamPayload)
            .lpush(`clickstream.slug.${slug}`, clickstreamPayload)
            .hset(`cfray.to.click`, cfRay, clickstreamPayload)
            .zadd('clickstream.chronological', 0, lexKey)
            .zadd('clickstream.chronological.by.user', 0, userLexKey)
            .zadd('clickstream.chronological.by.slug', 0, slugLexKey)
            .zincrby(`user.${owner}.clickcount`, 1, `${slug}`)
            .zincrby(`slug.${slug}.clickcount`, 1, `${slug}`)
            .exec((err, result) => { 
                console.log(JSON.stringify(result)); 
            });
        return Promise.resolve(generateExitMessage(timestamp));
    } catch (error) {
        return Promise.reject(generateUnknownError(error));
    }
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
    console.log(`${JSON.stringify(Object.entries(req.body))}`);

    try {
        const job = await testApiQueue.add({
            logEntry: req.body.logEntry,
            requestHeaders: req.body.requestHeaders,
            responseHeaders: req.body.responseHeaders,
            cfRay: req.body.cfRay,
            workerId: req.body.workerId,
            slug: req.body.slug,
            owner: req.body.owner,
            destination: req.body.destination,
            recievedAt: req.body.recievedAt,
            loggedAt: req.body.loggedAt,
            queuedAt: timestamp,
            timestamp: timestamp
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