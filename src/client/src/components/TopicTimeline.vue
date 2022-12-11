<script setup lang="ts">
import type { Post } from "@/types/Post";
import PostCard from "@/components/PostCard.vue";
import { inject, onMounted, ref } from "vue";
import type { AxiosInstance } from "axios";

export interface TopicTimeline {
  topic: string;
}
const props = defineProps<TopicTimeline>();

const api = inject("api") as AxiosInstance;
const posts = ref<Map<string, Post>>(new Map<string, Post>());

async function fetchTopicPosts() {
  const postsData = await api.get("/topic/" + props.topic);
  const postsAux = postsData.data.sort((objA: Post, objB: Post) => {
    return (
      new Date(objB.timestamp).getTime() - new Date(objA.timestamp).getTime()
    );
  });
  for (let post of postsAux) {
    posts.value.set(post.id, post as Post);
  }
}

onMounted(async () => {
  await fetchTopicPosts();
});
</script>

<template>
  <section class="self-start pt-10 w-full">
    <h1 class="font-bold text-5xl">Posts</h1>
    <div v-for="[key, value] in posts" v-bind:key="key" class="flex flex-col">
      <PostCard :post="value" :name="props.topic" :id="key" />
    </div>
  </section>
</template>
