import React, { useEffect, useState } from "react";
import api from "@/api/api";
import { useSearchParams, useNavigate } from "react-router-dom";

export default function Transaction() {
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [payingId, setPayingId] = useState("");
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    // 🔁 Handle VNPAY callback
    useEffect(() => {
        const success = searchParams.get("success");
        const txnRef = searchParams.get("txnRef");
        const transNo = searchParams.get("transNo");
        if (success === "true" && txnRef) {
            setTransactions((prev) =>
                prev.map((t) =>
                    t.transactionId === txnRef
                        ? { ...t, paymentStatus: "Success", vnpayTransactionNo: transNo }
                        : t
                )
            );
            alert(`✅ Thanh toán thành công! Mã VNPAY: ${transNo}`);
            navigate("/user/transaction", { replace: true });
            setTimeout(() => window.location.reload(), 2000);
        } else if (success === "false") {
            alert("❌ Thanh toán thất bại. Vui lòng thử lại.");
            navigate("/user/transaction", { replace: true });
        }
    }, [searchParams, navigate]);

    // 🧾 Load danh sách
    useEffect(() => {
        const loadTransactions = async () => {
            try {
                const token = localStorage.getItem("token");
                const userId = localStorage.getItem("userId");
                const res = await api.get(
                    `/Transaction/user-transaction-history-list/${userId}`,
                    { headers: { Authorization: `Bearer ${token}` } }
                );
                const data = res.data?.data || res.data || [];
                setTransactions(Array.isArray(data) ? data : []);
            } catch {
                alert("Failed to load transaction history.");
            } finally {
                setLoading(false);
            }
        };
        loadTransactions();
    }, []);

    // 🪙 Tạo thanh toán
    const startPayment = async (transactionId) => {
        if (!transactionId) return;
        setPayingId(transactionId);
        try {
            const token = localStorage.getItem("token");
            const res = await api.post("/Payment/create-payment", null, {
                params: { transactionId },
                headers: token ? { Authorization: `Bearer ${token}` } : {},
            });
            const url = res?.data?.paymentUrl || res?.data?.data?.paymentUrl;
            if (!url) throw new Error("No payment URL returned");
            window.location.href = url;
        } catch (err) {
            alert(`❌ ${err?.response?.data?.message || err.message}`);
        } finally {
            setPayingId("");
        }
    };

    if (loading)
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
                <div className="h-12 w-12 border-4 border-t-transparent border-blue-500 rounded-full animate-spin"></div>
                <p className="mt-3 text-gray-600">Loading your transactions...</p>
            </div>
        );

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#01E6FF] to-[#78FC92] py-10 px-5">
            <div className="max-w-5xl mx-auto bg-white rounded-3xl shadow-2xl p-8 border border-gray-100 backdrop-blur-sm">
                <div className="flex items-center justify-between mb-8">
                    <h2 className="text-3xl font-bold text-gray-800 flex items-center gap-2">
                        <i className="bi bi-cash-coin text-blue-600 text-2xl"></i>
                        Transaction History
                    </h2>
                    <button
                        onClick={() => navigate("/user/service")}
                        className="px-4 py-2 bg-gray-100 rounded-xl hover:bg-gray-200 transition font-medium"
                    >
                        ← Back to Service
                    </button>
                </div>

                {transactions.length === 0 ? (
                    <div className="text-center py-10 text-gray-600">
                        <i className="bi bi-receipt-cutoff text-5xl text-gray-400"></i>
                        <p className="mt-4 text-lg">No transactions found</p>
                    </div>
                ) : (
                    <div className="grid md:grid-cols-2 gap-6">
                        {transactions.map((t) => {
                            const status = String(t.paymentStatus || "Pending");
                            const isPending = /pending|waiting/i.test(status);
                            const formattedDate = t.paymentDate
                                ? new Date(t.paymentDate).toLocaleDateString("en-GB")
                                : "—";
                            const btnLoading = payingId === t.transactionId;

                            const statusColor = /success|approved/i.test(status)
                                ? "bg-green-100 text-green-700"
                                : /fail|denied|cancel/i.test(status)
                                    ? "bg-red-100 text-red-700"
                                    : "bg-yellow-100 text-yellow-700";

                            return (
                                <div
                                    key={
                                        t.transactionId ||
                                        `${t.planId}-${t.createdAt || Math.random()}`
                                    }
                                    className="rounded-2xl p-5 bg-gradient-to-tr from-white to-gray-50 shadow-lg border hover:shadow-2xl transition"
                                >
                                    <div className="flex justify-between items-center mb-3">
                                        <p className="font-semibold text-gray-800">
                                            {t.transactionNote || t.transactionType || "Transaction"}
                                        </p>
                                        <span
                                            className={`px-3 py-1 rounded-full text-sm font-medium ${statusColor}`}
                                        >
                                            {status}
                                        </span>
                                    </div>

                                    <p className="text-gray-600 mb-2">
                                        <i className="bi bi-hash text-blue-500"></i>{" "}
                                        <strong>ID:</strong> {t.transactionId || "—"}
                                    </p>
                                    <p className="text-gray-600 mb-2">
                                        <i className="bi bi-calendar3 text-blue-500"></i>{" "}
                                        {formattedDate}
                                    </p>
                                    <p className="text-blue-700 text-xl font-bold mb-4">
                                        {Number(t.amount || 0).toLocaleString("vi-VN")} ₫
                                    </p>

                                    <div className="text-right">
                                        {isPending && Number(t.amount || 0) > 0 ? (
                                            <button
                                                onClick={() => startPayment(t.transactionId)}
                                                disabled={btnLoading}
                                                className="bg-blue-600 text-white px-5 py-2 rounded-lg shadow-md hover:bg-blue-700 disabled:opacity-60"
                                            >
                                                {btnLoading ? "Processing…" : "💳 Pay Now"}
                                            </button>
                                        ) : (
                                            <span className="text-gray-400 italic text-sm">
                                                No action
                                            </span>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
