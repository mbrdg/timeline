<script setup lang="ts">
import type { Post } from '@/types/Post';
export interface PostCard {
  post: Post;
  name: string;
}
const props = defineProps<PostCard>();
</script>

<template>

  <div class="mx-2 mt-2" v-if="props.name !== post.handle">
    <div>{{ props.name }} reposted</div>
  </div>
  <div class="container flex flex-col bg-lightdark rounded-md p-5 my-2 gap-2 shadow-md">
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

</template>
