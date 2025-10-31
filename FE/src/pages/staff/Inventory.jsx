// src/pages/staff/Inventory.jsx
import React from "react";
import api from "@/api/api"; // axios instance của bạn (đã set baseURL)

export default function Inventory() {
    /* ===== Constants ===== */
    const ROWS = ["A", "B", "C", "D", "E"]; // 5 hàng x 4 cột = 20 ô (chỉ dùng để sắp, KHÔNG hiển thị)
    const COLS = 4;
    const toPos = (i) => `${ROWS[Math.floor(i / COLS)]}${(i % COLS) + 1}`; // nội bộ

    /* ===== State ===== */
    const [slots, setSlots] = React.useState([]);       // [{ slot, battery|null }]
    const [openSlot, setOpenSlot] = React.useState(null);
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState(null);
    const [lastUpdated, setLastUpdated] = React.useState(null);

    // Hiển thị tên trạm: ưu tiên localStorage.stationName; fallback stationId từ payload
    const [stationName, setStationName] = React.useState(
        localStorage.getItem("stationName") || "Station"
    );

    // StaffId gửi cho BE (chú ý key — tuỳ hệ thống bạn đang lưu)
    const staffId =
        localStorage.getItem("staffId") ||
        localStorage.getItem("StaffId") ||
        localStorage.getItem("userId") ||
        "";

    /* ===== Helpers ===== */
    const buildEmptyGrid = React.useCallback(
        () => Array.from({ length: ROWS.length * COLS }, (_, i) => ({ slot: toPos(i), battery: null })),
        []
    );

    const clamp01 = (n) => {
        const x = Number(n);
        if (!Number.isFinite(x)) return 0;
        return Math.max(0, Math.min(100, Math.round(x)));
    };

    const fmtTime = (iso) => (iso ? new Date(iso).toLocaleString() : "—");

    // Tone theo status từ BE:
    // - Maintenance/mantaince -> đỏ
    // - Warehouse/Full/FullPin/Best -> xanh
    // - khác -> xám
    const statusTone = (status) => {
        const raw = (status || "").trim();
        const s = raw.toLowerCase();

        const isMaintenance = /maintain/.test(s); // bắt cả "maintenance" & "mantaince"
        if (isMaintenance) {
            return {
                bg: "rgba(239,68,68,.12)", // red-500/12
                fg: "#991b1b",             // red-800
                br: "#ef4444",             // red-500
                label: raw || "Maintenance",
            };
        }

        const isGreen =
            s.includes("warehouse") ||
            s === "full" ||
            s === "fullpin" ||
            s === "best";
        if (isGreen) {
            return {
                bg: "rgba(16,185,129,.12)", // emerald-500/12
                fg: "#065f46",               // emerald-900
                br: "#10b981",               // emerald-500
                label: raw || "Warehouse",
            };
        }

        // Default (xám)
        return {
            bg: "rgba(148,163,184,.12)", // slate-400/12
            fg: "#334155",               // slate-700
            br: "#94a3b8",               // slate-400
            label: raw,                  // giữ nguyên status BE
        };
    };

    // Map 1 item BE -> battery chuẩn UI
    const mapBattery = (it) => ({
        id: it.batteryId,
        soh: clamp01(it.soh),
        soc: clamp01(it.soc),
        capacityKWh: Number(it.capacity),
        status: it.status || "Warehouse",
        updatedAt: new Date().toISOString(), // BE chưa trả time cập nhật
        stationId: it.stationId,
        stationName: it.stationName,
    });

    // Lấy tối đa 20 pin, gán tuần tự vào 20 ô; phần còn lại để trống
    const buildGridFromApi = (list) => {
        const grid = buildEmptyGrid();
        if (!Array.isArray(list)) return grid;

        if (list.length > 20) {
            console.warn(`[Inventory] API returned ${list.length} items; using first 20.`);
        }
        const items = list.slice(0, 20).map(mapBattery);

        return grid.map((g, idx) => ({
            slot: g.slot,               // vẫn giữ để sắp xếp nội bộ
            battery: items[idx] || null,
        }));
    };

    /* ===== Fetch ===== */
    const fetchInventory = React.useCallback(async () => {
        try {
            if (!staffId) {
                setError("Thiếu staffId trong localStorage. Vui lòng đăng nhập lại.");
                setSlots(buildEmptyGrid());
                setLoading(false);
                return;
            }

            setError(null);
            setLoading(true);
            const res = await api.get("/Station/station-inventory", {
                params: { StaffId: staffId }, // đúng key theo BE
            });

            const payload = Array.isArray(res.data) ? res.data : res.data?.data || [];
            const grid = buildGridFromApi(payload);
            setSlots(grid);

            // Cập nhật tên trạm nếu có stationId trong payload
            const stId = payload?.[0]?.stationId;
            if (stId) setStationName(stId);

            setLastUpdated(new Date().toISOString());
        } catch (e) {
            console.error("Fetch station inventory failed:", e);
            setError(e?.response?.data?.message || e?.message || "Không thể tải kho pin.");
            setSlots(buildEmptyGrid());
        } finally {
            setLoading(false);
        }
    }, [staffId, buildEmptyGrid]);

    React.useEffect(() => {
        fetchInventory();
    }, [fetchInventory]);

    /* ===== UI ===== */
    return (
        <section>
            {/* Header */}
            <header className="row-between">
                <div className="header-left">
                    <span className="kho-chip">Kho trạm</span>
                    <h2 className="h1 m-0">{stationName}</h2>
                    <div className="muted small">
                        {lastUpdated ? `Cập nhật: ${fmtTime(lastUpdated)}` : ""}
                    </div>
                </div>
                <div className="actions">
                    <button className="btn" onClick={fetchInventory} disabled={loading}>
                        <i className="bi bi-arrow-clockwise" /> {loading ? "Loading..." : "Refresh"}
                    </button>
                </div>
            </header>

            {/* Error */}
            {error && (
                <div className="card card-padded mt-3 error">
                    <i className="bi bi-exclamation-triangle" /> {error}
                </div>
            )}

            {/* Grid 20 ô (KHÔNG hiển thị vị trí) */}
            <section className="card card-padded mt-4">
                <div className="row-between">
                    <h3 className="h4 m-0">Kho Pin</h3>
                    <div className="legend">
                        <span className="legend-dot full" /> Warehouse/Full
                        <span className="legend-dot maint" /> Maintenance
                        <span className="legend-dot empty" /> Khác / Empty
                    </div>
                </div>

                <div className="slots-grid mt-3" role="grid" aria-label="Danh sách Pin trong kho">
                    {(loading && slots.length === 0 ? buildEmptyGrid() : slots).map(({ slot, battery }) => {
                        const tone = statusTone(battery?.status);
                        const pct = battery ? clamp01(battery.soc) : 0;

                        return (
                            <button
                                key={slot}
                                role="gridcell"
                                className={`slot-card ${loading && !battery ? "skeleton" : ""}`}
                                style={{
                                    borderColor: tone.br,
                                    background: battery ? "#fff" : "linear-gradient(#f8fafc,#f1f5f9)",
                                }}
                                onClick={() => setOpenSlot({ slot, battery })}
                                disabled={loading && slots.length === 0}
                                aria-label={battery ? `Pin ${battery.id}, SOC ${pct}%` : "Ô trống"}
                                type="button"
                            >
                                <div className="slot-head">
                                    {/* ĐÃ BỎ nhãn vị trí (A1..E4) */}
                                    <span
                                        className="status-badge"
                                        style={{ background: tone.bg, color: tone.fg, borderColor: tone.br }}
                                    >
                                        {battery ? (tone.label || "—") : ""}
                                    </span>
                                </div>

                                <div className="slot-body">
                                    <div className="slot-id">{battery?.id || "—"}</div>

                                    {battery ? (
                                        <>
                                            <div className="kv">
                                                <span>SOH</span>
                                                <b>{clamp01(battery.soh)}%</b>
                                            </div>
                                            <div className="kv">
                                                <span>SOC</span>
                                                <b>{pct}%</b>
                                            </div>
                                            <div className="socbar">
                                                <span
                                                    className="socbar-fill"
                                                    style={{ width: `${pct}%`, background: tone.br }}
                                                />
                                            </div>
                                        </>
                                    ) : (
                                        <div className="muted small">Chưa có Pin</div>
                                    )}
                                </div>
                            </button>
                        );
                    })}
                </div>
            </section>

            {/* Drawer detail (KHÔNG hiển thị vị trí) */}
            {openSlot && (
                <div className="overlay" onClick={() => setOpenSlot(null)}>
                    <aside className="drawer" onClick={(e) => e.stopPropagation()}>
                        <header className="drawer-head">
                            <h4 className="m-0">Chi tiết Pin</h4>
                            <button className="btn-close" onClick={() => setOpenSlot(null)} aria-label="Đóng" type="button">
                                ×
                            </button>
                        </header>

                        <div className="drawer-body">
                            <dl className="details">
                                <div className="detail">
                                    <dt>Mã Pin</dt>
                                    <dd>{openSlot.battery?.id || "—"}</dd>
                                </div>
                                <div className="detail">
                                    <dt>SOH</dt>
                                    <dd>
                                        {openSlot.battery?.soh != null ? `${clamp01(openSlot.battery.soh)}%` : "—"}
                                    </dd>
                                </div>
                                <div className="detail">
                                    <dt>SOC</dt>
                                    <dd>
                                        {openSlot.battery?.soc != null ? `${clamp01(openSlot.battery.soc)}%` : "—"}
                                    </dd>
                                </div>
                                <div className="detail">
                                    <dt>Capacity</dt>
                                    <dd>
                                        {openSlot.battery?.capacityKWh != null
                                            ? `${openSlot.battery.capacityKWh} kWh`
                                            : "—"}
                                    </dd>
                                </div>
                                <div className="detail">
                                    <dt>Trạng thái</dt>
                                    <dd>
                                        {openSlot.battery ? (
                                            (() => {
                                                const t = statusTone(openSlot.battery.status);
                                                return (
                                                    <span
                                                        className="status-badge"
                                                        style={{ background: t.bg, color: t.fg, borderColor: t.br }}
                                                    >
                                                        {t.label || "—"}
                                                    </span>
                                                );
                                            })()
                                        ) : (
                                            ""
                                        )}
                                    </dd>
                                </div>
                                <div className="detail">
                                    <dt>Station</dt>
                                    <dd>{openSlot.battery?.stationId || stationName}</dd>
                                </div>
                                <div className="detail">
                                    <dt>Updated</dt>
                                    <dd>{fmtTime(openSlot.battery?.updatedAt)}</dd>
                                </div>
                            </dl>
                        </div>

                        <footer className="drawer-foot">
                            <button className="btn ghost" onClick={() => setOpenSlot(null)} type="button">
                                Đóng
                            </button>
                        </footer>
                    </aside>
                </div>
            )}

            {/* Styles scoped */}
            <style>{`
        .row-between { display:flex; align-items:flex-end; justify-content:space-between; gap:12px; }
        .card-padded { padding: 16px 20px; }
        .m-0 { margin: 0; }
        .h4 { font-size:16px; font-weight:600; }
        .h5 { font-size:18px; font-weight:700; }
        .small { font-size:12px; }
        .muted { color: var(--muted); }

        .kho-chip {
          display:inline-block; padding:4px 10px; border-radius:999px;
          background:#eef2ff; color:#3730a3; font-weight:600; font-size:12px; border:1px solid #c7d2fe;
          margin-bottom:6px;
        }
        .actions .btn { height:36px; padding:0 12px; border-radius:10px; border:1px solid var(--line); background:#fff; }
        .error { color:#991b1b; background:#fee2e2; border:1px solid #fecaca; }

        .legend { display:flex; align-items:center; gap:12px; color:var(--muted); font-size:12px; }
        .legend-dot { width:10px; height:10px; border-radius:50%; display:inline-block; border:1px solid var(--line); margin-right:4px; }
        .legend .full { background:#10b98133; border-color:#10b981; }
        .legend .maint { background:#ef444433; border-color:#ef4444; }
        .legend .empty { background:#94a3b833; border-color:#94a3b8; }

        .slots-grid {
          display:grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap:12px;
        }
        .slot-card {
          border:1px solid var(--line);
          border-radius:14px;
          padding:12px;
          display:flex; flex-direction:column; gap:8px;
          text-align:left; cursor:pointer;
          transition: box-shadow .2s, transform .1s;
          background:#fff;
        }
        .slot-card:hover { box-shadow:0 4px 16px rgba(2,6,23,.06); transform: translateY(-1px); }
        .slot-card:active { transform: translateY(0); }
        .slot-card.skeleton { position:relative; overflow:hidden; }
        .slot-card.skeleton::after {
          content:""; position:absolute; inset:0;
          background: linear-gradient(90deg, transparent, rgba(148,163,184,.1), transparent);
          animation: shimmer 1.2s infinite;
        }
        @keyframes shimmer { 0% { transform: translateX(-100%); } 100% { transform: translateX(100%); } }

        .slot-head { display:flex; align-items:center; justify-content:flex-end; gap:8px; } /* bỏ chỗ cho nhãn vị trí */
        .status-badge { font-size:12px; padding:2px 8px; border-radius:999px; border:1px solid; white-space:nowrap; }

        .slot-body { display:flex; flex-direction:column; gap:6px; }
        .slot-id { font-weight:600; font-size:14px; }

        .kv { display:flex; align-items:center; justify-content:space-between; font-size:12px; }
        .socbar { height:6px; border-radius:999px; background:#e2e8f0; overflow:hidden; }
        .socbar-fill { display:block; height:100%; border-radius:999px; }

        /* Drawer + overlay */
        .overlay {
          position:fixed; inset:0; background: rgba(15,23,42,0.25);
          backdrop-filter: blur(2px);
          display:flex; justify-content:flex-end; z-index: 50;
        }
        .drawer {
          width: 380px; max-width: 90vw; height: 100%;
          background: #fff; border-left: 1px solid var(--line);
          display:flex; flex-direction:column;
          animation: slideIn .18s ease-out;
        }
        @keyframes slideIn { from { transform: translateX(20px); opacity:0 } to { transform: translateX(0); opacity:1 } }

        .drawer-head { display:flex; align-items:center; justify-content:space-between; padding:16px 18px; border-bottom:1px solid var(--line); }
        .drawer-body { padding:16px 18px; display:flex; flex-direction:column; gap:14px; }
        .drawer-foot { padding:12px 18px; border-top:1px solid var(--line); display:flex; justify-content:flex-end; gap:8px; }

        .details { display:grid; grid-template-columns: 1fr 1fr; gap:12px; margin:0; }
        .detail { display:flex; align-items:center; justify-content:space-between; padding:10px 12px; border:1px solid var(--line); border-radius:10px; }
        .detail dt { color:var(--muted); font-weight:500; }
        .detail dd { margin:0; font-weight:700; }

        .btn { height:36px; padding:0 12px; border-radius:10px; border:1px solid var(--line); background:#fff; }
        .btn.ghost:hover { background:#f8fafc; }
        .btn-close { background:transparent; border:none; font-size:22px; line-height:1; cursor:pointer; color:#0f172a; }
      `}</style>
        </section>
    );
}