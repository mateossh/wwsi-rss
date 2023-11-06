import { defineConfig } from 'astro/config';
import tailwind from "@astrojs/tailwind";

import vercelEdge from "@astrojs/vercel/edge";

// https://astro.build/config
export default defineConfig({
  integrations: [tailwind()],
  output: "server",
  adapter: vercelEdge()
});