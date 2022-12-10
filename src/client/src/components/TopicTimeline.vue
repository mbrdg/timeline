<script setup lang="ts">
import type { Post } from "@/types/Post";
import PostCard from "@/components/PostCard.vue";
import { computed } from "vue";

export interface TopicTimeline {
  posts: Post[];
  topic: string;
}
const props = defineProps<TopicTimeline>();
const sortedPosts = computed(() => {
  const alias = props.posts;
  return alias.sort((a, b) => {
    return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
  });
});
</script>

<template>
  <section class="self-start pt-10 w-full">
    <h1 class="font-bold text-5xl">Timeline</h1>
    <div v-for="post in sortedPosts" v-bind:key="post" class="flex flex-col">
      <PostCard :post="post" :name="props.topic" />
    </div>
  </section>
</template>
