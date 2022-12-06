<script setup lang="ts">
import { defineProps } from "vue";
export interface ProfileDescription {
  name: string;
  followers: string[];
  following: string[];
}

const props = defineProps<ProfileDescription>();
</script>

<template>
  <section class="pt-20 flex flex-col gap-10">
    <h1 class="font-bold text-5xl">@{{ name }}</h1>
    <div class="flex gap-7 text-xl">
      <span class="flex gap-2">
        <p>{{ followers.length }}</p>
        <p class="text-accent">Followers</p>
      </span>
      <span class="flex gap-2">
        <p>{{ following.length }}</p>
        <p class="text-accent">Following</p>
      </span>
    </div>
  </section>
</template>
