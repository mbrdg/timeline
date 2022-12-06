// SDLE @ M.EIC, 2022
// T4G14

import { TLUserHandle } from "./tluser.js";

export type TLPostId = string;
export interface TLPost {
    readonly handle: TLUserHandle;
    readonly content: string;
    readonly timestamp: Date;
    reposts: TLUserHandle[];
    likes: TLUserHandle[];
}

export interface TLInteraction {
    readonly handle: TLUserHandle;
    readonly id: TLPostId;
}


export enum TLPostInteraction {
    POST,
    REPOST,
    LIKE,
}

export interface TLInteractionMetadata {
    readonly who: TLUserHandle;
    readonly id: TLPostId;
    readonly interaction: TLPostInteraction;
    readonly timestamp: Date;
}
