/* eslint-disable no-unused-vars */
import React, { useEffect, useState } from "react";
import api from "@/api/api";

export default function PaymentInfo() {
    const [payments, setPayments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [creatingAll, setCreatingAll] = useState(false);

    // Detail state
    const [showDetail, setShowDetail] = useState(false);
    const [detailLoading, setDetailLoading] = useState(false);
    const [detailError, setDetailError] = useState("");
    const [detail, setDetail] = useState(null);
    const [selectedTxId, setSelectedTxId] = useState("");

    const formatVND = (value) =>
        Number(value || 0).toLocaleString("vi-VN", {
            style: "currency",
            currency: "VND",
        });

    const fmtDate = (d) => (d ? new Date(d).toLocaleString("vi-VN") : "—");

    const statusPill = (status) => {
        const s = String(status || "").toLowerCase();
        if (s === "approved" || s === "success") return "bg-green-100 text-green-700";
        if (s === "waiting" || s === "pending") return "bg-yellow-100 text-yellow-700";
        if (s === "denied" || s === "failed" || s === "fail")
            return "bg-red-100 text-red-700";
        return "bg-gray-100 text-gray-700";
    };

    const loadTransactions = async () => {
        try {
            setRefreshing(true);
            const token = localStorage.getItem("token");

            const res = await api.get("/Transaction/admin-transaction-list", {
                headers: { Authorization: `Bearer ${token}` },
            });

            const data =
                res?.data?.data && Array.isArray(res.data.data) ? res.data.data : [];

            setPayments(data);
        } catch (err) {
            console.error("❌ admin-transaction-list error:", err?.response?.data || err);
            alert("⚠ Không thể tải danh sách giao dịch!");
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        loadTransactions();
    }, []);

    // ===== DETAIL: fetch one transaction =====
    const openDetail = async (transactionId) => {
        if (!transactionId) return;
        setSelectedTxId(transactionId);
        setShowDetail(true);
        setDetailLoading(true);
        setDetailError("");
        setDetail(null);
        try {
            const token = localStorage.getItem("token");
            const res = await api.get("/Transaction/admin-transaction-detail", {
                params: { transactionId },
                headers: { Authorization: `Bearer ${token}` },
            });
            const payload = res?.data?.data ?? res?.data ?? null;

            // Chuẩn hoá nhẹ (phòng khi BE thay key nhỏ)
            const normalized = payload
                ? {
                    transactionId:
                        payload.transactionId || payload.id || transactionId,
                    status: payload.status || payload.paymentStatus || "—",
                    transactionType: payload.transactionType || payload.type || "—",
                    subscriptionId: payload.subscriptionId || "—",
                    driverName: payload.driverName || payload.customerName || "—",
                    driverId: payload.driverId || payload.userId || "—",
                    planName: payload.planName || payload.plan || "—",
                    numberOfBooking:
                        typeof payload.numberOfBooking === "number"
                            ? payload.numberOfBooking
                            : payload.bookingCount ?? 0,
                    totalFee:
                        typeof payload.totalFee === "number"
                            ? payload.totalFee
                            : Number(payload.fee || 0),
                    totalAmount:
                        typeof payload.totalAmount === "number"
                            ? payload.totalAmount
                            : Number(payload.amount || 0),
                }
                : null;

            setDetail(normalized);
        } catch (err) {
            console.error("❌ admin-transaction-detail error:", err?.response?.data || err);
            setDetailError(
                err?.response?.data?.message ||
                err?.message ||
                "Không thể tải chi tiết giao dịch."
            );
        } finally {
            setDetailLoading(false);
        }
    };

    // Bulk create invoices (giữ nguyên)
    const handleCreateAllInvoices = async () => {
        const eligible = payments.filter(
            (p) => String(p.paymentStatus || "").toLowerCase() === "waiting"
        );

        if (eligible.length === 0) {
            alert("Không có giao dịch ở trạng thái phù hợp để tạo hóa đơn.");
            return;
        }

        if (
            !window.confirm(
                `Tạo hóa đơn cho ${eligible.length} giao dịch ở trạng thái Waiting?`
            )
        )
            return;

        const token = localStorage.getItem("token");
        setCreatingAll(true);

        const results = [];
        try {
            for (const p of eligible) {
                try {
                    await api.post(
                        "/Transaction/admin-create-transaction",
                        { requestTransactionId: p.transactionId },
                        { headers: { Authorization: `Bearer ${token}` } }
                    );
                    results.push({ id: p.transactionId, ok: true });
                } catch (e) {
                    console.error(
                        "create-invoice failed:",
                        p.transactionId,
                        e?.response?.data || e
                    );
                    results.push({
                        id: p.transactionId,
                        ok: false,
                        msg:
                            e?.response?.data?.message ||
                            e?.response?.data?.title ||
                            e?.message ||
                            "failed",
                    });
                }
            }
        } finally {
            setCreatingAll(false);
        }

        const okCount = results.filter((r) => r.ok).length;
        const fail = results.filter((r) => !r.ok);

        let summary = `✅ Tạo hóa đơn xong.\nThành công: ${okCount}/${eligible.length}`;
        if (fail.length) {
            summary += `\n❌ Thất bại: ${fail.length}`;
            summary += `\nIDs lỗi: ${fail.map((f) => f.id).join(", ")}`;
        }
        alert(summary);

        loadTransactions();
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center mt-20 text-gray-600">
                <div className="animate-spin h-10 w-10 border-4 border-blue-500 border-t-transparent rounded-full mb-3"></div>
                <p>Đang tải danh sách giao dịch...</p>
            </div>
        );
    }

    return (
        <div className="p-8 bg-gray-50 min-h-screen">
            <div className="mb-8 flex flex-wrap gap-3 items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">
                        🧾 Admin Transaction Management
                    </h1>
                    <p className="text-gray-600">
                        Xuất hóa đơn hàng loạt và xem chi tiết giao dịch
                    </p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={loadTransactions}
                        disabled={refreshing || creatingAll}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-60"
                    >
                        {refreshing ? "Đang tải..." : (
                            <>
                                <i className="bi bi-arrow-repeat me-1" aria-hidden="true"></i>
                                Refresh
                            </>
                        )}
                    </button>
                    <button
                        onClick={handleCreateAllInvoices}
                        disabled={creatingAll || refreshing}
                        className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition disabled:opacity-60"
                        title="Tạo hóa đơn cho tất cả giao dịch đủ điều kiện"
                    >
                        {creatingAll ? "Đang tạo..." : (
                            <>
                                <i className="bi bi-receipt me-1" aria-hidden="true"></i>
                                Create
                            </>
                        )}
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                    Danh sách giao dịch
                </h2>

                <div className="overflow-x-auto">
                    <table className="min-w-full border-collapse text-center">
                        <thead className="bg-gray-100 border-b">
                            <tr>
                                <th className="px-4 py-3 text-sm font-semibold text-gray-700">
                                    Transaction ID
                                </th>
                                <th className="px-4 py-3 text-sm font-semibold text-gray-700">
                                    Amount
                                </th>
                                <th className="px-4 py-3 text-sm font-semibold text-gray-700">
                                    Context
                                </th>
                                <th className="px-4 py-3 text-sm font-semibold text-gray-700">
                                    Note
                                </th>
                                <th className="px-4 py-3 text-sm font-semibold text-gray-700">
                                    Status
                                </th>
                                <th className="px-4 py-3 text-sm font-semibold text-gray-700">
                                    Date
                                </th>
                                <th className="px-4 py-3 text-sm font-semibold text-gray-700">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {payments.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className="py-6 text-gray-500 italic">
                                        Không có giao dịch nào.
                                    </td>
                                </tr>
                            ) : (
                                payments.map((p) => {
                                    const status = String(p.paymentStatus || "").toLowerCase();
                                    const formattedDate = p.paymentDate
                                        ? new Date(p.paymentDate).toLocaleDateString("vi-VN")
                                        : "—";

                                    return (
                                        <tr
                                            key={p.transactionId}
                                            className="border-b hover:bg-gray-50 transition duration-150"
                                        >
                                            <td className="px-4 py-3 font-medium text-gray-800">
                                                {p.transactionId}
                                            </td>
                                            <td className="px-4 py-3 text-blue-700 font-semibold">
                                                {formatVND(p.amount)}
                                            </td>
                                            <td className="px-4 py-3 text-gray-700 text-sm">
                                                {p.transactionContext}
                                            </td>
                                            <td className="px-4 py-3 text-gray-700 text-sm">
                                                {p.transactionNote}
                                            </td>
                                            <td className="px-4 py-3">
                                                <span
                                                    className={`px-3 py-1 text-sm font-medium rounded-full ${statusPill(
                                                        p.paymentStatus
                                                    )}`}
                                                >
                                                    {p.paymentStatus}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-gray-600">{formattedDate}</td>
                                            <td className="px-4 py-3">
                                                <button
                                                    onClick={() => openDetail(p.transactionId)}
                                                    className="px-3 py-1.5 text-sm rounded-lg border hover:bg-gray-50"
                                                    title="Xem chi tiết"
                                                >
                                                    <i className="bi bi-eye me-1" /> View
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="mt-3 text-xs text-gray-500">
                    Gợi ý: Nút <b>Create</b> ở góc trên sẽ xuất hóa đơn <b>hàng loạt</b> cho
                    các giao dịch đang <b>Waiting</b>. Muốn tiêu chí khác — chỉnh biến{" "}
                    <code>eligible</code> trong <code>handleCreateAllInvoices</code>.
                </div>
            </div>

            {/* ============ DETAIL MODAL ============ */}
            {showDetail && (
                <div
                    className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
                    onClick={() => !detailLoading && setShowDetail(false)}
                >
                    <div
                        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="p-5 border-b flex items-center justify-between">
                            <h3 className="text-xl font-semibold">
                                Transaction Detail
                                {selectedTxId ? (
                                    <span className="text-gray-500 font-normal text-sm">
                                        {" "}
                                        • {selectedTxId}
                                    </span>
                                ) : null}
                            </h3>
                            <button
                                className="p-2 rounded-lg hover:bg-gray-100"
                                onClick={() => !detailLoading && setShowDetail(false)}
                            >
                                <i className="bi bi-x-lg" />
                            </button>
                        </div>

                        {detailLoading ? (
                            <div className="p-8 flex items-center justify-center text-gray-600">
                                <div className="h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mr-3" />
                                Đang tải chi tiết...
                            </div>
                        ) : detailError ? (
                            <div className="p-6 text-red-600">{detailError}</div>
                        ) : detail ? (
                            <div className="p-6 space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <KV label="Transaction ID" value={detail.transactionId} />
                                    <KV
                                        label="Status"
                                        value={
                                            <span
                                                className={`px-2.5 py-0.5 rounded-full text-sm font-medium ${statusPill(
                                                    detail.status
                                                )}`}
                                            >
                                                {detail.status}
                                            </span>
                                        }
                                    />
                                    <KV label="Type" value={detail.transactionType} />
                                    <KV label="Subscription ID" value={detail.subscriptionId} />
                                    <KV label="Driver Name" value={detail.driverName} />
                                    <KV label="Driver ID" value={detail.driverId} />
                                    <KV label="Plan" value={detail.planName} />
                                    <KV label="Bookings" value={detail.numberOfBooking} />
                                    <KV label="Total Fee" value={formatVND(detail.totalFee)} />
                                    <KV label="Total Amount" value={formatVND(detail.totalAmount)} />
                                </div>

                                <div className="pt-2 flex justify-end gap-2">
                                    <button
                                        className="px-4 py-2 rounded-lg border hover:bg-gray-50"
                                        onClick={() => setShowDetail(false)}
                                    >
                                        Close
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="p-6 text-gray-500">Không có dữ liệu chi tiết.</div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

function KV({ label, value }) {
    return (
        <div className="p-3 bg-gray-50 rounded-lg">
            <div className="text-sm text-gray-500">{label}</div>
            <div className="font-semibold text-gray-900">
                {value ?? <span className="text-gray-400">—</span>}
            </div>
        </div>
    );
}
