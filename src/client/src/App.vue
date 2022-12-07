<script setup lang="ts">
import { RouterView } from "vue-router";
import axios from "axios";
import { provide } from "vue";
const BASE_URL = "http://localhost:33705";
const api = axios.create({
  baseURL: BASE_URL,
  timeout: 2000,
});
provide("api", api);
</script>

<template>
  <div id="wrapper" class="grid min-h-full bg-dark text-light">
    <header></header>
    <RouterView />
    <footer></footer>
  </div>
</template>
