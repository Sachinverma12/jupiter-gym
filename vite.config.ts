import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";
import tailwindcss from "tailwindcss";

export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  css: [
    {
      postcss: {
        plugins: [tailwindcss()],
      },
    },
  ],
  resolve: {
    alias: {
      "@": "/src",
    },
  },
  server: {
    port: 3000,
    strictPort: true,
    host: true,
    open: true,
  },
  build: {
    target: "es2022",
    minify: "esbuild",
    sourcemap: true,
    assetsInlineLimit: 4000,
    rollupOptions: {
      output: {
        assetFileNames: "assets/[name]-[hash][extname]",
        chunkFileNames: "assets/[name]-[hash].js",
        entryFileNames: "assets/[name]-[hash].js",
        compact: true,
        manualChunks: {
          query: ["@tanstack/react-query"],
          router: ["@tanstack/react-router"],
          start: ["@tanstack/react-start"],
          supabase: ["@supabase/supabase-js"],
          ui: ["react", "lucide-react"],
          chart: ["recharts"],
        },
      },
    },
    cssCodeSplit: true,
  },
  optimizeDeps: {
    include: [
      "lucide-react",
      "recharts",
      "qrcode.react",
      "dayjs",
      "date-fns",
    ],
  },
  envPrefix: "VITE_",
});