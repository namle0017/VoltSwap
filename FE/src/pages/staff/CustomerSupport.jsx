// src/pages/staff/CustomerSupport.jsx
import React from "react";
import api from "@/api/api";

/* ===== Endpoint (UI tiếng Anh, comment tiếng Việt) =====
 * GET /Report/customer-reports?UserId=...
 * BE trả về:
 * {
 *   "message": "Get list successfull",
 *   "data": [
 *     {
 *       "staffId": "ST-20000013",
 *       "driverId": "DR-30000001",
 *       "driverName": "Trần Yến",
 *       "reportType": 2,              // số: cần map sang text
 *       "reportNote": "Battery low",
 *       "createAt": "2024-01-04T00:00:00",
 *       "reportStatus": "Processing"  // hoặc "Done", ...
 *     }
 *   ]
 * }
 */

const ROUTE = "/Report/customer-reports";

// Map số -> mô tả loại báo cáo (có fallback nếu BE đổi)
const reportTypeLabel = (t) => {
    switch (Number(t)) {
        case 1: return "System Error";
        case 2: return "User Issue";
        case 3: return "Battery Issue";
        case 4: return "Station Issue";
        default: return `Type ${t ?? "—"}`;
    }
};

// Định dạng thời gian ngắn gọn
const fmtTime = (iso) => {
    if (!iso) return "—";
    try {
        const d = new Date(iso);
        return `${d.toLocaleDateString()} • ${d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
    } catch { return "—"; }
};

// Chip trạng thái
function StatusPill({ status }) {
    const s = String(status || "").toLowerCase();
    const cls = s === "done"
        ? "border-emerald-600 text-emerald-700 bg-emerald-50"
        : s === "processing"
            ? "border-amber-600 text-amber-700 bg-amber-50"
            : "border-slate-500 text-slate-700 bg-slate-50";
    return (
        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs border ${cls}`}>
            {status || "—"}
        </span>
    );
}

export default function CustomerSupport() {
    // Lấy UserId (FE truyền cho BE). Ưu tiên userId, sau đó StaffId.
    const [userId] = React.useState(() =>
        (localStorage.getItem("userId") ||
            localStorage.getItem("StaffId") ||
            "").trim()
    );

    // State dữ liệu
    const [rows, setRows] = React.useState([]);
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState("");

    // Tìm kiếm cục bộ
    const [q, setQ] = React.useState("");
    const [showDebug, setShowDebug] = React.useState(false);

    // Gọi API lấy danh sách ticket
    const fetchTickets = React.useCallback(async () => {
        if (!userId) {
            setError("Missing UserId in localStorage. Please sign in again.");
            setLoading(false);
            return;
        }
        try {
            setLoading(true);
            setError("");
            const res = await api.get(ROUTE, { params: { UserId: userId } });
            const list = Array.isArray(res?.data?.data) ? res.data.data : [];
            // Sắp xếp mới nhất lên trên (createAt desc)
            list.sort((a, b) => new Date(b.createAt || 0) - new Date(a.createAt || 0));
            setRows(list);
        } catch (e) {
            setError(e?.response?.data?.message || e?.message || "Failed to load tickets.");
        } finally {
            setLoading(false);
        }
    }, [userId]);

    React.useEffect(() => { fetchTickets(); }, [fetchTickets]);

    // Lọc theo từ khóa
    const filtered = React.useMemo(() => {
        const term = q.trim().toLowerCase();
        if (!term) return rows;
        return rows.filter((r) => {
            const hay =
                `${r.staffId || ""} ${r.driverId || ""} ${r.driverName || ""} ${r.reportNote || ""} ${r.reportStatus || ""} ${reportTypeLabel(r.reportType)}`.toLowerCase();
            return hay.includes(term);
        });
    }, [q, rows]);

    // Đếm ticket chưa Done
    const openCount = React.useMemo(
        () => rows.filter(r => String(r.reportStatus || "").toLowerCase() !== "done").length,
        [rows]
    );

    return (
        <section className="space-y-4">
            {/* Header */}
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                    <h2 className="text-xl font-bold">Customer Support</h2>
                    <p className="text-sm text-slate-500">Tickets and conversations with customers.</p>
                </div>

                <div className="flex items-center gap-2">
                    <input
                        className="rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Search ID / name / note / status"
                        value={q}
                        onChange={(e) => setQ(e.target.value)}
                    />
                    <button
                        onClick={fetchTickets}
                        className="px-3 py-2 rounded-lg border text-sm disabled:opacity-60"
                        disabled={loading}
                        title="Refresh tickets"
                        type="button"
                    >
                        ↻ Refresh
                    </button>
                    <button
                        onClick={() => setShowDebug((v) => !v)}
                        className="px-3 py-2 rounded-lg border text-sm"
                        type="button"
                    >
                        {showDebug ? "Hide Debug" : "Show Debug"}
                    </button>
                </div>
            </div>

            {/* Card danh sách */}
            <div className="rounded-2xl border bg-white shadow-sm">
                <div className="px-4 py-3 border-b flex items-center justify-between">
                    <div className="font-semibold flex items-center gap-2">
                        <span role="img" aria-label="headset">🎧</span>
                        Open Tickets
                    </div>
                    <div className="text-xs text-slate-500">
                        {openCount} open • {rows.length} total
                    </div>
                </div>

                {error && (
                    <div className="px-4 py-3 text-sm text-red-600">{error}</div>
                )}

                {loading ? (
                    <div className="px-4 py-6 text-sm text-slate-500">Loading…</div>
                ) : filtered.length === 0 ? (
                    <div className="px-4 py-6 text-sm text-slate-500">No tickets.</div>
                ) : (
                    <ul className="divide-y">
                        {filtered.map((t, i) => {
                            const title = `${reportTypeLabel(t.reportType)} — ${t.reportNote || "No note"}`;
                            const sub = `${t.driverName || "—"}${t.driverId ? ` • ${t.driverId}` : ""}`;
                            return (
                                <li key={`${t.staffId || "row"}-${i}`} className="px-4 py-3 flex items-start justify-between gap-3 hover:bg-slate-50">
                                    <div>
                                        <div className="font-medium">{title}</div>
                                        <div className="text-xs text-slate-500">{sub}</div>
                                        <div className="text-[11px] text-slate-500 mt-0.5">Staff: {t.staffId || "—"}</div>
                                    </div>
                                    <div className="flex items-center gap-3 shrink-0">
                                        <StatusPill status={t.reportStatus} />
                                        <span className="text-xs text-slate-500">{fmtTime(t.createAt)}</span>
                                    </div>
                                </li>
                            );
                        })}
                    </ul>
                )}
            </div>

            {/* Debug JSON (tùy chọn) */}
            {showDebug && (
                <pre className="mt-4 text-xs bg-slate-50 border rounded-lg p-3 overflow-auto">
                    {JSON.stringify(rows, null, 2)}
                </pre>
            )}
        </section>
    );
}
