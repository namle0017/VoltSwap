// src/api/batterySwapApi.js
import axios from "axios";

export const batteryApi = axios.create({
  baseURL: "", // dùng proxy của Vite
  headers: { "Content-Type": "application/json" },
});

batteryApi.interceptors.request.use((config) => {
  const fullUrl = (config.baseURL || "") + (config.url || "");
  console.log(`[HTTP] ${config.method?.toUpperCase()} ${fullUrl}`, config);
  return config;
});

// ---- BatterySwap APIs ----
export const getStationList = () =>
  batteryApi.get("/api/BatterySwap/get-station-list");

export const validateSubscription = (subscriptionId, stationId) =>
  batteryApi.get("/api/BatterySwap/validate-subscription", {
    params: { subscriptionId, stationId },
  });

export const swapInBattery = (payload) => {
  console.log("[swap-in] payload →", JSON.parse(JSON.stringify(payload)));
  return batteryApi.post("/api/BatterySwap/swap-in-battery", payload);
};

export const swapOutBattery = (payload) => {
  console.log("[swap-out] payload →", JSON.parse(JSON.stringify(payload)));
  return batteryApi.post("/api/BatterySwap/swap-out-battery", payload);
};
