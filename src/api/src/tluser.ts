// SDLE @ M.EIC, 2022
// T4G14

import { TLInteractionMetadata } from "./social/tlinteraction.js";

export type TLUserHandle = string;
export type TLUserPublicKey = string;

export interface TLUserRegistration {
    readonly handle: TLUserHandle;
    readonly key: TLUserPublicKey;
}

export interface TLUser {
    readonly handle: TLUserHandle;
    readonly key: TLUserPublicKey;
    followers: TLUserHandle[];
    following: TLUserHandle[];
    timeline: TLInteractionMetadata[];
}