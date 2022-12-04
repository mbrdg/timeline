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

import all from 'it-all';
import type { QueryOptions } from '@libp2p/interface-dht';

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

    const hasCID = async (cid : CID) => {
        try { 
            await all(node.contentRouting.findProviders(
                cid,
                {queryFuncTimeout: 3000} as QueryOptions
            ));
            return true;
        } catch (err) {
            return false;
        }
    };

    app.post('/register', (req, res) => {
        void (async () => {
            const { handle } = req.body as Pick<TLUser, "handle">;
            const user: Readonly<TLUser> = {
                handle: handle,
                followers: new Set<TLUserHandle>(),
                following: new Set<TLUserHandle>(),
                posts: [],
            };
            console.log(`🐦 Server received the following registration request\n`, user);
    
            const key = createCID({ handle: user.handle });
            
            if (await hasCID(key)) {
                console.info(`🚨 Aborting: this handle is already in use: ${handle}`);
                res.status(400).send(`This handle is already in use: ${handle}`);
                return; 
            }
            console.info(`⌛ Proceeding to the ${handle} registration`);
        
            const value = encoder.encode(JSON.stringify(user));
    
            node.contentRouting.put(key.bytes, value)
                .then(() => {
                    node.contentRouting.provide(key)
                        .then(() => {
                            console.info(`✅ ${handle} was successfully registered`)
                            res.status(201).send(`User registered successfully`);
                        })
                        .catch(err => res.status(500).send(err));
                })
                .catch(err => {
                    console.error(err);
                    res.status(400).send(`Unable to fullfill the registration request`);
                });
        })();
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
        void (async () => {
            const { handle, content } = req.body as Pick<TLPost, "handle" | "content">;
            const post: Readonly<Omit<TLPost, "handle">> = {
                content: content,
                timestamp: new Date(),
                reposts: new Set<TLUserHandle>(),
                likes: new Set<TLUserHandle>(),
            };
            console.info(`🐦 Server received the following publishing request\n`, post);
    
            const user = createCID({ handle: handle });
            if (!await hasCID(user)) {
                console.info(`🚨 Aborting: there is no user with the handle: ${handle}`);
                res.status(400).send(`Invalid handle: ${handle}`);
                return;
            }
            console.info(`⌛ Publishing...`);

            node.contentRouting.get(user.bytes)
            .then(result => {
                const user_content = JSON.parse(decoder.decode(result)) as TLUser;
                user_content.posts.push(post);
                const new_user = encoder.encode(JSON.stringify(user_content));
                node.contentRouting.put(user.bytes, new_user)
                    .then(() => {
                        console.info(`✅ ${handle}'s post was successfully published`);
                        res.status(200).send(user.toString());
                    })
                    .catch(() => {
                        console.error(`💥 Error while publishing the new ${handle} post: `, post);
                        res.status(500);
                    });
            })
            .catch(console.error);
        })();
    });

    const httpServer = app.listen(port, hostname, () => {
        const address = httpServer.address() as AddressInfo;
        console.info(`🐦 Server running at http://${hostname}:${address.port}`);
    });
}

// Entry Point
main().then().catch(console.error);
