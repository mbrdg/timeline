// SDLE @ M.EIC, 2022
// T4G14

import type { TLUserHandle } from "../tluser.js";
import type { TLPostId } from "../tlpost.js";

export type TLSignature = string;


export interface TLInteraction {
    readonly handle: TLUserHandle;
    readonly id: TLPostId;
}

export enum TLInteractionAction {
    POST,
    REPOST,
    LIKE,
}

export interface TLInteractionMetadata {
    readonly who: TLUserHandle;
    readonly id: TLPostId;
    readonly interaction: TLInteractionAction;
    readonly timestamp: Date;
}

export interface TLSignedInteraction {
    readonly handle: TLUserHandle;
    readonly signature: TLSignature;
}