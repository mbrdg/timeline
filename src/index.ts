// SDLE @ M.EIC, 2022
// T4G14

import express from 'express';
import { AddressInfo } from 'net';
import { createLibp2p } from 'libp2p';
import { tcp } from '@libp2p/tcp';
import { noise } from '@chainsafe/libp2p-noise';
import { mdns } from '@libp2p/mdns';

import type { PeerInfo } from '@libp2p/interface-peer-info';
import type { Connection } from '@libp2p/interface-connection';

import TLPost from './tlpost.js';
import { kadDHT } from '@libp2p/kad-dht';


const main = async () => {

    const encoder = new TextEncoder();
    const decoder = new TextDecoder("utf-8");

    const [hostname, port]  = ['localhost', 0];
    const app = express();
    app.use(express.json());

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

    node.connectionManager.addEventListener('peer:connect', (event) => {
       const connection = event.detail as Connection;
       console.log(`✅ Connected peer ${connection.remotePeer.toString()}`);
    });
    node.connectionManager.addEventListener('peer:disconnect', (event) => {
        const connection = event.detail as Connection;
        console.log(`❌ Disconnected peer ${connection.remotePeer.toString()}`);
    });

    await node.start();
    console.info(`🐦 libp2p node has started`);

    app.post('/publish', (req, res) => {
        const { handle, content } = req.body as Pick<TLPost, "handle" | "content">;
        const time = new Date();

        const post: Readonly<TLPost> = {
            handle: handle,
            content: content,
            timestamp: time,
            reposts: 0,
            likes: 0
        };

        const key = encoder.encode(`/post/${handle}`);
        const value = encoder.encode(JSON.stringify(post));

        node.contentRouting.put(key, value).then((post) => {
            console.info(`🐦 Server received the following post`, post);
            res.status(201).send(`Post published successfully`);
        }).catch((err) => {
            console.error(err);
            res.status(400);
        });
    });

    app.get('/get/:handle', (req, res) => {
        const handle = req.params.handle;
        const key = encoder.encode(`/post/${handle}`);

        node.contentRouting.get(key).then((content) => {
            const value = decoder.decode(content);
            res.status(200).send(value);
        }).catch((err) => {
            console.error(err);
            res.status(404);
        });
    });

    const httpServer = app.listen(port, hostname, () => {
        const address = httpServer.address() as AddressInfo;
        console.info(`🐦 Server running at http://${hostname}:${address.port}`);
    });
}

// Entry Point
main().then().catch(console.error);
