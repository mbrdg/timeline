<script setup lang="ts">
import PostCreationCard from "../components/PostCreationCard.vue";
import { inject, type Ref } from "vue";
import HomeTimeline from "../components/HomeTimeline.vue";

const key = inject("key") as Ref<string>;
const handle = inject("handle") as Ref<string>;

const emit = defineEmits(["pk-invalid"]);
const notifySidebar = () => {
  emit("pk-invalid");
};
</script>

<template>
  <main class="w-full m-auto h-full flex flex-col items-center pt-10 gap-10">
    <section class="flex gap-6 items-center">
      <img src="../assets/aleph.svg" />
      <h1 class="text-5xl text-accent font-bold">Homepage</h1>
    </section>
    <PostCreationCard
      @pk-invalid="notifySidebar"
      :handle="handle"
      :private-key="key"
    />
    <HomeTimeline :key="handle" :handle="handle" />
  </main>
</template>
