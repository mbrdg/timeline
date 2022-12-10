<script setup lang="ts">
import { inject, onBeforeMount, ref } from "vue";
import { useRoute } from "vue-router";
import type { AxiosInstance } from "axios";
import ProfileDescription from "../components/ProfileDescription.vue";
import PostsTimeline from "../components/PostsTimeline.vue";
import type { UserInfo } from "../types/User";

const api = inject("api") as AxiosInstance;

const route = useRoute();

const emit = defineEmits(["follow"]);
const updateKey = () => {
  emit("follow");
};

const handle = ref("");
const user = ref<UserInfo>({
  handle: "",
  followers: [],
  following: [],
  timeline: [],
});

let postsLoaded = false;

async function fetchUserInfo(handle: string) {
  const data = await api.get("/" + handle, {
    validateStatus: (status) => {
      return status == 302;
    },
  });
  postsLoaded = true;
  user.value = data.data;
}

onBeforeMount(async () => {
  handle.value = route.params.handle.toString();
  await fetchUserInfo(handle.value);
  postsLoaded = true;
  console.log(user.value.timeline);
});
</script>

<template>
  <main class="w-full flex flex-col mx-auto">
    <ProfileDescription
      @follow="updateKey"
      :name="handle"
      :followers="user?.followers || []"
      :following="user?.following || []"
    />
    <PostsTimeline
      v-if="postsLoaded"
      :timeline="user.timeline"
      :name="handle"
    />
  </main>
</template>
