import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "@/api/api";

export default function ChangeService() {
    const navigate = useNavigate();
    const [subs, setSubs] = useState([]);
    const [selected, setSelected] = useState(null);
    const [current, setCurrent] = useState(null);
    const [loading, setLoading] = useState(true);

    // 🔹 Load danh sách gói
    useEffect(() => {
        const loadSubs = async () => {
            try {
                const res = await api.get("/Subscription/GetAll");
                const data = Array.isArray(res.data) ? res.data : [];
                setSubs(data);
                setCurrent(data.find((s) => s.status === "active"));
            } catch (err) {
                console.error(err);
                alert("❌ Failed to load subscriptions.");
            } finally {
                setLoading(false);
            }
        };
        loadSubs();
    }, []);

    // 🔁 Đổi gói
    const changePlan = async () => {
        if (!selected) return alert("Please select a plan.");
        if (selected.planId === current?.planId)
            return alert("You are already using this plan!");

        try {
            await api.put(`/Subscription/ChangePlan/${selected.planId}`, {
                newPlanId: selected.planId,
            });

            await api.post("/Transaction/Create", {
                driverId: "DRV001",
                planId: selected.planId,
                amount: selected.price,
                fee: 0,
                transactionType: "ChangePlan",
            });

            alert("✅ Plan changed successfully!");
            navigate("/user/transaction");
        } catch (error) {
            console.error(error);
            alert("❌ Failed to change plan.");
        }
    };

    if (loading)
        return (
            <div className="flex flex-col items-center mt-20 text-gray-600">
                <div className="animate-spin h-10 w-10 border-4 border-blue-500 border-t-transparent rounded-full mb-3"></div>
                <p>Loading subscription plans...</p>
            </div>
        );

    return (
        <div className="min-h-screen bg-gradient-to-br from-yellow-100 to-cyan-100 py-10 px-4">
            <div className="max-w-5xl mx-auto bg-white rounded-2xl shadow-lg p-6">
                <h2 className="text-2xl font-bold text-center mb-6">
                    🔁 Change Subscription Plan
                </h2>

                {current && (
                    <div className="text-center mb-8">
                        <p className="text-gray-700">
                            <strong>Current Plan:</strong>{" "}
                            <span className="text-blue-700 font-semibold">
                                {current.planName}
                            </span>
                        </p>
                    </div>
                )}

                <div className="overflow-x-auto">
                    <table className="w-full text-center border-collapse">
                        <thead>
                            <tr className="bg-gray-100 text-gray-700">
                                <th className="p-3">Package</th>
                                <th>Batteries</th>
                                <th>Mileage (km)</th>
                                <th>Price (₫)</th>
                                <th>Status</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                            {subs.map((p) => (
                                <tr
                                    key={p.planId}
                                    className={`border-b hover:bg-yellow-50 ${selected?.planId === p.planId ? "bg-yellow-100" : ""
                                        }`}
                                >
                                    <td className="p-3 font-semibold">{p.planName}</td>
                                    <td>{p.batteries}</td>
                                    <td>{p.milleageBaseUsed || "Unlimited"}</td>
                                    <td>{p.price.toLocaleString()}</td>
                                    <td
                                        className={`font-semibold ${p.status === "active"
                                                ? "text-green-600"
                                                : "text-gray-500 italic"
                                            }`}
                                    >
                                        {p.status === "active" ? "In Use" : "Available"}
                                    </td>
                                    <td>
                                        {p.status === "active" ? (
                                            <button
                                                disabled
                                                className="px-3 py-1 rounded-full bg-gray-300 text-gray-600 cursor-not-allowed"
                                            >
                                                In Use
                                            </button>
                                        ) : (
                                            <button
                                                onClick={() => setSelected(p)}
                                                className={`px-3 py-1 rounded-full ${selected?.planId === p.planId
                                                        ? "bg-yellow-400 text-black font-semibold"
                                                        : "bg-yellow-200 hover:bg-yellow-300"
                                                    }`}
                                            >
                                                {selected?.planId === p.planId ? "Selected" : "Change"}
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="text-center mt-8 space-x-3">
                    <button
                        onClick={changePlan}
                        disabled={!selected}
                        className={`px-6 py-2 rounded-lg font-semibold ${selected
                                ? "bg-blue-600 text-white hover:bg-blue-700"
                                : "bg-gray-400 text-gray-100 cursor-not-allowed"
                            }`}
                    >
                        🔄 Confirm Change
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
