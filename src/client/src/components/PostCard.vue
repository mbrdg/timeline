<script setup lang="ts">
import type { Post } from "@/types/Post";
import type { AxiosInstance } from "axios";
import { inject, computed, reactive, type Ref } from "vue";
import * as jose from "jose";
export interface PostCard {
  post: Post;
  id: string;
}
const props = defineProps<PostCard>();
const api = inject("api") as AxiosInstance;
const handle = inject("handle") as Ref<string>;
const key = inject("key") as Ref<string>;

const likeCount = reactive({ count: props.post.likes.length });
const isLiked = reactive({ isLiked: props.post.likes.includes(handle.value) });

const repostCount = reactive({ count: props.post.reposts.length });
const isReposted = reactive({
  isReposted: props.post.reposts.includes(handle.value),
});

function timeDifference(current: number, previous: number) {
  var msPerMinute = 60 * 1000;
  var msPerHour = msPerMinute * 60;
  var msPerDay = msPerHour * 24;
  var msPerMonth = msPerDay * 30;
  var msPerYear = msPerDay * 365;

  var elapsed = current - previous;
  if (elapsed < msPerMinute) {
    return Math.round(elapsed / 1000) + " seconds ago";
  } else if (elapsed < msPerHour) {
    return Math.round(elapsed / msPerMinute) + " minutes ago";
  } else if (elapsed < msPerDay) {
    return Math.round(elapsed / msPerHour) + " hours ago";
  } else if (elapsed < msPerMonth) {
    return Math.round(elapsed / msPerDay) + " days ago";
  } else if (elapsed < msPerYear) {
    return Math.round(elapsed / msPerMonth) + " months ago";
  } else {
    return Math.round(elapsed / msPerYear) + " years ago";
  }
}

const signId = async (id: string) => {
  const algorithm = "RS512";
  try {
    // Must be in PKCS8 format
    const privateKey = await jose.importPKCS8(key.value, algorithm);

    const signature = await new jose.CompactSign(
      new TextEncoder().encode(JSON.stringify({ id: id }))
    )
      .setProtectedHeader({ alg: algorithm })
      .sign(privateKey);

    return signature;
  } catch (error) {
    console.error(error);
  }
};

async function like() {
  const signature = await signId(props.id);
  if (!isLiked.isLiked) {
    await api
      .post("/like", {
        handle: handle.value,
        signature: signature,
      })
      .then((response) => {
        console.log("Received a response of", response);
      });
    likeCount.count++;
    isLiked.isLiked = true;
  } else {
    await api.post("/remove/like", {
      handle: handle.value,
      signature: signature,
    });
    likeCount.count--;
    isLiked.isLiked = false;
  }
}

async function repost() {
  const signature = await signId(props.id);
  if (!isReposted.isReposted) {
    await api.post("/repost", {
      handle: handle.value,
      signature: signature,
    });
    repostCount.count++;
    isReposted.isReposted = true;
  } else {
    await api.post("/remove/repost", {
      handle: handle.value,
      signature: signature,
    });
    repostCount.count--;
    isReposted.isReposted = false;
  }
}

function highlightTopics(text: string) {
  console.log(text);
  return text.replace(new RegExp(/(^|\W)#\w+/gi, "gi"), (match) => {
    console.log(match);
    return `<span class='text-accent'>${match}</span>`;
  });
}
</script>

<template>
  <div
    class="container flex flex-col bg-lightdark rounded-md p-5 my-2 gap-2 shadow-md"
  >
    <div class="flex flex-col justify-between">
      <div class="font-semibold text-lg">
        <RouterLink :to="`/${post.handle}`" class="hover:underline">
          {{ post.handle }}
        </RouterLink>
      </div>
      <div class="font-light text-sm">
        {{ timeDifference(Date.now(), new Date(post.timestamp).getTime()) }}
      </div>
    </div>
    <div v-html="highlightTopics(post.content)"></div>
    <div class="flex-grow h-px bg-dark mt-2 opacity-70"></div>
    <div class="flex flex-row justify-around">
      <form @submit.prevent="repost" class="flex flex-row gap-1">
        <button v-if="isReposted.isReposted">
          <img src="@/assets/repeat_filled.svg" />
        </button>
        <button v-else><img src="@/assets/repeat.svg" /></button>
        <div>
          {{
            computed(() => {
              return repostCount.count;
            })
          }}
        </div>
      </form>
      <form @submit.prevent="like" class="flex flex-row gap-1">
        <button v-if="isLiked.isLiked">
          <img src="@/assets/heart_filled.svg" />
        </button>
        <button v-else><img src="@/assets/heart.svg" /></button>
        <div>
          {{
            computed(() => {
              return likeCount.count;
            })
          }}
        </div>
      </form>
    </div>
  </div>
</template>
