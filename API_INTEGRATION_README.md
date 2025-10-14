# 🚀 EV Staff Dashboard - API Integration

## 📋 Cấu hình API

### 1. Axios Configuration
```javascript
// src/services/api.js
import axios from "axios";

const API_BASE_URL = "https://6cefe8355a09.ngrok-free.app/api";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
    "ngrok-skip-browser-warning": "true", // Bypass ngrok browser warning
  },
});
```

### 2. API Services
```javascript
// src/services/apiServices.js
import api from "./api.js";

export const adminRequestsAPI = {
    async fetchAdminRequests() {
        const response = await api.get("/admin-requests");
        return response.data;
    },
    
    async createAdminRequest(payload) {
        const response = await api.post("/admin-requests", payload);
        return response.data;
    },
};
```

## 🔧 Cách thay đổi API URL

### Option 1: Hardcode trong code (Recommended)
```javascript
// src/services/api.js
const API_BASE_URL = "https://your-new-api-url.com/api";
```

### Option 2: Environment Variables
```javascript
// src/services/api.js
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "https://6cefe8355a09.ngrok-free.app/api";
```

Tạo file `.env.local`:
```bash
VITE_API_BASE_URL=https://your-new-api-url.com/api
```

## 📊 API Endpoints

### Admin Requests
- `GET /api/admin-requests` - Lấy danh sách requests
- `POST /api/admin-requests` - Tạo request mới
- `PATCH /api/admin-requests/:id` - Cập nhật request
- `DELETE /api/admin-requests/:id` - Xóa request

### Manual Swap
- `GET /api/stations/:stationId/slots/ready` - Lấy slots sẵn sàng
- `GET /api/stations/:stationId/slots` - Lấy tất cả slots
- `POST /api/manual-swap` - Thực hiện manual swap
- `GET /api/swap-history` - Lấy lịch sử swap

### Dock Console
- `POST /api/dock/battery` - Dock battery vào slot
- `POST /api/dock/undock` - Undock battery từ slot
- `POST /api/dock/combo` - Dock + Undock combo

## 🧪 Testing

### 1. API Test Page
```
http://localhost:5175/api-test
```

### 2. Browser Console
Mở DevTools (F12) → Console để xem:
```
🌐 API Call: GET /admin-requests
✅ API Response: [...]
```

### 3. Network Tab
DevTools → Network để xem request/response details

## 🔍 Debug

### Common Issues

#### CORS Error
```
Access to fetch at 'https://6cefe8355a09.ngrok-free.app/api/admin-requests' 
from origin 'http://localhost:5175' has been blocked by CORS policy
```

**Solution**: Backend cần thêm CORS headers:
```javascript
app.use(cors({
  origin: 'http://localhost:5175',
  credentials: true
}));
```

#### Ngrok Browser Warning
```
ngrok-skip-browser-warning header đã được thêm tự động
```

#### 404 Not Found
```
HTTP error! status: 404
```

**Solution**: Kiểm tra API endpoints có đúng không

## 📝 Request/Response Examples

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

## 🚀 Deployment

### 1. Build
```bash
npm run build
```

### 2. Deploy
Upload `dist/` folder lên web server

### 3. Update API URL
Thay đổi `API_BASE_URL` trong `src/services/api.js` thành production URL

## 📞 Support

Nếu gặp vấn đề:
1. Check browser console
2. Check Network tab
3. Verify API endpoints
4. Check backend logs
5. Contact backend team

