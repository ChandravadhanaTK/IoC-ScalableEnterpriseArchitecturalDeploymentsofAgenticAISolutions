import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// `npm run dev` proxies /api to the FastAPI backend on :8000.
// `npm run build:demo` produces a backend-free build that runs the agent
// workflow in the browser (src/demo/engine.js) for hosted demos.
export default defineConfig(({ mode }) => ({
  plugins: [react()],
  define: { __DEMO__: JSON.stringify(mode === "demo") },
  // Keep the in-browser engine out of production bundles entirely.
  resolve: mode === "demo" ? {} : {
    alias: [{ find: /^\.\/demo\/engine\.js$/, replacement: new URL("./src/demo/stub.js", import.meta.url).pathname }],
  },
  server: {
    port: 5173,
    proxy: { "/api": "http://localhost:8000", "/metrics": "http://localhost:8000" },
  },
  build: mode === "demo"
    ? { outDir: "dist-demo", rollupOptions: { output: { inlineDynamicImports: true } } }
    : { outDir: "dist" },
}));
