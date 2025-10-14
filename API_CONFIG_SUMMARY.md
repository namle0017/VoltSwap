# 🎯 API Configuration Summary

## 📋 Cấu hình hiện tại

### ✅ **Manual Swap API - Real API**
- **URL**: `https://6cefe8355a09.ngrok-free.app/api`
- **Endpoints**:
  - `GET /stations/:stationId/slots/ready` - Lấy slots sẵn sàng
  - `GET /stations/:stationId/slots` - Lấy tất cả slots  
  - `POST /manual-swap` - Thực hiện manual swap
  - `GET /swap-history` - Lấy lịch sử swap
- **Pages sử dụng**: ManualAssist, BatterySwap, DockConsole (slots)

### 📝 **Mock Data APIs**
- **Admin Requests** - localStorage mock data
- **Dock Console** - localStorage mock data  
- **Overview/Inventory** - localStorage mock data
- **Booking/Customer Support** - localStorage mock data

## 🧪 **Cách test**

### 1. API Test Page
```
http://localhost:5175/api-test
```
- Chỉ test Manual Swap API
- Hiển thị status của từng API

### 2. Test các trang chính

#### Manual Assist (Real API)
```
http://localhost:5175/staff/assist
```
- ✅ Load ready slots từ real API
- ✅ Submit manual swap tới real API
- ✅ Console logs chi tiết

#### Battery Swap History (Real API)
```
http://localhost:5175/staff/swap
```
- ✅ Load history từ real API
- ✅ Hiển thị lịch sử swap thật

#### Admin Request (Mock Data)
```
http://localhost:5175/staff/admin-request
```
- 📝 Sử dụng mock data (localStorage)
- 📝 Console log: "Using mock data for Admin Requests"

#### Dock Console (Mixed)
```
http://localhost:5175/staff/dock
```
- ✅ Load slots từ real API
- 📝 Dock/Undock operations dùng mock data

## 🔍 **Console Logs**

### Real API Calls
```
🌐 Manual Swap API Call: GET /stations/st-01/slots/ready
✅ Manual Swap API Response: [...]
```

### Mock Data Usage
```
📝 Using mock data for Admin Requests
📝 Using mock data for Dock Console
```

## 🚀 **Demo Flow**

1. **Truy cập**: `http://localhost:5175/api-test`
2. **Test Manual Swap API** - kiểm tra connection
3. **Vào Manual Assist**: `http://localhost:5175/staff/assist`
4. **Test real functionality** với backend
5. **Kiểm tra console** để xem API calls
6. **Test các trang khác** với mock data

## 📊 **Expected Manual Swap API Responses**

### Ready Slots
```json
GET /api/stations/st-01/slots/ready
[
  {
    "slotId": "sl-1",
    "battery": {
      "id": "bat-ok-101",
      "soh": 91,
      "soc": 100,
      "cycles": 30
    }
  }
]
```

### Manual Swap
```json
POST /api/manual-swap
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
```

### Swap History
```json
GET /api/swap-history
[
  {
    "id": "swap-1234567890",
    "type": "manual",
    "at": "2025-01-15T10:30:00Z",
    "stationId": "st-01",
    "staffId": "staff-001",
    "subscriptionId": "sub-001",
    "inBatteryId": "bat-err-001",
    "outBatteryId": "bat-new-9001",
    "fee": 0,
    "message": "Đã đổi pin thành công."
  }
]
```

## 🔧 **Troubleshooting**

### CORS Error
```
Access to fetch at 'https://6cefe8355a09.ngrok-free.app/api/...' 
from origin 'http://localhost:5175' has been blocked by CORS policy
```
**Solution**: Backend cần thêm CORS headers

### 404 Error
```
HTTP error! status: 404
```
**Solution**: Kiểm tra API endpoints có đúng không

### Network Error
```
Failed to fetch
```
**Solution**: Kiểm tra ngrok tunnel có đang chạy không

## 📝 **Next Steps**

1. **Test Manual Swap API** với backend thật
2. **Fix các lỗi** nếu có (CORS, 404, etc.)
3. **Cung cấp thêm API endpoints** cho các phần khác nếu cần
4. **Deploy** lên production khi ready
