<script setup lang="ts">
import { inject, onBeforeMount, ref } from "vue";
import { useRoute } from "vue-router";
import type { AxiosInstance } from "axios";
import ProfileDescription from "../components/ProfileDescription.vue";
import ProfileTimeline from "./ProfileTimeline.vue";
export interface Post {
  handle: string;
  content: string;
  timestamp: Date;
  reposts: string[];
  likes: string[];
}

enum PostInteraction {
  POST,
  REPOST,
  LIKE,
}
interface Interaction {
  handle: string;
  id: string;
  interaction: PostInteraction;
  timestamp: Date;
}
interface UserInfo {
  handle: string;
  followers: string[];
  following: string[];
  timeline: Interaction[];
}

const api = inject("api") as AxiosInstance;
const route = useRoute();
const handle = ref("");
const user = ref<UserInfo>();
const posts = ref<Post[]>([]);
handle.value = route.params.handle as string;

async function fetchUserInfo(handle: string) {
  const data = await api.get("/" + handle, {
    validateStatus: (status) => {
      return status == 302
    }
  });
  user.value = JSON.parse(data.data);
  const postIDs = user.value?.timeline.filter((i) => i.interaction !== PostInteraction.LIKE)
    .map((i) => i.id)
    .filter((elem, index, self) => {
      return index === self.indexOf(elem);
    });

  console.log(postIDs);
  for (let id of postIDs || []) {
    const postData = await api.get("/post/" + id, {
      validateStatus: (status) => {
        return status == 302
      }
    });
    posts.value.push(JSON.parse(postData.data));
  }

}

onBeforeMount(async () => {
  handle.value = route.params.handle.toString();
  await fetchUserInfo(handle.value)
}
);
</script>

<template>
  <main class="w-3/5 flex flex-col mx-auto">
    <ProfileDescription :name="user?.handle || ''" :followers="user?.followers || []"
      :following="user?.following || []" />
    <ProfileTimeline :posts="posts" :name="user?.handle || ''" />
  </main>
</template>
