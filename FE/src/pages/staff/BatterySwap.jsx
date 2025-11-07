/* eslint-disable no-unused-vars */
// src/pages/staff/BatterySwap.jsx
import React, { useEffect, useMemo, useState } from "react";
import api from "@/api/api"; // axios instance (already has baseURL)

const ROUTE = "/BatterySwap/staff-view-battery-swap";

// --- helpers ---
<<<<<<< HEAD
const isNullishStr = (v) =>
    v == null ||
    String(v).trim().toLowerCase() === "null" ||
    String(v).trim() === "";
const valOrDash = (v) => (isNullishStr(v) ? "—" : v);

function normalizeList(payload) {
    const raw = Array.isArray(payload?.data)
        ? payload.data
        : Array.isArray(payload)
            ? payload
            : [];
=======
const isNullishStr = (v) => v == null || String(v).trim().toLowerCase() === "null" || String(v).trim() === "";
const valOrDash = (v) => (isNullishStr(v) ? "—" : v);

function normalizeList(payload) {
    const raw = Array.isArray(payload?.data) ? payload.data : Array.isArray(payload) ? payload : [];
>>>>>>> feature/initial-upload
    return raw.map((r, i) => ({
        // BE sample had "staffId": "SUB-83793747" which is actually the ID shown in the table
        id: r.staffId ?? r.id ?? `ROW-${i + 1}`,
        userId: r.userId ?? "",
        userName: r.userName ?? "",
        batteryIn: isNullishStr(r.batteryIdIn) ? null : r.batteryIdIn,
        batteryOut: isNullishStr(r.batteryIdOut) ? null : r.batteryIdOut,
        status: r.status ?? "",
        time: r.time ?? "", // "08:00:00"
    }));
}

function formatTime12h(hms) {
    if (!hms || typeof hms !== "string") return "—";
    const [h = "0", m = "0", s = "0"] = hms.split(":");
    let hh = parseInt(h, 10);
    if (Number.isNaN(hh)) return hms;
    const ampm = hh >= 12 ? "PM" : "AM";
    hh = hh % 12 || 12;
<<<<<<< HEAD
    return `${String(hh).padStart(2, "0")}:${String(
        parseInt(m, 10)
    ).padStart(2, "0")}${ampm}`;
=======
    return `${String(hh).padStart(2, "0")}:${String(parseInt(m, 10)).padStart(2, "0")}${ampm}`;
>>>>>>> feature/initial-upload
}

function StatusBadge({ status }) {
    const s = String(status || "").toLowerCase();
<<<<<<< HEAD
    let bg = "#e2e8f0",
        fg = "#0f172a",
        label = status || "—";
    if (s === "using") {
        bg = "rgba(59,130,246,.12)";
        fg = "#1d4ed8";
    } else if (s === "returned") {
        bg = "rgba(16,185,129,.12)";
        fg = "#065f46";
    } else if (s === "failed" || s === "fail" || s === "error") {
        bg = "rgba(239,68,68,.12)";
        fg = "#b91c1c";
    }
    return (
        <span
            className="swap-badge"
            style={{ background: bg, color: fg, borderColor: fg }}
        >
=======
    let bg = "#e2e8f0", fg = "#0f172a", label = status || "—";
    if (s === "using") { bg = "rgba(59,130,246,.12)"; fg = "#1d4ed8"; }
    else if (s === "returned") { bg = "rgba(16,185,129,.12)"; fg = "#065f46"; }
    else if (s === "failed" || s === "fail" || s === "error") { bg = "rgba(239,68,68,.12)"; fg = "#b91c1c"; }
    return (
        <span className="swap-badge" style={{ background: bg, color: fg, borderColor: fg }}>
>>>>>>> feature/initial-upload
            {label}
        </span>
    );
}

export default function BatterySwap() {
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState("");
    const [search, setSearch] = useState("");
    const [sortDir, setSortDir] = useState("asc"); // asc | desc
<<<<<<< HEAD
=======
    const [showDebug, setShowDebug] = useState(false);
>>>>>>> feature/initial-upload

    // UserId FE must send
    const userId = (localStorage.getItem("userId") || "").trim();

    const collator = useMemo(
<<<<<<< HEAD
        () =>
            new Intl.Collator(undefined, {
                numeric: true,
                sensitivity: "base",
            }),
=======
        () => new Intl.Collator(undefined, { numeric: true, sensitivity: "base" }),
>>>>>>> feature/initial-upload
        []
    );

    const fetchData = async () => {
        try {
            if (!userId) {
<<<<<<< HEAD
                setErr(
                    "Missing userId in localStorage. Please sign in again."
                );
=======
                setErr("Thiếu userId trong localStorage. Vui lòng đăng nhập lại.");
>>>>>>> feature/initial-upload
                setRows([]);
                setLoading(false);
                return;
            }
            setErr("");
            setLoading(true);
            const res = await api.get(ROUTE, { params: { UserId: userId } });
            const list = normalizeList(res.data);
            setRows(list);
        } catch (e) {
            console.error("Load swaps failed:", e);
<<<<<<< HEAD
            setErr(
                e?.response?.data?.message ||
                e?.message ||
                "Failed to load battery swap history."
            );
=======
            setErr(e?.response?.data?.message || e?.message || "Không thể tải lịch sử đổi pin.");
>>>>>>> feature/initial-upload
            setRows([]);
        } finally {
            setLoading(false);
        }
    };

<<<<<<< HEAD
    useEffect(() => {
        fetchData();
        // eslint-disable-next-line
    }, []);
=======
    useEffect(() => { fetchData(); /* eslint-disable-next-line */ }, []);
>>>>>>> feature/initial-upload

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        if (!q) return rows;
<<<<<<< HEAD
        return rows.filter(
            (r) =>
                (r.id || "").toLowerCase().includes(q) ||
                (r.userName || "").toLowerCase().includes(q) ||
                (r.batteryIn || "").toLowerCase().includes(q) ||
                (r.batteryOut || "").toLowerCase().includes(q)
=======
        return rows.filter((r) =>
            (r.id || "").toLowerCase().includes(q) ||
            (r.userName || "").toLowerCase().includes(q) ||
            (r.batteryIn || "").toLowerCase().includes(q) ||
            (r.batteryOut || "").toLowerCase().includes(q)
>>>>>>> feature/initial-upload
        );
    }, [rows, search]);

    const sorted = useMemo(() => {
<<<<<<< HEAD
        const arr = [...filtered].sort((a, b) =>
            collator.compare(a.id, b.id)
        );
=======
        const arr = [...filtered].sort((a, b) => collator.compare(a.id, b.id));
>>>>>>> feature/initial-upload
        return sortDir === "desc" ? arr.reverse() : arr;
    }, [filtered, sortDir, collator]);

    return (
        <section>
            {/* Header */}
            <div className="row-between">
                <div>
                    <h2 className="h1 m-0">Battery Swap</h2>
<<<<<<< HEAD
=======
                    <p className="muted">Lịch sử đổi pin tại trạm (theo UserId của nhân viên).</p>
>>>>>>> feature/initial-upload
                </div>
                <div className="flex items-center gap-2">
                    <input
                        className="swap-input"
<<<<<<< HEAD
                        placeholder="Search ID / name / pin in / pin out…"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                    <button
                        className="swap-btn"
                        onClick={fetchData}
                        disabled={loading}
                    >
                        ↻ {loading ? "Loading..." : "Refresh"}
                    </button>

=======
                        placeholder="Tìm ID / tên / pin in/out…"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                    <button className="swap-btn" onClick={fetchData} disabled={loading}>
                        ↻ {loading ? "Loading..." : "Refresh"}
                    </button>
                    <button className="swap-btn ghost" onClick={() => setShowDebug((v) => !v)}>
                        {showDebug ? "Hide Debug" : "Show Debug"}
                    </button>
>>>>>>> feature/initial-upload
                </div>
            </div>

            {/* Error */}
            {!!err && (
<<<<<<< HEAD
                <div className="card card-padded mt-3 error">⚠️ {err}</div>
=======
                <div className="card card-padded mt-3 error">
                    ⚠️ {err}
                </div>
>>>>>>> feature/initial-upload
            )}

            {/* Table */}
            <div className="card mt-4 overflow-auto">
                <table className="swap-table">
                    <thead className="bg-slate-50">
                        <tr>
                            <th
                                className="px-4 py-3 text-left cursor-pointer select-none"
<<<<<<< HEAD
                                onClick={() =>
                                    setSortDir((d) =>
                                        d === "asc" ? "desc" : "asc"
                                    )
                                }
                                title="Sort by ID"
=======
                                onClick={() => setSortDir((d) => (d === "asc" ? "desc" : "asc"))}
                                title="Sắp xếp theo ID"
>>>>>>> feature/initial-upload
                            >
                                ID {sortDir === "asc" ? "▲" : "▼"}
                            </th>
                            <th className="px-4 py-3 text-left">Customer</th>
<<<<<<< HEAD
                            <th className="px-4 py-3 text-left">
                                Battery in / out
                            </th>
=======
                            <th className="px-4 py-3 text-left">Pin in / out</th>
>>>>>>> feature/initial-upload
                            <th className="px-4 py-3 text-left">Time</th>
                            <th className="px-4 py-3 text-left">Status</th>
                        </tr>
                    </thead>

                    <tbody>
                        {loading ? (
                            <tr>
<<<<<<< HEAD
                                <td
                                    className="px-4 py-4 text-slate-500"
                                    colSpan={5}
                                >
                                    Loading…
                                </td>
                            </tr>
                        ) : sorted.length === 0 ? (
                            <tr>
                                <td
                                    className="px-4 py-6 text-slate-500"
                                    colSpan={5}
                                >
                                    No records.
                                </td>
                            </tr>
                        ) : (
                            sorted.map((r, idx) => (
                                <tr
                                    key={`${r.id}-${r.userId}-${r.time}-${idx}`}
                                    className="border-t hover:bg-slate-50/60"
                                >
                                    <td className="px-4 py-3 font-semibold">
                                        {r.id}
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="font-medium">
                                            {r.userName || "—"}
                                        </div>
                                        <div className="muted small">
                                            {r.userId || ""}
                                        </div>
                                    </td>
                                    <td className="px-4 py-3">
                                        <div>
                                            In:{" "}
                                            <b>{valOrDash(r.batteryIn)}</b>
                                        </div>
                                        <div>
                                            Out:{" "}
                                            <b>{valOrDash(r.batteryOut)}</b>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3">
                                        {formatTime12h(r.time)}
                                    </td>
                                    <td className="px-4 py-3">
                                        <StatusBadge status={r.status} />
                                    </td>
=======
                                <td className="px-4 py-4 text-slate-500" colSpan={5}>Đang tải…</td>
                            </tr>
                        ) : sorted.length === 0 ? (
                            <tr>
                                <td className="px-4 py-6 text-slate-500" colSpan={5}>Không có bản ghi nào.</td>
                            </tr>
                        ) : (
                            sorted.map((r, idx) => (
                                <tr key={`${r.id}-${r.userId}-${r.time}-${idx}`} className="border-t hover:bg-slate-50/60">
                                    <td className="px-4 py-3 font-semibold">{r.id}</td>
                                    <td className="px-4 py-3">
                                        <div className="font-medium">{r.userName || "—"}</div>
                                        <div className="muted small">{r.userId || ""}</div>
                                    </td>
                                    <td className="px-4 py-3">
                                        <div>In: <b>{valOrDash(r.batteryIn)}</b></div>
                                        <div>Out: <b>{valOrDash(r.batteryOut)}</b></div>
                                    </td>
                                    <td className="px-4 py-3">{formatTime12h(r.time)}</td>
                                    <td className="px-4 py-3"><StatusBadge status={r.status} /></td>
>>>>>>> feature/initial-upload
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

<<<<<<< HEAD

=======
            {/* Optional debug */}
            {showDebug && (
                <pre className="mt-3 small" style={{ whiteSpace: "pre-wrap" }}>
                    {JSON.stringify({ route: ROUTE, userId, raw: rows }, null, 2)}
                </pre>
            )}
>>>>>>> feature/initial-upload

            {/* Local styles (scoped) */}
            <style>{`
        .row-between{display:flex;align-items:flex-end;justify-content:space-between;gap:12px;}
        .m-0{margin:0;}
        .h1{font-size:22px;font-weight:800;}
        .muted{color:var(--muted);}
        .small{font-size:12px;}
        .card{border:1px solid var(--line);border-radius:14px;background:#fff;}
        .card-padded{padding:14px 16px;}
        .error{color:#991b1b;background:#fee2e2;border-color:#fecaca;}

        .swap-input{
          height:36px;border:1px solid var(--line);border-radius:10px;padding:0 10px;background:#fff;
          min-width:260px;
        }
        .swap-btn{
          height:36px;border:1px solid var(--line);border-radius:10px;padding:0 12px;background:#fff;
        }
        .swap-btn.ghost:hover{background:#f8fafc;}

        .swap-table{width:100%;border-collapse:separate;border-spacing:0;}
        .swap-table th{font-weight:700;color:#0f172a;border-bottom:1px solid var(--line);}
        .swap-table td{vertical-align:top;}

        .swap-badge{
          display:inline-block;font-size:12px;font-weight:700;padding:2px 8px;border:1px solid;border-radius:999px;
        }
      `}</style>
        </section>
    );
<<<<<<< HEAD
}
=======
}
>>>>>>> feature/initial-upload
