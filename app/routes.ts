import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("travel", "routes/travel.tsx"),
  route("blog", "routes/blog.tsx", { id: "blog" }),
  route("blog/:slug", "routes/blog.$slug.tsx", { id: "blog-post" }),
  route("thoughts", "routes/blog.tsx", { id: "thoughts" }),
  route("thoughts/:slug", "routes/blog.$slug.tsx", { id: "thoughts-post" }),
] satisfies RouteConfig;
