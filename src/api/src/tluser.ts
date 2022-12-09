// SDLE @ M.EIC, 2022
// T4G14

import { TLInteractionMetadata } from "./tlpost.js";

export type TLUserHandle = string;

export interface TLUser {
    readonly handle: TLUserHandle;
    readonly publicKey: string;
    followers: TLUserHandle[];
    following: TLUserHandle[];
    timeline: TLInteractionMetadata[];
}