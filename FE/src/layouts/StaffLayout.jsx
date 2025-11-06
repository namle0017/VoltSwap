// src/layouts/StaffLayout.jsx
import React, { useEffect, useRef, useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import PageTransition from "@/components/PageTransition";
import "bootstrap-icons/font/bootstrap-icons.css"; // cần có

// Map route -> nhãn + icon Bootstrap (KHÔNG để "bi " lặp lại)
const sections = [
    { to: "/staff/overview", label: "Overview", icon: "bi-house" },
    { to: "/staff/inventory", label: "Inventory", icon: "bi-box" },
    { to: "/staff/assist", label: "Manual Assist", icon: "bi-tools" },
    { to: "/staff/swap", label: "Battery Swap", icon: "bi-battery-charging" },
    { to: "/staff/booking", label: "Booking", icon: "bi-calendar-check" },
    { to: "/staff/admin-request", label: "Admin Request", icon: "bi-file-earmark-text" },
    { to: "/staff/support", label: "Customer Support", icon: "bi-chat-dots" },
    { to: "/staff/battery-mgmt", label: "Battery Manager", icon: "bi-gear" },
];

/* Small, accessible confirm dialog */
function ConfirmDialog({ open, title, message, onCancel, onConfirm }) {
    const cancelRef = useRef(null);
    useEffect(() => {
        if (open) cancelRef.current?.focus();
    }, [open]);
    if (!open) return null;

    return (
        <div
            className="fixed inset-0 z-[100]"
            role="dialog"
            aria-modal="true"
            aria-labelledby="dlg-title"
            aria-describedby="dlg-desc"
            onKeyDown={(e) => e.key === "Escape" && onCancel()}
        >
            <div className="absolute inset-0 bg-black/40" onClick={onCancel} />
            <div className="absolute inset-x-0 top-[20%] mx-auto max-w-md rounded-2xl border bg-white shadow-xl">
                <div className="px-5 py-4 border-b font-semibold" id="dlg-title">
                    {title}
                </div>
                <div className="p-5 text-sm text-slate-600" id="dlg-desc">
                    {message}
                </div>
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
                        className="px-3 py-2 rounded-lg bg-red-600 text-white text-sm flex items-center"
                        onClick={onConfirm}
                    >
                        <i className="bi bi-box-arrow-right mr-2" aria-hidden="true" />
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
        const CLEAR_KEYS = [
            "accessToken", "role",
            "userId", "UserId",
            "staffId", "StaffId",
            "stationId", "StationId",
        ];
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
                    <div className="brand-badge flex items-center justify-center">
                        <i
                            className="bi bi-lightning-charge-fill text-yellow-400 text-2xl"
                            aria-hidden="true"
                        />
                        <span className="sr-only">EVSwap</span>
                    </div>
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
                            title={s.label}
                        >
                            <i className={`bi ${s.icon} text-lg`} aria-hidden="true" />
                            <span className="ml-2">{s.label}</span>
                        </NavLink>
                    ))}
                </nav>

                {/* Nút Sign out ở sidebar */}
                <button
                    type="button"
                    className="mt-4 w-full px-3 py-2 rounded-xl bg-white text-black font-medium shadow flex items-center justify-center"
                    onClick={() => setConfirmOpen(true)}
                    title="Đăng xuất"
                >
                    <i className="bi bi-box-arrow-right mr-2" aria-hidden="true" />
                    Sign out
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
