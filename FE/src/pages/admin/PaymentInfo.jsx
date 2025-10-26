/* eslint-disable no-unused-vars */
import React, { useEffect, useState } from "react";
import api from "@/api/api";

export default function PaymentInfo() {
    const [payments, setPayments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [creatingAll, setCreatingAll] = useState(false);

    const formatVND = (value) =>
        Number(value || 0).toLocaleString("vi-VN", {
            style: "currency",
            currency: "VND",
        });

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

    // Tạo hóa đơn cho TẤT CẢ giao dịch đủ điều kiện (ví dụ: trạng thái Waiting)
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
                        {refreshing ? "Đang tải..." : "🔄 Refresh"}
                    </button>
                    <button
                        onClick={handleCreateAllInvoices}
                        disabled={creatingAll || refreshing}
                        className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition disabled:opacity-60"
                        title="Tạo hóa đơn cho tất cả giao dịch đủ điều kiện"
                    >
                        {creatingAll ? "Đang tạo..." : "🧾 Create"}
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
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="mt-3 text-xs text-gray-500">
                    Gợi ý: Nút <b>Create</b> ở góc trên sẽ xuất hóa đơn <b>hàng loạt</b> cho các giao dịch đang <b>Waiting</b>.
                    Nếu muốn tiêu chí khác, sửa biến <code>eligible</code> trong hàm <code>handleCreateAllInvoices</code>.
                </div>
            </div>
        </div>
    );
}
