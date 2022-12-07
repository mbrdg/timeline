<script setup lang="ts">
import { inject, onBeforeMount, ref } from "vue";
import { useRoute } from "vue-router";
import { AxiosInstance } from "axios";
import ProfileDescription from "../components/ProfileDescription.vue";
import ProfileTimeline from "./ProfileTimeline.vue";
export interface Post {
  handle: string;
  content: string;
  timestamp: Date;
  reposts: string[];
  likes: string[];
}

enum PostInteraction {
  POST,
  REPOST,
  LIKE,
}
interface Interaction {
  handle: string;
  id: string;
  interaction: PostInteraction;
  timestamp: Date;
}
interface UserInfo {
  handle: string;
  followers: string[];
  following: string[];
  interactions: Interaction[];
}
const mockPost: Post = {
  handle: "anti-jules",
  content: "Vue é grande fixe",
  timestamp: new Date("2022-12-07T03:24:00"),
  reposts: ["Krypt0"],
  likes: ["Krypt0"],
}

const mockPost1: Post = {
  handle: "Krypt0",
  content: "Aceita, jovem!",
  timestamp: new Date("2022-12-07T03:24:00"),
  reposts: [],
  likes: ["anti-jules"],
}


const mockUser: UserInfo = {
  handle: "Krypt0",
  followers: ["Daniela", "Miro", "Julia", "Semis"],
  following: ["Daniela", "Miro", "Julia"],
  interactions: [
    { handle: "anti-jules", id: "1", interaction: PostInteraction.POST, timestamp: new Date("2022-12-7T02:47") },
    { handle: "Krypt0", id: "2", interaction: PostInteraction.POST, timestamp: new Date("2022-12-7T03:47") },
    { handle: "Krypt0", id: "1", interaction: PostInteraction.REPOST, timestamp: new Date("2022-12-7T04:47") },
    { handle: "Krypt0", id: "1", interaction: PostInteraction.LIKE, timestamp: new Date("2022-12-7T04:47") },

  ],
};

const mockPostsMap : Map<string, Post> = new Map([
  ['1', mockPost],
  ['2', mockPost1]
]);

const api = inject("api") as AxiosInstance;
const route = useRoute();
const handle = ref("");
const user = ref<UserInfo>();
const posts = ref<(Post | undefined)[]>();
handle.value = route.params.handle as string;

async function fetchUserInfo(handle: string) {
  const data = mockUser; // TODO: Use await api.get(`/${handle}`);
  console.log("The users data is", data);
  user.value = data;
}

async function fetchUserPosts(handle: string) {
  const interactions = mockUser.interactions;
  const idPostsToShow = interactions
    .filter((interaction) => interaction.interaction !== PostInteraction.LIKE)
    .map((interaction) => interaction.id)
    .filter((elem, index, self)=> {
      return index === self.indexOf(elem);
    });
  
  posts.value = idPostsToShow
  .map((id: string)=>mockPostsMap.get(id));
 
 console.log(posts.value);
}
onBeforeMount(async () => {
  await fetchUserInfo(handle.value)
  await fetchUserPosts(handle.value)
}
);
</script>

<template>
  <main class="w-3/5 flex flex-col mx-auto">
    <ProfileDescription :name="handle" :followers="user.followers" :following="user.following" />
    <ProfileTimeline :posts=posts?.values() />
  </main>
</template>
