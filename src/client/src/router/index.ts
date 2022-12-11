import { createRouter, createWebHistory } from "vue-router";
import HomeView from "../views/HomeView.vue";
import RegisterView from "../views/RegisterView.vue";
import ProfileView from "../views/ProfileView.vue";
import TopicView from "../views/TopicView.vue";
import ListView from "../views/ListView.vue";

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: "/",
      redirect: "/home",
    },
    {
      path: "/home",
      name: "home",
      component: HomeView,
    },
    {
      path: "/register",
      name: "register",
      component: RegisterView,
    },
    {
      path: "/:handle",
      name: "profile",
      component: ProfileView,
    },
    {
      path: "/topic/:topic",
      name: "topic",
      component: TopicView,
      props: true,
    },
    {
      path: "/list/:type/:id",
      name: "list",
      component: ListView,
    },
  ],
});

export default router;
