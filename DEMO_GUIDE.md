# 🚀 Demo với Real API Backend

## 📋 Cấu hình hiện tại

- **Frontend**: `http://localhost:5175/`
- **Backend API**: `https://6cefe8355a09.ngrok-free.app/api`
- **Status**: ✅ Sẵn sàng để demo

## 🧪 Cách test API

### 1. Truy cập API Test Page
```
http://localhost:5175/api-test
```

Trang này sẽ test các API endpoints:
- ✅ Admin Requests API
- ✅ Manual Swap History API  
- ✅ Station Slots API

### 2. Test các trang chính

#### Admin Request Page
```
http://localhost:5175/staff/admin-request
```
- Test tạo request mới
- Test load danh sách requests
- Kiểm tra Network tab để xem API calls

#### Manual Assist Page  
```
http://localhost:5175/staff/assist
```
- Test manual swap functionality
- Test load ready slots
- Test submit swap request

#### Battery Swap History
```
http://localhost:5175/staff/swap
```
- Test load swap history
- Xem lịch sử các lần swap

#### Dock Console
```
http://localhost:5175/staff/dock
```
- Test dock/undock operations
- Test load station slots

## 🔍 Debug và Monitoring

### 1. Browser Console
Mở DevTools (F12) → Console để xem:
```
🌐 API Call: GET https://6cefe8355a09.ngrok-free.app/api/admin-requests
✅ API Response: [...]
```

### 2. Network Tab
DevTools → Network để xem:
- Request/Response details
- Status codes
- Headers
- Response time

### 3. Common Issues

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

#### Network Error
```
Failed to fetch
```
**Solution**: Kiểm tra ngrok tunnel có đang chạy không

## 📊 Expected API Responses

### Admin Requests
```json
GET /api/admin-requests
[
  {
    "id": "IS001",
    "code": "IS001", 
    "requestType": "Overheated Battery",
    "driverId": "driver-001",
    "description": "Pin quá nhiệt khi vận hành",
    "status": "Pending",
    "createdAt": "2025-01-15T10:30:00Z"
  }
]
```

### Manual Swap History
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

### Station Slots
```json
GET /api/stations/st-01/slots
[
  {
    "id": "sl-0",
    "status": "empty",
    "batteryId": null
  },
  {
    "id": "sl-1", 
    "status": "ready",
    "batteryId": "bat-ok-101"
  }
]
```

## 🎯 Demo Checklist

- [ ] Ngrok tunnel đang chạy
- [ ] Frontend build thành công
- [ ] API Test page hoạt động
- [ ] Admin Request page load được data
- [ ] Manual Assist page hoạt động
- [ ] Battery Swap history hiển thị
- [ ] Dock Console hoạt động
- [ ] Console không có lỗi
- [ ] Network requests thành công

## 🚀 Next Steps

1. **Test tất cả features** với real API
2. **Fix các lỗi** nếu có (CORS, 404, etc.)
3. **Optimize API calls** nếu cần
4. **Add error handling** tốt hơn
5. **Deploy** lên production

## 📞 Support

Nếu gặp vấn đề:
1. Check browser console
2. Check Network tab  
3. Verify ngrok tunnel status
4. Check backend logs
5. Contact backend team

