import { createRouter, createWebHistory } from "vue-router";

import HomePage from "./pages/HomePage.vue";
import PostPage from "./pages/PostPage.vue";
import UserPage from "./pages/UserPage.vue";
import NewPost from "./pages/NewPost.vue";

const router = createRouter({
    history: createWebHistory(),
    routes: [
        { path: "/", redirect: "/home" },
        { path: "/home", component: HomePage },
        { path: "/newpost", component: NewPost },
        { path: "/:id", component: UserPage },
        { path: "/post/:id", component: PostPage },
        { path: "/:notFound(.*)", redirect: "/" } // regular expression for anything entered
    ],
});

export default router;