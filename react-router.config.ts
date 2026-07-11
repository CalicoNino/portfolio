import type { Config } from "@react-router/dev/config";
import { getAllPosts } from "./lib/blog";

export default {
  ssr: true,
  async prerender() {
    const posts = getAllPosts();
    return [
      "/",
      "/blog",
      "/thoughts",
      ...posts.map((p) => `/blog/${p.slug}`),
      ...posts.map((p) => `/thoughts/${p.slug}`),
    ];
  },
} satisfies Config;
