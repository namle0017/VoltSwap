// src/pages/AdminRequest.jsx
import React, { useEffect, useMemo, useState } from "react";
import api from "@/api/api"; // axios instance chung

export default function AdminRequest() {
    const [staffId] = useState(
        localStorage.getItem("StaffId") || localStorage.getItem("userId") || ""
    );

    // ===== Form state =====
    const [reportTypes, setReportTypes] = useState([]);
    const [reportTypeId, setReportTypeId] = useState("");
    const [driverId, setDriverId] = useState("");
    const [reportNote, setReportNote] = useState("");

    // ===== List + UI state =====
    const [items, setItems] = useState([]);
    const [loadingTypes, setLoadingTypes] = useState(false);
    const [creating, setCreating] = useState(false);
    const [error, setError] = useState("");

    const canSubmit = useMemo(
        () => !!staffId && !!reportTypeId && reportNote.trim().length > 0,
        [staffId, reportTypeId, reportNote]
    );

    async function loadReportTypes() {
        try {
            setLoadingTypes(true);
            setError("");
            const res = await api.get("/Report/get-staff-report-list");
            const list = Array.isArray(res?.data?.data) ? res.data.data : [];
            setReportTypes(list);
        } catch (e) {
            console.error(e);
            setError(e.message || "Failed to load report types");
        } finally {
            setLoadingTypes(false);
        }
    }

    useEffect(() => {
        loadReportTypes();
    }, []);

    async function onSubmit(e) {
        e.preventDefault();
        if (!canSubmit) return;

        if (!staffId) {
            setError("Missing staffId. Please login again.");
            return;
        }

        try {
            setCreating(true);
            setError("");

            const payload = {
                staffId: staffId,
                driverId: driverId.trim() ? driverId.trim() : null,
                reportTypeId: Number(reportTypeId),
                reportNote: reportNote.trim(),
            };

            const res = await api.post("/Report/staff-create-report", payload);
            const createdRaw = res?.data?.data || res?.data || {};

            const typeObj = (reportTypes || []).find(
                (t) => Number(t.reportTypeId) === Number(payload.reportTypeId)
            );

            const created = {
                id: createdRaw.id || createdRaw.reportId || `R-${Date.now()}`,
                staffId: createdRaw.staffId || payload.staffId,
                driverId:
                    createdRaw.driverId !== undefined
                        ? createdRaw.driverId
                        : payload.driverId,
                reportTypeId:
                    createdRaw.reportTypeId || payload.reportTypeId,
                reportType:
                    createdRaw.reportType ||
                    typeObj?.reportType ||
                    "-",
                reportNote:
                    createdRaw.reportNote || payload.reportNote,
                createdAt:
                    createdRaw.createdAt || new Date().toISOString(),
                status: createdRaw.status || "Processing",
            };

            setItems((prev) => [created, ...prev]);
            setReportTypeId("");
            setDriverId("");
            setReportNote("");
        } catch (e) {
            console.error(e);
            setError(e.message || "Submit failed");
        } finally {
            setCreating(false);
        }
    }

    return (
        <section style={{ fontFamily: "system-ui", color: "#0f172a" }}>
            <h2 style={{ margin: "0 0 6px", fontSize: 22, fontWeight: 800 }}>
                Staff → Admin Report
            </h2>
            <p style={{ margin: "0 0 14px", fontSize: 12, color: "#6b7280" }}>
                Staff ID: <strong>{staffId || "N/A (please login)"}</strong>
            </p>

            {/* FORM */}
            <form onSubmit={onSubmit} style={card}>
                <div style={grid2}>
                    <label style={label}>
                        Report Type
                        <select
                            style={input}
                            value={reportTypeId}
                            onChange={(e) => setReportTypeId(e.target.value)}
                            disabled={loadingTypes || reportTypes.length === 0}
                        >
                            <option value="">
                                {loadingTypes
                                    ? "Loading types..."
                                    : "Select report type"}
                            </option>
                            {reportTypes.map((t) => (
                                <option
                                    key={t.reportTypeId}
                                    value={t.reportTypeId}
                                >
                                    {t.reportType}
                                </option>
                            ))}
                        </select>
                    </label>

                    <label style={label}>
                        Driver ID (optional)
                        <input
                            style={input}
                            placeholder="Driver ID (can be empty)"
                            value={driverId}
                            onChange={(e) => setDriverId(e.target.value)}
                        />
                    </label>
                </div>

                <label style={{ ...label, marginTop: 12 }}>
                    Report Note
                    <textarea
                        rows={5}
                        style={{ ...input, resize: "vertical" }}
                        placeholder="Describe the issue / request for Admin"
                        value={reportNote}
                        onChange={(e) => setReportNote(e.target.value)}
                    />
                </label>

                <div style={{ marginTop: 14 }}>
                    <button
                        type="submit"
                        disabled={!canSubmit || creating}
                        style={{
                            ...btnPrimary,
                            opacity: !canSubmit || creating ? 0.6 : 1,
                            width: "100%",
                        }}
                    >
                        {creating ? "Sending…" : "Send Report to Admin"}
                    </button>
                </div>

                {error && (
                    <div
                        style={{
                            color: "#b91c1c",
                            marginTop: 10,
                            fontWeight: 600,
                        }}
                    >
                        ❌ {error}
                    </div>
                )}
            </form>

            {/* SUBMITTED REPORTS */}
            <div style={{ ...cardSoft, marginTop: 18 }}>
                <div
                    style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        gap: 8,
                    }}
                >
                    <h3
                        style={{
                            margin: 0,
                            fontSize: 15,
                            fontWeight: 800,
                            color: "#111827",
                        }}
                    >
                        Submitted Reports
                    </h3>
                    <button
                        onClick={loadReportTypes}
                        style={btnGhost}
                        disabled={loadingTypes}
                    >
                        {loadingTypes ? "Loading…" : "Reload Types"}
                    </button>
                </div>

                <div style={{ overflowX: "auto", marginTop: 10 }}>
                    <table style={table}>
                        <thead>
                            <tr>
                                <th style={th}>Report ID</th>
                                <th style={th}>Type</th>
                                <th style={th}>Driver ID</th>
                                <th style={th}>Note</th>
                                <th style={th}>Created At</th>
                                <th style={th}>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {items.length === 0 ? (
                                <tr>
                                    <td
                                        colSpan={6}
                                        style={{
                                            padding: 18,
                                            textAlign: "center",
                                            color: "#9ca3af",
                                            fontSize: 13,
                                        }}
                                    >
                                        No report submitted yet.
                                    </td>
                                </tr>
                            ) : (
                                items.map((r, i) => (
                                    <tr
                                        key={r.id}
                                        style={{
                                            backgroundColor:
                                                i % 2 === 0
                                                    ? "#ffffff"
                                                    : "#f9fafb",
                                        }}
                                    >
                                        <td style={tdStrong}>{r.id}</td>
                                        <td style={td}>
                                            {r.reportType || "-"}
                                        </td>
                                        <td style={td}>
                                            {r.driverId || "—"}
                                        </td>
                                        <td
                                            style={{
                                                ...td,
                                                maxWidth: 260,
                                                whiteSpace: "nowrap",
                                                overflow: "hidden",
                                                textOverflow: "ellipsis",
                                            }}
                                            title={r.reportNote}
                                        >
                                            {r.reportNote || "-"}
                                        </td>
                                        <td style={td}>
                                            {r.createdAt
                                                ? new Date(
                                                    r.createdAt
                                                ).toLocaleString()
                                                : "-"}
                                        </td>
                                        <td style={td}>
                                            <span
                                                style={statusBadge(
                                                    r.status || "Processing"
                                                )}
                                            >
                                                {r.status || "Processing"}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </section>
    );
}

/* ==== styles ==== */

const card = {
    background: "#ffffff",
    border: "1px solid #e5e7eb",
    borderRadius: 16,
    padding: 16,
    boxShadow: "0 6px 18px rgba(15,23,42,0.04)",
};

const cardSoft = {
    background: "#f9fafb",
    border: "1px solid #e5e7eb",
    borderRadius: 16,
    padding: 16,
    boxShadow: "0 4px 14px rgba(15,23,42,0.03)",
};

const grid2 = {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 12,
};

const label = {
    display: "grid",
    gap: 6,
    fontSize: 13,
    fontWeight: 600,
    color: "#111827",
};

const input = {
    padding: "10px 12px",
    border: "1px solid #e5e7eb",
    borderRadius: 10,
    outline: "none",
    fontSize: 13,
    backgroundColor: "#f9fafb",
};

const btn = {
    background: "#f3f4f6",
    border: "1px solid #e5e7eb",
    padding: "8px 12px",
    borderRadius: 8,
    cursor: "pointer",
    fontSize: 13,
};

const btnPrimary = {
    ...btn,
    background: "#111827",
    color: "#ffffff",
    borderColor: "#111827",
    fontWeight: 600,
};

const btnGhost = {
    ...btn,
    background: "#ffffff",
    borderColor: "#e5e7eb",
    fontSize: 12,
};

const table = {
    width: "100%",
    borderCollapse: "separate",
    borderSpacing: 0,
    fontSize: 13,
    marginTop: 4,
};

const th = {
    textAlign: "left",
    padding: "10px 12px",
    fontWeight: 700,
    color: "#111827",
    backgroundColor: "#eef2ff",
    borderBottom: "1px solid #e5e7eb",
    whiteSpace: "nowrap",
};

const td = {
    padding: "9px 12px",
    color: "#111827",
    borderBottom: "1px solid #f3f4f6",
    fontWeight: 400,
};

const tdStrong = {
    ...td,
    fontWeight: 600,
    color: "#111827",
};

function statusBadge(status) {
    const s = String(status || "").toLowerCase();
    let bg = "#e5e7eb";
    let color = "#111827";

    if (s === "processing" || s === "pending") {
        bg = "#eff6ff";
        color = "#1d4ed8";
    } else if (s === "resolved" || s === "done") {
        bg = "#ecfdf5";
        color = "#15803d";
    } else if (s === "rejected") {
        bg = "#fef2f2";
        color = "#b91c1c";
    }

    return {
        display: "inline-flex",
        alignItems: "center",
        padding: "3px 9px",
        borderRadius: 999,
        fontSize: 11,
        fontWeight: 600,
        backgroundColor: bg,
        color,
    };
}
