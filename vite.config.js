import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      "/api": {
        target: "https://41e7c25c8860.ngrok-free.app", // 🔗 thay bằng URL ngrok hiện tại của bạn
        changeOrigin: true, // cho phép Vite đóng vai trò proxy hợp lệ
        secure: false, // bỏ kiểmtra SSL (vì ngrok free có thể cảnh báo)
        rewrite: (path) => path.replace(/^\/api/, "/api"), // giữ nguyên cấu trúc /api
        configure: (proxy) => {
          proxy.on("proxyReq", (proxyReq) => {
            // thêm header để ngrok bỏ qua trang cảnh báo
            proxyReq.setHeader("ngrok-skip-browser-warning", "true");
          });
        },
      },
    },
  },
  resolve: {
    // eslint-disable-next-line no-undef
    alias: { "@": path.resolve(__dirname, "src") },
  },
});