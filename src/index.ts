// SDLE @ M.EIC, 2022
// T4G14

import express from 'express';
import { AddressInfo } from 'net';
import { createLibp2p } from 'libp2p';
import { tcp } from '@libp2p/tcp';
import { noise } from '@chainsafe/libp2p-noise';
import { mdns } from '@libp2p/mdns';
import { kadDHT } from '@libp2p/kad-dht';
import type { PeerInfo } from '@libp2p/interface-peer-info';
import TLPost from './tlpost.js';


const main = async () => {

    const node = await createLibp2p({
        addresses: {
            listen: ['/ip4/0.0.0.0/tcp/0']
        },
        transports: [tcp()],
        connectionEncryption: [noise()],
        peerDiscovery: [mdns()],
        dht: kadDHT()
    });

    node.addEventListener('peer:discovery', (event) => {
        const peer = event.detail as PeerInfo;
        console.log(`⚗️  Discovered peer ${peer.id}`);
    });

    await node.start();
    console.info(`🐦 libp2p node has started`);

    const [hostname, port]  = ['localhost', 0];
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

    const httpServer = app.listen(port, hostname, () => {
        const address = httpServer.address() as AddressInfo;
        console.info(`🐦 Server running at http://${hostname}/${address.port}`);
    });
}

// Entry Point
main().then().catch(console.error);
