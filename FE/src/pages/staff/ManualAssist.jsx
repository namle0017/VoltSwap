// src/pages/staff/ManualAssist.jsx
import React, { useMemo, useState } from "react";
import api from "@/api/api"; // axios instance

export default function ManualAssist() {
    // Lấy staffId từ localStorage (không hard-code)
    const [staffId] = useState(
        localStorage.getItem("StaffId") || localStorage.getItem("userId") || ""
    );

    const [subscriptionId, setSubscriptionId] = useState(""); // subId khi gửi
    const [errorType, setErrorType] = useState(""); // '' | 'pinIn' | 'pinOut'
    const [inBatteryId, setInBatteryId] = useState(""); // pin lỗi KH (khi pinIn)
    const [outBatteryId, setOutBatteryId] = useState(""); // pin xuất (chọn từ kho)

    const [submitting, setSubmitting] = useState(false);
    const [resp, setResp] = useState(null);
    const [err, setErr] = useState("");

    const wizardReady = useMemo(
        () => errorType === "pinIn" || errorType === "pinOut",
        [errorType]
    );

    const canConfirm = useMemo(() => {
        if (!(errorType === "pinIn" || errorType === "pinOut")) return false;
        if (!subscriptionId.trim()) return false;
        if (!outBatteryId.trim()) return false;
        if (errorType === "pinIn" && !inBatteryId.trim()) return false;
        return true;
    }, [errorType, subscriptionId, outBatteryId, inBatteryId]);

    async function onConfirm() {
        if (!canConfirm) return;
        setSubmitting(true);
        setErr("");
        setResp(null);

        try {
            const payload = {
                staffId,
                batteryOutId: outBatteryId || null,
                batteryInId: errorType === "pinIn" ? (inBatteryId || null) : null,
                subId: subscriptionId,
            };
            // ĐÃ ĐỔI endpoint:
            const res = await api.post("/api/BatterySwap/staff-help-customer", payload);
            setResp(res.data);
        } catch (e) {
            console.error(e);
            setErr(e?.response?.data?.message || e.message || "Manual Assist failed");
        } finally {
            setSubmitting(false);
        }
    }

    /* ================= Sổ chọn pin từ kho (GET chỉ staffId) ================= */
    const [openPicker, setOpenPicker] = useState(false);
    const [pickLoading, setPickLoading] = useState(false);
    const [pickErr, setPickErr] = useState("");
    const [batteries, setBatteries] = useState([]);
    const [minSoc, setMinSoc] = useState(0); // lọc SOC tối thiểu

    const loadWarehouse = async () => {
        setPickLoading(true);
        setPickErr("");
        try {
            if (!staffId.trim()) {
                setPickErr("Vui lòng cung cấp staffId.");
                setBatteries([]);
                return;
            }
            const res = await api.get("/Station/station-inventory", {
                params: { staffId },
            });
            const list = Array.isArray(res.data) ? res.data : res.data?.data || [];
            const mapped = list.map((it) => ({
                id: it.batteryId || it.id || "",
                soh: clamp01(it.soh),
                soc: clamp01(it.soc),
                capacityKWh: Number(it.capacity ?? it.capacityKWh ?? 0),
                status: (it.status || "Warehouse"), // giữ nguyên status từ BE
            }));
            setBatteries(mapped);
        } catch (e) {
            console.error(e);
            setPickErr(e?.response?.data?.message || e.message || "Không thể tải kho pin.");
            setBatteries([]);
        } finally {
            setPickLoading(false);
        }
    };

    // 🔎 CHỈ hiện pin có status === 'warehouse' (case-insensitive) + lọc theo SOC
    const filteredBatteries = useMemo(
        () =>
            batteries
                .filter((b) => isWarehouse(b.status))                 // chỉ Warehouse
                .filter((b) => Number.isFinite(b.soc) && b.soc >= minSoc)
                .sort((a, b) => (b.soc ?? 0) - (a.soc ?? 0)),
        [batteries, minSoc]
    );

    return (
        <section>
            <h2 className="h1" style={{ marginTop: 0 }}>Manual Assist</h2>

            {/* Wizard */}
            <div className="card" style={{ marginTop: 12 }}>
                <h3 style={{ marginTop: 0 }}>Chọn loại xử lý</h3>
                <div style={grid2}>
                    <label>
                        Subscription Id
                        <input
                            className="input"
                            value={subscriptionId}
                            onChange={(e) => setSubscriptionId(e.target.value)}
                            placeholder="VD: SUB-123"
                        />
                    </label>

                    <div>
                        <div className="small muted" style={{ marginBottom: 6 }}>
                            * Gửi ngầm: Staff <b>{staffId || "—"}</b>
                        </div>
                        <div style={{ display: "flex", gap: 16 }}>
                            <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                <input
                                    type="radio"
                                    name="errType"
                                    value="pinIn"
                                    checked={errorType === "pinIn"}
                                    onChange={() => { setErrorType("pinIn"); setOutBatteryId(""); }}
                                />
                                Pin In (pin KH đưa vào bị lỗi)
                            </label>
                            <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                <input
                                    type="radio"
                                    name="errType"
                                    value="pinOut"
                                    checked={errorType === "pinOut"}
                                    onChange={() => { setErrorType("pinOut"); setOutBatteryId(""); }}
                                />
                                Pin Out (máy không nhả pin)
                            </label>
                        </div>
                    </div>
                </div>
            </div>

            {!wizardReady ? null : (
                <>
                    {errorType === "pinIn" && (
                        <div style={grid2}>
                            <div className="card">
                                <h3 style={{ marginTop: 0 }}>Nhận pin khách (Pin In)</h3>
                                <label>
                                    Battery Id (pin KH)
                                    <input
                                        className="input"
                                        value={inBatteryId}
                                        onChange={(e) => setInBatteryId(e.target.value)}
                                        placeholder="VD: BAT-ERR-001"
                                    />
                                </label>
                            </div>

                            <div className="card">
                                <h3 style={{ marginTop: 0 }}>Xuất pin cho khách</h3>
                                <label>
                                    Out Battery ID
                                    <div style={{ display: "flex", gap: 8 }}>
                                        <input
                                            className="input"
                                            value={outBatteryId}
                                            onChange={(e) => setOutBatteryId(e.target.value)}
                                            placeholder="Chọn từ kho…"
                                            aria-label="Out Battery ID"
                                        />
                                        <button
                                            className="btn"
                                            type="button"
                                            onClick={() => { setOpenPicker(true); loadWarehouse(); }}
                                            disabled={!staffId.trim()}
                                            title={!staffId.trim() ? "Thiếu staffId" : ""}
                                        >
                                            Chọn từ kho
                                        </button>
                                    </div>
                                </label>
                                <p className="small muted" style={{ marginTop: 6 }}>
                                    * Chỉ hiển thị pin có trạng thái <b>warehouse</b>.
                                </p>
                            </div>
                        </div>
                    )}

                    {errorType === "pinOut" && (
                        <div className="card" style={{ marginTop: 16 }}>
                            <h3 style={{ marginTop: 0 }}>Xuất pin cho khách</h3>
                            <label>
                                Out Battery ID
                                <div style={{ display: "flex", gap: 8 }}>
                                    <input
                                        className="input"
                                        value={outBatteryId}
                                        onChange={(e) => setOutBatteryId(e.target.value)}
                                        placeholder="Chọn từ kho…"
                                        aria-label="Out Battery ID"
                                    />
                                    <button
                                        className="btn"
                                        type="button"
                                        onClick={() => { setOpenPicker(true); loadWarehouse(); }}
                                        disabled={!staffId.trim()}
                                        title={!staffId.trim() ? "Thiếu staffId" : ""}
                                    >
                                        Chọn từ kho
                                    </button>
                                </div>
                            </label>
                            <p className="small muted" style={{ marginTop: 6 }}>
                                * Chỉ hiển thị pin có trạng thái <b>warehouse</b>.
                            </p>
                        </div>
                    )}

                    <div style={{ marginTop: 12 }}>
                        <button className="btn btn-primary" onClick={onConfirm} disabled={!canConfirm || submitting}>
                            {submitting ? "Processing…" : "Xác nhận & gửi Manual Assist"}
                        </button>
                    </div>

                    {err && (
                        <div className="card mt-3" style={{ borderColor: "#ef4444", background: "#fef2f2" }}>
                            <div style={{ color: "#dc2626", fontWeight: 700, whiteSpace: "pre-wrap" }}>
                                ❌ {err}
                            </div>
                        </div>
                    )}

                    {resp && (
                        <div className="card mt-3">
                            <div style={{ fontWeight: 700, marginBottom: 6 }}>✅ BE trả về</div>
                            <pre style={pre}>{JSON.stringify(resp, null, 2)}</pre>
                        </div>
                    )}
                </>
            )}

            {/* ===== Modal “sổ kho” ===== */}
            {openPicker && (
                <div className="overlay" onClick={() => setOpenPicker(false)}>
                    <aside className="drawer" onClick={(e) => e.stopPropagation()}>
                        <header className="drawer-head">
                            <h4 className="m-0">Chọn pin từ kho</h4>
                            <button className="btn-close" onClick={() => setOpenPicker(false)} aria-label="Đóng">×</button>
                        </header>

                        <div className="drawer-body" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                            <div className="row-between">
                                <div className="small muted">Staff: <b>{staffId || "—"}</b></div>
                                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                    <label className="small muted">Lọc SOC tối thiểu</label>
                                    <input
                                        type="number"
                                        min={0}
                                        max={100}
                                        value={minSoc}
                                        onChange={(e) => setMinSoc(clamp01(e.target.value))}
                                        style={{ width: 72 }}
                                        aria-label="Lọc SOC tối thiểu"
                                    />
                                </div>
                            </div>

                            {pickErr && (
                                <div className="card" style={{ color: "#991b1b", background: "#fee2e2", border: "1px solid #fecaca" }}>
                                    {pickErr}
                                </div>
                            )}

                            <div className="slots-grid" role="list" aria-label="Danh sách pin trong kho">
                                {pickLoading
                                    ? Array.from({ length: 8 }).map((_, i) => <div key={i} className="slot-card skeleton" />)
                                    : filteredBatteries.length === 0
                                        ? <div className="muted small">Không có pin phù hợp (chỉ hiển thị trạng thái warehouse).</div>
                                        : filteredBatteries.map((b) => {
                                            const tone = statusTone(b.status);
                                            return (
                                                <div key={b.id} className="slot-card" role="listitem" style={{ borderColor: tone.br, background: "#fff" }}>
                                                    <div className="slot-head">
                                                        <span className="status-badge" style={{ background: tone.bg, color: tone.fg, borderColor: tone.br }}>
                                                            {tone.label}
                                                        </span>
                                                    </div>
                                                    <div className="slot-body">
                                                        <div className="slot-id">{b.id}</div>
                                                        <div className="kv"><span>SOH</span><b>{clamp01(b.soh)}%</b></div>
                                                        <div className="kv"><span>SOC</span><b>{clamp01(b.soc)}%</b></div>
                                                        <div className="socbar">
                                                            <span className="socbar-fill" style={{ width: `${clamp01(b.soc)}%`, background: tone.br }} />
                                                        </div>
                                                    </div>
                                                    <div className="slot-foot" style={{ marginTop: 8, display: "flex", justifyContent: "flex-end" }}>
                                                        <button className="btn" onClick={() => { setOutBatteryId(b.id); setOpenPicker(false); }}>
                                                            Chọn
                                                        </button>
                                                    </div>
                                                </div>
                                            );
                                        })}
                            </div>
                        </div>

                        <footer className="drawer-foot">
                            <button className="btn ghost" onClick={() => setOpenPicker(false)}>Đóng</button>
                        </footer>
                    </aside>
                </div>
            )}

            {/* Styles */}
            <style>{`
        .row-between { display:flex; align-items:center; justify-content:space-between; gap:12px; }
        .small { font-size:12px; }
        .muted { color: var(--muted); }
        .m-0 { margin: 0; }

        .btn { height:36px; padding:0 12px; border-radius:10px; border:1px solid var(--line); background:#fff; }
        .btn.btn-primary { background:#2563eb; color:#fff; border-color:#1d4ed8; }
        .btn.btn-primary:disabled { opacity:.6; cursor:not-allowed; }
        .btn.ghost:hover { background:#f8fafc; }
        .btn-close { background:transparent; border:none; font-size:22px; line-height:1; cursor:pointer; color:#0f172a; }

        .slots-grid { display:grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap:12px; }
        @media (min-width: 920px) { .slots-grid { grid-template-columns: repeat(4, minmax(0, 1fr)); } }

        .slot-card { border:1px solid var(--line); border-radius:14px; padding:12px; display:flex; flex-direction:column; gap:8px; }
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
      `}</style>
        </section>
    );
}

/* ===== Helpers ===== */
const grid2 = { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 };
const pre = { background: "#0f172a", color: "#e5e7eb", padding: 12, borderRadius: 8, overflowX: "auto" };

function clamp01(n) {
    const x = Number(n);
    if (!Number.isFinite(x)) return 0;
    const r = Math.round(x);
    return Math.max(0, Math.min(100, r));
}

function isWarehouse(status) {
    return (status || "").trim().toLowerCase() === "warehouse";
}

function statusTone(status) {
    const s = (status || "").toLowerCase();
    if (s === "warehouse") {
        return { bg: "rgba(16,185,129,.10)", fg: "#065f46", br: "#10b981", label: "Warehouse" };
    }
    return { bg: "rgba(148,163,184,.12)", fg: "#334155", br: "#94a3b8", label: "Other" };
}
