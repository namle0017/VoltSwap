// fakeApi.js

// Fake data trạm
export const fetchStationData = async () => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const slots = Array.from({ length: 20 }, (_, i) => {
        // 4 slot đầu luôn trống cho user bỏ pin vào
        if (i < 4) {
          return {
            id: i + 1,
            type: "INPUT", // slot để bỏ pin vào
            hasBattery: false,
            battery: null,
          };
        }
        // Các slot còn lại chứa pin sạc sẵn (mock)
        return {
          id: i + 1,
          type: "OUTPUT", // slot chứa pin sạc
          hasBattery: Math.random() > 0.2,
          battery: {
            id: `PIN-${i + 1}`,
            soh: Math.floor(Math.random() * 35) + 65, // SoH 65% - 100%
            cycles: Math.floor(Math.random() * 500),
          },
        };
      });

      resolve({
        stationId: "ST001",
        name: "Trạm đổi pin EV Demo",
        location: "123 Đường A, Quận B, TP.HCM",
        totalSlots: 20,
        slots,
      });
    }, 500);
  });
};

// Fake kiểm tra pin user đưa vào
export const validateInsertedPins = async (pins) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      // Nếu có pin SoH < 65% thì fail
      const badPin = pins.find((p) => p.soh < 65);
      if (badPin) {
        resolve({
          success: false,
          message: `❌ Pin ${badPin.id} SoH < 65% → cần bảo trì`,
        });
      } else {
        resolve({
          success: true,
          message: "✅ Tất cả pin hợp lệ",
        });
      }
    }, 2000);
  });
};
// src/api/fakeApi.js
let transactionHistory = [];

export function getTransactionHistory() {
  return transactionHistory;
}

export function addTransaction(entry) {
  transactionHistory.push({
    id: transactionHistory.length + 1,
    time: new Date().toLocaleString(),
    ...entry,
  });
}
