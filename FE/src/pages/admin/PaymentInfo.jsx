/* eslint-disable no-unused-vars */
import React, { useEffect, useState } from "react";
import api from "@/api/api";

export default function PaymentInfo() {
    const [payments, setPayments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const formatVND = (value) =>
        Number(value || 0).toLocaleString("vi-VN", {
            style: "currency",
            currency: "VND",
        });

    // Load danh sách chờ duyệt
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

    // Admin approve/deny theo API mới
    const handleAdminApprove = async (transactionId, next) => {
        const label = next === "Approved" ? "duyệt (Approved)" : "từ chối (Denied)";
        if (!window.confirm(`Xác nhận ${label} giao dịch ${transactionId}?`)) return;

        try {
            const token = localStorage.getItem("token");
            await api.post(
                "/Transaction/admin-approve-transaction",
                {
                    requestTransactionId: transactionId,
                    newStatus: next, // "Approved" | "Denied"
                },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            alert(`✅ Đã ${label} thành công!`);

            // Cập nhật UI local
            setPayments((prev) =>
                prev.map((p) =>
                    p.transactionId === transactionId
                        ? { ...p, paymentStatus: next }
                        : p
                )
            );
        } catch (err) {
            console.error("❌ admin-approve-transaction error:", err?.response?.data || err);
            alert("❌ Cập nhật trạng thái thất bại!");
        }
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
            <div className="mb-8 flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">🧾 Admin Transaction Management</h1>
                    <p className="text-gray-600">Duyệt thanh toán người dùng</p>
                </div>
                <button
                    onClick={loadTransactions}
                    disabled={refreshing}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                    {refreshing ? "Đang tải..." : "🔄 Refresh"}
                </button>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Waiting / Approved / Denied</h2>

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
                                <th className="px-4 py-3 text-sm font-semibold text-gray-700">Action</th>
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
                                    const status = String(p.paymentStatus || "").toLowerCase(); // Waiting/Approved/Denied
                                    const formattedDate = p.paymentDate
                                        ? new Date(p.paymentDate).toLocaleDateString("vi-VN")
                                        : "—";

                                    return (
                                        <tr key={p.transactionId} className="border-b hover:bg-gray-50 transition duration-150">
                                            <td className="px-4 py-3 font-medium text-gray-800">{p.transactionId}</td>
                                            <td className="px-4 py-3 text-blue-700 font-semibold">{formatVND(p.amount)}</td>
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
                                                {status === "waiting" ? (
                                                    <div className="flex justify-center gap-2">
                                                        <button
                                                            onClick={() => handleAdminApprove(p.transactionId, "Approved")}
                                                            className="px-3 py-1 border border-green-600 text-green-600 rounded-lg hover:bg-green-600 hover:text-white transition"
                                                        >
                                                            Approve
                                                        </button>
                                                        <button
                                                            onClick={() => handleAdminApprove(p.transactionId, "Denied")}
                                                            className="px-3 py-1 border border-red-600 text-red-600 rounded-lg hover:bg-red-600 hover:text-white transition"
                                                        >
                                                            Deny
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <span className="text-gray-400 italic">—</span>
                                                )}
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
