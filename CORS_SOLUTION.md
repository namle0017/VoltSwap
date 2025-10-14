# Giải pháp CORS cho Staff Page

## Vấn đề
Frontend đang gặp lỗi CORS khi gọi API đến backend ngrok:
```
Access to XMLHttpRequest at 'https://6cefe8355a09.ngrok-free.app/api/swap-history' 
from origin 'http://localhost:5173' has been blocked by CORS policy
```

## Giải pháp đã áp dụng

### 1. Sử dụng Vite Proxy (Đã cấu hình)
File `vite.config.js` đã được cấu hình để proxy requests từ `/api` đến ngrok URL:

```javascript
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/api": {
        target: "https://6cefe8355a09.ngrok-free.app",
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
```

### 2. Cập nhật API Client
File `src/services/api.js` đã được cập nhật để:
- Sử dụng `/api` trong development (proxy)
- Fallback về ngrok URL trong production
- Thêm error handling cho CORS

### 3. Cải thiện Error Handling
- Thêm error states trong các components
- Hiển thị thông báo lỗi rõ ràng cho user
- Thêm nút "Thử lại" khi có lỗi

## Cách test

1. **Restart dev server** để áp dụng proxy:
   ```bash
   npm run dev
   ```

2. **Kiểm tra Network tab** trong DevTools:
   - Requests sẽ đi đến `http://localhost:5173/api/...` thay vì ngrok URL
   - Không còn lỗi CORS

3. **Kiểm tra Console**:
   - Sẽ thấy log: `📍 Full URL: /api/swap-history`
   - Không còn CORS errors

## Backup Solutions

Nếu proxy không hoạt động, có thể:

### 1. Cấu hình CORS trên Backend
Backend cần thêm headers:
```javascript
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true
}));
```

### 2. Sử dụng Browser Extension
Tạm thời disable CORS với extension như "CORS Unblock"

### 3. Chạy Chrome với disabled security
```bash
chrome --disable-web-security --user-data-dir=/tmp/chrome_dev
```

## Monitoring

Để theo dõi API calls:
- Check Console logs với prefix `🌐 Manual Swap API Call`
- Check Network tab trong DevTools
- Error messages sẽ hiển thị trong UI

## Notes

- Proxy chỉ hoạt động trong development mode
- Production cần cấu hình CORS trên backend
- Ngrok URL có thể thay đổi, cần cập nhật `vite.config.js`

