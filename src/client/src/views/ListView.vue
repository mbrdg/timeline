<script setup lang="ts">
import { inject, onBeforeMount, ref } from "vue";
import { useRoute } from "vue-router";
import type { AxiosInstance } from "axios";

const route = useRoute();
const api = inject("api") as AxiosInstance;

const interactionType = ref("");
const data = ref([""]);

const fetchUser = async (handle: string) => {
  const result = await api.get(`/${handle}`, {
    validateStatus: (status) => {
      return status === 302;
    },
  });
  return [result.data.followers, result.data.following];
};

const fetchPost = async (id: string) => {
  const result = await api.get(`/post/${id}`, {
    validateStatus: (status) => {
      return status === 302;
    },
  });
  return [result.data.reposts, result.data.likes];
};

const fetchList = async () => {
  let result: string[][];
  switch (route.params.type) {
    case "followers":
      result = await fetchUser(route.params.id as string);
      interactionType.value = "Followers";
      data.value = result.at(0);
      break;
    case "following":
      result = await fetchUser(route.params.id as string);
      interactionType.value = "Following";
      data.value = result.at(1);
      break;
    case "reposts":
      result = await fetchPost(route.params.id as string);
      interactionType.value = "Reposts";
      data.value = result.at(0);
      break;
    case "likes":
      result = await fetchPost(route.params.id as string);
      interactionType.value = "Likes";
      data.value = result.at(1);
      break;
    default:
      break;
  }
};

onBeforeMount(fetchList);
</script>

<template>
  <section class="pt-36 flex flex-col gap-6">
    <h1 class="text-5xl font-bold text-accent">{{ interactionType }}</h1>
    <RouterLink
      :to="`/${user}`"
      class="text-2xl pt-6 hover:underline"
      v-for="user in data"
      :key="user"
    >
      {{ user }}
    </RouterLink>
  </section>
</template>
