<script setup lang="ts">
export interface TopicDescription {
  name: string;
  numberPosts: number;
}

const props = defineProps<TopicDescription>();
</script>

<template>
  <section class="pt-20 flex flex-col gap-10">
    <span class="flex items-center gap-10">
      <RouterLink to="/home">
        <img src="../assets/aleph.svg" class="w-16" />
      </RouterLink>
      <h1 class="font-bold text-5xl text-accent">{{ props.name }}</h1>
    </span>
    <div class="flex gap-7 text-xl">
      <span class="flex gap-2">
        <p>{{ props.numberPosts }}</p>
        <p class="text-accent">Posts</p>
      </span>
    </div>
  </section>
</template>
