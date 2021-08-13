import express from 'express'

const app = express();


app.get('/', (req, res) => {
    res.send('Hello World!'); 
});

app.get('/route1', (req, res) => {
    res.send('Hello from path1');
});
app.get('/route2', (req, res) => {
    res.send('Hello from path2');
});

app.listen(3000, () => console.log('Listening on port 3000')); 