// src/layouts/MainLayout.jsx
import React from "react";
import { Outlet, useLocation } from "react-router-dom";
import ErrorBoundary from "../components/ErrorBoundary";
// (tùy) import Navbar from "../components/Navbar";
// (tùy) import Footer from "../components/Footer";

function DebugOverlay() {
    const loc = useLocation();
    React.useEffect(() => {
        console.log("[DEBUG] route changed:", loc.pathname);
    }, [loc.pathname]);

    // Bật/tắt overlay nhanh bằng boolean này
    const SHOW = true;
    if (!SHOW) return null;

    return (
        <div style={{
            position: "fixed", bottom: 12, right: 12, zIndex: 9999,
            background: "rgba(17,24,39,.9)", color: "#fff", padding: "10px 12px",
            borderRadius: 10, boxShadow: "0 6px 20px rgba(0,0,0,.25)", fontFamily: "system-ui",
            maxWidth: 360
        }}>
            <div style={{ fontWeight: 700, marginBottom: 4 }}>Debug Overlay</div>
            <div style={{ fontSize: 12, opacity: .9 }}>
                route: <b>{loc.pathname}</b>
            </div>
            <div style={{ fontSize: 12, opacity: .9 }}>
                mounted: <b id="dbg-mount-ts">{new Date().toLocaleString()}</b>
            </div>
        </div>
    );
}

export default function MainLayout() {
    return (
        <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "#f8fafc", color: "#0f172a" }}>
            {/* <Navbar /> */}
            <main style={{ flex: 1, padding: 16 }}>
                <ErrorBoundary>
                    <Outlet />
                </ErrorBoundary>
            </main>
            {/* <Footer /> */}
            <DebugOverlay />
        </div>
    );
}
