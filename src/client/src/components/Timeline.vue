<script setup lang="ts">
import type { Post } from '@/types/Post';
import PostCard from '@/components/PostCard.vue'
const props = defineProps({
  posts: Array<Post>,
  name: String
});
</script>

<template>
  <section class="self-start pt-10 w-1/2">
    <h1 class="font-bold text-5xl">Timeline</h1>
    <div v-for="post in props.posts" class="flex flex-col">
      <PostCard :post="post" :name="props.name" />
    </div>
  </section>
</template>
