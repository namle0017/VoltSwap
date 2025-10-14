// vite.config.js
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/api": {
        target: "https://5e7d9aa861ce.ngrok-free.app", // 🔗 thay bằng URL ngrok hiện tại của bạn
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
});
