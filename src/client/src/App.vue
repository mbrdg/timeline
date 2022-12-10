<script setup lang="ts">
import { RouterView, useRoute } from "vue-router";
import TheSidebar from "./components/TheSidebar.vue";
import axios from "axios";
import { ref, provide, computed, watch } from "vue";

const BASE_URL = "http://localhost:43461";
const api = axios.create({
  baseURL: BASE_URL,
  timeout: 5000,
});
provide("api", api);

const key = ref("");
const handle = ref("");
provide("key", key);
provide("handle", handle);

const keyInvalid = ref(false);
const notifySidebar = () => {
  keyInvalid.value = true;
};

const route = useRoute();
const isRegister = computed(() => {
  return route.path === "/register";
});

const update = ref(0);

const updateKey = () => update.value++;
watch(() => route.fullPath, updateKey);

const getHandle = () => {
  let user = sessionStorage.getItem("handle");
  if (user) {
    handle.value = user;
  }
};
</script>

<template>
  <div id="wrapper" class="grid grid-cols-3 min-h-full bg-dark text-light">
    <aside></aside>
    <RouterView
      :key="update"
      @follow="updateKey"
      @registered="getHandle"
      @pk-invalid="notifySidebar"
    />
    <TheSidebar
      v-if="!isRegister"
      :key-invalid="keyInvalid"
      v-model:private-key="key"
      v-model:handle="handle"
    />
  </div>
</template>
