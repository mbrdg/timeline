<script setup lang="ts">
import { RouterLink } from "vue-router";
import { inject, ref } from "vue";
import type { AxiosInstance } from "axios";
import router from "@/router";
const api = inject("api") as AxiosInstance;
const login = async (handle: string) => {
  const response = await api.post("/register", { handle }).catch((error) => {
    console.error("Error logging user:", error.message, error.code);
    loginError.value = true;
  });
  if (response) {
    console.log(
      "Successfully authenticated the user and got a response of",
      response
    );
    router.push({ name: "home" });
  }
};
const handle = ref("");
const loginError = ref(false);
</script>

<template>
  <main class="flex items-center justify-center w-1/3 m-auto">
    <form @submit.prevent="login(handle)" class="flex flex-col gap-6 w-full">
      <h1 class="text-3xl">Welcome to YADTS</h1>
      <div class="flex w-3/4 h-11 bg-lightdark rounded-full shadow-none">
        <div class="flex flex-1 pt-1 pr-2 pb-0 pl-3">
          <div class="flex items-center pr-3">
            <div class="m-auto pb-5 h-5 w-5 leading-5">
              <img src="../assets/user.svg" />
            </div>
          </div>
          <div class="flex flex-1 flex-wrap">
            <input
              type="text"
              placeholder="Please enter your username"
              class="bg-transparent border-0 mb-1 p-0 w-full focus:outline-none"
              v-model="handle"
            />
          </div>
        </div>
      </div>
      <p v-if="loginError" class="text-red-500">
        There was an error with the login. Please try again
      </p>
      <p>
        Don't have an account yet?
        <RouterLink to="/register" class="underline text-accent"
          >Register now!</RouterLink
        >
      </p>
    </form>
  </main>
</template>
