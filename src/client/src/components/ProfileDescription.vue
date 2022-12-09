<script setup lang="ts">
import type { AxiosInstance } from "axios";
import { computed, inject, type Ref } from "vue";

export interface ProfileDescription {
  name: string;
  followers: string[];
  following: string[];
}

const props = defineProps<ProfileDescription>();

const api = inject("api") as AxiosInstance;
const handle = inject("handle") as Ref<string>;
const key = inject("key") as Ref<string>;

const canInteract = computed(() => {
  return (
    handle.value !== props.name &&
    key.value.length !== 0 &&
    handle.value.length !== 0
  );
});

const canFollow = computed(() => {
  return !props.followers.includes(handle.value);
});

async function unfollowUser() {
  const from = handle.value;
  const to = props.name;
  const response = await api
    .post("/unfollow", {
      from,
      to,
    })
    .catch((error) => {
      console.error(
        "Error sending unfollow request",
        error.code,
        error.message
      );
    });

  if (response) {
    console.log(`${from} just unfollowed ${to}`);
  }
}

async function followUser() {
  const from = handle.value;
  const to = props.name;
  const response = await api
    .post("/follow", {
      from,
      to,
    })
    .catch((error) => {
      console.error("Error sending follow request", error.code, error.message);
    });

  if (response) {
    console.log(`${from} just followed ${to}`);
  }
}
</script>

<template>
  <section class="pt-20 flex flex-col gap-10">
    <span class="flex items-center gap-10">
      <RouterLink to="/home">
        <img src="../assets/aleph.svg" class="w-16" />
      </RouterLink>
      <h1 class="font-bold text-5xl text-accent">{{ name }}</h1>
      <button
        @click="followUser"
        v-if="canInteract && canFollow"
        class="bg-light rounded-xl text-superdark text-lg mt-2 py-3 px-1 w-1/5 mr-10"
        type="submit"
      >
        Follow
      </button>
      <button
        @click="unfollowUser"
        v-else-if="canInteract && !canFollow"
        class="bg-light rounded-xl text-superdark text-lg mt-2 py-3 px-1 w-1/5 mr-10"
        type="submit"
      >
        Unfollow
      </button>
      <div v-else></div>
    </span>
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
