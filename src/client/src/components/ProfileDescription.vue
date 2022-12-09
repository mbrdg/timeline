<script setup lang="ts">
export interface ProfileDescription {
  name: string;
  followers: string[];
  following: string[];
}

defineProps<ProfileDescription>();
</script>

<template>
  <section class="pt-20 flex flex-col gap-10">
    <span class="flex items-center gap-10">
      <RouterLink to="/home">
        <img src="../assets/aleph.svg" class="w-16" />
      </RouterLink>
      <h1 class="font-bold text-5xl text-accent">{{ name }}</h1>
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
