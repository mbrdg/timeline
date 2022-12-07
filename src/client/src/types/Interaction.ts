export enum PostInteraction {
  POST,
  REPOST,
  LIKE,
}
export interface Interaction {
  handle: string;
  id: string;
  interaction: PostInteraction;
  timestamp: Date;
}
