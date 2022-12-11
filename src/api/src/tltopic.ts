// SDLE @ M.EIC, 2022
// T4G14

import type { TLPostId } from "./tlpost.js";

export type TLTopicName = string;

export interface TLTopic {
    readonly topic: TLTopicName;
    timeline: TLPostId[];
}