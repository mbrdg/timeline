<script setup lang="ts">
import { inject, onBeforeMount, ref } from "vue";
import { useRoute } from "vue-router";
import type { AxiosInstance } from "axios";
import TopicDescription from "../components/TopicDescription.vue";
import TopicTimeline from "../components/TopicTimeline.vue";
import type { Post } from "../types/Post";

const api = inject("api") as AxiosInstance;

const route = useRoute();

const topicName = ref("");
const posts = ref<Post[]>([]);

async function fetchTopicInfo(topic: string) {
  const data = await api.get("/topic/" + topic);
  posts.value = data.data;
}

onBeforeMount(async () => {
  topicName.value = route.params.topic.toString();
  await fetchTopicInfo(topicName.value);
});
</script>

<template>
  <main class="w-full flex flex-col mx-auto">
    <TopicDescription :name="topicName" :numberPosts="posts.length" />
    <TopicTimeline :posts="posts" :topic="topicName" />
  </main>
</template>
