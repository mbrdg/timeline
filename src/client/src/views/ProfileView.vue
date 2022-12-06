<script setup lang="ts">
import { inject, onBeforeMount, ref } from "vue";
import { useRoute } from "vue-router";
import { AxiosInstance } from "axios";
import ProfileDescription from "../components/ProfileDescription.vue";
import ProfileTimeline from "./ProfileTimeline.vue";

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

const mockUser: UserInfo = {
  handle: "Krypt0",
  followers: ["Daniela", "Miro", "Julia", "Semis"],
  following: ["Daniela", "Miro", "Julia"],
  interactions: [],
};

const api = inject("api") as AxiosInstance;
const route = useRoute();
const handle = ref("");
const user = ref<UserInfo>();
handle.value = route.params.handle as string;

async function fetchUserInfo(handle: string) {
  const data = mockUser; // TODO: Use await api.get(`/${handle}`);
  console.log("The users data is", data);
  user.value = data;
}
onBeforeMount(async () => await fetchUserInfo(handle.value));
</script>

<template>
  <main class="w-1/3 flex flex-col mx-auto">
    <ProfileDescription
      :name="handle"
      :followers="user.followers"
      :following="user.following"
    />
    <ProfileTimeline />
  </main>
</template>
