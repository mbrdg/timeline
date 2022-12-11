<script setup lang="ts">
import type { Post } from "@/types/Post";
import PostCard from "@/components/PostCard.vue";
import { PostInteraction } from "@/types/Interaction";
import type { AxiosInstance } from "axios";
import { inject, onMounted, ref } from "vue";
export interface HomeTimeline {
  handle: string;
}
const props = defineProps<HomeTimeline>();

const api = inject("api") as AxiosInstance;
const posts = ref<Map<string, [Post, PostInteraction, string]>>(
  new Map<string, [Post, PostInteraction, string]>()
);

async function fetchTimeline() {
  const userData = await api.get(props.handle, {
    validateStatus: (status) => {
      return status == 302;
    },
  });

  if (userData.status == 404) return;

  const timelineData = await api.get("/timeline/" + props.handle);
  const postsAux = timelineData.data.sort((objA: Post, objB: Post) => {
    return (
      new Date(objB.timestamp).getTime() - new Date(objA.timestamp).getTime()
    );
  });
  for (let post of postsAux) {
    posts.value.set(post.id, [post as Post, post.interaction, post.who]);
  }
}

onMounted(async () => {
  await fetchTimeline();
});
</script>

<template>
  <section class="self-start pt-10 w-full">
    <h1 class="font-bold text-5xl">Timeline</h1>
    <div v-for="[key, value] in posts" v-bind:key="key" class="flex flex-col">
      <div v-if="value[1] == PostInteraction.REPOST">
        {{ value[2] }} reposted
      </div>
      <PostCard :post="value[0]" :id="key" />
    </div>
  </section>
</template>
