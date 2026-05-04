import { reactRouter } from "@react-router/dev/vite";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  base: process.env.BASE_PATH ?? "/",
  plugins: [reactRouter(), tsconfigPaths()],
  ssr: {
    external: ["node:fs", "node:path", "gray-matter"],
  },
});
