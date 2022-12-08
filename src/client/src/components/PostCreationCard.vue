<script setup lang="ts">
import { ref, computed, inject } from "vue";
import type { AxiosInstance } from "axios";
export interface UserInfo {
  handle: string;
  privateKey: string;
}

const props = defineProps<UserInfo>();

const api = inject("api") as AxiosInstance;
const content = ref("");
const publishError = ref(false);

const disableButton = computed(() => {
  return (
    content.value.length === 0 ||
    props.privateKey.length === 0 ||
    props.handle.length === 0
  );
});

async function publish(postContent: string) {
  const response = await api
    .post("/publish", {
      handle: props.handle,
      content: postContent,
    })
    .catch((error) => {
      console.error("Error publishing post:", error.message, error.code);
      publishError.value = true;
    });
  console.log("Published the post. Got a response of:", response);
  content.value = "";
}
</script>

<template>
  <form
    @submit.prevent="publish(content)"
    class="flex flex-col justify-center pt-10 pb-5 my-5 rounded-2xl bg-superdark w-full"
  >
    <textarea
      class="bg-superdark border-[1.5px] rounded-xl px-3 py-3 m-auto w-4/5 outline-none resize-none placeholder:text-xl text-xl"
      placeholder="Oh look it's decentralized"
      rows="5"
      v-model="content"
    ></textarea>
    <p v-if="publishError" class="m-auto w-4/5 pt-2 text-red-500">
      There was a problem publishing the post. Please try again.
    </p>
    <button
      class="bg-light rounded-xl text-superdark text-lg mt-5 py-3 px-1 self-end w-1/5 mr-10 disabled:bg-accent"
      type="submit"
      :disabled="disableButton"
    >
      Publish
    </button>
  </form>
</template>
