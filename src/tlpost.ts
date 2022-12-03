// SDLE @ M.EIC, 2022
// T4G14

import { TLUserHandle } from "./tluser.js";

export default interface TLPost {
    readonly handle: TLUserHandle;
    readonly content: string;
    timestamp: Date;
    reposts: Set<TLUserHandle>;
    likes: Set<TLUserHandle>;
}