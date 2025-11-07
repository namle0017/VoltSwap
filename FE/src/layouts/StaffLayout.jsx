// src/layouts/StaffLayout.jsx
import React, { useEffect, useRef, useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import PageTransition from "@/components/PageTransition";

const sections = [
    { to: "/staff/overview", label: "Overview", icon: "🏠" },
    { to: "/staff/inventory", label: "Inventory", icon: "📦" },
    { to: "/staff/assist", label: "Manual Assist", icon: "🛠️" },
    { to: "/staff/swap", label: "Battery Swap", icon: "⚡" },
    { to: "/staff/booking", label: "Booking", icon: "🗓️" },
    { to: "/staff/admin-request", label: "Admin Request", icon: "📝" },
    { to: "/staff/support", label: "Customer Support", icon: "💬" },
    { to: "/staff/battery-mgmt", label: "Battery Manager", icon: "🔋" },
];

/* Small, accessible confirm dialog */
function ConfirmDialog({ open, title, message, onCancel, onConfirm }) {
    const cancelRef = useRef(null);

    useEffect(() => {
        if (open) cancelRef.current?.focus();
    }, [open]);

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-[100]" role="dialog" aria-modal="true" aria-labelledby="dlg-title" aria-describedby="dlg-desc"
            onKeyDown={(e) => e.key === "Escape" && onCancel()}>
            <div className="absolute inset-0 bg-black/40" onClick={onCancel} />
            <div className="absolute inset-x-0 top-[20%] mx-auto max-w-md rounded-2xl border bg-white shadow-xl">
                <div className="px-5 py-4 border-b font-semibold" id="dlg-title">{title}</div>
                <div className="p-5 text-sm text-slate-600" id="dlg-desc">{message}</div>
                <div className="px-5 py-4 border-t flex justify-end gap-2">
                    <button
                        type="button"
                        className="px-3 py-2 rounded-lg border text-sm"
                        ref={cancelRef}
                        onClick={onCancel}
                    >
                        Hủy
                    </button>
                    <button
                        type="button"
                        className="px-3 py-2 rounded-lg bg-red-600 text-white text-sm"
                        onClick={onConfirm}
                    >
                        Đăng xuất
                    </button>
                </div>
            </div>
        </div>
    );
}

export default function StaffLayout() {
    const location = useLocation();
    const navigate = useNavigate();
    const [confirmOpen, setConfirmOpen] = useState(false);

    const doSignOut = () => {
        // Xoá các key xác thực/làm việc
        const CLEAR_KEYS = ["accessToken", "role", "userId", "staffId", "stationId"];
        CLEAR_KEYS.forEach((k) => localStorage.removeItem(k));

        setConfirmOpen(false);
        navigate("/", { replace: true }); // về Home.jsx
    };

    return (
        <div className="staff-shell">
            {/* Sidebar trái */}
            <aside className="sidebar">
                {/* Brand */}
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
                    type="button"
                    className="btn mt-4 w-100"
                    onClick={() => setConfirmOpen(true)}
                    title="Đăng xuất"
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

            {/* Confirm before leaving */}
            <ConfirmDialog
                open={confirmOpen}
                title="Đăng xuất?"
                message="Bạn có chắc chắn muốn đăng xuất khỏi Staff Portal không?"
                onCancel={() => setConfirmOpen(false)}
                onConfirm={doSignOut}
            />
        </div>
    );
}