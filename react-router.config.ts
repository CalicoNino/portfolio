import type { Config } from "@react-router/dev/config";
import blogPosts from "./data/blog-posts.json";

export default {
  ssr: true,
  async prerender() {
    return [
      "/",
      "/blog",
      "/thoughts",
      ...blogPosts.map((p) => `/blog/${p.slug}`),
      ...blogPosts.map((p) => `/thoughts/${p.slug}`),
    ];
  },
} satisfies Config;
