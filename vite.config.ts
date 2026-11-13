import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import site from "./site.config.json";

export default defineConfig({
  base: new URL(site.url).pathname,
  plugins: [react()],
  build: {
    sourcemap: false,
  },
});
