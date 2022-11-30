// SDLE @ M.EIC, 2022
// T4G14
import express from 'express';

import TLNode from "./kademlia/tlnode";
import TLPost from "./kademlia/tlpost";


const port = 8000;
const self = new TLNode('localhost', port);

const app = express();
app.use(express.json());


app.get('/id', (_req, res) => {
    res.status(200).send(self.id);
});

app.post('/register', (_req, res) => {
    res.status(501).send('Not implemented yet.');
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
