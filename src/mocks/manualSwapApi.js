// DEPRECATED: File này đã không được sử dụng nữa
// Tất cả các API đã được chuyển sang sử dụng API thật trong src/services/apiServices.js
//
// src/mocks/manualSwapApi.js
// ====== SEED DB (đủ cho demo) ======
const seed = () => ({
    packages: {
        G1: { code: "G1", pinsIncluded: 1, type: "at_station" },   // đổi tại trạm: 0đ
        S1: { code: "S1", pinsIncluded: 1, type: "self_charge" },  // tự sạc: -8k
    },
    subscriptions: new Map([
        ["sub-001", { id: "sub-001", userId: "cus-001", packageCode: "G1", active: true, end: "2025-12-31" }],
        ["sub-002", { id: "sub-002", userId: "cus-002", packageCode: "S1", active: true, end: "2025-12-31" }],
    ]),
    wallets: new Map([
        ["cus-001", { userId: "cus-001", balance: 100_000 }],
        ["cus-002", { userId: "cus-002", balance: 8_000 }],
    ]),
    batteries: new Map([
        // pin KH đem tới (lỗi)
        ["bat-err-001", { id: "bat-err-001", soh: 62, soc: 18, cycles: 120, flags: [] }],
        // pin sẵn trong kho (100%)
        ["bat-ok-101", { id: "bat-ok-101", soh: 91, soc: 100, cycles: 30, flags: [] }],
        ["bat-ok-102", { id: "bat-ok-102", soh: 88, soc: 100, cycles: 35, flags: [] }],
    ]),
    stations: new Map([
        ["st-01", {
            id: "st-01",
            slots: Array.from({ length: 20 }, (_, i) => {
                if (i === 2) return { id: `sl-${i}`, status: "ready", batteryId: "bat-ok-101" };
                if (i === 3) return { id: `sl-${i}`, status: "ready", batteryId: "bat-ok-102" };
                return { id: `sl-${i}`, status: i < 4 ? "reserve" : "empty", batteryId: null };
            }),
        }],
    ]),
    reports: new Map(),
    swapsHistory: [],
});

let DB = seed();
export function resetDemo() { DB = seed(); }
export const __db = () => DB;

// ====== Helpers / Rules ======
const minutesToFull = (soc) => Math.ceil((100 - soc) / 5.22); // BR-022
function recordReturn(bat) {
    bat.lastReturn = {
        date: new Date().toISOString(),
        soh: bat.soh,
        soc: bat.soc,
        chargeMinutesToFull: minutesToFull(bat.soc),
    };
}
function addReportRevenue(fee) {
    const ym = new Date().toISOString().slice(0, 7);
    const rep = DB.reports.get(ym) || { swaps: 0, revenue: 0 };
    rep.swaps += 1; rep.revenue += fee; DB.reports.set(ym, rep);
}
function upsertBattery({ id, soh = 90, soc = 100, cycles = 0, flags = [] }) {
    const cur = DB.batteries.get(String(id));
    if (cur) return cur;
    const b = { id: String(id), soh: Number(soh), soc: Number(soc), cycles: Number(cycles), flags: flags || [] };
    DB.batteries.set(b.id, b);
    return b;
}

// ====== Public helpers cho UI ======
export function listReadySlots(stationId) {
    const st = DB.stations.get(String(stationId));
    if (!st) return [];
    return st.slots
        .filter(s => s.status === "ready" && s.batteryId && DB.batteries.get(s.batteryId)?.soc === 100)
        .map(s => ({ slotId: s.id, battery: DB.batteries.get(s.batteryId) }));
}
export function getStationSlots(stationId) {
    const st = DB.stations.get(String(stationId));
    return st ? st.slots : [];
}

// ====== GIẢ LẬP chính (đã đổi sang staffId) ======
/**
 * staffManualSwapFlexible({
 *   stationId, subscriptionId, staffId, inBatteryId,
 *   outMode: "slot" | "manual",
 *   outSlotId?,                // khi outMode="slot"
 *   outBattery? { id, soh, soc, cycles } // khi outMode="manual"
 * })
 */
// src/mocks/manualSwapApi.js
// (giữ nguyên các phần seed/DB/helper ở trên)

export async function staffManualSwapFlexible({
    stationId, subscriptionId, staffId,
    inBatteryId,                               // <-- giờ CHO PHÉP optional khi out-only
    outMode = "manual", outSlotId, outBattery,
    errorType = "pinIn"                        // "pinIn" | "pinOut" — để lưu lịch sử rõ ràng
}) {
    const st = DB.stations.get(String(stationId));
    if (!st) return { ok: false, error: "Station không tồn tại" };

    // vẫn xác thực subscription của KH để trừ ví đúng
    const sub = DB.subscriptions.get(String(subscriptionId));
    if (!sub || !sub.active) return { ok: false, error: "Subscription không hợp lệ/đã hết hạn" };
    const pkg = DB.packages[sub.packageCode];

    // inBatteryId có thể vắng ở lỗi Pin Out
    let inBat = null;
    let needMaintenance = false;
    if (inBatteryId) {
        inBat = DB.batteries.get(String(inBatteryId));
        if (!inBat) return { ok: false, error: "Battery Id (pin KH) không hợp lệ" };
        needMaintenance = inBat.soh < 65; // BR-004
    }

    let usedSlotId = null;
    let outBat = null;

    if (outMode === "slot") {
        const idx = st.slots.findIndex(s => s.id === String(outSlotId));
        if (idx === -1) return { ok: false, error: "Slot xuất không tồn tại" };
        const slot = st.slots[idx];
        if (slot.status !== "ready" || !slot.batteryId) return { ok: false, error: "Slot không sẵn sàng" };
        outBat = DB.batteries.get(slot.batteryId);
        if (outBat?.soc !== 100) return { ok: false, error: "Pin xuất không đủ 100%" }; // BR-020
        st.slots[idx] = { id: slot.id, status: "empty", batteryId: null }; // lấy ra khỏi slot
        usedSlotId = slot.id;
    } else if (outMode === "manual") {
        if (!outBattery?.id) return { ok: false, error: "Thiếu outBattery.id" };
        const soc = Number(outBattery.soc ?? 100);
        if (soc !== 100) return { ok: false, error: "SoC của pin xuất phải = 100%" }; // BR-020
        outBat = upsertBattery({
            id: outBattery.id,
            soh: outBattery.soh ?? 90,
            soc: 100,
            cycles: outBattery.cycles ?? 0,
            flags: [],
        });
    } else {
        return { ok: false, error: "outMode không hợp lệ" };
    }

    // phí theo gói (BR-024/030)
    const wallet = DB.wallets.get(String(sub.userId)) || { balance: 0 };
    let fee = 0;
    if (pkg.type === "self_charge") {
        if (wallet.balance < 8000) return { ok: false, error: "Ví KH không đủ 8.000đ" };
        wallet.balance -= 8000;
        DB.wallets.set(String(sub.userId), wallet);
        fee = 8000;
    }

    if (inBat) {
        if (needMaintenance) inBat.flags = [...new Set([...(inBat.flags || []), "maintenance"])];
        recordReturn(inBat); // BR-021/025/026
    }
    addReportRevenue(fee); // BR-002

    // Lịch sử có staffId + errorType
    DB.swapsHistory.unshift({
        id: "swap-" + Date.now(),
        type: errorType === "pinOut" ? "manual-outOnly" : (outMode === "manual" ? "manual-outPin" : "manual"),
        at: new Date().toISOString(),
        stationId,
        staffId,
        subscriptionId,
        inBatteryId: inBat?.id ?? null,
        outBatteryId: outBat.id,
        usedSlotId,
        fee,
        message:
            errorType === "pinOut"
                ? "Manual assist • Pin Out error — xuất pin cho khách"
                : (needMaintenance ? "Manual swap • maintenance flagged"
                    : (outMode === "manual" ? "Manual swap (out=manual)" : "Manual swap")),
    });

    return {
        ok: true,
        data: {
            stationId, subscriptionId, staffId,
            inBattery: inBat || null,
            outBattery: outBat,
            usedSlotId,
            fee,
        },
    };
}

// ====== Dock Console functions ======
export function dockBattery({ stationId, pillarId, batteryInId, slotInId }) {
    const st = DB.stations.get(String(stationId));
    if (!st) return { ok: false, error: "Station không tồn tại" };
    const bat = DB.batteries.get(String(batteryInId));
    if (!bat) return { ok: false, error: "Battery In không tồn tại" };
    const idx = st.slots.findIndex(s => s.id === String(slotInId));
    if (idx === -1) return { ok: false, error: "Slot In không tồn tại" };
    const slot = st.slots[idx];
    if (slot.batteryId) return { ok: false, error: `Slot ${slot.id} đã có pin (${slot.batteryId})` };
    const dup = st.slots.find(s => s.batteryId === bat.id);
    if (dup) return { ok: false, error: `Pin ${bat.id} đang ở slot ${dup.id}` };
    st.slots[idx] = { id: slot.id, status: "charging", batteryId: bat.id };
    return { ok: true, data: { slotId: slot.id, batteryId: bat.id } };
}

export function undockBattery({ stationId, pillarId, batteryOutId, slotOutId }) {
    const st = DB.stations.get(String(stationId));
    if (!st) return { ok: false, error: "Station không tồn tại" };
    const idx = st.slots.findIndex(s => s.id === String(slotOutId));
    if (idx === -1) return { ok: false, error: "Slot Out không tồn tại" };
    const slot = st.slots[idx];
    if (!slot.batteryId) return { ok: false, error: `Slot ${slot.id} đang trống` };
    if (String(slot.batteryId) !== String(batteryOutId)) return { ok: false, error: `Slot ${slot.id} chứa ${slot.batteryId}, không phải ${batteryOutId}` };
    st.slots[idx] = { id: slot.id, status: "empty", batteryId: null };
    return { ok: true, data: { slotId: slot.id, batteryId: String(batteryOutId) } };
}

export function dockUndockCombo({ stationId, pillarId, batteryInId, slotInId, batteryOutId, slotOutId }) {
    const dockResult = dockBattery({ stationId, pillarId, batteryInId, slotInId });
    if (!dockResult.ok) return dockResult;
    
    const undockResult = undockBattery({ stationId, pillarId, batteryOutId, slotOutId });
    if (!undockResult.ok) {
        // Rollback dock operation
        const st = DB.stations.get(String(stationId));
        const idx = st.slots.findIndex(s => s.id === String(slotInId));
        if (idx !== -1) {
            st.slots[idx] = { id: slotInId, status: "empty", batteryId: null };
        }
        return undockResult;
    }
    
    return { 
        ok: true, 
        data: { 
            dock: dockResult.data, 
            undock: undockResult.data 
        } 
    };
}

// ====== History function ======
export function getHistory() {
    return DB.swapsHistory;
}
