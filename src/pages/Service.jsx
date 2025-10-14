import React, { useEffect, useState } from "react";
import api from "../api/api";
import { useNavigate } from "react-router-dom";

export default function Service() {
    const navigate = useNavigate();
    const [subs, setSubs] = useState([]);
    const [selected, setSelected] = useState("");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchPlans = async () => {
            try {
                const res = await api.get("/Plan/plan-list");

                // 🧠 đảm bảo dữ liệu luôn là mảng
                const data = Array.isArray(res.data)
                    ? res.data
                    : Array.isArray(res.data.data)
                        ? res.data.data
                        : Array.isArray(res.data.planList)
                            ? res.data.planList
                            : [];

                console.log("✅ Plan list response:", res.data);
                setSubs(data);

                const active = data.find((s) => s.status === "active");
                setSelected(active?.planId || data[0]?.planId || "");
            } catch (err) {
                console.error("❌ Error fetching plans:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchPlans();
    }, []);

    if (loading)
        return (
            <div className="flex justify-center items-center min-h-screen">
                <div className="h-10 w-10 border-4 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );

    const current = subs.find((s) => s.planId === selected);

    return (
        <div className="p-6 bg-gray-50 min-h-screen">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                📦 Subscription
            </h2>

            {subs.length === 0 && (
                <div className="text-center bg-white p-8 rounded-2xl shadow-md border max-w-xl mx-auto">
                    <h3 className="text-xl font-semibold mb-2">
                        You don't have a subscription yet
                    </h3>
                    <p className="text-gray-600 mb-5">
                        Register now to enjoy battery swaps and exclusive benefits.
                    </p>
                    <button
                        onClick={() => navigate("/user/service/register")}
                        className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
                    >
                        ➕ Register new Service
                    </button>
                </div>
            )}

            {current && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* LEFT CARD - CURRENT PLAN */}
                    <div
                        className="p-6 rounded-2xl shadow-lg text-gray-800"
                        style={{
                            background: "linear-gradient(135deg, #a5f3fc 0%, #c084fc 100%)",
                        }}
                    >
                        <h3 className="text-lg text-gray-700 mb-1">Current subscription</h3>
                        <h2 className="text-3xl font-bold text-blue-900 mb-2">
                            {current.planName}
                        </h2>
                        <p className="text-sm text-gray-700 mb-4">
                            <strong>Plan ID:</strong> {current.planId}
                        </p>

                        <label className="block text-sm mb-1 font-semibold">
                            Select Subscription
                        </label>
                        <select
                            className="w-full border rounded-lg p-2 mb-2 focus:ring-2 focus:ring-blue-500"
                            value={selected}
                            onChange={(e) => setSelected(e.target.value)}
                        >
                            {subs.map((s) => (
                                <option key={s.planId} value={s.planId}>
                                    {s.planName} — {s.price.toLocaleString()}₫
                                </option>
                            ))}
                        </select>

                        <p className="text-sm text-green-800 mb-4">
                            ✅ Valid until {current.expireDate || "2025-12-31"}
                        </p>

                        <div className="flex justify-between items-center mb-4">
                            <div>
                                <p className="text-gray-600 text-sm">Status</p>
                                <p className="font-semibold text-green-700 capitalize">
                                    {current.status || "active"}
                                </p>
                            </div>
                            <div className="text-right">
                                <p className="text-2xl font-bold text-blue-900">
                                    {current.price?.toLocaleString() || 0}₫
                                </p>
                                <p className="text-gray-600 text-sm">/ month</p>
                            </div>
                        </div>

                        <div className="bg-white bg-opacity-30 rounded-xl p-3 mb-4">
                            <p className="font-semibold">Battery Mileage</p>
                            <p className="text-sm text-gray-700">
                                {current.milleageBaseUsed
                                    ? `${current.milleageBaseUsed} km/month`
                                    : "Unlimited"}
                            </p>
                        </div>

                        <button
                            onClick={() => navigate("/user/service/change")}
                            className="w-full bg-black text-white rounded-lg py-2 hover:bg-gray-900 transition mb-3 flex items-center justify-center gap-2"
                        >
                            <span>🔁</span> Change Service →
                        </button>

                        <button
                            onClick={() => navigate("/user/service/register")}
                            className="w-full bg-indigo-600 text-white rounded-lg py-2 hover:bg-indigo-700 transition flex items-center justify-center gap-2"
                        >
                            <span>➕</span> Register new Service
                        </button>
                    </div>

                    {/* RIGHT CARD - STATS */}
                    <div className="p-6 bg-white rounded-2xl shadow-lg">
                        <h3 className="text-lg font-semibold mb-4 text-gray-700">
                            Usage Statistics
                        </h3>

                        <div className="space-y-4">
                            <div className="p-4 rounded-xl bg-blue-50 text-center">
                                <p className="text-3xl font-bold text-blue-600">28</p>
                                <p className="text-gray-600 text-sm">Swaps this month</p>
                            </div>
                            <div className="p-4 rounded-xl bg-green-50 text-center">
                                <p className="text-3xl font-bold text-green-600">1,250 km</p>
                                <p className="text-gray-600 text-sm">Distance traveled</p>
                            </div>
                            <div className="p-4 rounded-xl bg-purple-50 text-center">
                                <p className="text-3xl font-bold text-purple-600">80,000₫</p>
                                <p className="text-gray-600 text-sm">Total Charge</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}