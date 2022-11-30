// SDLE @ M.EIC, 2022
// T4G14

import express from 'express';
import { createLibp2p } from 'libp2p';
import { tcp } from '@libp2p/tcp';
import { noise } from '@chainsafe/libp2p-noise';
import { kadDHT } from '@libp2p/kad-dht';

import TLPost from './tlpost.js';


const main = async () => {
    const node = await createLibp2p({
        addresses: {
            listen: ['/ip4/127.0.0.1/tcp/0']
        },
        transports: [tcp()],
        connectionEncryption: [noise()],
        dht: kadDHT()
    });

    await node.start();
    console.info(`🐦 libp2p node has started`);

    const port = 8000;
    const app = express();
    app.use(express.json());

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
}

// Entry Point
main().then().catch(console.error);
