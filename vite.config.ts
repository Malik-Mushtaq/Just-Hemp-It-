import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(() => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
    allowedHosts: ["justhempit.co.uk", "www.justhempit.co.uk", "admin.justhempit.co.uk"],
  },
  preview: {
    host: "::",
    allowedHosts: ["justhempit.co.uk", "www.justhempit.co.uk", "admin.justhempit.co.uk"],
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));