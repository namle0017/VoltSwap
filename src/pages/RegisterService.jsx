import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/api";

export default function RegisterService() {
    const navigate = useNavigate();
    const [plans, setPlans] = useState([]);
    const [selected, setSelected] = useState(null);
    const [loading, setLoading] = useState(true);

    // 🔹 Load danh sách gói thuê từ BE
    useEffect(() => {
        const fetchPlans = async () => {
            try {
                const res = await api.get("/Plan/plan-list");
                // Kiểm tra data hợp lệ
                if (res.data && Array.isArray(res.data.data)) {
                    setPlans(res.data.data);
                } else {
                    console.warn("⚠️ Unexpected response format:", res.data);
                }
            } catch (error) {
                console.error("❌ Failed to fetch plans:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchPlans();
    }, []);

    // ✅ Đăng ký gói thuê
    const register = async () => {
        if (!selected) return alert("Please select a plan first!");

        const token = localStorage.getItem("token");
        const driverId = localStorage.getItem("userId"); // lấy đúng ID đã login

        if (!token || !driverId) {
            alert("Please log in again!");
            navigate("/login");
            return;
        }

        const payload = {
            driverId: driverId, // ✅ BE cần field này
            planId: selected.planId, // ✅ từ gói chọn
            amount: selected.price, // ✅ giá gói
            fee: 0, // có thể để 0
            transactionType: "Register", // ✅ BE cần type
        };

        console.log("📤 Payload gửi đi:", payload);

        try {
            const res = await api.post(
                "/Transaction/transaction-user-list",
                payload,
                {
                    headers: {
                        Authorization: `Bearer ${token}`, // ✅ thêm JWT token
                    },
                }
            );

            console.log("✅ Response:", res.data);
            localStorage.setItem("lastPlanId", selected.planId);
            alert(`✅ Registered for ${selected.planName} successfully!`);
            navigate("/user/transaction");
        } catch (err) {
            console.error("❌ Registration error:", err.response?.data || err);
            alert("❌ Registration failed! Please check console for details.");
        }
    };

    if (loading)
        return (
            <div className="flex justify-center items-center min-h-screen text-gray-600">
                <div className="animate-spin h-10 w-10 border-4 border-blue-400 border-t-transparent rounded-full mr-3"></div>
                Loading plans...
            </div>
        );

    return (
        <div className="min-h-screen bg-gradient-to-br from-cyan-100 to-yellow-100 py-10 px-4">
            <div className="max-w-5xl mx-auto bg-white rounded-2xl p-6 shadow-lg border border-gray-200">
                <h2 className="text-2xl font-bold text-center mb-6 text-gray-800">
                    ⚡ Choose Your Subscription
                </h2>

                {/* Bảng hiển thị danh sách gói */}
                <div className="overflow-x-auto">
                    <table className="w-full text-center border-collapse">
                        <thead>
                            <tr className="bg-gray-100 text-gray-700">
                                <th className="p-3">Package</th>
                                <th>Batteries</th>
                                <th>Mileage (km)</th>
                                <th>Price (₫)</th>
                                <th></th>
                            </tr>
                        </thead>

                        <tbody>
                            {plans.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="py-6 text-gray-500">
                                        No subscription plans available.
                                    </td>
                                </tr>
                            ) : (
                                plans.map((p) => (
                                    <tr
                                        key={p.planId}
                                        className={`border-b hover:bg-yellow-50 transition ${selected?.planId === p.planId ? "bg-yellow-100" : ""
                                            }`}
                                    >
                                        <td className="p-3 font-semibold text-gray-800">
                                            {p.planName}
                                        </td>
                                        <td>{p.numberBattery}</td>
                                        <td>
                                            {p.milleageBaseUsed > 0
                                                ? p.milleageBaseUsed
                                                : "Unlimited"}
                                        </td>
                                        <td>{p.price.toLocaleString()}</td>
                                        <td>
                                            <button
                                                onClick={() => setSelected(p)}
                                                className={`px-3 py-1 rounded-full ${selected?.planId === p.planId
                                                        ? "bg-yellow-400 text-black font-semibold"
                                                        : "bg-yellow-200 hover:bg-yellow-300"
                                                    }`}
                                            >
                                                {selected?.planId === p.planId ? "Selected" : "Choose"}
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Nút hành động */}
                <div className="text-center mt-8 space-x-3">
                    <button
                        onClick={register}
                        disabled={!selected}
                        className={`px-6 py-2 rounded-lg font-semibold ${selected
                                ? "bg-blue-600 text-white hover:bg-blue-700"
                                : "bg-gray-400 text-gray-100 cursor-not-allowed"
                            }`}
                    >
                        🚀 Confirm Registration
                    </button>
                    <button
                        onClick={() => navigate("/user/service")}
                        className="px-6 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 font-semibold"
                    >
                        ⬅️ Back
                    </button>
                </div>
            </div>
        </div>
    );
}