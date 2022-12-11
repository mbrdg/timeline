// SDLE @ M.EIC, 2022
// T4G14

import express from "express";
import cors from "cors";
import { AddressInfo } from "net";

import { createLibp2p } from "libp2p";
import { tcp } from "@libp2p/tcp";
import { noise } from "@chainsafe/libp2p-noise";
import { mdns } from "@libp2p/mdns";
import { mplex } from "@libp2p/mplex";
import { kadDHT } from "@libp2p/kad-dht";
import type { PeerInfo } from "@libp2p/interface-peer-info";
import type { Connection } from "@libp2p/interface-connection";

import { CID } from "multiformats/cid";
import { sha256 } from "multiformats/hashes/sha2";

import { importSPKI, compactVerify } from "jose";

import NodeCache from "node-cache";

import cli from "./tlcli.js";
import { TLUserHandle, TLUser, TLUserRegistration } from "./tluser.js";
import { TLPost, TLPostId } from "./tlpost.js";
import { TLTopic, TLTopicName } from "./tltopic.js";
import {
  TLInteraction,
  TLInteractionMetadata,
  TLInteractionAction,
  TLSignedInteraction,
} from "./social/tlinteraction.js";
import { TLConnection, TLSignedConnection } from "./social/tlconnection.js";

const main = async () => {
  const encoder = new TextEncoder();
  const decoder = new TextDecoder("utf-8");
  const algorithm = "ES256";
  const cache = new NodeCache();

  const [hostname, port] = ["localhost", cli.port];
  const app = express();

  // CORS for all origins, what a beautiful flaw
  app.use(cors());
  app.use(express.json());

  const createCID = (data: Readonly<Partial<TLUser | TLPost | TLTopic>>) => {
    const bytes = encoder.encode(JSON.stringify(data));
    const hash = sha256.digest(bytes) as Awaited<
      ReturnType<typeof sha256.digest>
    >;
    return CID.createV1(sha256.code, hash);
  };

  const update = <T>(value: T, operation: (v: T) => T) => {
    const v = operation(value);
    return JSON.stringify(v);
  };

  const store = (
    k: CID,
    v: Uint8Array,
    msg: string,
    p?: CID,
    provide = true
  ) => {
    node.contentRouting
      .put(k.bytes, v)
      .then(() =>
        provide ? node.contentRouting.provide(p ? p : k) : Promise.resolve()
      )
      .catch(() => {
        throw new Error(msg);
      });
  };

  const validate = <P, R>(
    user: TLUser,
    signature: string,
    createReturn: (arg: P) => R
  ) =>
    importSPKI(user.key, algorithm)
      .then((key) => compactVerify(signature, key))
      .then((signed) => JSON.parse(decoder.decode(signed.payload)) as P)
      .then(createReturn)
      .catch(() => {
        throw new Error(`Signature and Public Key mismatch`);
      });

  const get = <T>(cid: CID) => {
    if (node.getConnections().length === 0) {
      const key = cid.toString();
      const value = cache.get(key);
      if (value === undefined)
        return Promise.reject(
          new Error(`The key ${key} does not exist in the cache`)
        );
      return Promise.resolve(JSON.parse(value as string) as T);
    }

    return node.contentRouting
      .get(cid.bytes)
      .then((value) => JSON.parse(decoder.decode(value)) as T);
  };

  const put = (
    cid: CID,
    value: string,
    errorMessage: string,
    provide = true,
    p?: CID
  ) =>
    node.getConnections().length === 0
      ? cache.set(cid.toString(), value)
      : store(cid, encoder.encode(value), errorMessage, p, provide);

  const node = await createLibp2p({
    addresses: {
      listen: ["/ip4/0.0.0.0/tcp/0"],
    },
    transports: [tcp()],
    connectionEncryption: [noise()],
    streamMuxers: [mplex()],
    peerDiscovery: [mdns()],
    dht: kadDHT(),
  });

  node.addEventListener("peer:discovery", (event) => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const peer = event.detail as PeerInfo;
    console.debug(`🔎 Discovered peer ${peer.multiaddrs.toString()}`);

    node.peerStore.addressBook
      .set(peer.id, peer.multiaddrs)
      .catch(console.error);

    node.dial(peer.id).catch(console.error);
  });

  node.connectionManager.addEventListener("peer:connect", (event) => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const connection = event.detail as Connection;
    console.debug(`✅ Connected peer ${connection.remotePeer.toString()}`);

    const toStore = cache.keys();
    if (toStore.length === 0) return;
    console.info(`📨 Transferring the data from the cache to the dht`);
    toStore.map((key) => {
      const cid = CID.parse(key);
      const storedValue = cache.take(key);
      if (storedValue !== undefined) {
        const value = encoder.encode(storedValue as string);
        node.contentRouting.put(cid.bytes, value).catch(console.error);
      }
      return key;
    });
  });
  node.connectionManager.addEventListener("peer:disconnect", (event) => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const connection = event.detail as Connection;
    console.debug(`❌ Disconnected peer ${connection.remotePeer.toString()}`);
  });

  await node.start();
  console.info(`🐦 libp2p node has started`);

  app.post("/register", (req, res) => {
    const { handle, key } = req.body as TLUserRegistration;
    const user: Readonly<TLUser> = {
      handle: handle,
      key: key,
      followers: [],
      following: [],
      timeline: [],
    };
    const userCID = createCID({ handle: handle });
    const value = JSON.stringify(user);

    console.info(`🆕 Received a register request from ${handle}`);

    const validate = () =>
      importSPKI(key, algorithm).catch(() => {
        throw new Error(`The public keys must be in SPKI format`);
      });

    get<TLUser>(userCID)
      .then(() => res.status(303).send({ message: `${handle} already exists` }))
      .catch(() =>
        validate()
          .then(() => put(userCID, value, `Unable to register ${handle}`))
          .then(() =>
            res.status(201).send({ message: `${handle} is now registered` })
          )
          .catch((err: Error) => res.status(400).send({ message: err.message }))
      );
  });

  app.get("/:handle", (req, res) => {
    const { handle } = req.params as Pick<TLUser, "handle">;
    const userCID = createCID({ handle: handle });

    console.info(`💡 Received a request for the profile of ${handle}`);

    get<TLUser>(userCID)
      .then((user) => res.status(302).send(user))
      .catch(() =>
        res.status(404).send({ message: `User ${handle} not found` })
      );
  });

  app.get("/timeline/:handle", (req, res) => {
    const { handle } = req.params as Pick<TLUser, "handle">;
    const key = createCID({ handle: handle });

    type TLTimelineInteraction = TLPost &
      Omit<TLInteractionMetadata, "timestamp">;

    console.info(`📜 Received a request for the timeline of ${handle}`);

    const userTimeline = (handle: TLUserHandle) => {
      const cid = createCID({ handle: handle });
      return get<TLUser>(cid)
        .then((user) => user.timeline)
        .catch(() => {
          throw new Error(`Unable to fetch timeline of ${handle}`);
        });
    };

    const timelinePosts = (interactions: TLInteractionMetadata[]) => {
      return Promise.all(
        interactions.map((post) => {
          const cid = CID.parse(post.id);
          const metadata = post as Omit<TLInteractionMetadata, "timestamp">;

          return (async () => {
            const post = await get<TLPost>(cid);
            return { ...post, ...metadata } as TLTimelineInteraction;
          })();
        })
      );
    };

    get<Pick<TLUser, "timeline" | "following">>(key)
      .then((user) =>
        Promise.all(
          Array.from(user.following).map(
            async (handle) => await userTimeline(handle)
          )
        ).then((timelines) => [...timelines, user.timeline])
      )
      .then((timelines) =>
        timelines
          .flat()
          .sort(
            (a, b) =>
              new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
          )
          .slice(0, 127)
      )
      .then(timelinePosts)
      .then((mixed) => res.status(200).send(mixed))
      .catch((err: Error) => res.status(400).send({ message: err.message }));
  });

  app.post("/publish", (req, res) => {
    const { handle, signature } = req.body as TLSignedInteraction;
    const timestamp = new Date();
    const userCID = createCID({ handle: handle });
    const postCID = createCID({ handle: handle, timestamp: timestamp });

    type TLValidationResult = { user: TLUser } & {
      post: Pick<TLPost, "content" | "topics">;
    };

    console.info(`📥 Received a publishing request from ${handle}`);

    const createPost = (props: TLValidationResult) => {
      if (props.post.content.length === 0)
        throw new Error(`Who does write an empty post?!`);

      const post: Readonly<TLPost> = {
        handle: handle,
        content: props.post.content,
        timestamp: timestamp,
        topics: props.post.topics,
        reposts: [],
        likes: [],
      };

      const value = JSON.stringify(post);
      put(postCID, value, `Unable to create post of ${handle} inside the DHT`);
      return props;
    };

    const createInteraction = (props: TLValidationResult) => {
      const interaction: Readonly<TLInteractionMetadata> = {
        who: handle,
        id: postCID.toString(),
        interaction: TLInteractionAction.POST,
        timestamp: timestamp,
      };
      props.user.timeline.push(interaction);

      const value = JSON.stringify(props.user);
      put(userCID, value, `Unable to publish in the timeline of ${handle}`);
      return props;
    };

    const createTopic = (name: TLTopicName) => {
      const topic: Readonly<TLTopic> = {
        topic: name,
        timeline: [postCID.toString()],
      };
      const value = JSON.stringify(topic);
      return value;
    };

    const publishOnTopic = (props: TLValidationResult) => {
      return Promise.all(
        props.post.topics.map((topic) => {
          const topicCID = createCID({ topic: topic });
          return get<TLTopic>(topicCID)
            .then((value) =>
              update<TLTopic>(value, (topic) => {
                topic.timeline.push(postCID.toString());
                return topic;
              })
            )
            .catch(() => createTopic(topic))
            .then((value) =>
              put(
                topicCID,
                value,
                `Unable to add the post to the timeline of ${topic}`
              )
            );
        })
      );
    };

    get<TLUser>(userCID)
      .then((user) =>
        validate<Pick<TLPost, "content" | "topics">, TLValidationResult>(
          user,
          signature,
          (post: Pick<TLPost, "content" | "topics">) =>
            ({ user, post } as TLValidationResult)
        )
      )
      .then(createPost)
      .then(createInteraction)
      .then(publishOnTopic)
      .then(() => res.status(201).send({ id: postCID.toString() }))
      .catch((err: Error) => res.status(400).send({ message: err.message }));
  });

  app.get("/post/:id", (req, res) => {
    const { id } = req.params;
    const key = CID.parse(id);

    console.info(`📤 Received a request for the data of the post: ${id}`);

    get<TLPost>(key)
      .then((post) => res.status(302).send(post))
      .catch(() => res.status(404).send({ message: `Post not found` }));
  });

  app.get("/topic/:topic", (req, res) => {
    const { topic } = req.params as Pick<TLTopic, "topic">;
    const key = createCID({ topic: topic });

    type TLTopicFetch = TLPost & { id: TLPostId };

    console.info(
      `🏷️  Received a request for the timeline of the topic: ${topic}`
    );

    const topicPosts = (topic: TLTopic) => {
      return Promise.all(
        topic.timeline.map((post) => {
          const cid = CID.parse(post);

          return (async () => {
            const fetched = await get<TLPost>(cid);
            return { ...fetched, id: post } as TLTopicFetch;
          })();
        })
      );
    };

    get<TLTopic>(key)
      .then(topicPosts)
      .then((posts) => res.status(200).send(posts))
      .catch(() => res.status(500).send({ message: `Topic not found` }));
  });

  app.post("/repost", (req, res) => {
    const { handle, signature } = req.body as TLSignedInteraction;
    const userCID = createCID({ handle: handle });

    type TLValidatorInteraction = { user: TLUser } & { post: TLPostId };

    console.info(`🔁 Received a repost request from ${handle}`);

    const updatePost = (props: TLValidatorInteraction) => {
      const postCID = CID.parse(props.post);
      return get<TLPost>(postCID)
        .then((value) =>
          update<TLPost>(value, (post) => {
            if (post.reposts.includes(handle))
              throw new Error(`${handle} already reposted ${props.post}`);

            post.reposts.push(handle);
            return post;
          })
        )
        .then((value) =>
          put(
            postCID,
            value,
            `Unable to update the post with the repost information`
          )
        )
        .then(() => props)
        .catch((err) => Promise.reject(err));
    };

    const updateUser = (props: TLValidatorInteraction) => {
      const interaction: TLInteractionMetadata = {
        who: props.user.handle,
        id: props.post,
        interaction: TLInteractionAction.REPOST,
        timestamp: new Date(),
      };
      props.user.timeline.push(interaction);
      const value = JSON.stringify(props.user);
      put(
        userCID,
        value,
        `Unable to respost ${props.post} to the timeline of ${handle}`
      );
      return props;
    };

    get<TLUser>(userCID)
      .then((user) =>
        validate<Pick<TLInteraction, "id">, TLValidatorInteraction>(
          user,
          signature,
          (post: Pick<TLInteraction, "id">) =>
            ({ user, post: post.id } as TLValidatorInteraction)
        )
      )
      .then(updatePost)
      .then(updateUser)
      .then((props) => res.status(200).send({ id: props.post }))
      .catch((err: Error) => res.status(400).send({ message: err.message }));
  });

  app.post("/like", (req, res) => {
    const { handle, signature } = req.body as TLSignedInteraction;
    const userCID = createCID({ handle: handle });

    type TLValidatorInteraction = { user: TLUser } & { post: TLPostId };

    console.info(`❤️  Received a like request from ${handle}`);

    const updatePost = (props: TLValidatorInteraction) => {
      const postCID = CID.parse(props.post);
      return get<TLPost>(postCID)
        .then((value) =>
          update<TLPost>(value, (post) => {
            if (post.likes.includes(handle))
              throw new Error(`${handle} has already liked ${props.post}`);

            post.likes.push(handle);
            return post;
          })
        )
        .then((value) =>
          put(
            postCID,
            value,
            `Unable to update the post with the like information`
          )
        )
        .then(() => props)
        .catch((err) => Promise.reject(err));
    };

    const updateUser = (props: TLValidatorInteraction) => {
      const interaction: TLInteractionMetadata = {
        who: props.user.handle,
        id: props.post,
        interaction: TLInteractionAction.LIKE,
        timestamp: new Date(),
      };
      props.user.timeline.push(interaction);
      const value = JSON.stringify(props.user);
      put(
        userCID,
        value,
        `Unable to add the like of ${props.post} to the timeline of ${handle}`
      );
      return props;
    };

    get<TLUser>(userCID)
      .then((user) =>
        validate<Pick<TLInteraction, "id">, TLValidatorInteraction>(
          user,
          signature,
          (post: Pick<TLInteraction, "id">) =>
            ({ user, post: post.id } as TLValidatorInteraction)
        )
      )
      .then(updatePost)
      .then(updateUser)
      .then((props) => res.status(200).send({ id: props.post }))
      .catch((err: Error) => res.status(400).send({ message: err.message }));
  });

  app.post("/unlike", (req, res) => {
    const { handle, signature } = req.body as TLSignedInteraction;
    const userCID = createCID({ handle: handle });

    type TLValidatorInteraction = { user: TLUser } & { post: TLPostId };

    console.info(`💔 Received an unlike request from ${handle}`);

    const updatePost = (props: TLValidatorInteraction) => {
      const postCID = CID.parse(props.post);

      return get<TLPost>(postCID)
        .then((value) =>
          update<TLPost>(value, (post) => {
            if (!post.likes.includes(handle))
              throw new Error(`${handle} does not like ${props.post}`);

            post.likes = post.likes.filter((u) => u !== handle);
            return post;
          })
        )
        .then((value) =>
          put(
            postCID,
            value,
            `Unable to update the post with the like information`
          )
        )
        .then(() => props)
        .catch((err: Error) => Promise.reject(err));
    };

    const updateUser = (props: TLValidatorInteraction) => {
      props.user.timeline = props.user.timeline.filter(
        (u) =>
          u.who !== handle ||
          u.id !== props.post ||
          u.interaction !== TLInteractionAction.LIKE
      );

      const value = JSON.stringify(props.user);
      put(
        userCID,
        value,
        `Unable to remove the like of ${props.post} to the timeline of ${handle}`
      );
      return props;
    };

    get<TLUser>(userCID)
      .then((user) =>
        validate<Pick<TLInteraction, "id">, TLValidatorInteraction>(
          user,
          signature,
          (post: Pick<TLInteraction, "id">) =>
            ({ user, post: post.id } as TLValidatorInteraction)
        )
      )
      .then(updatePost)
      .then(updateUser)
      .then((props) =>
        res
          .status(200)
          .send({ message: `${handle} removed like from ${props.post}` })
      )
      .catch((err: Error) => res.status(400).send({ message: err.message }));
  });

  app.post("/unrepost", (req, res) => {
    const { handle, signature } = req.body as TLSignedInteraction;
    const userCID = createCID({ handle: handle });

    type TLValidatorInteraction = { user: TLUser } & { post: TLPostId };

    console.info(`↩️  Received an unrepost request from ${handle}`);

    const updatePost = (props: TLValidatorInteraction) => {
      const postCID = CID.parse(props.post);
      return get<TLPost>(postCID)
        .then((value) =>
          update<TLPost>(value, (post) => {
            if (!post.reposts.includes(handle))
              throw new Error(`${handle} has not reposted ${props.post}`);

            post.reposts = post.reposts.filter((u) => u !== handle);
            return post;
          })
        )
        .then((value) =>
          put(
            postCID,
            value,
            `Unable to update the post with the repost information`
          )
        )
        .then(() => props)
        .catch((err) => Promise.reject(err));
    };

    const updateUser = (props: TLValidatorInteraction) => {
      props.user.timeline = props.user.timeline.filter(
        (u) =>
          u.who !== handle ||
          u.id !== props.post ||
          u.interaction !== TLInteractionAction.REPOST
      );

      const value = JSON.stringify(props.user);
      put(
        userCID,
        value,
        `Unable to remove respost of ${props.post} from the timeline of ${handle}`
      );
      return props;
    };

    get<TLUser>(userCID)
      .then((user) =>
        validate<Pick<TLInteraction, "id">, TLValidatorInteraction>(
          user,
          signature,
          (post: Pick<TLInteraction, "id">) =>
            ({ user, post: post.id } as TLValidatorInteraction)
        )
      )
      .then(updatePost)
      .then(updateUser)
      .then((props) =>
        res
          .status(200)
          .send({ message: `${handle} removed repost from ${props.post}` })
      )
      .catch((err: Error) => res.status(400).send({ message: err.message }));
  });

  app.post("/follow", (req, res) => {
    const { from, signature } = req.body as TLSignedConnection;
    const fromCID = createCID({ handle: from });

    interface TLUserCID {
      handle: TLUserHandle;
      cid: CID;
    }
    type TLValidatorFollow = { from: TLUser } & { to: TLUserCID };

    console.info(`🫂  Received a follow request from ${from}`);

    const followed = (props: TLValidatorFollow) =>
      get<TLUser>(props.to.cid)
        .then((value) =>
          update<TLUser>(value, (user) => {
            if (user.followers.includes(from))
              throw new Error(`${from} already follows ${props.to.handle}`);

            user.followers.push(from);
            return user;
          })
        )
        .then((value) =>
          put(
            props.to.cid,
            value,
            `Unable to connect ${from} to ${props.to.handle}`,
            false
          )
        )
        .then(() => props)
        .catch((err) => Promise.reject(err));

    const follower = (props: TLValidatorFollow) => {
      if (props.from.following.includes(props.to.handle))
        throw new Error(`${props.to.handle} is already followed by ${from}`);

      props.from.following.push(props.to.handle);
      const value = JSON.stringify(props.from);
      put(
        fromCID,
        value,
        `Unable to connect ${from} to ${props.to.handle}`,
        true,
        props.to.cid
      );
      return props;
    };

    get<TLUser>(fromCID)
      .then((user) =>
        validate<Pick<TLConnection, "to">, TLValidatorFollow>(
          user,
          signature,
          (userTo: Pick<TLConnection, "to">) => {
            const to = {
              handle: userTo.to,
              cid: createCID({ handle: userTo.to }),
            } as TLUserCID;
            return { from: user, to } as TLValidatorFollow;
          }
        )
      )
      .then(followed)
      .then(follower)
      .then((props) =>
        res.status(200).send({
          message: `${props.from.handle} now follows ${props.to.handle}`,
        })
      )
      .catch((err: Error) => res.status(400).send({ message: err.message }));
  });

  app.post("/unfollow", (req, res) => {
    const { from, signature } = req.body as TLSignedConnection;
    const fromCID = createCID({ handle: from });

    interface TLUserCID {
      handle: TLUserHandle;
      cid: CID;
    }
    type TLValidatorUnfollow = { from: TLUser } & { to: TLUserCID };

    console.info(`🪦  Received an unfollow request from ${from}`);

    const unfollowed = (props: TLValidatorUnfollow) =>
      get<TLUser>(props.to.cid)
        .then((value) =>
          update<TLUser>(value, (user) => {
            if (!user.followers.includes(from))
              throw new Error(`${from} does not follow ${user.handle}`);

            user.followers = user.followers.filter((u) => u !== from);
            return user;
          })
        )
        .then((value) =>
          put(
            props.to.cid,
            value,
            `Unable to remove the connection of ${from} to ${props.to.handle}`,
            false
          )
        )
        .then(() => props)
        .catch((err: Error) => Promise.reject(err));

    const unfollower = (props: TLValidatorUnfollow) => {
      if (!props.from.following.includes(props.to.handle))
        throw new Error(
          `${props.from.handle} does not follow ${props.to.handle}`
        );

      props.from.following = props.from.following.filter(
        (u) => u !== props.to.handle
      );
      const value = JSON.stringify(props.from);
      put(
        fromCID,
        value,
        `Unable to remove the connection of ${from} to ${props.to.handle}`,
        false
      );
      return props;
    };

    get<TLUser>(fromCID)
      .then((user) =>
        validate<Pick<TLConnection, "to">, TLValidatorUnfollow>(
          user,
          signature,
          (userTo: Pick<TLConnection, "to">) => {
            const to = {
              handle: userTo.to,
              cid: createCID({ handle: userTo.to }),
            } as TLUserCID;
            return { from: user, to } as TLValidatorUnfollow;
          }
        )
      )
      .then(unfollower)
      .then(unfollowed)
      .then((props) =>
        res.status(200).send({
          message: `${props.from.handle} no longer follows ${props.to.handle}`,
        })
      )
      .catch((err: Error) => res.status(400).send({ message: err.message }));
  });

  const httpServer = app.listen(port, hostname, () => {
    const address = httpServer.address() as AddressInfo;
    console.info(`🐦 Server running at http://${hostname}:${address.port}`);
  });
};

// Entry Point
main().then().catch(console.error);
