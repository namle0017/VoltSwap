/* eslint-disable no-unused-vars */
import React, { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "@/api/api";

export default function Payment() {
    const { id } = useParams(); // transactionId
    const [transaction, setTransaction] = useState(null);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);

    // chờ admin duyệt
    const [waitingAdmin, setWaitingAdmin] = useState(false);
    const [polling, setPolling] = useState(false);
    const pollRef = useRef(null);

    // đếm ngược theo amount (BE trả)
    const [countdown, setCountdown] = useState(0);
    const timerRef = useRef(null);

    const navigate = useNavigate();

    const fetchDetail = async () => {
        const res = await api.get(`/Transaction/payment-detail`, {
            params: { transactionId: id },
        });
        // tuỳ BE: data có thể lồng data.data
        const data =
            res?.data?.data?.data ||
            res?.data?.data ||
            res?.data ||
            null;
        return data;
    };

    useEffect(() => {
        const load = async () => {
            try {
                const data = await fetchDetail();
                if (!data) {
                    alert("❌ Transaction not found!");
                    return;
                }
                setTransaction(data);
            } catch (err) {
                console.error("❌ load detail:", err?.response?.data || err);
                alert("⚠ Unable to load transaction details");
            } finally {
                setLoading(false);
            }
        };
        load();
        return () => {
            if (pollRef.current) clearInterval(pollRef.current);
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [id]);

    // Confirm Payment → gọi BE xác nhận (user đã chuyển khoản/xác nhận)
    const handlePayment = async () => {
        if (!transaction) return;

        // Nếu BE trả sẵn đã success/approved thì bỏ
        if (String(transaction.paymentStatus).toLowerCase() === "approved") {
            alert("✅ Payment already approved.");
            return navigate("/user/transaction");
        }

        if (!window.confirm("💰 Xác nhận thanh toán cho giao dịch này?")) return;

        setProcessing(true);
        try {
            // theo yêu cầu: confirm payment gửi transactionId
            await api.post("/Transaction/confirm-payment", {
                transactionId: transaction.transactionId,
            });

            // Bắt đầu chờ admin duyệt
            setWaitingAdmin(true);
            startPollingForApproval();
        } catch (err) {
            console.error("❌ confirm-payment failed:", err?.response?.data || err);
            alert("❌ Payment confirm failed! Please try again.");
        } finally {
            setProcessing(false);
        }
    };

    // Poll liên tục detail cho đến khi status = Approved | Denied
    const startPollingForApproval = () => {
        if (pollRef.current) clearInterval(pollRef.current);
        setPolling(true);

        pollRef.current = setInterval(async () => {
            try {
                const latest = await fetchDetail();
                setTransaction(latest);

                const status = String(latest?.paymentStatus || "").toLowerCase(); // Waiting/Approved/Denied
                if (status === "approved" || status === "denied") {
                    clearInterval(pollRef.current);
                    setPolling(false);

                    if (status === "denied") {
                        alert("❌ Thanh toán bị từ chối bởi Admin.");
                        return navigate("/user/transaction");
                    }

                    // status === "approved" → đếm ngược theo amount rồi chuyển sang StationSwap
                    const delaySec = Math.max(0, Math.round(Number(latest?.amount || 0)));
                    if (delaySec > 0) {
                        setCountdown(delaySec);
                        if (timerRef.current) clearInterval(timerRef.current);
                        timerRef.current = setInterval(() => {
                            setCountdown((c) => {
                                if (c <= 1) {
                                    clearInterval(timerRef.current);
                                    goToStationSwap();
                                    return 0;
                                }
                                return c - 1;
                            });
                        }, 1000);
                    } else {
                        goToStationSwap();
                    }
                }
            } catch (e) {
                // tiếp tục poll dù lỗi lẻ tẻ
                console.warn("⚠ Poll payment-detail error:", e?.response?.data || e);
            }
        }, 2000);
    };

    // Điều hướng sang trạm giả lập StationSwap (dùng preset đã lưu khi booking)
    const goToStationSwap = () => {
        const stId =
            localStorage.getItem("swap_stationId") ||
            localStorage.getItem("last_stationId"); // fallback
        const subId =
            localStorage.getItem("swap_subscriptionId") ||
            localStorage.getItem("lastPlanId"); // fallback

        alert("✅ Thanh toán đã được duyệt!\nHệ thống sẽ chuyển sang màn hình đổi pin.");
        navigate("/stations", {
            state: { stationId: stId || "", subscriptionId: subId || "" },
        });
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center mt-20 text-gray-600">
                <div className="animate-spin h-10 w-10 border-4 border-blue-500 border-t-transparent rounded-full mb-3"></div>
                <p>Loading payment details...</p>
            </div>
        );
    }

    if (!transaction) {
        return (
            <div className="text-center mt-20 text-gray-600">
                <p>❌ Transaction not found.</p>
                <button
                    onClick={() => navigate("/user/transaction")}
                    className="mt-4 px-5 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg font-semibold"
                >
                    ⬅ Back to Transactions
                </button>
            </div>
        );
    }

    const formattedDate = transaction.paymentDate
        ? new Date(transaction.paymentDate).toLocaleString()
        : "Not yet paid";

    const bankInfo = {
        bankName: transaction.bankName || "N/A",
        accountNumber: transaction.paymentAccount || "N/A",
        transactionContext: transaction.transactionContext || "N/A",
        method: "Bank Transfer",
    };

    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text);
        alert("📋 Copied to clipboard!");
    };

    const statusLower = String(transaction.paymentStatus || "").toLowerCase();

    return (
        <div className="min-h-screen bg-gray-50 py-10 px-4">
            <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
                <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">💳 Payment Information</h2>

                <div className="border rounded-xl p-5 mb-6 shadow-sm hover:shadow-md transition">
                    <h3 className="font-semibold text-lg text-gray-800 mb-4 flex items-center gap-2">
                        Bank Transfer
                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-md">
                            Recommended
                        </span>
                    </h3>

                    <div className="space-y-3 text-gray-700">
                        <p>
                            <span className="font-semibold">Bank Name: </span>
                            {bankInfo.bankName}
                        </p>
                        <p className="flex items-center gap-2">
                            <span className="font-semibold">Account Number:</span>
                            {bankInfo.accountNumber}
                            <button
                                onClick={() => copyToClipboard(bankInfo.accountNumber)}
                                className="text-gray-500 hover:text-blue-600"
                            >
                                📋
                            </button>
                        </p>
                        <p>
                            <span className="font-semibold">Transaction Context:</span>{" "}
                            {bankInfo.transactionContext}
                        </p>
                    </div>
                </div>

                <div className="border rounded-xl p-5 shadow-sm">
                    <h3 className="font-semibold text-lg mb-3 text-gray-800">Payment Summary</h3>

                    <div className="space-y-2 text-gray-700">
                        <p className="flex justify-between">
                            <span>Transaction ID</span>
                            <span className="font-semibold">{transaction.transactionId}</span>
                        </p>
                        <p className="flex justify-between">
                            <span>Amount</span>
                            <span className="font-semibold text-blue-700">
                                {(transaction.amount || 0).toLocaleString()} VND
                            </span>
                        </p>
                        <p className="flex justify-between">
                            <span>Status</span>
                            <span
                                className={`text-sm px-3 py-1 rounded-md border ${statusLower === "approved"
                                    ? "bg-green-100 text-green-700 border-green-300"
                                    : statusLower === "denied"
                                        ? "bg-red-100 text-red-700 border-red-300"
                                        : "bg-yellow-100 text-yellow-700 border-yellow-300"
                                    }`}
                            >
                                {transaction.paymentStatus}
                            </span>
                        </p>
                        <p className="flex justify-between">
                            <span>Payment Date</span>
                            <span>{formattedDate}</span>
                        </p>
                    </div>

                    {/* Trạng thái chờ admin & đếm ngược */}
                    {waitingAdmin && (
                        <div className="mt-4 text-sm text-yellow-700 bg-yellow-50 border border-yellow-200 rounded p-3">
                            ⏳ Đã xác nhận thanh toán. Vui lòng đợi Admin duyệt...
                            {polling && <span className="ml-1 opacity-80">(đang kiểm tra trạng thái)</span>}
                        </div>
                    )}

                    {countdown > 0 && (
                        <div className="mt-3 text-center text-green-700 bg-green-50 border border-green-200 rounded p-3">
                            ✅ Đã được Admin phê duyệt. Sẽ chuyển sang màn hình đổi pin sau <b>{countdown}s</b>…
                        </div>
                    )}

                    <button
                        onClick={handlePayment}
                        disabled={
                            processing ||
                            waitingAdmin ||
                            statusLower === "approved" ||
                            statusLower === "denied"
                        }
                        className={`mt-5 w-full py-3 rounded-lg text-white font-semibold transition ${processing || waitingAdmin
                            ? "bg-gray-400 cursor-not-allowed"
                            : "bg-blue-600 hover:bg-blue-700"
                            }`}
                    >
                        {processing
                            ? "Processing..."
                            : waitingAdmin
                                ? "Waiting for Admin Approval..."
                                : "Confirm Payment"}
                    </button>
                </div>
            </div>
        </div>
    );
}
