<script setup lang="ts">
import type { Post } from "@/types/Post";
import PostCard from "@/components/PostCard.vue";

export interface Timeline {
  posts: Map<string, Post>;
  name: string;
}
const props = defineProps<Timeline>();
</script>

<template>
  <section class="self-start pt-10 w-full">
    <h1 class="font-bold text-5xl">Timeline</h1>
    <div v-for="[key, value] in posts" v-bind:key="key" class="flex flex-col">
      <PostCard :post="value" :name="props.name" :id="key" />
    </div>
  </section>
</template>
