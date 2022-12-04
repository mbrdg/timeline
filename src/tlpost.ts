// SDLE @ M.EIC, 2022
// T4G14

import { TLUserHandle } from "./tluser.js";

export type TLPostId = string;

export interface TLPost {
    readonly handle: TLUserHandle;
    readonly content: string;
    timestamp: Date;
    reposts: TLUserHandle[];
    likes: TLUserHandle[];
}

export interface TLInteraction {
    readonly handle: TLUserHandle;
    readonly id: TLPostId;
}
