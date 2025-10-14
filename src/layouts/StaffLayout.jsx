// src/layouts/StaffLayout.jsx
import React from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import PageTransition from "../components/PageTransition";

const sections = [
    { to: "/staff/overview", label: "Overview", icon: "🏠" },
    { to: "/staff/inventory", label: "Inventory", icon: "📦" },
    { to: "/staff/assist", label: "Manual Assist", icon: "🛠️" }, // giả lập đổi thủ công
    { to: "/staff/swap", label: "Battery Swap", icon: "⚡" },  // chỉ hiển thị lịch sử
    { to: "/staff/dock", label: "Dock Console", icon: "🧰" }, // NEW
    { to: "/staff/booking", label: "Booking", icon: "🗓️" },
    { to: "/staff/admin-request", label: "Admin Request", icon: "📝" },
    { to: "/staff/support", label: "Customer Support", icon: "💬" },
];

export default function StaffLayout() {
    const location = useLocation();

    return (
        <div className="staff-shell">
            {/* Sidebar trái */}
            <aside className="sidebar">
                {/* Brand (không avatar) */}
                <div className="brand-tile">
                    <div className="brand-badge">⚡</div>
                    <div>
                        <div style={{ fontWeight: 800, lineHeight: 1 }}>EVSwap</div>
                        <div className="small" style={{ opacity: 0.8 }}>Staff Portal</div>
                    </div>
                </div>

                <nav className="nav-list">
                    {sections.map((s) => (
                        <NavLink
                            key={s.to}
                            to={s.to}
                            className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}
                        >
                            <span>{s.icon}</span>
                            <span>{s.label}</span>
                        </NavLink>
                    ))}
                </nav>

                <button
                    className="btn mt-4 w-100"
                    onClick={() => alert("Signing out…")}
                >
                    🚪 Sign out
                </button>
            </aside>

            {/* Content phải + hiệu ứng chuyển trang */}
            <main className="staff-content">
                <AnimatePresence mode="wait">
                    <PageTransition key={location.pathname}>
                        <Outlet />
                    </PageTransition>
                </AnimatePresence>
            </main>
        </div>
    );
}