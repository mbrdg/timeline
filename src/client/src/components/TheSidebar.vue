<script setup lang="ts">
export interface UserInfo {
  handle: string;
  privateKey: string;
}

defineProps<UserInfo>();
defineEmits(["update:handle", "update:privateKey"]);
</script>

<template>
  <aside class="w-1/3 flex flex-col pt-36 pl-10">
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
    <div class="flex gap-2 text-xl mt-5">
      <p>Go to your</p>
      <RouterLink class="text-accent" :to="`/${handle}`"
        >profile page</RouterLink
      >
    </div>
    <div class="flex gap-2 text-xl mt-5">
      <p>Not registered yet?</p>
      <RouterLink class="text-accent" to="/register">Register now!</RouterLink>
    </div>
  </aside>
</template>
