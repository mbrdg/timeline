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

import type { PeerInfo } from '@libp2p/interface-peer-info';
import type { Connection } from '@libp2p/interface-connection';

import { CID } from 'multiformats/cid';
import { sha256 } from 'multiformats/hashes/sha2';

import TLPost from './tlpost.js';
import TLUser, { TLUserHandle } from './tluser.js';


const main = async () => {

    const encoder = new TextEncoder();
    const decoder = new TextDecoder("utf-8");

    const createCID = (data: Readonly<Partial<TLUser | TLPost>>) => {
        const bytes = encoder.encode(JSON.stringify(data));
        const hash = sha256.digest(bytes) as Awaited<ReturnType<typeof sha256.digest>>;
        return CID.createV1(sha256.code, hash);
    }

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
        const { handle } = req.body as Pick<TLUser, "handle">;
        const user: Readonly<TLUser> = {
            handle: handle,
            followers: new Set<TLUserHandle>(),
            following: new Set<TLUserHandle>(),
            posts: [],
        };
        console.log(`🐦 Server received the following registration request\n`, user);

        // TODO: check if a given handle already exists (auth)
        const key = createCID({ handle: user.handle });
        const value = encoder.encode(JSON.stringify(user));

        node.contentRouting.put(key.bytes, value)
            .then(() => {
                node.contentRouting.provide(key)
                    .then(() => res.status(201).send(`User registered successfully`))
                    .catch(err => res.status(500).send(err));
            })
            .catch(err => {
                console.error(err);
                res.status(400).send(`Unable to fullfill the registration request`);
            });
    });

    app.get('/:handle', (req, res) => {
        const { handle } = req.params as Pick<TLUser, "handle">;
        const key = createCID({ handle: handle });

        node.contentRouting.get(key.bytes)
            .then((value) => {
                const user = decoder.decode(value);
                res.status(200).send(user);
            })
            .catch(() => res.status(404).send(`User ${handle} not found`));
    });

    app.post('/publish', (req, res) => {
        const { handle, content } = req.body as Pick<TLPost, "handle" | "content">;
        const time = new Date();
        const post: Readonly<TLPost> = {
            handle: handle,
            content: content,
            timestamp: time,
            reposts: new Set<TLUserHandle>(),
            likes: new Set<TLUserHandle>(),
        };
        console.info(`🐦 Server received the following publishing request\n`, post);

        // TODO: associate a new post with a handle
        const key = createCID({ handle: post.handle, timestamp: post.timestamp });
        const value = encoder.encode(JSON.stringify(post));

        node.contentRouting.put(key.bytes, value)
            .then(() => {
                node.contentRouting.provide(key)
                    .then(() => res.status(201).send(`${key.toString()}`))
                    .catch(err => res.status(500).send(err));
            })
            .catch((err) => {
                console.error(err);
                res.status(400).send(`Unable to fullfill the publishing request`);
            });
    });

    app.get('/post/:cid', (req, res) => {
        const { cid } = req.params;
        const key = CID.parse(cid);

        node.contentRouting.get(key.bytes)
            .then((value) => {
                const post = decoder.decode(value);
                res.status(200).send(post);
            })
            .catch(() => res.status(404).send(`Post ${key.toString()} not found`));
    });

    const httpServer = app.listen(port, hostname, () => {
        const address = httpServer.address() as AddressInfo;
        console.info(`🐦 Server running at http://${hostname}:${address.port}`);
    });
}

// Entry Point
main().then().catch(console.error);
