<script setup lang="ts">
import type { Post } from '@/types/Post';
import PostCard from '@/components/PostCard.vue'

export interface Timeline {
  posts: Map<string, Post>;
  name: string;
}
const props = defineProps<Timeline>();
</script>

<template>
  <section class="self-start pt-10 w-1/2">
    <h1 class="font-bold text-5xl">Timeline</h1>
    <div v-for="id in props.posts.keys()" class="flex flex-col">
      <PostCard :post="props.posts.get(id)" :name="props.name" :id="id" />
    </div>
  </section>
</template>
