// SDLE @ M.EIC, 2022
// T4G14

import { TLPostId } from "./tlpost.js";

export type TLUserHandle = string;

export interface TLUser {
    readonly handle: TLUserHandle;
    followers: TLUserHandle[];
    following: TLUserHandle[];
    posts: TLPostId[];
    reposts: TLPostId[];
    likes: TLPostId[];
}