import React, { useEffect, useState } from "react";
import api from "@/api/api";
import { useSearchParams, useNavigate } from "react-router-dom";

export default function Transaction() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [payingId, setPayingId] = useState("");
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // XỬ LÝ CALLBACK TỪ VNPAY
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

      alert(`Thanh toán thành công! Mã VNPAY: ${transNo}`);
      navigate("/user/transaction", { replace: true });

      setTimeout(() => window.location.reload(), 2000);
    } else if (success === "false") {
      alert("Thanh toán thất bại. Vui lòng thử lại.");
      navigate("/user/transaction", { replace: true });
    }
  }, [searchParams, navigate]);

  // Load danh sách
  useEffect(() => {
    const loadTransactions = async () => {
      try {
        const token = localStorage.getItem("token");
        const userId = localStorage.getItem("userId");

        const res = await api.get(
          `/Transaction/user-transaction-history-list/${userId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        const transactionData =
          (res.data && Array.isArray(res.data.data) && res.data.data) ||
          (res.data && Array.isArray(res.data) && res.data) ||
          [];

        setTransactions(transactionData);
      } catch (err) {
        console.error("Failed to load transactions:", err);
        alert("Failed to load transaction history.");
      } finally {
        setLoading(false);
      }
    };
    loadTransactions();
  }, []);

  const startPayment = async (transactionId) => {
    if (!transactionId) return;
    setPayingId(transactionId);
    try {
      const token = localStorage.getItem("token");
      const res = await api.post("/Payment/create-payment", null, {
        params: { transactionId },
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      const url = res?.data?.paymentUrl || res?.data?.data?.paymentUrl || "";
      if (!url) throw new Error("No payment URL");
      window.location.href = url;
    } catch (err) {
      alert(
        `Tạo phiên thanh toán thất bại: ${
          err?.response?.data?.message || err.message
        }`
      );
    } finally {
      setPayingId("");
    }
  };

  if (loading)
    return (
      <div className="flex flex-col items-center mt-20 text-gray-600">
        <div className="animate-spin h-10 w-10 border-4 border-blue-500 border-t-transparent rounded-full mb-3"></div>
        <p>Loading your transactions...</p>
      </div>
    );

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-6">
      <div className="max-w-5xl mx-auto bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
        <div className="flex items-center mb-6">
          <span className="text-2xl mr-2">📘</span>
          <h2 className="text-2xl font-bold text-gray-800">Transactions</h2>
        </div>

        {/* 🧾 Transaction Table */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-center">
            <thead>
              <tr className="bg-blue-600 text-white text-sm">
                <th className="py-3 px-2 rounded-tl-lg">Transaction ID</th>
                <th className="py-3 px-2">Transaction Note</th>
                <th className="py-3 px-2">Amount (₫)</th>
                <th className="py-3 px-2">Status</th>
                <th className="py-3 px-2">Date</th>
                <th className="py-3 px-2 rounded-tr-lg">Action</th>
              </tr>
            </thead>

            <tbody>
              {transactions.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-6 text-gray-500">
                    No transactions found.
                  </td>
                </tr>
              ) : (
                transactions.map((t) => {
                  const status = String(t.paymentStatus || "Pending");
                  const isPending = /pending|waiting/i.test(status);
                  const formattedDate = t.paymentDate
                    ? new Date(t.paymentDate).toLocaleDateString("en-CA")
                    : "—";
                  const btnLoading = payingId === t.transactionId;

                  return (
                    <tr
                      key={
                        t.transactionId ||
                        `${t.planId}-${t.createdAt || Math.random()}`
                      }
                      className="border-b hover:bg-gray-50 transition duration-150"
                    >
                      <td className="py-3 px-2 font-semibold text-gray-700">
                        {t.transactionId || "—"}
                      </td>
                      <td className="py-3 px-2 text-gray-700">
                        {t.transactionNote || t.transactionType || "—"}
                      </td>
                      <td className="py-3 px-2 font-semibold text-blue-700">
                        {Number(t.amount || 0).toLocaleString()}₫
                      </td>
                      <td className="py-3 px-2">
                        <span
                          className={`px-3 py-1 rounded-full text-sm font-semibold ${
                            /success|approved/i.test(status)
                              ? "bg-green-100 text-green-700"
                              : /fail|denied|cancel/i.test(status)
                              ? "bg-red-100 text-red-700"
                              : "bg-yellow-100 text-yellow-700"
                          }`}
                        >
                          {status}
                        </span>
                      </td>
                      <td className="py-3 px-2 text-gray-600">
                        {formattedDate}
                      </td>
                      <td className="py-3 px-2">
                        {isPending && Number(t.amount || 0) > 0 ? (
                          <button
                            onClick={() => startPayment(t.transactionId)}
                            disabled={btnLoading}
                            className="bg-blue-600 text-white text-sm px-4 py-1.5 rounded hover:bg-blue-700 transition disabled:opacity-60 disabled:cursor-not-allowed"
                          >
                            {btnLoading ? "Processing…" : "💳 Pay Now"}
                          </button>
                        ) : (
                          <span className="text-gray-400 text-sm italic">
                            —
                          </span>
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
