import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite"; // 1. Add this import

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(), // 2. Add this to the plugins array
  ],
  server: {
    host: true, // Listen on all network addresses (0.0.0.0) so mobile devices on the same Wi-Fi can connect
  },
});
