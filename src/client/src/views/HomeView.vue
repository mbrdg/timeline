<script setup lang="ts">
import PostCreationCard from "../components/PostCreationCard.vue";
import type { AxiosInstance } from "axios";
import { inject, onBeforeMount } from "vue";

const api = inject("api") as AxiosInstance;
function getTimeline(): void {
  console.log("Get Timeline not yet implemented");
}
onBeforeMount(getTimeline);
</script>

<template>
  <main class="w-1/3 m-auto h-full flex flex-col items-center pt-10 gap-10">
    <section class="w-full flex gap-6 items-center">
      <img src="../assets/alef.svg" />
      <h1 class="text-5xl text-accent font-bold">Homepage</h1>
    </section>
    <PostCreationCard />
    <!-- Insert timeline here when available -->
  </main>
</template>
