// SDLE @ M.EIC, 2022
// T4G14

import { TLInteractionMetadata } from "./tlpost.js";
import { KeyLike } from "jose";

export type TLUserHandle = string;

export interface TLUser {
    readonly handle: TLUserHandle;
    readonly publicKey: KeyLike;
    followers: TLUserHandle[];
    following: TLUserHandle[];
    timeline: TLInteractionMetadata[];
}