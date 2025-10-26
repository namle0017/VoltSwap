/* eslint-disable no-unused-vars */
import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import api from "@/api/api";

export default function SuggestService() {
    const navigate = useNavigate();
    const location = useLocation();

    const [plans, setPlans] = useState([]);
    const [selected, setSelected] = useState(null);
    const [loading, setLoading] = useState(true);

    // Modal state
    const [showModal, setShowModal] = useState(false);
    const [planDetail, setPlanDetail] = useState(null);
    const [detailLoading, setDetailLoading] = useState(false);

    const getFeeIcon = (type) => {
        const key = type.toLowerCase();
        if (key.includes("mileage")) return "🚗";
        if (key.includes("swap")) return "🔄";
        if (key.includes("penalty") || key.includes("late")) return "⚠️";
        if (key.includes("booking")) return "📅";
        if (key.includes("deposit")) return "💰";
        return "📌";
    };
    const queryParams = new URLSearchParams(location.search);
    const planList = queryParams.get("planList"); // ví dụ: "G2,GU"

    // 🛠️ Gọi API suggest
    useEffect(() => {
        const fetchSuggestedPlans = async () => {
            try {
                const token = localStorage.getItem("token");
                if (!planList) {
                    alert("No suggested plans found!");
                    navigate("/user/vehicle");
                    return;
                }

                const res = await api.get("/Plan/plan-suggest-list", {
                    params: { PlanName: planList },
                    headers: { Authorization: `Bearer ${token}` },
                });

                setPlans(res.data?.data || []);
            } catch (err) {
                console.error("❌ Failed to fetch suggested plans:", err);
                alert("Failed to load suggested plans!");
            } finally {
                setLoading(false);
            }
        };

        fetchSuggestedPlans();
    }, [planList, navigate]);
    // 📌 Đăng ký gói thuê
    const register = async () => {
        if (!selected) return alert("Please choose a plan first!");

        const token = localStorage.getItem("token");
        const driverId = localStorage.getItem("userId");

        try {
            await api.post(
                "/Transaction/transaction-user-list",
                {
                    driverId,
                    planId: selected.planId,

                    amount: selected.price,
                    fee: 0,
                    transactionType: "Register",
                },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            alert(`✅ Registered for ${selected.planName} successfully!`);
            navigate("/user/transaction");
        } catch (err) {
            console.error("❌ Registration error:", err.response?.data || err);
            alert("❌ Registration failed!");
        }
    };

    // 📄 Xem chi tiết gói
    const handleViewPlanDetail = async (planId) => {
        try {
            setDetailLoading(true);
            const res = await api.get(`/Plan/plan-detail/${planId}`);
            setPlanDetail(res.data?.data);
            setShowModal(true);
        } catch (err) {
            console.error("❌ Failed to fetch plan details:", err);
            alert("Cannot load plan details!");
        } finally {
            setDetailLoading(false);
        }
    };

    if (loading)
        return (
            <div className="flex justify-center items-center min-h-screen text-gray-600">
                <div className="animate-spin h-10 w-10 border-4 border-blue-400 border-t-transparent rounded-full mr-3"></div>
                Loading suggested plans...
            </div>
        );

    return (
        <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 py-10 px-4">
            <div className="max-w-5xl mx-auto bg-white rounded-2xl p-6 shadow-lg border border-gray-200">
                <h2 className="text-2xl font-bold text-center mb-6 text-gray-800">
                    🌟 Suggested Subscription Plans for VIN:{" "}
                    <span className="text-blue-600">{planList}</span>
                </h2>

                <div className="overflow-x-auto">
                    <table className="w-full text-center border-collapse">
                        <thead>
                            <tr className="bg-gray-100 text-gray-700">
                                <th className="p-3">Package</th>
                                <th>Batteries</th>
                                <th>Duration (Days)</th>
                                <th>Price (₫)</th>
                                <th>Suggested</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {plans.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="py-6 text-gray-500">
                                        No suggested plans available.
                                    </td>
                                </tr>
                            ) : (
                                plans.map((p) => (
                                    <tr
                                        key={p.planId}
                                        className={`border-b transition ${p.isSuggest
                                                ? "bg-green-100 hover:bg-green-200"
                                                : "hover:bg-gray-50"
                                            } ${selected?.planId === p.planId ? "bg-yellow-200" : ""}`}
                                    >
                                        <td className="p-3 font-semibold text-gray-800">
                                            {p.planName}
                                        </td>
                                        <td>{p.numberBattery}</td>
                                        <td>{p.durationDays}</td>
                                        <td>{p.price.toLocaleString()}</td>
                                        <td>
                                            {p.isSuggest ? (
                                                <span className="text-green-700 font-semibold">
                                                    ✅ Recommended
                                                </span>
                                            ) : (
                                                <span className="text-gray-500">—</span>
                                            )}
                                        </td>
                                        <td className="space-x-2">
                                            <button
                                                onClick={() => handleViewPlanDetail(p.planId)}
                                                className="px-3 py-1 bg-blue-100 hover:bg-blue-200 rounded-lg"
                                            >
                                                ℹ️ Details
                                            </button>
                                            <button
                                                onClick={() => setSelected(p)}
                                                className={`px-3 py-1 rounded-full ${selected?.planId === p.planId
                                                        ? "bg-yellow-400 font-semibold"
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

                <div className="text-center mt-8 space-x-3">
                    <button
                        onClick={register}
                        disabled={!selected}
                        className={`px-6 py-2 rounded-lg font-semibold ${selected
                                ? "bg-green-600 text-white hover:bg-green-700"
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