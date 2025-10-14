// src/api/batterySwapApi.js
import axios from "axios";

/** Axios instance dùng Vite proxy (/api) */
export const batteryApi = axios.create({
    baseURL: "", // để rỗng: mọi request sẽ bắt đầu bằng "/api/..."
});

batteryApi.interceptors.request.use((config) => {
    const fullUrl = (config.baseURL || "") + (config.url || "");
    const bodyOrParams = config.data ?? config.params ?? {};
    console.log(`[HTTP] ${config.method?.toUpperCase()} ${fullUrl}`, bodyOrParams);
    return config;
});

/* =============== Manual Assist (giữ nguyên nếu bạn đang dùng) =============== */
const toStr = (v) => (v == null ? v : String(v));

export async function manualAssist({
    stationId,
    staffId,
    subId,
    errorType,   // "pinIn" | "pinOut"
    inBatteryId, // dùng khi pinIn
    outBatteryId // pin xuất cho KH
}) {
    const body = {
        stationId: toStr(stationId),
        staffId: toStr(staffId),
        batteryOutId: toStr(outBatteryId) ?? null,
        batteryInId: errorType === "pinIn" ? toStr(inBatteryId) : null,
        subId: toStr(subId),
    };

    // Try #1: subId
    let res = await batteryApi.post("/api/BatterySwap/get-battery-in-station", body, {
        headers: { "Content-Type": "application/json" },
        validateStatus: () => true,
    });
    if (res.status >= 200 && res.status < 300) return res.data;

    // Try #2: subscriptionId
    const alt = { ...body, subscriptionId: body.subId };
    delete alt.subId;
    res = await batteryApi.post("/api/BatterySwap/get-battery-in-station", alt, {
        headers: { "Content-Type": "application/json" },
        validateStatus: () => true,
    });
    if (res.status >= 200 && res.status < 300) return res.data;

    const text =
        typeof res.data === "string"
            ? res.data
            : res.data?.title || res.data?.message || res.statusText || "Bad Request";
    const err = new Error(text);
    err.response = res;
    throw err;
}

/* ======================== Staff add new battery (GET ONLY) ========================
   - CHỈ gửi 4 tham số: slotId, batteryId, stationId, staffId
   - Không skip lỗi. Nếu BE trả lỗi, throw ra để UI hiển thị.
   - Có kèm fallback KEY NAMES theo ảnh bạn gửi (SlotId/BatteryInId/StataionId/staffId).
*/
export async function staffAddNewBattery({
    slotId,
    batteryId,
    stationId,
    staffId,
}) {
    // Gửi đúng key theo yêu cầu BE (theo hình)
    const params = {
        SlotId: String(slotId),
        BatteryInId: String(batteryId),
        StataionId: String(stationId), // giữ nguyên typo này vì BE yêu cầu như vậy
        staffId: String(staffId),
    };

    // Gửi GET request
    const res = await batteryApi.get("/api/BatterySwap/staff-add-new-battery", {
        params,
        headers: { "ngrok-skip-browser-warning": "true" },
        validateStatus: () => true,
    });

    console.log("[GET staff-add-new-battery]", res.status, params, res.data);

    // Nếu thành công
    if (res.status >= 200 && res.status < 300) return res.data;

    // Nếu lỗi → trả nguyên văn lỗi từ BE
    const text =
        typeof res.data === "string"
            ? res.data
            : res.data?.title || res.data?.message || res.statusText || "Request failed";
    const err = new Error(text);
    err.response = res;
    throw err;
}
