<script setup lang="ts">
import PostCreationCard from "../components/PostCreationCard.vue";
import TheSidebar from "../components/TheSidebar.vue";
import type { AxiosInstance } from "axios";
import { ref, inject, onBeforeMount } from "vue";

const api = inject("api") as AxiosInstance;
const handle = ref("");
const key = ref("");

function getTimeline(): void {
  console.log("Get Timeline not yet implemented", api.name);
}
const getHandle = () => {
  let user = sessionStorage.getItem("handle");
  if (user) {
    handle.value = user;
  }
};
onBeforeMount(() => {
  getHandle();
  getTimeline();
});
</script>

<template>
  <main class="w-full flex">
    <aside class="w-1/3"></aside>
    <main class="w-1/3 m-auto h-full flex flex-col items-center pt-10 gap-10">
      <section class="flex gap-6 items-center">
        <img src="../assets/alef.svg" />
        <h1 class="text-5xl text-accent font-bold">Homepage</h1>
      </section>
      <PostCreationCard :handle="handle" :private-key="key" />
      <!-- Insert timeline here when available -->
    </main>
    <TheSidebar v-model:private-key="key" v-model:handle="handle" />
  </main>
</template>
