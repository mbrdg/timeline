// SDLE @ M.EIC, 2022
// T4G14
import express from 'express';

import TLPost from "./tlpost";


const port = 8000;

const app = express();
app.use(express.json());

app.get('/timeline', (_req, res) => {
    res.status(501).send('General timeline not implemented yet.');
});

app.get('/timeline/:user', (_req, res) => {
    res.status(501).send('Users\' timeline not implemented yet.');
});

app.post('/register', (_req, res) => {
    res.status(501).send('Register not implemented yet.');
});

app.post('/follow', (_req, res) => {
    res.status(501).send('Follow a new user not implemented yet.');
});

app.post('/retweet', (_req, res) => {
    res.status(501).send('Retweet not implemented yet.');
});

app.post('/fav', (_req, res) => {
    res.status(501).send('Fav not implemented yet.');
});

app.post('/comment', (_req, res) => {
    res.status(501).send('Comments not implemented yet.');
});

app.post('/publish', (req, res) => {
    const { handle, content } = req.body as Pick<TLPost, "handle" | "content">;
    const time = new Date();

    const tweet: Readonly<TLPost> = {
        handle: handle,
        content: content,
        timestamp: time
    };

    console.log(`🐦 Server received the following tweet at ${time.toDateString()}`);
    console.log(tweet);

    res.status(201).send(`Tweet published successfully`);
});


app.listen(port, () => {
    console.info(`🐦 Server running at http://localhost:${port}`);
});
