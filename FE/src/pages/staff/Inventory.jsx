// src/pages/staff/Inventory.jsx
// ===================
// UI: English
// Comment: Tiếng Việt
// Yêu cầu: Chỉ hiển thị 20 pin đầu; có nút "View more" để xem toàn bộ (và "View less" để thu về).
// Sắp xếp: Pin thường lên trước, Maintenance xuống dưới; trong nhóm sort theo SOC ↓, SOH ↓, ID ↑.
// API: GET /Station/station-inventory?staffId=...
// Tính năng mới: Thanh search theo Battery ID (lọc theo id, không phân biệt hoa/thường)
// ===================

import React from "react";
import api from "@/api/api";

/* ===== Helpers ===== */
// Ép SOC/SOH về 0..100 (làm tròn)
function clamp01(n) {
    const x = Number(n);
    if (!Number.isFinite(x)) return 0;
    const r = Math.round(x);
    return Math.max(0, Math.min(100, r));
}

// BE đôi khi viết sai chính tả "mantaince" → vẫn coi là maintenance
function isMaintenance(item) {
    const a = (item?.status || "").toLowerCase();
    const b = (item?.batteryStatus || "").toLowerCase();
    return a === "maintenance" || b === "maintenance" || a === "mantaince" || b === "mantaince";
}

// Tone màu cho thẻ theo trạng thái
function statusTone(item) {
    if (isMaintenance(item)) {
        return { bg: "rgba(239,68,68,.10)", fg: "#7f1d1d", br: "#ef4444", label: "Maintenance" };
    }
    return { bg: "rgba(16,185,129,.10)", fg: "#065f46", br: "#10b981", label: item?.status || "Normal" };
}

// Chuẩn hoá 1 bản ghi pin về shape dùng cho UI
function mapBattery(it) {
    return {
        id: it.batteryId || it.id || "",
        soh: clamp01(it.soh),
        soc: clamp01(it.soc),
        capacityKWh: Number(it.capacity ?? it.capacityKWh ?? 0),
        status: it.status || it.batteryStatus || "Normal",
        batteryStatus: it.batteryStatus,
        stationId: it.stationId,
    };
}

// Sort: pin thường trước, Maintenance sau; trong nhóm sort theo SOC desc → SOH desc → ID asc
function compareBattery(a, b) {
    const aMaint = isMaintenance(a) ? 1 : 0;
    const bMaint = isMaintenance(b) ? 1 : 0;
    if (aMaint !== bMaint) return aMaint - bMaint; // 0 trước 1 (Maintenance xuống dưới)
    if ((b.soc ?? 0) !== (a.soc ?? 0)) return (b.soc ?? 0) - (a.soc ?? 0);
    if ((b.soh ?? 0) !== (a.soh ?? 0)) return (b.soh ?? 0) - (a.soh ?? 0);
    return String(a.id).localeCompare(String(b.id));
}

const PAGE_SIZE = 20; // Hiển thị 20 pin đầu

export default function Inventory() {
    // StaffId gửi cho BE
    const staffId =
        localStorage.getItem("StaffId") ||
        localStorage.getItem("staffId") ||
        localStorage.getItem("userId") ||
        "";

    const [list, setList] = React.useState([]); // toàn bộ pin đã sort
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState("");

    // Tên trạm nếu BE có trả
    const [stationName, setStationName] = React.useState(
        localStorage.getItem("stationName") || "Station"
    );

    // Drawer detail
    const [openSlot, setOpenSlot] = React.useState(null);

    // View-more: dùng limit thay vì boolean để control hiển thị
    const [limit, setLimit] = React.useState(PAGE_SIZE);

    // Search query cho Battery ID
    const [query, setQuery] = React.useState("");

    // Fetch inventory
    const fetchInventory = React.useCallback(async () => {
        try {
            setLoading(true);
            setError("");
            setLimit(PAGE_SIZE); // reset về 20 mỗi lần refresh

            if (!staffId) {
                setError("Missing staffId in localStorage. Please sign in again.");
                setList([]);
                return;
            }

            const res = await api.get("/Station/station-inventory", { params: { staffId } });
            const payload = Array.isArray(res.data) ? res.data : res.data?.data || [];

            const mapped = payload.map(mapBattery).sort(compareBattery);
            setList(mapped);

            const stName =
                res.data?.stationName ||
                res.data?.data?.stationName ||
                payload?.[0]?.stationName;
            if (stName) setStationName(stName);
        } catch (e) {
            console.error(e);
            setError(e?.response?.data?.message || e?.message || "Failed to load station inventory.");
            setList([]);
        } finally {
            setLoading(false);
        }
    }, [staffId]);

    React.useEffect(() => {
        fetchInventory();
    }, [fetchInventory]);

    // Khi người dùng gõ search → tự thu về 20 để tránh đổ quá nhiều
    React.useEffect(() => {
        setLimit(PAGE_SIZE);
    }, [query]);

    // Lọc theo Battery ID (không phân biệt hoa/thường)
    const filtered = React.useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return list;
        return list.filter((b) => String(b.id || "").toLowerCase().includes(q));
    }, [list, query]);

    // Danh sách hiển thị dựa theo limit trên dữ liệu đã lọc
    const visible = loading ? [] : filtered.slice(0, Math.min(limit, filtered.length));
    const canViewMore = !loading && limit < filtered.length;
    const canViewLess = !loading && limit > PAGE_SIZE;

    return (
        <section>
            {/* Header */}
            <header className="row-between">
                <div className="header-left">
                    <span className="kho-chip">Station inventory</span>
                    <h2 className="h1 m-0">{stationName}</h2>
                    <div className="muted small">
                        {!loading && (
                            <>
                                Showing <b>{visible.length}</b> of{" "}
                                <b>{filtered.length}</b> {query ? "matches" : "batteries"}
                                {query && <> (total {list.length})</>}
                            </>
                        )}
                    </div>
                </div>

                <div className="actions">
                    {/* Ô Search theo Battery ID */}
                    <div className="search">
                        <i className="bi bi-search" aria-hidden="true" />
                        <input
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Search by Battery ID…"
                            aria-label="Search by Battery ID"
                        />
                        {query && (
                            <button
                                type="button"
                                className="clear"
                                onClick={() => setQuery("")}
                                aria-label="Clear search"
                                title="Clear"
                            >
                                <i className="bi bi-x" />
                            </button>
                        )}
                    </div>

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

            {/* Grid: chỉ 20 pin đầu; có View more / View less */}
            <section className="card card-padded mt-4">
                <div className="row-between">
                    <h3 className="h4 m-0">Batteries</h3>
                    <div className="legend">
                        <span className="legend-dot full" /> Normal
                        <span className="legend-dot maint" /> Maintenance
                    </div>
                </div>

                {!loading && filtered.length === 0 ? (
                    <div className="mt-3 muted">No batteries found{query ? " for this search." : "."}</div>
                ) : (
                    <div className="slots-grid mt-3" role="grid" aria-label="Station batteries">
                        {(loading ? Array.from({ length: PAGE_SIZE }) : visible).map((b, i) => {
                            if (loading) return <div key={i} className="slot-card skeleton" />;

                            const tone = statusTone(b);
                            const pct = clamp01(b.soc);

                            return (
                                <button
                                    key={b.id || i}
                                    role="gridcell"
                                    className="slot-card"
                                    style={{ borderColor: tone.br, background: "#fff" }}
                                    onClick={() => setOpenSlot({ battery: b })}
                                    aria-label={b.id ? `Battery ${b.id}, SOC ${pct}%` : "Battery"}
                                >
                                    <div className="slot-head">
                                        <span
                                            className="status-badge"
                                            style={{ background: tone.bg, color: tone.fg, borderColor: tone.br }}
                                        >
                                            {tone.label}
                                        </span>
                                    </div>

                                    <div className="slot-body">
                                        <div className="slot-id">{b.id || "—"}</div>

                                        <div className="kv">
                                            <span>SOH</span>
                                            <b>{clamp01(b.soh)}%</b>
                                        </div>
                                        <div className="kv">
                                            <span>SOC</span>
                                            <b>{pct}%</b>
                                        </div>

                                        <div className="socbar" title={`SOC ${pct}%`}>
                                            <span
                                                className="socbar-fill"
                                                style={{ width: `${pct}%`, borderColor: tone.br, background: tone.br }}
                                            />
                                        </div>

                                        <div className="kv">
                                            <span>Capacity</span>
                                            <b>{b.capacityKWh ? `${b.capacityKWh} kWh` : "—"}</b>
                                        </div>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                )}

                {/* View more / View less */}
                {!loading && filtered.length > 0 && (canViewMore || canViewLess) && (
                    <div className="mt-3" style={{ display: "flex", justifyContent: "center", gap: 8 }}>
                        {canViewMore && (
                            <button className="btn" onClick={() => setLimit(filtered.length)}>
                                View more
                            </button>
                        )}
                        {canViewLess && (
                            <button className="btn" onClick={() => setLimit(PAGE_SIZE)}>
                                View less
                            </button>
                        )}
                    </div>
                )}
            </section>

            {/* Drawer detail */}
            {openSlot && (
                <div className="overlay" onClick={() => setOpenSlot(null)}>
                    <aside className="drawer" onClick={(e) => e.stopPropagation()}>
                        <header className="drawer-head">
                            <h4 className="m-0">Battery detail</h4>
                            <button className="btn-close" onClick={() => setOpenSlot(null)} aria-label="Close">
                                ×
                            </button>
                        </header>

                        <div className="drawer-body">
                            <dl className="details">
                                <div className="detail">
                                    <dt>Battery ID</dt>
                                    <dd>{openSlot.battery?.id || "—"}</dd>
                                </div>
                                <div className="detail">
                                    <dt>SOH</dt>
                                    <dd>{clamp01(openSlot.battery?.soh)}%</dd>
                                </div>
                                <div className="detail">
                                    <dt>SOC</dt>
                                    <dd>{clamp01(openSlot.battery?.soc)}%</dd>
                                </div>
                                <div className="detail">
                                    <dt>Capacity</dt>
                                    <dd>
                                        {openSlot.battery?.capacityKWh
                                            ? `${openSlot.battery.capacityKWh} kWh`
                                            : "—"}
                                    </dd>
                                </div>
                                <div className="detail">
                                    <dt>Status</dt>
                                    <dd>
                                        {isMaintenance(openSlot.battery)
                                            ? "Maintenance"
                                            : openSlot.battery?.status || "Normal"}
                                    </dd>
                                </div>
                            </dl>
                        </div>

                        <footer className="drawer-foot">
                            <button className="btn ghost" onClick={() => setOpenSlot(null)}>
                                Close
                            </button>
                        </footer>
                    </aside>
                </div>
            )}

            {/* Styles */}
            <style>{`
        .row-between { display:flex; align-items:flex-end; justify-content:space-between; gap:12px; }
        .card-padded { padding: 16px 20px; }
        .m-0 { margin: 0; }
        .h4 { font-size:16px; font-weight:600; }
        .small { font-size:12px; }
        .muted { color: var(--muted); }

        .kho-chip {
          display:inline-block; padding:4px 10px; border-radius:999px;
          background:#eef2ff; color:#3730a3; font-weight:600; font-size:12px; border:1px solid #c7d2fe;
          margin-bottom:6px;
        }

        .actions { display:flex; align-items:center; gap:10px; }
        .actions .btn { height:36px; padding:0 12px; border-radius:10px; border:1px solid var(--line); background:#fff; }

        /* Search box */
        .search {
          display:flex; align-items:center; gap:8px; height:36px;
          padding:0 10px; border:1px solid var(--line); border-radius:10px; background:#fff;
        }
        .search i { font-size:14px; color:var(--muted); }
        .search input {
          border:none; outline:none; background:transparent; min-width:220px;
          font-size:14px; color:#0f172a;
        }
        .search .clear {
          display:flex; align-items:center; justify-content:center;
          border:none; background:transparent; width:28px; height:28px; cursor:pointer; color:#334155;
          border-radius:8px;
        }
        .search .clear:hover { background:#f1f5f9; }

        .error { color:#991b1b; background:#fee2e2; border:1px solid #fecaca; }

        .legend { display:flex; align-items:center; gap:12px; color:var(--muted); font-size:12px; }
        .legend-dot { width:10px; height:10px; border-radius:50%; display:inline-block; border:1px solid var(--line); margin-right:4px; }
        .legend .full { background:#10b98133; border-color:#10b981; }
        .legend .maint { background:#ef444433; border-color:#ef4444; }

        .slots-grid {
          display:grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap:12px;
        }
        @media (max-width: 1024px) { .slots-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); } }
        @media (max-width: 768px) { .slots-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } }

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
        .slot-card.skeleton { position:relative; overflow:hidden; min-height:120px; }
        .slot-card.skeleton::after {
          content:""; position:absolute; inset:0;
          background: linear-gradient(90deg, transparent, rgba(148,163,184,.1), transparent);
          animation: shimmer 1.2s infinite;
        }

        .slot-head { display:flex; align-items:center; justify-content:flex-end; gap:8px; }
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
