<script setup lang="ts">
import PostCreationCard from "../components/PostCreationCard.vue";
import type { AxiosInstance } from "axios";
import { inject, onBeforeMount } from "vue";

const api = inject("api") as AxiosInstance;
function getTimeline(): void {
  console.log("Working on this");
}
onBeforeMount(getTimeline);
</script>

<template>
  <main class="flex flex-col gap-10">
    <PostCreationCard />
  </main>
</template>
