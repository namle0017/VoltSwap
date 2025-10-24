// src/pages/user/Transaction.jsx
import React, { useEffect, useState } from "react";
import api from "@/api/api";
import { useNavigate } from "react-router-dom";

export default function Transaction() {
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const loadTransactions = async () => {
            try {
                const token = localStorage.getItem("token");
                const userId = localStorage.getItem("userId");

                console.log("📡 Requesting transactions for user:", userId);

                const res = await api.get(
                    `/Transaction/user-transaction-history-list/${userId}`,
                    { headers: { Authorization: `Bearer ${token}` } }
                );

                console.log("🔍 API Response:", res.data);

                // Parse linh động
                const transactionData =
                    (res.data && Array.isArray(res.data.data) && res.data.data) ||
                    (res.data && Array.isArray(res.data) && res.data) ||
                    [];

                setTransactions(transactionData);
            } catch (err) {
                console.error("❌ Failed to load transactions:", err);
                alert("Failed to load transaction history.");
            } finally {
                setLoading(false);
            }
        };
        loadTransactions();
    }, []);

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
                                    const formattedDate = t.paymentDate
                                        ? new Date(t.paymentDate).toLocaleDateString("en-CA")
                                        : "—";

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
                                                    className={`px-3 py-1 rounded-full text-sm font-semibold ${t.paymentStatus === "success"
                                                            ? "bg-green-100 text-green-700"
                                                            : t.paymentStatus === "fail"
                                                                ? "bg-red-100 text-red-700"
                                                                : "bg-yellow-100 text-yellow-700"
                                                        }`}
                                                >
                                                    {t.paymentStatus || "Pending"}
                                                </span>
                                            </td>
                                            <td className="py-3 px-2 text-gray-600">
                                                {formattedDate}
                                            </td>
                                            <td className="py-3 px-2">
                                                {t.paymentStatus === "Pending" && t.amount > 0 ? (
                                                    <button
                                                        onClick={() =>
                                                            navigate(`/user/paynow/${t.transactionId}`)
                                                        }
                                                        className="bg-blue-600 text-white text-sm px-4 py-1.5 rounded hover:bg-blue-700 transition"
                                                    >
                                                        💳 Pay Now
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