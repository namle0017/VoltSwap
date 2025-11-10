// src/pages/staff/CustomerSupport.jsx
import React, { useEffect, useMemo, useState } from "react";
import api from "@/api/api";

// BE: /api/Report/customer-reports?userId=ST-20000001
const LIST_ENDPOINT = "/Report/customer-reports";

// TODO: Endpoint reject 1 report (BE đưa sau)
const REJECT_ENDPOINT = ""; // ví dụ: "/Report/reject-customer-report"

// Chỉ hiện reportType trong list này
const ALLOWED_TYPES = [0, 1, 2, 3, 8];

/* ========== Helpers ========== */

// "2025-11-24T00:00:00" -> "12:00AM"
function formatTime(iso) {
    if (!iso) return "-";
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "-";
    let h = d.getHours();
    const m = d.getMinutes();
    const ampm = h >= 12 ? "PM" : "AM";
    h = h % 12;
    if (h === 0) h = 12;
    const mm = String(m).padStart(2, "0");
    return `${h}:${mm}${ampm}`;
}

// Chuẩn hoá đúng với JSON BE gửi
function normalizeReports(list) {
    return (list || []).map((item, idx) => {
        const reportType =
            typeof item.reportType === "number"
                ? item.reportType
                : Number(item.reportType ?? NaN);

        return {
            key:
                item.reportId ||
                `${item.staffId || "ST"}-${idx}`,
            staffId: item.staffId || "",
            driverId: item.driverId || "",
            driverName: item.driverName || "",
            note: item.reportNote || "",
            reportTypeName: item.reportTypeName || "",
            reportType,
            status: item.reportStatus || "",
            createdAt: item.createAt || "",
            _raw: item,
        };
    });
}

// Map status -> css
function getStatusClass(status) {
    const s = (status || "").toLowerCase();
    if (s === "processing") return "processing";
    if (s === "done" || s === "resolved") return "ok";
    if (s === "pending") return "pending";
    if (s === "rejected") return "rejected";
    return "default";
}

export default function CustomerSupport() {
    // Staff đang login
    const [userId] = useState(
        localStorage.getItem("StaffId") ||
        localStorage.getItem("userId") ||
        ""
    );

    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(false);
    const [err, setErr] = useState("");
    const [rejectingId, setRejectingId] = useState(null);

    // ===== Load list =====
    useEffect(() => {
        if (!userId) {
            setErr("Missing UserId. Please login again.");
            return;
        }

        let cancelled = false;

        (async () => {
            try {
                setLoading(true);
                setErr("");

                const res = await api.get(LIST_ENDPOINT, {
                    params: { userId },
                });

                const rawList = Array.isArray(res?.data?.data)
                    ? res.data.data
                    : [];

                if (!cancelled) {
                    // Chuẩn hoá + lọc theo reportType
                    const normalized = normalizeReports(
                        rawList
                    ).filter((r) =>
                        ALLOWED_TYPES.includes(
                            Number(r.reportType)
                        )
                    );
                    setReports(normalized);
                }
            } catch (error) {
                console.error(
                    "Load customer reports error",
                    error
                );
                if (!cancelled) {
                    setErr(
                        error?.response?.data?.message ||
                        "Cannot load customer reports. Please try again."
                    );
                }
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [userId]);

    const total = reports.length;
    const processingCount = useMemo(
        () =>
            reports.filter(
                (r) =>
                    (r.status || "")
                        .toLowerCase() === "processing"
            ).length,
        [reports]
    );

    // ===== Reject 1 report (Processing) =====
    const handleReject = async (report) => {
        if (!report) return;

        const ok = window.confirm(
            "Are you sure you want to reject this report?"
        );
        if (!ok) return;

        try {
            setRejectingId(report.key);

            if (REJECT_ENDPOINT) {
                await api.post(REJECT_ENDPOINT, {
                    // chỉnh đúng field theo BE khi có
                    reportId:
                        report._raw?.reportId ||
                        report.key,
                });
            }

            // Remove khỏi UI
            setReports((prev) =>
                prev.filter(
                    (x) => x.key !== report.key
                )
            );
        } catch (error) {
            console.error(
                "Reject report error",
                error
            );
            alert(
                error?.response?.data?.message ||
                "Failed to reject this report."
            );
        } finally {
            setRejectingId(null);
        }
    };

    return (
        <section className="cs-wrap">
            {/* Header */}
            <div className="cs-header">
                <div>
                    <h2 className="cs-title">
                        Customer Support
                    </h2>
                </div>
                <div className="cs-meta">
                    <div>
                        User ID:{" "}
                        <span className="strong">
                            {userId || "-"}
                        </span>
                    </div>
                    <div>
                        Processing:{" "}
                        <span className="strong">
                            {processingCount}
                        </span>
                    </div>
                    <div>
                        Total:{" "}
                        <span className="strong">
                            {total}
                        </span>
                    </div>
                </div>
            </div>

            {/* Error */}
            {err && (
                <div className="cs-alert">
                    <i className="bi bi-exclamation-triangle-fill" />
                    <span>{err}</span>
                </div>
            )}

            {/* Table */}
            <div className="cs-card">
                <table className="cs-table">
                    <thead>
                        <tr>
                            <th>Driver ID</th>
                            <th>Customer</th>
                            <th>ID Pin</th>
                            <th>Description</th>
                            <th>Time</th>
                            <th className="right">
                                Status
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading && (
                            <tr>
                                <td
                                    colSpan={6}
                                    className="empty"
                                >
                                    Loading reports...
                                </td>
                            </tr>
                        )}

                        {!loading &&
                            !err &&
                            reports.length === 0 && (
                                <tr>
                                    <td
                                        colSpan={6}
                                        className="empty"
                                    >
                                        No reports found.
                                    </td>
                                </tr>
                            )}

                        {!loading &&
                            !err &&
                            reports.map((r) => {
                                const desc =
                                    r.note ||
                                    r.reportTypeName ||
                                    "-";
                                const time =
                                    formatTime(
                                        r.createdAt
                                    );
                                const pillClass =
                                    getStatusClass(
                                        r.status
                                    );

                                return (
                                    <tr key={r.key}>
                                        <td>
                                            {r.driverId ||
                                                "-"}
                                        </td>
                                        <td>
                                            {r.driverName ||
                                                "-"}
                                        </td>
                                        <td>
                                            {/* BE chưa có -> để "-" */}
                                            -
                                        </td>
                                        <td className="desc">
                                            {desc}
                                        </td>
                                        <td>
                                            {time}
                                        </td>
                                        <td className="right">
                                            <span
                                                className={`pill ${pillClass}`}
                                            >
                                                {r.status ||
                                                    "-"}
                                            </span>

                                            {(r.status ||
                                                "")
                                                .toLowerCase() ===
                                                "processing" && (
                                                    <button
                                                        type="button"
                                                        className="reject-btn"
                                                        onClick={() =>
                                                            handleReject(
                                                                r
                                                            )
                                                        }
                                                        disabled={
                                                            rejectingId ===
                                                            r.key
                                                        }
                                                    >
                                                        {rejectingId ===
                                                            r.key
                                                            ? "Rejecting..."
                                                            : "Reject"}
                                                    </button>
                                                )}
                                        </td>
                                    </tr>
                                );
                            })}
                    </tbody>
                </table>
            </div>

            {/* Styles */}
            <style>{`
                .cs-wrap {
                    --line: #e5e7eb;
                    --muted: #6b7280;
                    --bg: #ffffff;
                    color: #111827;
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                }
                .cs-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-end;
                    gap: 16px;
                }
                .cs-title {
                    margin: 0;
                    font-size: 22px;
                    font-weight: 600;
                }
                .cs-meta {
                    display: flex;
                    flex-direction: column;
                    font-size: 12px;
                    color: var(--muted);
                    text-align: right;
                    gap: 2px;
                }
                .strong {
                    font-weight: 600;
                    color: #111827;
                }
                .cs-alert {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    padding: 8px 10px;
                    border-radius: 10px;
                    border: 1px solid #fecaca;
                    background: #fef2f2;
                    font-size: 13px;
                    color: #991b1b;
                }
                .cs-card {
                    padding: 16px 20px;
                    border-radius: 18px;
                    background: var(--bg);
                    border: 1px solid var(--line);
                    box-shadow: 0 8px 30px rgba(15,23,42,0.05);
                }
                .cs-table {
                    width: 100%;
                    border-collapse: collapse;
                    font-size: 13px;
                }
                .cs-table th,
                .cs-table td {
                    padding: 9px 8px;
                    border-bottom: 1px solid #f3f4f6;
                }
                .cs-table thead th {
                    font-size: 12px;
                    font-weight: 500;
                    color: var(--muted);
                    border-bottom: 1px solid var(--line);
                }
                .cs-table .right {
                    text-align: right;
                }
                .cs-table .desc {
                    max-width: 260px;
                    white-space: nowrap;
                    text-overflow: ellipsis;
                    overflow: hidden;
                }
                .empty {
                    text-align: center;
                    padding: 14px 6px;
                    color: var(--muted);
                }
                .pill {
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    padding: 4px 10px;
                    border-radius: 999px;
                    font-size: 10px;
                    border: 1px solid transparent;
                    background: #f3f4f6;
                    color: #4b5563;
                }
                .pill.processing {
                    background: #eff6ff;
                    color: #1d4ed8;
                    border-color: #bfdbfe;
                }
                .pill.ok {
                    background: #ecfdf5;
                    color: #16a34a;
                    border-color: #bbf7d0;
                }
                .pill.pending {
                    background: #fffbeb;
                    color: #d97706;
                    border-color: #fed7aa;
                }
                .pill.rejected {
                    background: #fef2f2;
                    color: #b91c1c;
                    border-color: #fecaca;
                }
                .reject-btn {
                    margin-left: 8px;
                    padding: 4px 10px;
                    font-size: 10px;
                    border-radius: 999px;
                    border: 1px solid #fecaca;
                    background: #fef2f2;
                    color: #b91c1c;
                    cursor: pointer;
                    transition: all .16s ease;
                }
                .reject-btn:hover:not(:disabled) {
                    background: #fee2e2;
                    box-shadow: 0 2px 6px rgba(0,0,0,0.08);
                }
                .reject-btn:disabled {
                    opacity: .6;
                    cursor: default;
                    box-shadow: none;
                }
            `}</style>
        </section>
    );
}
