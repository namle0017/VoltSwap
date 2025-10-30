// src/pages/staff/Overview.jsx
import React, { useEffect, useMemo, useState } from "react";
import api from "@/api/api"; // axios instance

// ✅ Endpoint & param mới
const ROUTE = "/Overview/staff-overview"; // GET with ?userId=...

function StatCard({ icon, label, value, loading }) {
    return (
        <div className="rounded-2xl border bg-white shadow-sm p-4 flex items-center gap-3">
            <div className="text-2xl">{icon}</div>
            <div>
                <div className="text-slate-500 text-sm">{label}</div>
                <div className="text-2xl font-bold">{loading ? "…" : (value ?? 0)}</div>
            </div>
        </div>
    );
}

function badgeTone(statusRaw) {
    const s = String(statusRaw || "").toLowerCase();
    if (s === "done") return "bg-emerald-50 text-emerald-700 border-emerald-200";
    if (s === "processing") return "bg-amber-50 text-amber-700 border-amber-200";
    return "bg-slate-50 text-slate-700 border-slate-200";
}

export default function Overview() {
    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState("");
    const [data, setData] = useState(null);

    // ✅ Ưu tiên userId (theo yêu cầu), fallback các key khác nếu thiếu
    const userId = (
        localStorage.getItem("userId") ||
        localStorage.getItem("staffId") ||
        localStorage.getItem("StaffId") ||
        ""
    ).trim();

    const fetchOverview = async () => {
        try {
            if (!userId) {
                setErr("Thiếu userId trong localStorage. Vui lòng đăng nhập lại.");
                setData(null);
                setLoading(false);
                return;
            }
            setErr("");
            setLoading(true);

            // ✅ Gọi đúng: /api/Overview/staff-overview?userId=...
            const res = await api.get(ROUTE, { params: { userId } });
            setData(res?.data?.data || null);
        } catch (e) {
            setErr(e?.response?.data?.message || e?.message || "Tải overview thất bại");
            setData(null);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOverview();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [userId]);

    const stats = useMemo(() => {
        const n = data?.numberOfBat || {};
        return [
            { key: "full", icon: "🔋", label: "Fully Charged", value: n.numberOfBatteryFully },
            { key: "charging", icon: "🔌", label: "Charging", value: n.numberOfBatteryCharging },
            { key: "maintenance", icon: "🛠️", label: "Maintenance", value: n.numberOfBatteryMaintenance },
            { key: "warehouse", icon: "📦", label: "In Warehouse", value: n.numberOfBatteryInWarehouse },
            { key: "swaps", icon: "⚡", label: "Swaps Today", value: data?.swapInDat },
        ];
    }, [data]);

    const tickets = useMemo(() => {
        const list = Array.isArray(data?.repostList) ? data.repostList : [];
        return list.map((t, i) => ({
            id: i + 1,
            type: t.reportType || "Report",
            note: t.reportNote || "",
            who: t.driverName || t.staffId || "—",
            time: t.createAt ? new Date(t.createAt).toLocaleString() : "—",
            status: t.reportStatus || "Pending",
        }));
    }, [data]);

    return (
        <section className="space-y-6">
            {/* Header */}
            <header className="flex flex-wrap items-end justify-between gap-3">
                <div>
                    <h1 className="text-xl font-bold m-0">Overview</h1>
                    <p className="text-slate-500 text-sm">Tổng quan trạm & hoạt động trong ngày</p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        className="px-3 py-2 rounded-lg border text-sm"
                        onClick={fetchOverview}
                        disabled={loading}
                        title="Làm mới dữ liệu"
                    >
                        ↻ {loading ? "Loading..." : "Refresh"}
                    </button>
                </div>
            </header>

            {/* Error */}
            {!!err && <div className="text-sm text-red-600">{err}</div>}

            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                {stats.map((s) => (
                    <StatCard
                        key={s.key}
                        icon={s.icon}
                        label={s.label}
                        value={s.value}
                        loading={loading}
                    />
                ))}
            </div>

            {/* Tickets / Reports */}
            <div className="rounded-2xl border bg-white shadow-sm">
                <div className="px-4 py-3 border-b flex items-center gap-2">
                    <span>⚠️</span>
                    <span className="font-semibold">Sự cố / Ticket</span>
                </div>

                {loading ? (
                    <div className="p-4 text-sm text-slate-500">Đang tải…</div>
                ) : !tickets.length ? (
                    <div className="p-4 text-sm text-slate-500">Không có ticket.</div>
                ) : (
                    <div className="divide-y">
                        {tickets.map((t) => (
                            <div key={t.id} className="p-4 flex items-center justify-between">
                                <div className="space-y-1">
                                    <div className="font-medium">
                                        {t.type}{t.note ? ` — ${t.note}` : ""}
                                    </div>
                                    <div className="text-slate-500 text-sm">{t.who}</div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className={`px-2 py-0.5 rounded text-xs border ${badgeTone(t.status)}`}>
                                        {t.status}
                                    </span>
                                    <span className="text-slate-500 text-xs">{t.time}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </section>
    );
}