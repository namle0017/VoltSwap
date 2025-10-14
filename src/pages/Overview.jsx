// src/pages/Overview.jsx
import React from "react";

export default function Overview() {
    // mock data — bạn có thể nối API sau
    const stats = [
        { id: "full", title: "Fully Charge Battery", value: 3, icon: "🔋" },
        { id: "charging", title: "Charging Battery", value: 1, icon: "🔌" },
        { id: "swaps", title: "Amount Of Swap today", value: 140, icon: "⚡" },
    ];

    const tickets = [
        {
            id: 1,
            title: "Battery damaged after exchange",
            who: "Trần Văn A",
            place: "Trạm Bình Tân • 2025-01-15",
            status: "pending",
            time: "10:20 AM",
        },
        {
            id: 2,
            title: "Station not working",
            who: "Nguyễn Văn B",
            place: "Trạm Quận 8 • 2025-01-14",
            status: "processing",
            time: "12:04 AM",
        },
        {
            id: 3,
            title: "Upcoming appointment",
            who: "Lê Thị C",
            place: "Trạm Tân Sơn Nhất • 2025-01-15",
            status: "pending",
            time: "6:50 AM",
        },
    ];

    return (
        <div>
            {/* KPIs */}
            <div className="kpi3">
                {stats.map(s => (
                    <div key={s.id} className="kpi-card">
                        <div className="kpi-ico" aria-hidden>{s.icon}</div>
                        <div>
                            <div className="kpi-title">{s.title}</div>
                            <div className="kpi-value">{s.value}</div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Tickets */}
            <div className="tickets" style={{ marginTop: 24 }}>
                <div className="tickets-head">
                    <span>⚠️</span>
                    <span>Xử lý sự cố</span>
                </div>

                {tickets.map(t => (
                    <div key={t.id} className="ticket">
                        <div>
                            <div className="ticket-title">{t.title}</div>
                            <div className="ticket-sub">
                                {t.who} • {t.place}
                            </div>
                        </div>

                        <div className="ticket-right">
                            <span className={`pill ${t.status === "processing" ? "processing" : "pending"}`}>
                                {t.status === "processing" ? "Processing" : "Pending"}
                            </span>
                            <span className="time">{t.time}</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}