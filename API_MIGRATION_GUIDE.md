# Hướng dẫn chuyển đổi từ Mock API sang Real API

## 🚀 Đã hoàn thành

### 1. Tạo API Service Layer
- ✅ File `src/services/api.js` - chứa tất cả API calls
- ✅ Cấu trúc modular theo từng module (adminRequests, manualSwap, dockConsole, etc.)

### 2. Cập nhật Components
- ✅ `AdminRequest.jsx` - sử dụng `adminRequestsAPI`
- ✅ `ManualAssist.jsx` - sử dụng `manualSwapAPI` 
- ✅ `DockConsole.jsx` - sử dụng `dockConsoleAPI`
- ✅ `BatterySwap.jsx` - sử dụng `manualSwapAPI.getHistory()`

## 🔧 Cấu hình cần thiết

### 1. Environment Variables
Tạo file `.env.local` trong root project:
```bash
# API Base URL - thay đổi theo backend của bạn
VITE_API_BASE_URL=http://localhost:8080/api

# Hoặc các URL khác:
# Development: http://localhost:8080/api
# Staging: https://staging-api.evswap.com/api  
# Production: https://api.evswap.com/api
```

### 2. Backend API Endpoints cần implement

#### Admin Requests
- `GET /api/admin-requests` - Lấy danh sách requests
- `POST /api/admin-requests` - Tạo request mới
- `PATCH /api/admin-requests/:id` - Cập nhật request
- `DELETE /api/admin-requests/:id` - Xóa request

#### Manual Swap
- `GET /api/stations/:stationId/slots/ready` - Lấy slots sẵn sàng
- `GET /api/stations/:stationId/slots` - Lấy tất cả slots
- `POST /api/manual-swap` - Thực hiện manual swap
- `GET /api/swap-history` - Lấy lịch sử swap

#### Dock Console
- `POST /api/dock/battery` - Dock battery vào slot
- `POST /api/dock/undock` - Undock battery từ slot
- `POST /api/dock/combo` - Dock + Undock combo

#### Overview & Others
- `GET /api/overview/stats` - Thống kê tổng quan
- `GET /api/overview/tickets` - Danh sách tickets
- `GET /api/inventory/summary` - Tóm tắt inventory
- `GET /api/bookings` - Danh sách bookings
- `GET /api/support/tickets` - Support tickets

## 📝 Request/Response Format

### Admin Request
```javascript
// POST /api/admin-requests
{
  "requestType": "Overheated Battery",
  "driverId": "driver-001", 
  "description": "Pin quá nhiệt khi vận hành"
}

// Response
{
  "id": "IS001",
  "code": "IS001",
  "requestType": "Overheated Battery",
  "driverId": "driver-001",
  "description": "Pin quá nhiệt khi vận hành",
  "status": "Pending",
  "createdAt": "2025-01-15T10:30:00Z"
}
```

### Manual Swap
```javascript
// POST /api/manual-swap
{
  "stationId": "st-01",
  "subscriptionId": "sub-001", 
  "staffId": "staff-001",
  "inBatteryId": "bat-err-001",
  "outMode": "manual",
  "outBattery": {
    "id": "bat-new-9001",
    "soh": 90,
    "soc": 100,
    "cycles": 0
  },
  "errorType": "pinIn"
}

// Response
{
  "ok": true,
  "data": {
    "stationId": "st-01",
    "subscriptionId": "sub-001",
    "staffId": "staff-001", 
    "inBattery": {...},
    "outBattery": {...},
    "usedSlotId": null,
    "fee": 0,
    "message": "Đã đổi pin thành công."
  }
}
```

## 🔄 Cách test

### 1. Với Mock API (hiện tại)
```bash
npm run dev
# Truy cập http://localhost:5175
# Tất cả sẽ hoạt động với mock data
```

### 2. Với Real API
```bash
# 1. Cập nhật .env.local với URL backend thật
VITE_API_BASE_URL=http://your-backend-url/api

# 2. Restart dev server
npm run dev

# 3. Kiểm tra Network tab trong DevTools để xem API calls
```

## 🛠️ Troubleshooting

### Lỗi CORS
Nếu gặp lỗi CORS, backend cần cấu hình:
```javascript
// Backend cần thêm CORS headers
app.use(cors({
  origin: 'http://localhost:5175', // hoặc domain frontend
  credentials: true
}));
```

### Lỗi 404
- Kiểm tra API endpoints có đúng không
- Kiểm tra VITE_API_BASE_URL có đúng không
- Kiểm tra backend có chạy không

### Lỗi Authentication
Nếu cần authentication, thêm vào `src/services/api.js`:
```javascript
// Thêm token vào headers
headers: {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${localStorage.getItem('token')}`,
}
```

## 📚 Next Steps

1. **Implement Backend APIs** theo format đã định
2. **Test từng API** một cách riêng biệt
3. **Thêm Error Handling** tốt hơn trong frontend
4. **Thêm Loading States** cho UX tốt hơn
5. **Thêm Authentication** nếu cần
6. **Deploy** và test trên staging/production

