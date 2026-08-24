import { defineConfig } from "vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";
import tailwindcss from "@tailwindcss/vite";
import { nitro } from "nitro/vite";

export default defineConfig({
  plugins: [tanstackStart(), nitro(), tailwindcss(), react(), tsconfigPaths()],
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
  },
  optimizeDeps: {
    include: ["lucide-react", "recharts", "qrcode.react", "dayjs", "date-fns"],
  },
  envPrefix: "VITE_",
});
