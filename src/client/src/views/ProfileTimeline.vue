<script setup lang="ts">
import type { Post } from './ProfileView.vue';

export interface Timeline { }
const props = defineProps({
  posts: Array<Post>
});
</script>

<template>
  <section class="self-start pt-10 w-1/2">
    <h1 class="font-bold text-5xl">Timeline</h1>
    <!-- TODO: Add the entries here -->
    <div v-for="post in posts">

      <div class="container flex flex-col bg-lightdark rounded-md p-5 m-2 gap-2 shadow-md">
        <div class="flex flex-col justify-between">
          <div class="font-semibold text-lg">{{ post.handle }}</div>
          <div class="font-light text-sm">{{ post.timestamp.toLocaleString() }}</div>
        </div>
        <div>{{ post.content }}</div>
        <div class="flex-grow h-px bg-dark mt-2 opacity-70"></div>
        <div class="flex flex-row justify-around">
          <div class="flex flex-row gap-1">
            <div>🔁</div>
            <div>{{ post.reposts.length }}</div>
          </div>
          <div class="flex flex-row gap-1">
            <div>❤️</div>
            <div>{{ post.likes.length }}</div>
          </div>
        </div>
      </div>

    </div>
  </section>
</template>
