<script setup lang="ts">
import { inject, onBeforeMount, ref } from "vue";
import { useRoute } from "vue-router";
import type { AxiosInstance } from "axios";
import ProfileDescription from "../components/ProfileDescription.vue";
import PostsTimeline from "../components/PostsTimeline.vue";
import type { Post } from "../types/Post";
import type { UserInfo } from "../types/User";
import { PostInteraction } from "../types/Interaction";

const api = inject("api") as AxiosInstance;

const route = useRoute();

const handle = ref("");
const user = ref<UserInfo>();
const posts = ref<Map<string, Post>>(new Map<string, Post>());

async function fetchUserInfo(handle: string) {
  const data = await api.get("/" + handle, {
    validateStatus: (status) => {
      return status == 302;
    },
  });

  user.value = data.data;

  const postIDs = user.value?.timeline
    .filter((i) => i.interaction !== PostInteraction.LIKE)
    .sort((objA, objB) => {
      return (
        new Date(objB.timestamp).getTime() - new Date(objA.timestamp).getTime()
      );
    })
    .map((i) => i.id)
    .filter((elem, index, self) => {
      return index === self.indexOf(elem);
    });

  for (let id of postIDs || []) {
    const postData = await api.get("/post/" + id, {
      validateStatus: (status) => {
        return status == 302;
      },
    });

    posts.value.set(id, postData.data);
  }
}

onBeforeMount(async () => {
  handle.value = route.params.handle.toString();
  await fetchUserInfo(handle.value);
});
</script>

<template>
  <main class="w-full flex flex-col mx-auto">
    <ProfileDescription
      :name="handle"
      :followers="user?.followers || []"
      :following="user?.following || []"
    />
    <PostsTimeline :posts="posts" :name="handle || ''" />
  </main>
</template>
