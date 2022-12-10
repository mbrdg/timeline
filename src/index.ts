// SDLE @ M.EIC, 2022
// T4G14

import express from 'express';
import cors from 'cors';
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

import { importSPKI, compactVerify } from 'jose';

import cli from './tlcli.js';
import {
    TLPost,
    TLPostId,
    TLInteraction,
    TLInteractionMetadata,
    TLPostInteraction,
    TLPostTopic,
    TLTopic
} from './tlpost.js';
import { TLUser, TLUserHandle } from './tluser.js';
import { TLConnection } from './social/tlconnection.js';


const main = async () => {

    const encoder = new TextEncoder();
    const decoder = new TextDecoder('utf-8');
    const algorithm = 'ES256';

    const [hostname, port] = ['localhost', cli.port];
    const app = express();

    // CORS for all origins, what a beautiful flaw
    app.use(cors());
    app.use(express.json());

    const createCID = (data: Readonly<Partial<TLUser | TLPost | TLTopic>>) => {
        const bytes = encoder.encode(JSON.stringify(data));
        const hash = sha256.digest(bytes) as Awaited<ReturnType<typeof sha256.digest>>;
        return CID.createV1(sha256.code, hash);
    };

    const update = <T>(value: Uint8Array, operation: (v: T) => T) => {
        let v = JSON.parse(decoder.decode(value)) as T;
        v = operation(v);
        return encoder.encode(JSON.stringify(v));
    };

    const store = (k: CID, v: Uint8Array, errorMessage: string, p?: CID) => {
        node.contentRouting.put(k.bytes, v)
            .then(() => p ? node.contentRouting.provide(p) : node.contentRouting.provide(k))
            .catch(() => { throw new Error(errorMessage)});
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
        const { handle, publicKey } = req.body as { handle: TLUserHandle } & { publicKey: string };
        const user: Readonly<TLUser> = {
            handle: handle,
            publicKey: publicKey,
            followers: [],
            following: [],
            timeline: []
        } as Readonly<TLUser>;

        const value = encoder.encode(JSON.stringify(user));

        console.log(`🐦 Received registration request: ${handle}`);

        const key = createCID({ handle: handle });

        const validate = () =>
            importSPKI(publicKey, algorithm)
                .catch(() => { throw new Error(`The public keys must be in SPKI format`); });

        node.contentRouting.get(key.bytes)
            .then(() => res.status(303).send({ message: `${handle} already exists` }))
            .catch(() => validate()
                .then(() => store(key, value, `Unable to register ${handle}`))
                .then(() => res.status(201).send({ message: `${handle} is now registered` }))
                .catch((err: Error) => res.status(400).send({ message: err.message })));
    });

    app.get('/timeline/:handle', (req, res) => {
        const { handle } = req.params as Pick<TLUser, 'handle'>;
        const key = createCID({ handle: handle });

        const getUserTimeline = (handle: TLUserHandle) => {
            const cid = createCID({ handle: handle });

            return (async () => {
                const value = await node.contentRouting.get(cid.bytes);
                const user = JSON.parse(decoder.decode(value)) as TLUser;
                return user.timeline;
            })();
        };

        type TLTimelineInteraction = (TLPost & Omit<TLInteractionMetadata, 'timestamp'>);
        const getTimelinePosts = (interactions: TLInteractionMetadata[]) => {
            return Promise.all(interactions.map(post => {
                const cid = CID.parse(post.id);
                const metadata = post as Omit<TLInteractionMetadata, 'timestamp'>;

                return (async () => {
                    const value = await node.contentRouting.get(cid.bytes);
                    const post = JSON.parse(decoder.decode(value)) as TLPost;
                    return { ...post, ...metadata } as TLTimelineInteraction;
                })();
            }));
        };

        node.contentRouting.get(key.bytes)
            .then(value => JSON.parse(decoder.decode(value)) as Pick<TLUser, 'timeline' | 'following'>)
            .then(user =>
                Promise.all(Array.from(user.following).map(async (handle) => await getUserTimeline(handle)))
                    .then(timelines => [...timelines, user.timeline])
            )
            .then(timelines =>
                timelines.flat()
                    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
                    .slice(0, 127)
            )
            .then(getTimelinePosts)
            .then(mixed => res.status(200).send(mixed))
            .catch((err: Error) => res.send(400).send({ message: err.message }));
    });

    app.get('/:handle', (req, res) => {
        const { handle } = req.params as Pick<TLUser, 'handle'>;
        const key = createCID({ handle: handle });

        node.contentRouting.get(key.bytes)
            .then(value => decoder.decode(value))
            .then(user => res.status(302).send(user))
            .catch(() => res.status(404).send({ message: `User ${handle} not found` }));
    });

    app.get('/post/:id', (req, res) => {
        const { id } = req.params;
        const key = CID.parse(id);

        node.contentRouting.get(key.bytes)
            .then(value => decoder.decode(value))
            .then(post => res.status(302).send(post))
            .catch(() => res.status(404).send({ message: `Post not found` }));
    });

    app.get('/topic/:topic', (req, res) => {
        const { topic } = req.params as Pick<TLTopic, 'topic'>;
        const key = createCID({ topic: topic });

        const getTopicPosts = async (topic: TLTopic) => {
            return Promise.all(topic.timeline.map(post => {
                const cid = CID.parse(post);
                return (async () => {
                    const value = await node.contentRouting.get(cid.bytes);
                    const postObj = JSON.parse(decoder.decode(value)) as TLPost;
                    return { ...postObj, id: post } as TLPost & { id: TLPostId };
                })();
            }));
        };

        node.contentRouting.get(key.bytes)
            .then(value => JSON.parse(decoder.decode(value)) as TLTopic)
            .then(getTopicPosts)
            .then((posts) => res.status(200).send(posts))
            .catch((err) => { console.error(err); res.sendStatus(500); });
    });

    app.post('/publish', (req, res) => {
        const { handle, signature } = req.body as { handle: TLUserHandle } & { signature: string };
        const timestamp = new Date();

        const userCID = createCID({ handle: handle });
        const postCID = createCID({ handle: handle, timestamp: timestamp });

        type TLValidationResult = { user: TLUser } & { post: Pick<TLPost, 'content' | 'topics'> };
        const validator = (user: TLUser) =>
            importSPKI(user.publicKey, algorithm)
                .then(publicKey => compactVerify(signature, publicKey))
                .then(res => JSON.parse(decoder.decode(res.payload)) as Pick<TLPost, 'content' | 'topics'>)
                .then(post => ({ user, post }) as TLValidationResult)
                .catch(() => { throw new Error(`Signature and Public Key mismatch`); });

        const createPost = (props: TLValidationResult) => {
            if (props.post.content.length === 0)
                throw new Error(`Who the f*ck posts an empty post?!`);

            const post: Readonly<TLPost> = {
                handle: handle,
                content: props.post.content,
                timestamp: timestamp,
                topics: props.post.topics,
                reposts: [],
                likes: [],
            };

            const value = encoder.encode(JSON.stringify(post));
            store(postCID, value, `Unable to store the given post`);
            return props;
        }

        const createInteraction = (props: TLValidationResult) => {
            const interaction: TLInteractionMetadata = {
                who: handle,
                id: postCID.toString(),
                interaction: TLPostInteraction.POST,
                timestamp: timestamp,
            };
            props.user.timeline.push(interaction);
            const value = encoder.encode(JSON.stringify(props.user));
            store(userCID, value, `Uable to publish the post in the timeline of ${handle}`);
            return props;
        }

        console.info(`🐦 Received publishing request from ${handle}`);

        const createTopic = (topic: TLPostTopic) => {
            const topicInfo: Readonly<TLTopic> = {
                topic: topic,
                timeline: [postCID.toString()]
            };
            const topicValue = encoder.encode(JSON.stringify(topicInfo));
            return topicValue;
        };

        const addPostToTopic = (props: TLValidationResult) => {
            return Promise.all(props.post.topics.map(topic => {
                const topicCID = createCID({ topic: topic });
                return node.contentRouting.get(topicCID.bytes)
                    .then(value =>
                        update<TLTopic>(value, topic => {
                            topic.timeline.push(postCID.toString());
                            return topic;
                        }))
                    .catch(() => createTopic(topic))
                    .then(value => store(topicCID, value, `Unable to add the post to the timeline of ${topic}`));
            }));
        };

        node.contentRouting.get(userCID.bytes)
            .then(value => JSON.parse(decoder.decode(value)) as TLUser)
            .then(validator)
            .then(createPost)
            .then(createInteraction)
            .then(addPostToTopic)
            .then(() => res.status(201).send({ id: postCID.toString() }))
            .catch((err: Error) => res.status(400).send({ message: err.message }));
    });

    app.post('/repost', (req, res) => {
        const { handle, signature } = req.body as { handle: TLUserHandle } & { signature: string };
        console.info(`🐦 Received repost request from ${handle}\n`);

        const userCID = createCID({ handle: handle });

        type TLValidatorInteraction = { user: TLUser } & { post: TLPostId };
        const validator = (user: TLUser) =>
            importSPKI(user.publicKey, algorithm)
                .then(publicKey => compactVerify(signature, publicKey))
                .then(res => JSON.parse(decoder.decode(res.payload)) as Pick<TLInteraction, 'id'>)
                .then(post => ({ user, post: post.id }) as TLValidatorInteraction)
                .catch(() => { throw new Error(`Signature and Public Key mismatch`); });

        const updatePost = (id: TLPostId) => {
            const postCID = CID.parse(id);
            node.contentRouting.get(postCID.bytes)
                .then(value => update<TLPost>(value, post => {
                    if (post.reposts.includes(handle))
                        throw new Error(`${handle} already reposted ${id}`);

                    post.reposts.push(handle);
                    return post;
                }))
                .then(value => store(postCID, value, `Unable to update the post with the repost information`))
                .catch(err => { throw err; });
        };

        const updateUser = (props: TLValidatorInteraction) => {
            const interaction: TLInteractionMetadata = {
                who: props.user.handle,
                id: props.post,
                interaction: TLPostInteraction.REPOST,
                timestamp: new Date(),
            };
            props.user.timeline.push(interaction);
            const value = encoder.encode(JSON.stringify(props.user));
            store(userCID, value, `Unable to respost ${props.post} to the timeline of ${handle}`);
        };

        node.contentRouting.get(userCID.bytes)
            .then(value => JSON.parse(decoder.decode(value)) as TLUser)
            .then(validator)
            .then(props => Promise.all([updatePost(props.post), updateUser(props)])
                    .then(() => res.status(200).send({ id: props.post }))
                    .catch((err: Error) => { throw err; })
            )
            .catch((err: Error) => res.status(400).send({ message: err.message }));

    });

    app.post('/like', (req, res) => {
        const { handle, signature } = req.body as { handle: TLUserHandle } & { signature: string };
        console.info(`🐦 Received like request from ${handle}}\n`);

        const userCID = createCID({ handle: handle });

        type TLValidatorInteraction = { user: TLUser } & { post: TLPostId };
        const validator = (user: TLUser) =>
            importSPKI(user.publicKey, algorithm)
                .then(publicKey => compactVerify(signature, publicKey))
                .then(res => JSON.parse(decoder.decode(res.payload)) as Pick<TLInteraction, 'id'>)
                .then(post => ({ user, post: post.id }) as TLValidatorInteraction)
                .catch(() => { throw new Error(`Signature and Public Key mismatch`); });

        const updatePost = (id: TLPostId) => {
            const postCID = CID.parse(id);
            node.contentRouting.get(postCID.bytes)
                .then(value => update<TLPost>(value, post => {
                    if (post.likes.includes(handle))
                        throw new Error(`${handle} has already liked ${id}`);

                    post.likes.push(handle);
                    return post;
                }))
                .then(value => store(postCID, value, `Unable to update the post with the like information`))
                .catch(console.error);
        };

        const updateUser = (props: TLValidatorInteraction) => {
            const interaction: TLInteractionMetadata = {
                who: props.user.handle,
                id: props.post,
                interaction: TLPostInteraction.LIKE,
                timestamp: new Date(),
            };
            props.user.timeline.push(interaction);
            const value = encoder.encode(JSON.stringify(props.user));
            store(userCID, value, `Unable to add the like of ${props.post} to the timeline of ${handle}`);
        };

        node.contentRouting.get(userCID.bytes)
            .then(value => JSON.parse(decoder.decode(value)) as TLUser)
            .then(validator)
            .then(props => Promise.all([updatePost(props.post), updateUser(props)])
                    .then(() => res.status(200).send({ id: props.post }))
                    .catch((err: Error) => { throw err; })
            )
            .catch((err: Error) => res.status(400).send({ message: err.message }));
    });

    app.post('/follow', (req, res) => {
        const { from, signature } = req.body as Pick<TLConnection, 'from'> & { signature: string };

        const fromCID = createCID({ handle: from });

        interface TLUserCID { handle: TLUserHandle, cid: CID }
        type TLValidatorFollow = { from: TLUser } & { to: TLUserCID };
        const validator = (user: TLUser) =>
            importSPKI(user.publicKey, algorithm)
                .then(publicKey => compactVerify(signature, publicKey))
                .then(res => JSON.parse(decoder.decode(res.payload)) as Pick<TLConnection, 'to'>)
                .then(userTo => ({ handle: userTo.to, cid: createCID({ handle: userTo.to }) }) as TLUserCID)
                .then(userTo => ({ from: user, to: userTo }) as TLValidatorFollow)
                .catch(() => { throw new Error(`Signature and Public Key mismatch`); });

        const followed = (to: TLUserCID) => node.contentRouting.get(to.cid.bytes)
            .then(value => update<TLUser>(value, user => {
                if (user.followers.includes(from))
                    throw new Error(`${from} already follows ${to.handle}`);

                user.followers.push(from);
                return user;
            }))
            .then(value => node.contentRouting.put(to.cid.bytes, value))
            .catch(console.error);

        const follower = (props: TLValidatorFollow) => {
            if (props.from.following.includes(props.to.handle))
                throw new Error(`${props.to.handle} is already followed by ${from}`);

            props.from.following.push(props.to.handle);
            const value = encoder.encode(JSON.stringify(props.from));
            store(fromCID, value, `Unable to connect ${from} to ${props.to.handle}`, props.to.cid);
        };

        node.contentRouting.get(fromCID.bytes)
            .then(value => JSON.parse(decoder.decode(value)) as TLUser)
            .then(validator)
            .then(props => Promise.all([followed(props.to), follower(props)])
                    .then(() => res.status(200).send({ message: `${props.from.handle} now follows ${props.to.handle}` }))
                    .catch((err: Error) => { throw err; })
            )
            .catch((err: Error) => res.status(400).send({ message: err.message }));
    });

    app.post('/unfollow', (req, res) => {
        const { from, signature } = req.body as Pick<TLConnection, 'from'> & { signature: string };

        const fromCID = createCID({ handle: from });

        interface TLUserCID { handle: TLUserHandle, cid: CID }
        type TLValidatorUnfollow = { from: TLUser } & { to: TLUserCID };
        const validator = (user: TLUser) =>
            importSPKI(user.publicKey, algorithm)
                .then(publicKey => compactVerify(signature, publicKey))
                .then(res => JSON.parse(decoder.decode(res.payload)) as Pick<TLConnection, 'to'>)
                .then(userTo => ({ handle: userTo.to, cid: createCID({ handle: userTo.to }) }) as TLUserCID)
                .then(userTo => ({ from: user, to: userTo }) as TLValidatorUnfollow)
                .catch(() => { throw new Error(`Signature and Public Key mismatch`); });

        const unfollowed = (to: TLUserCID) => node.contentRouting.get(to.cid.bytes)
            .then(value => update<TLUser>(value, user => {
                if (!user.followers.includes(from)) {
                    throw new Error(`${from} does not follow ${user.handle}`)
                }

                user.followers = user.followers.filter(u => u !== from);
                return user;
            }))
            .then(value => node.contentRouting.put(to.cid.bytes, value))
            .catch((err: Error) => { throw err; });

        const unfollower = (props: TLValidatorUnfollow) => {
            if (!props.from.following.includes(props.to.handle)) {
                throw new Error(`${props.from.handle} does not follow ${props.to.handle}`)
            }

            props.from.following = props.from.following.filter(u => u !== props.to.handle);
            const value = encoder.encode(JSON.stringify(props.from));
            return node.contentRouting.put(fromCID.bytes, value);
        };

        node.contentRouting.get(fromCID.bytes)
            .then(value => JSON.parse(decoder.decode(value)) as TLUser)
            .then(validator)
            .then(props => Promise.all([unfollowed(props.to), unfollower(props)])
                    .then(() => res.status(200).send({ message: `${props.from.handle} no longer follows ${props.to.handle}` }))
                    .catch((err: Error) => { throw err; })
            )
            .catch((err: Error) => res.status(400).send({ message: err.message }));
    });

    app.post('/remove/like', (req, res) => {
        const { handle, signature } = req.body as { handle: TLUserHandle } & { signature: string };
        console.info(`🐦 Received like removal request from ${handle}`);

        const userCID = createCID({ handle: handle });

        type TLValidatorInteraction = { user: TLUser } & { post: TLPostId };
        const validator = (user: TLUser) =>
            importSPKI(user.publicKey, algorithm)
                .then(publicKey => compactVerify(signature, publicKey))
                .then(res => JSON.parse(decoder.decode(res.payload)) as Pick<TLInteraction, 'id'>)
                .then(post => ({ user, post: post.id }) as TLValidatorInteraction)
                .catch(() => { throw new Error(`Signature and Public Key mismatch`); });
        
        const updatePost = (props: TLValidatorInteraction) => {
            const postCID = CID.parse(props.post);
            return node.contentRouting.get(postCID.bytes)
                .then(value => update<TLPost>(value, post => {
                    if (!post.likes.includes(handle))
                        throw new Error(`${handle} does not like ${props.post}`);

                    post.likes = post.likes.filter(u => u !== handle);
                    return post;
                }))
                .then(value => store(postCID, value, `Unable to update the post with the like information`))
                .then(() => props)
                .catch((err: Error) => { throw err; });
        };

        const updateUser = (props: TLValidatorInteraction) => {
            props.user.timeline = props.user.timeline.filter(u => !(u.who === handle && u.id == props.post && u.interaction === TLPostInteraction.LIKE));
            const value = encoder.encode(JSON.stringify(props.user));
            store(userCID, value, `Unable to remove the like of ${props.post} to the timeline of ${handle}`);
            return props;
        };

        node.contentRouting.get(userCID.bytes)
            .then(value => JSON.parse(decoder.decode(value)) as TLUser)
            .then(validator)
            .then(updatePost)
            .then(updateUser)
            .then(props => res.status(200).send({ message: `${handle} removed like from ${props.post}` }))
            .catch((err: Error) => res.status(400).send({ message: err.message }));
    });

    app.post('/remove/repost', (req, res) => {
        const { handle, signature } = req.body as { handle: TLUserHandle } & { signature: string };
        console.info(`🐦 Received repost request from ${handle}\n`);

        const userCID = createCID({ handle: handle });

        type TLValidatorInteraction = { user: TLUser } & { post: TLPostId };
        const validator = (user: TLUser) =>
            importSPKI(user.publicKey, algorithm)
                .then(publicKey => compactVerify(signature, publicKey))
                .then(res => JSON.parse(decoder.decode(res.payload)) as Pick<TLInteraction, 'id'>)
                .then(post => ({ user, post: post.id }) as TLValidatorInteraction)
                .catch(() => { throw new Error(`Signature and Public Key mismatch`); });

        const updatePost = (props: TLValidatorInteraction) => {
            const postCID = CID.parse(props.post);
            return node.contentRouting.get(postCID.bytes)
                .then(value => update<TLPost>(value, post => {
                    if (!post.reposts.includes(handle))
                        throw new Error(`${handle} has not reposted ${props.post}`);

                    post.reposts = post.reposts.filter(u => u !== handle);
                    return post;
                }))
                .then(value => store(postCID, value, `Unable to update the post with the repost information`))
                .then(() => props)
                .catch(err => { throw err; });
        };

        const updateUser = (props: TLValidatorInteraction) => {
            props.user.timeline = props.user.timeline.filter(u => !(u.who === handle && u.id === props.post && u.interaction === TLPostInteraction.REPOST))
            const value = encoder.encode(JSON.stringify(props.user));
            store(userCID, value, `Unable to remove respost of ${props.post} from the timeline of ${handle}`);
            return props;
        };

        node.contentRouting.get(userCID.bytes)
            .then(value => JSON.parse(decoder.decode(value)) as TLUser)
            .then(validator)
            .then(updatePost)
            .then(updateUser)
            .then(props => res.status(200).send({ message: `${handle} removed repost from ${props.post}` }))
            .catch((err: Error) => res.status(400).send({ message: err.message })); 
    });

    const httpServer = app.listen(port, hostname, () => {
        const address = httpServer.address() as AddressInfo;
        console.info(`🐦 Server running at http://${hostname}:${address.port}`);
    });
}

// Entry Point
main().then().catch(console.error);
