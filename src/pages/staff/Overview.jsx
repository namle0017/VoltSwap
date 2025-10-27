// src/pages/Overview.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import api from "@/api/api";

export default function Overview({ staffId: staffIdProp }) {
    const { staffId: staffIdFromRoute } = useParams();
    const [searchParams] = useSearchParams();

    // Lấy staffId theo thứ tự ưu tiên, KHÔNG gán mặc định cứng
    const [staffId, setStaffId] = useState(() => {
        return (
            staffIdProp ||
            staffIdFromRoute ||
            searchParams.get("staffId") ||
            localStorage.getItem("StaffId") ||
            localStorage.getItem("staffId") ||
            ""
        );
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [payload, setPayload] = useState(null);

    // Call API khi có staffId hợp lệ
    useEffect(() => {
        if (!staffId) return; // Chưa có staffId -> chưa gọi API
        let alive = true;

        (async () => {
            try {
                setLoading(true);
                setError("");
                const res = await api.get(`/Overview/staff-overview/${encodeURIComponent(staffId)}`);
                const data = res?.data?.data;
                if (!data) throw new Error("Unexpected response structure");
                if (alive) setPayload(data);
            } catch (e) {
                if (alive) setError(e?.message || "Không thể tải overview");
            } finally {
                if (alive) setLoading(false);
            }
        })();

        return () => {
            alive = false;
        };
    }, [staffId]);

    // ===== Helpers =====
    const fmtDateTime = (s) => {
        if (!s) return "";
        try {
            const d = new Date(s);
            const date = d.toLocaleDateString("vi-VN", { year: "numeric", month: "2-digit", day: "2-digit" });
            const time = d.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
            return `${date} • ${time}`;
        } catch {
            return s;
        }
    };

    // ===== Extract BE fields =====
    const numberOfBatteryFully = payload?.numberOfBat?.numberOfBatteryFully ?? 0;
    const numberOfBatteryCharging = payload?.numberOfBat?.numberOfBatteryCharging ?? 0;
    const numberOfBatteryMaintenance = payload?.numberOfBat?.numberOfBatteryMaintenance ?? 0;
    const numberOfBatteryInWarehouse = payload?.numberOfBat?.numberOfBatteryInWarehouse ?? 0;
    const swapsToday = payload?.swapInDat ?? payload?.swapInDay ?? 0; // dự phòng key khác tên

    const stats = [
        { id: "full", title: "Fully Charge Battery", value: numberOfBatteryFully, icon: "🔋" },
        { id: "charging", title: "Charging Battery", value: numberOfBatteryCharging, icon: "🔌" },
        { id: "swaps", title: "Amount Of Swap today", value: swapsToday, icon: "⚡" },
    ];

    const tickets = useMemo(() => {
        const list = payload?.repostList ?? [];
        return list.map((r, idx) => {
            const statusRaw = (r.reportStatus || "").toLowerCase();
            let status = "pending";
            if (statusRaw === "processing") status = "processing";
            else if (statusRaw === "done") status = "done";
            return {
                key: `${r.staffId || "st"}-${idx}`,
                title: r.reportType || "Report",
                who: r.driverName || r.staffId || "—",
                place: r.reportNote || "",
                status,
                time: fmtDateTime(r.createAt),
            };
        });
    }, [payload]);

    // ===== UI nhập staffId nếu chưa có =====
    if (!staffId) {
        const [temp, setTemp] = useState("");
        const [remember, setRemember] = useState(true);

        return (
            <div className="card" style={{ padding: 16 }}>
                <h3 style={{ marginTop: 0 }}>Nhập Staff ID</h3>
                <p className="muted">FE sẽ gửi staffId cho BE, không dùng giá trị mặc định.</p>
                <div className="row" style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <input
                        value={temp}
                        onChange={(e) => setTemp(e.target.value)}
                        placeholder="VD: ST-20000013"
                        className="input"
                        style={{ minWidth: 260 }}
                    />
                    <button
                        className="btn primary"
                        onClick={() => {
                            if (!temp.trim()) return;
                            if (remember) {
                                localStorage.setItem("StaffId", temp.trim());
                            }
                            setStaffId(temp.trim());
                        }}
                    >
                        Xác nhận
                    </button>
                </div>
                <label className="mt-2" style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <input
                        type="checkbox"
                        checked={remember}
                        onChange={(e) => setRemember(e.target.checked)}
                    />
                    <span>Lưu vào localStorage cho lần sau</span>
                </label>
            </div>
        );
    }

    // ===== Render chính =====
    return (
        <div>
            {/* KPIs */}
            <div className="kpi3">
                {stats.map((s) => (
                    <div key={s.id} className="kpi-card">
                        <div className="kpi-ico" aria-hidden>{s.icon}</div>
                        <div>
                            <div className="kpi-title">{s.title}</div>
                            <div className="kpi-value">{loading ? "…" : s.value}</div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Phụ: maintenance + warehouse */}
            <div className="mt-3" style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <span className="pill neutral">Maintenance: {loading ? "…" : numberOfBatteryMaintenance}</span>
                <span className="pill neutral">In Warehouse: {loading ? "…" : numberOfBatteryInWarehouse}</span>
            </div>

            {/* Tickets */}
            <div className="tickets" style={{ marginTop: 24 }}>
                <div className="tickets-head">
                    <span>⚠️</span>
                    <span>Xử lý sự cố</span>
                    <span className="muted" style={{ marginLeft: 8 }}>
                        ({loading ? "…" : (payload?.repostList?.length ?? 0)})
                    </span>
                </div>

                {loading && <div className="muted">Đang tải overview…</div>}
                {error && !loading && <div className="error">Lỗi: {error}</div>}
                {!loading && !error && (payload?.repostList?.length ?? 0) === 0 && (
                    <div className="muted">Không có báo cáo.</div>
                )}

                {!loading && !error && tickets.map((t) => (
                    <div key={t.key} className="ticket">
                        <div>
                            <div className="ticket-title">{t.title}</div>
                            <div className="ticket-sub">
                                {t.who}{t.place ? ` • ${t.place}` : ""}
                            </div>
                        </div>
                        <div className="ticket-right">
                            <span className={`pill ${t.status === "processing" ? "processing" : t.status === "done" ? "done" : "pending"}`}>
                                {t.status === "processing" ? "Processing" : t.status === "done" ? "Done" : "Pending"}
                            </span>
                            <span className="time">{t.time}</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
