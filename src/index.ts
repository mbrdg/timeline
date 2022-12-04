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

import { TLPost, TLInteraction, TLPostId } from './tlpost.js';
import { TLUser, TLUserHandle } from './tluser.js';
import { TLConnection } from './social/tlconnection.js';


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
            posts: new Array<TLPostId>(),
            reposts: new Array<TLPostId>(),
            likes: new Array<TLPostId>()
        };
        console.log(`🐦 Received registration request\n`, user);

        const key = createCID({ handle: user.handle });
        const value = encoder.encode(JSON.stringify(user));
        const register = () => {
            node.contentRouting.put(key.bytes, value)
                .then(() => node.contentRouting.provide(key))
                .then(() => res.sendStatus(201))
                .catch(() => res.sendStatus(400));
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
            .then(user => res.status(302).json(user))
            .catch(() => res.sendStatus(404));
    });

    app.get('/post/:id', (req, res) => {
        const { id } = req.params;
        const key = CID.parse(id);

        node.contentRouting.get(key.bytes)
            .then(value => decoder.decode(value))
            .then(post => res.status(302).json(post))
            .catch(() => res.sendStatus(404));
    });

    app.post('/publish', (req, res) => {
        const { handle, content } = req.body as Pick<TLPost, "handle" | "content">;
        const post: Readonly<TLPost> = {
            handle: handle,
            content: content,
            timestamp: new Date(),
            reposts: new Array<TLUserHandle>(),
            likes: new Array<TLUserHandle>(),
        };
        console.info(`🐦 Received publishing request\n`, post);

        const userCID = createCID({ handle: handle });
        const postCID = createCID({ handle: handle, timestamp: post.timestamp });
        const postValue = encoder.encode(JSON.stringify(post));

        const store = (key: CID, value: Uint8Array) => {
            node.contentRouting.put(key.bytes, value)
                .then(() => node.contentRouting.provide(key))
                .catch(console.error);
        };

        node.contentRouting.get(userCID.bytes)
            .then(value => {
                store(postCID, postValue);
                return value;
            })
            .then(user => JSON.parse(decoder.decode(user)) as TLUser)
            .then(user => {
                user.posts.push(postCID.toString());
                return user;
            })
            .then(user => encoder.encode(JSON.stringify(user)))
            .then(value => store(userCID, value))
            .then(() => res.sendStatus(201))
            .catch(() => res.sendStatus(400));
    });

    app.post('/repost', (req, res) => {
        const { handle, id } = req.body as TLInteraction;
        console.info(`🐦 Received repost request ${handle}-${id}\n`);

        const postCID = CID.parse(id);
        const userCID = createCID({ handle: handle });

        const store = (k: CID, v: Uint8Array) => {
            node.contentRouting.put(k.bytes, v)
                .then(() => node.contentRouting.provide(k))
                .catch(console.error);
        };

        const updatePost = node.contentRouting.get(postCID.bytes)
            .then(value => JSON.parse(decoder.decode(value)) as TLPost)
            .then(post => {
                if (post.reposts.includes(handle))
                    throw new Error(`${handle} already reposted ${id}`);

                post.reposts.push(handle);
                return post;
            })
            .then(post => encoder.encode(JSON.stringify(post)))
            .then(value => store(postCID, value))
            .catch(console.error);

        const updateUser = node.contentRouting.get(userCID.bytes)
            .then(value => JSON.parse(decoder.decode(value)) as TLUser)
            .then(user => {
                if (user.reposts.includes(id))
                    throw new Error(`${handle} already reposted ${id}`);

                user.reposts.push(id);
                return user;
            })
            .then(user => encoder.encode(JSON.stringify(user)))
            .then(value => store(userCID, value))
            .catch(console.error);

        Promise.all([updatePost, updateUser])
            .then(() => res.sendStatus(200))
            .catch(() => res.sendStatus(400));
    });

    app.post('/like', (req, res) => {
        const { handle, id } = req.body as TLInteraction;
        console.info(`🐦 Received repost request ${handle}-${id}\n`);

        const postCID = CID.parse(id);
        const userCID = createCID({ handle: handle });

        const store = (k: CID, v: Uint8Array) => {
            node.contentRouting.put(k.bytes, v)
                .then(() => node.contentRouting.provide(k))
                .catch(console.error);
        };

        const updatePost = node.contentRouting.get(postCID.bytes)
            .then(value => JSON.parse(decoder.decode(value)) as TLPost)
            .then(post => {
                if (post.likes.includes(handle))
                    throw new Error(`${handle} has already reposted ${id}`);

                post.likes.push(handle);
                return post;
            })
            .then(post => encoder.encode(JSON.stringify(post)))
            .then(value => store(postCID, value))
            .catch(console.error);

        const updateUser = node.contentRouting.get(userCID.bytes)
            .then(value => JSON.parse(decoder.decode(value)) as TLUser)
            .then(user => {
                if (user.likes.includes(id))
                    throw new Error(`${handle} has already liked ${id}`);

                user.likes.push(id);
                return user;
            })
            .then(user => encoder.encode(JSON.stringify(user)))
            .then(value => store(userCID, value))
            .catch(console.error)

        Promise.all([updatePost, updateUser])
            .then(() => res.sendStatus(200))
            .catch(() => res.sendStatus(400));
    });

    app.post('/follow', (req, res) => {
        const { from, to } = req.body as TLConnection;

        const toCID = createCID({ handle: to });
        const fromCID = createCID({ handle: from });

        const followed = node.contentRouting.get(toCID.bytes)
            .then(value => JSON.parse(decoder.decode(value)) as TLUser)
            .then(user => {
                if (user.followers.includes(from))
                    throw new Error(`${from} already follows ${to}`);

                user.followers.push(from);
                return user;
            })
            .then(value => encoder.encode(JSON.stringify(value)))
            .then(value => node.contentRouting.put(toCID.bytes, value))
            .catch(console.error);

        const follower = node.contentRouting.get(fromCID.bytes)
            .then(value => JSON.parse(decoder.decode(value)) as TLUser)
            .then(user => {
                if (user.following.includes(to))
                    throw new Error(`${to} is already followed by ${from}`);

                user.following.push(to);
                return user;
            })
            .then(value => encoder.encode(JSON.stringify(value)))
            .then(value => node.contentRouting.put(fromCID.bytes, value))
            .then(() => node.contentRouting.provide(toCID))
            .catch(console.error);

        Promise.all([followed, follower])
            .then(() => res.sendStatus(200))
            .catch(() => res.sendStatus(400));
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
            .then(() => res.sendStatus(200))
            .catch(() => res.sendStatus(400));
    });

    const httpServer = app.listen(port, hostname, () => {
        const address = httpServer.address() as AddressInfo;
        console.info(`🐦 Server running at http://${hostname}:${address.port}`);
    });
}

// Entry Point
main().then().catch(console.error);
