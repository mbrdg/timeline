// SDLE @ M.EIC, 2022
// T4G14

import type { TLTopicName } from "./tltopic.js";
import type { TLUserHandle } from "./tluser.js";

export type TLPostId = string;
export type TLPostContent = string;
export interface TLPost {
    readonly handle: TLUserHandle;
    readonly content: TLPostContent;
    readonly timestamp: Date;
    topics: TLTopicName[];
    reposts: TLUserHandle[];
    likes: TLUserHandle[];
}