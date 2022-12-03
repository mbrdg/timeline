// SDLE @ M.EIC, 2022
// T4G14

import express from 'express';
import { AddressInfo } from 'net';
import { createLibp2p } from 'libp2p';
import { tcp } from '@libp2p/tcp';
import { noise } from '@chainsafe/libp2p-noise';
import { mdns } from '@libp2p/mdns';
import { mplex } from '@libp2p/mplex';
import { kadDHT } from '@libp2p/kad-dht';
import { CID } from 'multiformats/cid';
import { sha256 as hasher } from 'multiformats/hashes/sha2';

import type { PeerInfo } from '@libp2p/interface-peer-info';
import type { Connection } from '@libp2p/interface-connection';

import TLPost from './tlpost.js';

const createCID = async (handle: string) => {
    const bytes = new TextEncoder().encode(handle)
    const hash = await hasher.digest(bytes);
    return CID.createV1(hasher.code, hash);
}

const main = async () => {

    const encoder = new TextEncoder();
    const decoder = new TextDecoder("utf-8");

    const [hostname, port] = ['localhost', 0];
    const app = express();
    app.use(express.json());

    const node = await createLibp2p({
        addresses: {
            listen: ['/ip4/0.0.0.0/tcp/0']
        },
        transports: [tcp()],
        connectionEncryption: [noise()],
        streamMuxers: [mplex()],
        peerDiscovery: [mdns()],
        dht: kadDHT()
    });

    node.addEventListener('peer:discovery', (event) => {
        const peer = event.detail as PeerInfo;

        node.peerStore.addressBook
            .set(peer.id, peer.multiaddrs)
            .catch(console.error);

        node.dial(peer.id)
            .catch(console.error);
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

    app.post('/register', (req, res) => {
        const handle = req.body.handle as string;
        
        const newUser = {
            handle: handle,
            following: [],
            likes: [],
            tweets: [],
        }
        
        const key = encoder.encode(`/${handle}`);
        const value = encoder.encode(JSON.stringify(newUser));
        node.contentRouting.put(key, value).then(async () => {
            console.info(`🐦 Server received the following user: `, newUser);
            node.contentRouting.provide(await createCID(`/${handle}`))
                .then(() => res.status(201).send(`User registered successfully`))
                .catch((err) => { console.error(err); res.status(500); });
        }).catch((err) => {
            console.error(err);
            res.status(400);
        });
    });

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
        node.contentRouting.put(key, value).then(async () => {
            console.info(`🐦 Server received the following post: `, post);
            node.contentRouting.provide(await createCID(`/post/${handle}`))
                .then(() => res.status(201).send(`Post published successfully`))
                .catch((err) => { console.error(err); res.status(500); });
        }).catch((err) => {
            console.error(err);
            res.status(400);
        });
    });

    app.get('/:handle', (req, res) => {
        const handle = req.params.handle;
        const key = encoder.encode(`/${handle}`);

        node.contentRouting.get(key).then((content) => {
            const value = decoder.decode(content);
            res.status(200).send(value);
        }).catch((err) => {
            console.error(err);
            res.status(404);
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
