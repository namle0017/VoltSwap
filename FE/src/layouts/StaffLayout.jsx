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
// src/layouts/StaffLayout.jsx
import React, { useEffect, useRef, useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import PageTransition from "@/components/PageTransition";
import "bootstrap-icons/font/bootstrap-icons.css";

// Map route -> nhãn + icon Bootstrap
// Lưu ý: KHÔNG để "bi " trong data vì bên dưới đã prepend "bi ".
const sections = [
    { to: "/staff/overview", label: "Overview", icon: "bi-house" },
    { to: "/staff/inventory", label: "Inventory", icon: "bi-box" },
    { to: "/staff/assist", label: "Manual Assist", icon: "bi-tools" },
    { to: "/staff/swap", label: "Battery Swap", icon: "bi-battery-full" },
    { to: "/staff/booking", label: "Booking", icon: "bi-calendar-check" },
    { to: "/staff/admin-request", label: "Admin Request", icon: "bi-file-earmark-text" },
    { to: "/staff/support", label: "Customer Support", icon: "bi-chat-dots" },
    { to: "/staff/battery-mgmt", label: "Battery Manager", icon: "bi-battery-charging" },
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
            "accessToken",
            "role",
            "userId",
            "UserId",
            "staffId",
            "StaffId",
            "stationId",
            "StationId",
        ];
        CLEAR_KEYS.forEach((k) => localStorage.removeItem(k));
        setConfirmOpen(false);
        navigate("/", { replace: true }); // về Home.jsx
    };

    return (
        // Layout FULL SCREEN, sidebar cố định, content scroll
        <div
            className="staff-shell"
            style={{
                display: "flex",
                height: "100vh",       // chiếm đúng viewport
                overflow: "hidden",    // chặn scroll toàn trang
                backgroundColor: "#f5f5fb",
            }}
        >
            {/* Sidebar trái (cố định) */}
            <aside
                className="sidebar"
                style={{
                    width: 240,
                    flexShrink: 0,
                    backgroundColor: "#4b1fa6",
                    color: "#ffffff",
                    display: "flex",
                    flexDirection: "column",
                    padding: "16px 12px",
                }}
            >
                {/* Brand */}
                <div
                    className="brand-tile"
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        marginBottom: 24,
                    }}
                >
                    <div
                        className="brand-badge"
                        style={{
                            width: 40,
                            height: 40,
                            borderRadius: 12,
                            backgroundColor: "#5c28c9",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                        }}
                    >
                        <i
                            className="bi bi-lightning-charge-fill"
                            style={{ fontSize: 22, color: "#ffd94a" }}
                            aria-hidden="true"
                        />
                        <span className="sr-only">EVSwap</span>
                    </div>
                    <div>
                        <div style={{ fontWeight: 800, lineHeight: 1 }}>EVSwap</div>
                        <div
                            style={{
                                fontSize: 12,
                                opacity: 0.85,
                            }}
                        >
                            Staff Portal
                        </div>
                    </div>
                </div>

                {/* Nav */}
                <nav className="nav-list" style={{ flex: 1 }}>
                    {sections.map((s) => (
                        <NavLink
                            key={s.to}
                            to={s.to}
                            title={s.label}
                            className={({ isActive }) =>
                                `nav-item ${isActive ? "active" : ""}`
                            }
                            style={({ isActive }) => ({
                                display: "flex",
                                alignItems: "center",
                                padding: "10px 12px",
                                marginBottom: 6,
                                borderRadius: 12,
                                fontSize: 14,
                                fontWeight: 500,
                                color: isActive ? "#4b1fa6" : "#ffffff",
                                backgroundColor: isActive ? "#ffffff" : "transparent",
                                textDecoration: "none",
                                gap: 10,
                                transition: "all 0.18s ease",
                            })}
                        >
                            <i
                                className={`bi ${s.icon}`}
                                aria-hidden="true"
                                style={{ fontSize: 18 }}
                            />
                            <span>{s.label}</span>
                        </NavLink>
                    ))}
                </nav>

                {/* Nút Sign out */}
                <button
                    type="button"
                    onClick={() => setConfirmOpen(true)}
                    title="Đăng xuất"
                    className="mt-4 w-full"
                    style={{
                        marginTop: 8,
                        width: "100%",
                        padding: "10px 12px",
                        borderRadius: 14,
                        backgroundColor: "#ffffff",
                        color: "#000000",
                        fontWeight: 600,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        border: "none",
                        cursor: "pointer",
                        boxShadow: "0 4px 10px rgba(0,0,0,0.15)",
                        gap: 8,
                    }}
                >
                    <i className="bi bi-box-arrow-right" aria-hidden="true" />
                    <span>Sign out</span>
                </button>
            </aside>

            {/* Content phải: chỉ phần này scroll */}
            <main
                className="staff-content"
                style={{
                    flex: 1,
                    padding: "24px 32px",
                    overflowY: "auto",
                    overflowX: "hidden",
                }}
            >
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
