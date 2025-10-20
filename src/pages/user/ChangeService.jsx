/* eslint-disable no-unused-vars */
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "@/api/api";

export default function ChangeService() {
  const navigate = useNavigate();
  const [plans, setPlans] = useState([]);
  const [selected, setSelected] = useState(null);
  const [currentPlan, setCurrentPlan] = useState(null);
  const [currentSubId, setCurrentSubId] = useState(null);
  const [loading, setLoading] = useState(true);

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [planDetail, setPlanDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // 🧠 Icon logic theo loại phí
  const getFeeIcon = (type) => {
    const key = type.toLowerCase();
    if (key.includes("mileage")) return "🚗";
    if (key.includes("swap")) return "🔄";
    if (key.includes("penalty") || key.includes("late")) return "⚠️";
    if (key.includes("booking")) return "📅";
    if (key.includes("deposit")) return "💰";
    return "📌";
  };

  // 🧭 Load danh sách plan & subscription hiện tại
  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("token");
        const userDriverId = localStorage.getItem("userId");

        const planRes = await api.get("/Plan/plan-list");
        const planList = Array.isArray(planRes.data.data)
          ? planRes.data.data
          : [];
        setPlans(planList);

        const subRes = await api.get(
          `/Subscription/subscription-user-list?DriverId=${userDriverId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        if (subRes.data?.data?.length > 0) {
          const activeSub = subRes.data.data[0];
          const foundPlan = planList.find(
            (p) => p.planName === activeSub.planName
          );
          setCurrentPlan(foundPlan || null);
          setCurrentSubId(activeSub.subId || "");
        } else {
          setCurrentPlan(null);
        }
      } catch (err) {
        console.error("❌ Error loading data:", err);
        alert("Failed to load plans or subscription info!");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // 🔍 Xem chi tiết plan (show modal)
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

  // 🔁 Đổi gói
  const handleChangePlan = async () => {
    if (!selected) return alert("Please select a new plan!");
    if (selected.planId === currentPlan?.planId)
      return alert("You are already on this plan!");

    try {
      const driverId = localStorage.getItem("userId");
      const token = localStorage.getItem("token");

      await api.post(
        "/Subscription/change",
        {
          userDriverId: driverId,
          subscriptionId: currentSubId,
          newPlanId: selected.planId,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      alert("✅ Plan changed successfully!");
      navigate("/user/transaction");
    } catch (err) {
      console.error("❌ Error changing plan:", err);
      alert("Failed to change plan. Please try again.");
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
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-cyan-100 py-10 px-4">
      <div className="max-w-6xl mx-auto bg-white rounded-2xl shadow-lg p-8">
        <h2 className="text-2xl font-bold text-center mb-8">
          🔁 Change Subscription Plan
        </h2>

        {currentPlan && (
          <div className="text-center mb-8">
            <p className="text-gray-700 text-lg">
              <strong>Current Plan:</strong>{" "}
              <span className="text-blue-700 font-semibold">
                {currentPlan.planName}
              </span>{" "}
              — {currentPlan.price.toLocaleString()}₫
            </p>
          </div>
        )}

        {/* 📋 List Plan */}
        <div className="overflow-x-auto">
          <table className="w-full text-center border-collapse">
            <thead>
              <tr className="bg-gray-100 text-gray-700">
                <th className="p-3">Plan</th>
                <th>Batteries</th>
                <th>Duration</th>
                <th>Mileage</th>
                <th>Price (₫)</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {plans.map((p) => (
                <tr
                  key={p.planId}
                  className={`border-b hover:bg-yellow-50 transition ${
                    selected?.planId === p.planId ? "bg-yellow-100" : ""
                  }`}
                >
                  <td className="p-3 font-semibold">{p.planName}</td>
                  <td>{p.numberBattery}</td>
                  <td>{p.durationDays} days</td>
                  <td>
                    {p.milleageBaseUsed > 0
                      ? `${p.milleageBaseUsed} km`
                      : "Unlimited"}
                  </td>
                  <td>{p.price.toLocaleString()}</td>
                  <td className="space-x-2">
                    <button
                      onClick={() => handleViewPlanDetail(p.planId)}
                      className="px-3 py-1 bg-blue-100 hover:bg-blue-200 rounded-lg"
                    >
                      ℹ️ Details
                    </button>
                    {currentPlan?.planId !== p.planId && (
                      <button
                        onClick={() => setSelected(p)}
                        className={`px-3 py-1 rounded-lg ${
                          selected?.planId === p.planId
                            ? "bg-yellow-400 font-semibold"
                            : "bg-yellow-200 hover:bg-yellow-300"
                        }`}
                      >
                        {selected?.planId === p.planId ? "Selected" : "Choose"}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* 🎛 Buttons */}
        <div className="text-center mt-10 space-x-3">
          <button
            onClick={handleChangePlan}
            disabled={!selected}
            className={`px-6 py-2 rounded-lg font-semibold ${
              selected
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

      {/* 🌟 MODAL */}
      {showModal && planDetail && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 transition-opacity">
          <div className="bg-white rounded-xl shadow-xl w-11/12 max-w-3xl transform transition-all scale-100 p-6">
            <h2 className="text-2xl font-bold mb-4 text-center">
              Plan Details: {planDetail.plans.planName}
            </h2>

            <div className="mb-4">
              <p>
                <strong>Price:</strong>{" "}
                {planDetail.plans.price.toLocaleString()}₫
              </p>
              <p>
                <strong>Batteries:</strong> {planDetail.plans.numberBattery}
              </p>
              <p>
                <strong>Duration:</strong> {planDetail.plans.durationDays} days
              </p>
              <p>
                <strong>Mileage:</strong> {planDetail.plans.milleageBaseUsed} km
              </p>
            </div>

            <h3 className="font-semibold text-lg mb-2">📑 Fee Details</h3>
            <table className="w-full text-center border-collapse border">
              <thead className="bg-gray-100">
                <tr>
                  <th className="p-2">Icon</th>
                  <th>Type</th>
                  <th>Amount</th>
                  <th>Unit</th>
                  <th>Range</th>
                  <th>Description</th>
                </tr>
              </thead>
              <tbody>
                {planDetail.planFees.map((fee, index) => (
                  <tr key={index} className="border">
                    <td className="text-lg">{getFeeIcon(fee.typeOfFee)}</td>
                    <td>{fee.typeOfFee}</td>
                    <td>{fee.amountFee}</td>
                    <td>{fee.unit}</td>
                    <td>
                      {fee.minValue} - {fee.maxValue}
                    </td>
                    <td>{fee.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="text-right mt-6">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 bg-gray-300 rounded-lg hover:bg-gray-400 mr-2"
              >
                Close
              </button>
              <button
                onClick={() => {
                  setSelected(planDetail.plans);
                  setShowModal(false);
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Select This Plan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
