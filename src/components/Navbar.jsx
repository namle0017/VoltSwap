// src/components/Navbar.jsx
import React from "react";
import { Link } from "react-router-dom";

export default function Navbar() {
    return (
        <header className="topbar">
            <div className="topbar-inner">
                {/* Logo/Brand */}
                <Link to="/" className="brand">EVSwap</Link>

                {/* Search + actions + nút vào Dashboard */}
                <div className="flex items-center" style={{ gap: 8, width: "100%", maxWidth: 520 }}>
                    <div className="w-100" style={{ position: "relative" }}>
                        <input className="input" placeholder="Search…" />
                        <span style={{ position: "absolute", left: 8, top: 8 }}>🔎</span>
                    </div>

                    {/* Nút chuyển nhanh tới Overview */}
                    <Link to="/staff/overview" className="btn btn-primary" title="Go to Dashboard">
                        Dashboard
                    </Link>

                    <button className="btn" title="Notifications">🔔</button>
                    <button className="btn" title="Settings">⚙️</button>
                    <button className="btn" title="Account">
                        <img
                            alt="You"
                            src="https://i.pravatar.cc/40?img=12"
                            className="rounded-full"
                            style={{ width: 28, height: 28 }}
                        />
                        <span className="small muted">Loki</span>
                    </button>
                </div>
            </div>
        </header>
    );
}
