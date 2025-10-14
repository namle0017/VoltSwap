// DEPRECATED: File này đã không được sử dụng nữa
// Tất cả các API đã được chuyển sang sử dụng API thật trong src/services/apiServices.js
// 
// src/api/adminRequests.js
// Fake API lưu trong localStorage để demo offline.
// Giữ nguyên interface: fetchAdminRequests(), createAdminRequest(payload)

const LS_KEY = "evswap_admin_requests";

// --- seed dữ liệu mẫu ---
function seedIfEmpty() {
    if (localStorage.getItem(LS_KEY)) return;
    const now = Date.now();
    const data = [
        {
            id: "IS001",
            code: "IS001",
            customerName: "Nguyễn Văn A",
            batteryId: "VIN004",
            requestType: "Overheated Battery",
            description: "Pin quá nhiệt khi đang vận hành, cần admin hỗ trợ.",
            status: "Pending",
            createdAtUtc: now - 1000 * 60 * 90, // 90 phút trước
        },
        {
            id: "IS002",
            code: "IS002",
            customerName: "Nguyễn Văn B",
            batteryId: "VIN006",
            requestType: "Non-Standard Battery",
            description: "Pin không đúng chuẩn trạm, không nhận sạc.",
            status: "Processing",
            createdAtUtc: now - 1000 * 60 * 30, // 30 phút trước
        },
        {
            id: "IS003",
            code: "IS003",
            customerName: "Trần Văn C",
            batteryId: "VF8",
            requestType: "Swollen Battery",
            description: "Pin phồng, cần kiểm tra an toàn ngay.",
            status: "Awaiting Admin",
            createdAtUtc: now - 1000 * 60 * 5, // 5 phút trước
        },
    ];
    localStorage.setItem(LS_KEY, JSON.stringify(data));
}
seedIfEmpty();

// --- utils ---
const fmtTime = (ms) =>
    new Date(ms).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

const sleep = (ms = 450) => new Promise((r) => setTimeout(r, ms));

function readDB() {
    try {
        return JSON.parse(localStorage.getItem(LS_KEY) || "[]");
    } catch {
        return [];
    }
}
function writeDB(rows) {
    localStorage.setItem(LS_KEY, JSON.stringify(rows));
}

// ========== Public API ==========

/**
 * GET /admin-requests  (fake)
 * Trả về mảng: [{ id, code, requestType, customerName, batteryId, status, createdAt }]
 */
export async function fetchAdminRequests() {
    await sleep(); // giả lập network
    const rows = readDB()
        .slice()
        .sort((a, b) => b.createdAtUtc - a.createdAtUtc)
        .map((r) => ({
            ...r,
            createdAt: fmtTime(r.createdAtUtc),
            time: fmtTime(r.createdAtUtc), // tương thích UI cũ nếu dùng 'time'
        }));
    return rows;
}

/**
 * POST /admin-requests  (fake)
 * payload: { requestType, driverId, description }
 * Trả về object đã tạo: { id, code, requestType, status, createdAt... }
 */
export async function createAdminRequest(payload) {
    await sleep(); // giả lập network

    const rows = readDB();
    const idNum = Math.floor(1000 + Math.random() * 9000);
    const id = "IS" + idNum;

    const now = Date.now();
    const created = {
        id,
        code: id,
        requestType: String(payload.requestType || "").trim(),
        driverId: String(payload.driverId || "").trim(),
        description: String(payload.description || "").trim(),
        // các field có thể trống nếu chưa tích hợp với data KH:
        customerName: payload.customerName || "-",
        batteryId: payload.batteryId || "-",
        status: "Pending",
        createdAtUtc: now,
        createdAt: fmtTime(now),
        time: fmtTime(now), // tương thích UI cũ nếu render 'time'
    };

    rows.unshift(created);
    writeDB(rows);
    return created;
}

/**
 * (Tùy chọn) Update trạng thái 1 request — nếu cần sau này.
 * patch: { status?: string, ... }
 */
export async function updateAdminRequest(id, patch = {}) {
    await sleep();
    const rows = readDB();
    const idx = rows.findIndex((r) => r.id === id);
    if (idx === -1) throw new Error("Not found");
    rows[idx] = { ...rows[idx], ...patch };
    writeDB(rows);
    return { ...rows[idx], createdAt: fmtTime(rows[idx].createdAtUtc) };
}

/**
 * (Tùy chọn) Xóa 1 request.
 */
export async function deleteAdminRequest(id) {
    await sleep();
    const rows = readDB().filter((r) => r.id !== id);
    writeDB(rows);
    return { ok: true };
}

/**
 * (Tùy chọn) Reset tất cả dữ liệu fake về mặc định.
 */
export function resetAdminRequestsFake() {
    localStorage.removeItem(LS_KEY);
    seedIfEmpty();
}
