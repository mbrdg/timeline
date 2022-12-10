<script setup lang="ts">
import type { AxiosInstance, AxiosResponse } from "axios";
import { inject, ref } from "vue";
import { useRouter } from "vue-router";

export interface UserFormInfo {
  handle: string;
  privateKey: string;
  keyInvalid: boolean;
}

const router = useRouter();
const api = inject("api") as AxiosInstance;

const page = ref("");
const notFound = ref(false);

const search = async (page: string) => {
  const isTopic = page.charAt(0) === "#";
  const url = isTopic ? `/topic/${page.slice(1)}` : `/${page}`;

  const result = await api
    .get(url, {
      validateStatus: (status) => {
        return status === 302 || status === 200;
      },
    })
    .catch((error) => {
      console.error("The error is", error.response);
      notFound.value = true;
      return { status: 404 };
    });

  const code = result.status;
  if (code === 302 || code === 200) {
    router.push({ path: url });
  }
};

defineProps<UserFormInfo>();
defineEmits(["update:handle", "update:privateKey"]);
</script>

<template>
  <aside class="flex flex-col pt-36 pl-10">
    <div class="text-2xl text-accent">These are your informations:</div>

    <label class="text-xl my-5">Your handle:</label>
    <input
      :value="handle"
      @input="$emit('update:handle', $event.target.value)"
      type="text"
      class="bg-superdark border-[1.5px] px-3 py-3 rounded-2xl w-4/5 outline-none placeholder:text-xl text-xl"
      placeholder="Enter your handle here"
    />
    <label class="text-xl my-5">Your private key:</label>
    <input
      :value="privateKey"
      @input="$emit('update:privateKey', $event.target.value)"
      type="password"
      class="bg-superdark border-[1.5px] px-3 py-3 rounded-2xl w-4/5 outline-none placeholder:text-xl text-xl"
      placeholder="Enter your private key here"
    />
    <p v-if="keyInvalid" class="text-red-500">
      The specified private key is not valid. Please try again.
    </p>
    <div class="flex gap-2 text-xl mt-5">
      <p>Go to your</p>
      <RouterLink class="text-accent" :to="`/${handle}`"
        >profile page</RouterLink
      >
    </div>
    <div class="flex gap-2 text-xl my-5">
      <p>Or search for another page here:</p>
    </div>
    <form @submit.prevent="search(page)">
      <input
        v-model="page"
        type="text"
        class="bg-superdark border-[1.5px] px-3 py-3 rounded-2xl w-4/5 outline-none placeholder:text-xl text-xl"
        placeholder="What page do you want to go to?"
      />
    </form>
    <p v-if="notFound" class="text-red-500">
      No user or topic matches your search. Please try again.
    </p>
    <div class="flex gap-2 text-xl mt-5">
      <p>Not registered yet?</p>
      <RouterLink class="text-accent" to="/register">Register now!</RouterLink>
    </div>
  </aside>
</template>
