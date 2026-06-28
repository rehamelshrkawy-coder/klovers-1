import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { ViteImageOptimizer } from "vite-plugin-image-optimizer";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(() => ({
  server: {
    host: "::",
    port: Number(process.env.PORT) || 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [
    react(),
    ViteImageOptimizer({
      jpg: { quality: 80 },
      jpeg: { quality: 80 },
      png: { quality: 80 },
      webp: { quality: 80 },
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    // Increase chunk size warning limit (avoids noise, not a problem for SPA)
    chunkSizeWarningLimit: 800,
    rollupOptions: {
      output: {
        // Split vendor chunks for better caching
        manualChunks: {
          // React core — changes rarely, long cache lifetime
          "vendor-react": ["react", "react-dom", "react-router-dom"],
          // UI components
          "vendor-ui": [
            "@radix-ui/react-dialog",
            "@radix-ui/react-tabs",
            "@radix-ui/react-select",
            "@radix-ui/react-toast",
            "@radix-ui/react-dropdown-menu",
          ],
          // Supabase client
          "vendor-supabase": ["@supabase/supabase-js"],
          // Markdown rendering (only used on blog post pages)
          "vendor-markdown": ["react-markdown", "remark-gfm"],
          // Charting — heavy (~400 kB) and only needed inside admin
          // Sales/Analytics surfaces. Named so the chunk hash stays
          // stable across deploys when unrelated admin code changes.
          "vendor-charts": ["recharts"],
        },
      },
    },
  },
}));
