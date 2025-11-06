/* eslint-disable no-unused-vars */
import React, { useEffect, useState } from "react";
import api from "@/api/api";

const LIST_EP = "/Transaction/admin-transaction-list";
const CREATE_EP = "/Transaction/admin-create-transaction";
const DETAIL_EP = "/Transaction/transaction-detail";            // ?requestTransactionId=...
const RECREATE_EP = "/Transaction/recreate-transaction";        // PATCH ?transactionId=...

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

    // Recreate guard
    const [recreatingIds, setRecreatingIds] = useState(() => new Set());

    const formatVND = (value) =>
        Number(value || 0).toLocaleString("vi-VN", { style: "currency", currency: "VND" });

    const statusPill = (status) => {
        const s = String(status || "").toLowerCase();
        if (s === "approved" || s === "success") return "bg-green-100 text-green-700";
        if (s === "waiting" || s === "pending") return "bg-yellow-100 text-yellow-700";
        if (s === "denied" || s === "failed" || s === "fail") return "bg-red-100 text-red-700";
        return "bg-gray-100 text-gray-700";
    };

    const isFailed = (status) => {
        const s = String(status || "").toLowerCase();
        return s === "failed" || s === "fail" || s === "denied";
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
            const res = await api.get(DETAIL_EP, {
                params: { requestTransactionId: transactionId },
                headers: token ? { Authorization: `Bearer ${token}` } : undefined,
            });
            const payload = res?.data?.data ?? null;

            const normalized = payload
                ? {
                    transactionId: payload.transactionId || transactionId,
                    status: payload.status || "—",
                    transactionType: payload.transactionType || "—",
                    subscriptionId: payload.subscriptionId || "—",
                    driverName: payload.driverName || "—",
                    driverId: payload.driverId || "—",
                    planName: payload.planName || "—",
                    numberOfBooking:
                        typeof payload.numberOfBooking === "number" ? payload.numberOfBooking : 0,
                    totalFee:
                        typeof payload.totalFee === "number" ? payload.totalFee : Number(payload.fee || 0),
                    totalAmount:
                        typeof payload.totalAmount === "number"
                            ? payload.totalAmount
                            : Number(payload.amount || 0),
                }
                : null;

            setDetail(normalized);
        } catch (err) {
            console.error("❌ transaction-detail error:", err?.response?.data || err);
            setDetailError(
                err?.response?.data?.message || err?.message || "Không thể tải chi tiết giao dịch."
            );
        } finally {
            setDetailLoading(false);
        }
    };

    // ===== RECREATE: PATCH ?transactionId=... (chỉ cho failed) =====
    const handleRecreate = async (transactionId) => {
        if (!transactionId) return;
        if (recreatingIds.has(transactionId)) return;

        setRecreatingIds((prev) => new Set(prev).add(transactionId));
        try {
            const token = localStorage.getItem("token");
            await api.patch(RECREATE_EP, null, {
                params: { transactionId },
                headers: token ? { Authorization: `Bearer ${token}` } : undefined,
            });
            alert(`✅ Đã recreate transaction ${transactionId}.`);
            await loadTransactions();
        } catch (err) {
            console.error("❌ recreate-transaction error:", err?.response?.data || err);
            const msg =
                err?.response?.data?.message ||
                err?.response?.data?.title ||
                err?.message ||
                "Recreate thất bại.";
            alert("❌ " + msg);
        } finally {
            setRecreatingIds((prev) => {
                const n = new Set(prev);
                n.delete(transactionId);
                return n;
            });
        }
    };

    // Bulk create invoices (Waiting)
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
            // chạy tuần tự để tránh BE bị quá tải (có thể đổi sang Promise.allSettled nếu muốn chạy song song)
            for (const p of eligible) {
                try {
                    await api.post(
                        "/Transaction/admin-create-transaction",
                        { requestTransactionId: p.transactionId },
                        { headers: { Authorization: `Bearer ${token}` } }
                    );
                    results.push({ id: p.transactionId, ok: true });
                } catch (e) {
                    console.error("create-invoice failed:", p.transactionId, e?.response?.data || e);
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

        // refresh để đồng bộ trạng thái
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
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">🧾 Admin Transaction Management</h1>
                    <p className="text-gray-600">Xuất hóa đơn hàng loạt cho giao dịch người dùng</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={loadTransactions}
                        disabled={refreshing || creatingAll}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-60"
                    >
                        {refreshing ? (
                            "Đang tải..."
                        ) : (
                            <>
                                <i className="bi bi-arrow-repeat animate-spin me-1" aria-hidden="true"></i>
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
                        {creatingAll ? ("Đang tạo...") : (
                            <>
                                <i className="bi bi-receipt me-1" aria-hidden="true"></i>
                                Create
                            </>
                        )}
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Danh sách giao dịch</h2>

                <div className="overflow-x-auto">
                    <table className="min-w-full border-collapse text-center">
                        <thead className="bg-gray-100 border-b">
                            <tr>
                                <th className="px-4 py-3 text-sm font-semibold text-gray-700">Transaction ID</th>
                                <th className="px-4 py-3 text-sm font-semibold text-gray-700">Amount</th>
                                <th className="px-4 py-3 text-sm font-semibold text-gray-700">Context</th>
                                <th className="px-4 py-3 text-sm font-semibold text-gray-700">Note</th>
                                <th className="px-4 py-3 text-sm font-semibold text-gray-700">Status</th>
                                <th className="px-4 py-3 text-sm font-semibold text-gray-700">Date</th>
                            </tr>
                        </thead>
                        <tbody>
                            {payments.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="py-6 text-gray-500 italic">
                                        Không có giao dịch nào.
                                    </td>
                                </tr>
                            ) : (
                                payments.map((p) => {
                                    const status = String(p.paymentStatus || "").toLowerCase(); // Waiting/Approved/Denied...
                                    const formattedDate = p.paymentDate
                                        ? new Date(p.paymentDate).toLocaleDateString("vi-VN")
                                        : "—";
                                    const canRecreate = isFailed(p.paymentStatus);
                                    const recreating = recreatingIds.has(p.transactionId);

                                    return (
                                        <tr
                                            key={p.transactionId}
                                            className="border-b hover:bg-gray-50 transition duration-150"
                                        >
                                            <td className="px-4 py-3 font-medium text-gray-800">{p.transactionId}</td>
                                            <td className="px-4 py-3 text-blue-700 font-semibold">
                                                {formatVND(p.amount)}
                                            </td>
                                            <td className="px-4 py-3 text-gray-700 text-sm">{p.transactionContext}</td>
                                            <td className="px-4 py-3 text-gray-700 text-sm">{p.transactionNote}</td>
                                            <td className="px-4 py-3">
                                                <span
                                                    className={`px-3 py-1 text-sm font-medium rounded-full ${status === "approved"
                                                        ? "bg-green-100 text-green-700"
                                                        : status === "waiting"
                                                            ? "bg-yellow-100 text-yellow-700"
                                                            : status === "denied"
                                                                ? "bg-red-100 text-red-700"
                                                                : "bg-gray-100 text-gray-700"
                                                        }`}
                                                >
                                                    {p.paymentStatus}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-gray-600">{formattedDate}</td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center justify-center gap-2">
                                                    <button
                                                        onClick={() => openDetail(p.transactionId)}
                                                        className="px-3 py-1.5 text-sm rounded-lg border hover:bg-gray-50"
                                                        title="Xem chi tiết"
                                                    >
                                                        <i className="bi bi-eye me-1" /> View
                                                    </button>

                                                    {canRecreate && (
                                                        <button
                                                            onClick={() => handleRecreate(p.transactionId)}
                                                            disabled={recreating}
                                                            className="px-3 py-1.5 text-sm rounded-lg border text-red-700 bg-red-50 hover:bg-red-100 disabled:opacity-60"
                                                            title="Recreate transaction (failed)"
                                                        >
                                                            {recreating ? "Recreating…" : (<><i className="bi bi-arrow-clockwise me-1" /> Recreate</>)}
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
