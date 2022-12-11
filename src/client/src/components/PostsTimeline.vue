<script setup lang="ts">
import type { Post } from "@/types/Post";
import PostCard from "@/components/PostCard.vue";
import { PostInteraction, type Interaction } from "@/types/Interaction";
import type { AxiosInstance } from "axios";
import { inject, onMounted, ref } from "vue";
export interface PostTimeline {
  name: string;
  timeline: Interaction[];
}
const props = defineProps<PostTimeline>();

const api = inject("api") as AxiosInstance;
const posts = ref<Map<string, [Post, PostInteraction]>>(
  new Map<string, [Post, PostInteraction]>()
);

async function fetchTimeline() {
  const postIDsAux = props.timeline
    .filter((i) => i.interaction !== PostInteraction.LIKE)
    .sort((objA, objB) => {
      return (
        new Date(objB.timestamp).getTime() - new Date(objA.timestamp).getTime()
      );
    })
    .filter((elem, index, self) => {
      return index === self.indexOf(elem);
    });

  const postIDs = postIDsAux.map((i) => i.id);
  const postInts = postIDsAux.map((i) => i.interaction);

  for (let id of postIDs || []) {
    const postData = await api.get("/post/" + id, {
      validateStatus: (status) => {
        return status == 302;
      },
    });
    posts.value.set(id, [postData.data, postInts[postIDs.indexOf(id)]]);
  }
}

onMounted(async () => {
  await fetchTimeline();
});
</script>

<template>
  <section class="self-start pt-10 w-full">
    <h1 class="font-bold text-5xl">Timeline</h1>
    <div v-for="[key, value] in posts" v-bind:key="key" class="flex flex-col">
      <div v-if="value[1] == PostInteraction.REPOST">
        {{ props.name }} reposted
      </div>
      <PostCard :post="value[0]" :name="props.name" :id="key" />
    </div>
  </section>
</template>
