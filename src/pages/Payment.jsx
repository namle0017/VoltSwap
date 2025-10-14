import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api/api";

export default function Payment() {
  const { id } = useParams(); // transactionId
  const [transaction, setTransaction] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const navigate = useNavigate();

  // 🔹 Load transaction details (POST list then filter)
  useEffect(() => {
    const loadDetail = async () => {
      try {
        const userId = localStorage.getItem("userId");
        const planId = localStorage.getItem("lastPlanId") || "PLAN-DEFAULT";

        if (!userId) {
          alert("Please log in again!");
          navigate("/login");
          return;
        }

        const payload = {
          PlanId: planId,
          DriverId: userId,
          TransactionType: "History",
        };

        const res = await api.post(
          "/Transaction/transaction-user-list",
          payload
        );
        const list = res.data?.data || [];
        const found = list.find((t) => t.transactionId === id);

        if (!found) {
          alert("❌ Transaction not found");
          return;
        }

        setTransaction(found);
      } catch (err) {
        console.error(
          "❌ Cannot load transaction detail:",
          err.response?.data || err
        );
        alert("❌ Cannot load transaction detail");
      } finally {
        setLoading(false);
      }
    };

    loadDetail();
  }, [id, navigate]);

  // 💰 Handle payment
  const handlePayment = async () => {
    if (!transaction) return;

    if (transaction.paymentStatus === "success") {
      alert("✅ This transaction has already been paid.");
      return navigate("/user/transaction");
    }

    if (!window.confirm("Confirm payment for this transaction?")) return;

    setProcessing(true);
    try {
      const res = await api.put(
        `/Transaction/Pay/${transaction.transactionId}`
      );
      alert("✅ Payment successful!");
      navigate("/user/transaction");
    } catch (err) {
      console.error("❌ Payment failed:", err.response?.data || err);
      alert("❌ Payment failed!");
    } finally {
      setProcessing(false);
    }
  };

  // 🌀 Loading state
  if (loading)
    return (
      <div className="flex flex-col items-center mt-20 text-gray-600">
        <div className="animate-spin h-10 w-10 border-4 border-blue-500 border-t-transparent rounded-full mb-3"></div>
        <p>Loading payment details...</p>
      </div>
    );

  if (!transaction)
    return (
      <div className="text-center mt-20 text-gray-600">
        <p>Transaction not found.</p>
        <button
          onClick={() => navigate("/user/transaction")}
          className="mt-4 px-5 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg font-semibold"
        >
          ⬅ Back to Transactions
        </button>
      </div>
    );

  const formattedDate = transaction.paymentDate
    ? new Date(transaction.paymentDate).toLocaleString()
    : "Not yet paid";

  // 🔹 Mock thông tin ngân hàng (hiện hardcode, có thể fetch sau)
  const bankInfo = {
    bankName: "Vietcombank",
    accountNumber: "1234567890123456",
    accountHolder: "Nguyen Ngoc Dang Nam Kiẹt",
    method: "Bank Transfer",
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    alert("📋 Copied to clipboard!");
  };

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
        <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">
          💳 Payment Information
        </h2>

        {/* 🏦 Bank Transfer Card */}
        <div className="border rounded-xl p-5 mb-6 shadow-sm hover:shadow-md transition">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-lg text-gray-800 flex items-center gap-2">
              Bank Transfer
              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-md">
                Recommended
              </span>
            </h3>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-5">
            <img
              src="https://cdn-icons-png.flaticon.com/512/483/483408.png"
              alt="Bank Transfer"
              className="w-24 h-24 rounded-md object-cover"
            />

            <div className="flex-1 text-gray-700 space-y-2">
              <p>
                <span className="font-semibold text-gray-600">Bank Name: </span>
                {bankInfo.bankName}
              </p>
              <p className="flex items-center gap-2">
                <span className="font-semibold text-gray-600">
                  Account Number (STK):{" "}
                </span>
                {bankInfo.accountNumber}
                <button
                  onClick={() => copyToClipboard(bankInfo.accountNumber)}
                  className="ml-1 text-gray-500 hover:text-blue-600"
                >
                  📋
                </button>
              </p>
              <p>
                <span className="font-semibold text-gray-600">
                  Account Holder:{" "}
                </span>
                {bankInfo.accountHolder}
              </p>
            </div>
          </div>
        </div>

        {/* 🧾 Payment Summary */}
        <div className="border rounded-xl p-5 shadow-sm">
          <h3 className="font-semibold text-lg mb-3 text-gray-800">
            Payment Summary
          </h3>
          <div className="space-y-2 text-gray-700">
            <p className="flex justify-between">
              <span>Transaction ID</span>
              <span className="font-semibold">{transaction.transactionId}</span>
            </p>
            <p className="flex justify-between">
              <span>Amount to Pay</span>
              <span className="font-semibold text-blue-700">
                {transaction.amount?.toLocaleString()} VND
              </span>
            </p>
            <p className="flex justify-between items-center">
              <span>Payment Status</span>
              <span
                className={`text-sm px-3 py-1 rounded-md border ${
                  transaction.paymentStatus === "success"
                    ? "bg-green-100 text-green-700 border-green-300"
                    : transaction.paymentStatus === "fail"
                    ? "bg-red-100 text-red-700 border-red-300"
                    : "bg-yellow-100 text-yellow-700 border-yellow-300"
                }`}
              >
                {transaction.paymentStatus}
              </span>
            </p>
          </div>

          <button
            onClick={handlePayment}
            disabled={processing || transaction.paymentStatus !== "Pending"}
            className={`mt-5 w-full py-3 rounded-lg text-white font-semibold transition ${
              transaction.paymentStatus !== "Pending"
                ? "bg-gray-400 cursor-not-allowed"
                : processing
                ? "bg-gray-500"
                : "bg-blue-600 hover:bg-blue-700"
            }`}
          >
            {processing ? "Processing..." : "Confirm Payment"}
          </button>
        </div>
      </div>
    </div>
  );
}
