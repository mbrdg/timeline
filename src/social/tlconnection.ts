// SDLE @ M.EIC, 2022
// T4G14

import type { TLUserHandle } from "../tluser.js";
import type { TLSignature } from "./tlinteraction.js";

export interface TLSignedConnection {
    readonly from: TLUserHandle;
    readonly signature: TLSignature
}

export interface TLConnection {
    readonly from: TLUserHandle;
    readonly to: TLUserHandle;
}