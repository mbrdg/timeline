<script setup lang="ts">
import type { Post } from '@/types/Post';
import type { AxiosInstance } from 'axios';
import { inject } from 'vue';
export interface PostCard {
  post: Post;
  name: string;
  id: string;
}
const props = defineProps<PostCard>();
const api = inject("api") as AxiosInstance;

function timeDifference(current: number, previous: number) {

  var msPerMinute = 60 * 1000;
  var msPerHour = msPerMinute * 60;
  var msPerDay = msPerHour * 24;
  var msPerMonth = msPerDay * 30;
  var msPerYear = msPerDay * 365;

  var elapsed = current - previous;
  console.log(current, previous);
  if (elapsed < msPerMinute) {
    return Math.round(elapsed / 1000) + ' seconds ago';
  } else if (elapsed < msPerHour) {
    return Math.round(elapsed / msPerMinute) + ' minutes ago';
  } else if (elapsed < msPerDay) {
    return Math.round(elapsed / msPerHour) + ' hours ago';
  } else if (elapsed < msPerMonth) {
    return Math.round(elapsed / msPerDay) + ' days ago';
  } else if (elapsed < msPerYear) {
    return Math.round(elapsed / msPerMonth) + ' months ago';
  } else {
    return Math.round(elapsed / msPerYear) + ' years ago';
  }
}

async function like() {
  await api.post("/like", {
    handle: props.name,
    id: props.id
  });
}

async function repost() {
  await api.post("/repost", {
    handle: props.name,
    id: props.id
  });
}



</script>

<template>

  <div class="mx-2 mt-2" v-if="props.name !== post.handle">
    <div>{{ props.name }} reposted</div>
  </div>
  <div class="container flex flex-col bg-lightdark rounded-md p-5 my-2 gap-2 shadow-md">
    <div class="flex flex-col justify-between">
      <div class="font-semibold text-lg">{{ post.handle }}</div>
      <div class="font-light text-sm">{{ timeDifference(Date.now(), (new Date(post.timestamp)).getTime()) }}
      </div>
    </div>
    <div>{{ post.content }}</div>
    <div class="flex-grow h-px bg-dark mt-2 opacity-70"></div>
    <div class="flex flex-row justify-around">
      <form @submit.prevent="repost" class="flex flex-row gap-1">
        <button v-if="post.reposts.includes(props.name)"><img src="@/assets/repeat_filled.svg" /></button>
        <button v-else><img src="@/assets/repeat.svg" /></button>
        <div>{{ post.reposts.length }}</div>
      </form>
      <form @submit.prevent="like" class="flex flex-row gap-1">
        <button v-if="post.likes.includes(props.name)"><img src="@/assets/heart_filled.svg" /></button>
        <button v-else><img src="@/assets/heart.svg" /></button>
        <div>{{ post.likes.length }}</div>
      </form>
    </div>
  </div>

</template>
