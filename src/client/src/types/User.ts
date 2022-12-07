import type { Interaction } from "./Interaction";

export interface UserInfo {
  handle: string;
  followers: string[];
  following: string[];
  timeline: Interaction[];
}
