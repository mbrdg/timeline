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
import TLConnection from './social/tlconnection.js';


const main = async () => {

    const encoder = new TextEncoder();
    const decoder = new TextDecoder("utf-8");

    const [hostname, port] = ['localhost', 0];
    const app = express();
    app.use(express.json());

    const createCID = (data: Readonly<Partial<TLUser | TLPost>>) => {
        const bytes = encoder.encode(JSON.stringify(data));
        const hash = sha256.digest(bytes) as Awaited<ReturnType<typeof sha256.digest>>;
        return CID.createV1(sha256.code, hash);
    };

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
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        const peer = event.detail as PeerInfo;
        console.debug(`🔎 Discovered peer ${peer.multiaddrs.toString()}`);

        node.peerStore.addressBook.set(peer.id, peer.multiaddrs)
            .catch(console.error);

        node.dial(peer.id)
            .catch(console.error);
    });

    node.connectionManager.addEventListener('peer:connect', (event) => {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        const connection = event.detail as Connection;
        console.debug(`✅ Connected peer ${connection.remotePeer.toString()}`);
    });
    node.connectionManager.addEventListener('peer:disconnect', (event) => {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        const connection = event.detail as Connection;
        console.debug(`❌ Disconnected peer ${connection.remotePeer.toString()}`);
    });

    await node.start();
    console.info(`🐦 libp2p node has started`);

    app.post('/register', (req, res) => {
        const { handle } = req.body as Pick<TLUser, "handle">;
        const user: Readonly<TLUser> = {
            handle: handle,
            followers: new Array<TLUserHandle>(),
            following: new Array<TLUserHandle>(),
            posts: new Array<TLPost>(),
        };
        console.log(`🐦 Server received the following registration request\n`, user);

        const key = createCID({ handle: user.handle });
        const value = encoder.encode(JSON.stringify(user));
        const register = () => {
            node.contentRouting.put(key.bytes, value)
                .then(() => node.contentRouting.provide(key))
                .then(() => res.status(201).send(`User registered successfully`))
                .catch(err => {
                    console.error(err);
                    res.status(400).send(`Unable to fullfill the registration request`);
                });
        };

        node.contentRouting.get(key.bytes)
            .then(() => res.status(303).send(`${handle} already exists`))
            .catch(register);
    });

    app.get('/:handle', (req, res) => {
        const { handle } = req.params as Pick<TLUser, "handle">;
        const key = createCID({ handle: handle });

        node.contentRouting.get(key.bytes)
            .then(value => decoder.decode(value))
            .then(user => res.status(302).send(user))
            .catch(() => res.status(404).send(`User ${handle} not found`));
    });

    app.post('/publish', (req, res) => {
        const { handle, content } = req.body as Pick<TLPost, "handle" | "content">;
        const post: Readonly<Omit<TLPost, "handle">> = {
            content: content,
            timestamp: new Date(),
            reposts: new Array<TLUserHandle>(),
            likes: new Array<TLUserHandle>(),
        };
        console.info(`🐦 Server received the following publishing request\n`, post);

        const key = createCID({ handle: handle });
        const publish = (value: Uint8Array) => {
            node.contentRouting.put(key.bytes, value)
                .then(() => node.contentRouting.provide(key))
                .then(() => res.status(201).send(`Post published successfully`))
                .catch(() => res.status(400).send(`Unable to fullfill the publishing request`));
        };

        node.contentRouting.get(key.bytes)
            .then(value => JSON.parse(decoder.decode(value)) as TLUser)
            .then(user => user.posts.push(post))
            .then(value => encoder.encode(JSON.stringify(value)))
            .then(publish)
            .catch(console.error);
    });

    app.post('/follow', (req, res) => {
        const { from, to } = req.body as TLConnection;

        const toCID = createCID({ handle: to });
        const fromCID = createCID({ handle: from });

        const followed = node.contentRouting.get(toCID.bytes)
            .then(value => JSON.parse(decoder.decode(value)) as TLUser)
            .then(user => {
                if (!user.followers.includes(from))
                    user.followers.push(from);
                return user;
            })
            .then(value => encoder.encode(JSON.stringify(value)))
            .then(value => node.contentRouting.put(toCID.bytes, value))
            .catch(console.error);

        const follower = node.contentRouting.get(fromCID.bytes)
            .then(value => JSON.parse(decoder.decode(value)) as TLUser)
            .then(user => {
                if (!user.following.includes(to))
                    user.following.push(to);
                return user;
            })
            .then(value => encoder.encode(JSON.stringify(value)))
            .then(value => node.contentRouting.put(fromCID.bytes, value))
            .then(() => node.contentRouting.provide(toCID))
            .catch(console.error);

        Promise.all([followed, follower])
            .then(() => res.status(200).send(`${from} now follows ${to}`))
            .catch(() => res.status(400).send(`Unable to fullfill the follow request`));
    });

    app.post('/unfollow', (req, res) => {
        const { from, to } = req.body as TLConnection;

        const toCID = createCID({ handle: to });
        const fromCID = createCID({ handle: from });

        const unfollowed = node.contentRouting.get(toCID.bytes)
            .then(value => JSON.parse(decoder.decode(value)) as TLUser)
            .then(user => {
                user.followers.filter(u => u !== from);
                return user;
            })
            .then(value => encoder.encode(JSON.stringify(value)))
            .then(value => node.contentRouting.put(toCID.bytes, value))
            .catch(console.error);

        const unfollower = node.contentRouting.get(fromCID.bytes)
            .then(value => JSON.parse(decoder.decode(value)) as TLUser)
            .then(user => {
                user.following.filter(u => u !== to);
                return user;
            })
            .then(value => encoder.encode(JSON.stringify(value)))
            .then(value => node.contentRouting.put(fromCID.bytes, value))
            .catch(console.error);

        Promise.all([unfollowed, unfollower])
            .then(() => res.status(200).json(`${from} no longer follows ${to}`))
            .catch(() => res.status(400).send(`Unable to fullfill the unfollow request`));
    });

    const httpServer = app.listen(port, hostname, () => {
        const address = httpServer.address() as AddressInfo;
        console.info(`🐦 Server running at http://${hostname}:${address.port}`);
    });
}

// Entry Point
main().then().catch(console.error);
