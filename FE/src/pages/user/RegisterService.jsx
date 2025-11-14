/* eslint-disable no-unused-vars */
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "@/api/api";

export default function RegisterService() {
  const navigate = useNavigate();
  const [plans, setPlans] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [planDetail, setPlanDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Icon logic theo loại phí — dùng Bootstrap Icons thay vì emoji
  const getFeeIcon = (type) => {
    const key = String(type || "").toLowerCase();
    if (key.includes("mileage")) return "bi-speedometer2";
    if (key.includes("swap")) return "bi-arrow-left-right";
    if (key.includes("penalty") || key.includes("late"))
      return "bi-exclamation-triangle-fill";
    if (key.includes("booking")) return "bi-calendar-event";
    if (key.includes("deposit")) return "bi-piggy-bank";
    return "bi-bookmark";
  };

  // Load danh sách plan
  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const res = await api.get("/Plan/plan-list");
        if (res.data && Array.isArray(res.data.data)) {
          setPlans(res.data.data);
        }
      } catch (err) {
        console.error("❌ Failed to fetch plans:", err?.response?.data || err);
        alert("Failed to load plans!");
      } finally {
        setLoading(false);
      }
    };
    fetchPlans();
  }, []);

  // Xem chi tiết plan và show modal
  const handleViewPlanDetail = async (planId) => {
    try {
      setDetailLoading(true);
      const res = await api.get(`/Plan/plan-detail/${planId}`);
      setPlanDetail(res.data?.data);
      setShowModal(true);
    } catch (err) {
      console.error(
        "❌ Failed to fetch plan details:",
        err?.response?.data || err
      );
      alert("Cannot load plan details!");
    } finally {
      setDetailLoading(false);
    }
  };

  // ✅ Đăng ký gói thuê — payload đúng schema BE
  const register = async () => {
    if (!selected) {
      alert("Please choose a plan first!");
      return;
    }

    const token = localStorage.getItem("token");
    const userId = localStorage.getItem("userId");

    if (!token || !userId) {
      alert("Please log in again!");
      navigate("/login");
      return;
    }

    const payload = { driverId: { userId }, planId: selected.planId };

    try {
      await api.post("/Transaction/transaction-register", payload, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      alert(`Registered for ${selected.planName} successfully!`);
      navigate("/user/transaction");
    } catch (err) {
      const v = err?.response?.data;
      // Gom lỗi validation (nếu có)
      let msg =
        (v?.title && `${v.title}`) ||
        v?.message ||
        err?.message ||
        "Registration failed!";
      if (v?.errors && typeof v.errors === "object") {
        const details = Object.entries(v.errors)
          .map(([k, arr]) => `${k}: ${(arr || []).join(", ")}`)
          .join("\n");
        msg += `\n${details}`;
      }
      console.error("❌ Registration error:", err?.response?.data || err);
      alert(msg);
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
          <i className="bi bi-lightning-charge-fill text-red-500" />{" "}
          Choose Your Subscription
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full text-center border-collapse">
            <thead>
              <tr className="bg-gray-100 text-gray-700">
                <th className="p-3">Package</th>
                <th>Batteries</th>
                <th>Mileage (km)</th>
                <th>Price (₫)</th>
                <th>Action</th>
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
                    <td>{Number(p.price || 0).toLocaleString("vi-VN")}</td>
                    <td className="space-x-2">
                      <button
                        onClick={() => handleViewPlanDetail(p.planId)}
                        className="px-3 py-1 bg-blue-100 hover:bg-blue-200 rounded-lg"
                      >
                        <i
                          className="bi bi-info-circle"
                          style={{ color: "blue" }}
                        />{" "}
                        Details
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
              ? "bg-blue-600 text-white hover:bg-blue-700"
              : "bg-gray-400 text-gray-100 cursor-not-allowed"
              }`}
          >
            <i className="bi bi-check-circle-fill" style={{ color: "blue" }} />{" "}
            Confirm Registration
          </button>
          <button
            onClick={() => navigate("/user/service")}
            className="px-6 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 font-semibold"
          >
            <i className="bi bi-arrow-left" style={{ color: "blue" }} /> Back
          </button>
        </div>
      </div>

      {/* Modal chi tiết — không nền đen full, layout rõ ràng, icon Bootstrap */}
      {showModal && planDetail && (
        <div className="fixed inset-0 z-50 pointer-events-none">
          <div className="flex justify-center mt-20 px-4 pointer-events-none">
            <div className="w-full max-w-3xl pointer-events-auto">
              <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 p-6">
                <div className="flex justify-between items-start gap-4 mb-4">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                      <i className="bi bi-journal-richtext text-blue-600" />
                      Plan Details: {planDetail.plans.planName}
                    </h2>
                    <p className="text-sm text-gray-500 mt-1">
                      Review all conditions, fees and benefits before you
                      confirm.
                    </p>
                  </div>
                  <button
                    onClick={() => setShowModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                    aria-label="Close"
                  >
                    <i className="bi bi-x-lg text-xl" />
                  </button>
                </div>

                <div className="grid md:grid-cols-2 gap-4 mb-6">
                  <div className="space-y-2 bg-blue-50 rounded-xl p-4">
                    <h3 className="text-sm font-semibold text-blue-700 flex items-center gap-2">
                      <i className="bi bi-lightning-charge-fill" />
                      Plan Overview
                    </h3>
                    <p className="text-sm text-gray-700">
                      <span className="font-medium">Price:</span>{" "}
                      {Number(planDetail.plans.price || 0).toLocaleString(
                        "vi-VN"
                      )}
                      ₫
                    </p>
                    <p className="text-sm text-gray-700">
                      <span className="font-medium">Batteries:</span>{" "}
                      {planDetail.plans.numberBattery}
                    </p>
                    <p className="text-sm text-gray-700">
                      <span className="font-medium">Duration:</span>{" "}
                      {planDetail.plans.durationDays} days
                    </p>
                    <p className="text-sm text-gray-700">
                      <span className="font-medium">Mileage:</span>{" "}
                      {planDetail.plans.milleageBaseUsed} km
                    </p>
                  </div>

                  <div className="space-y-2 bg-gray-50 rounded-xl p-4">
                    <h3 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                      <i className="bi bi-graph-up-arrow" />
                      Why this plan might fit you
                    </h3>
                    <p className="text-sm text-gray-700">
                      • Suitable for{" "}
                      <span className="font-semibold">
                        {planDetail.plans.numberBattery} batteries
                      </span>{" "}
                      and trips up to{" "}
                      <span className="font-semibold">
                        {planDetail.plans.milleageBaseUsed} km
                      </span>
                      .
                    </p>
                    <p className="text-sm text-gray-700">
                      • Duration of{" "}
                      <span className="font-semibold">
                        {planDetail.plans.durationDays} days
                      </span>{" "}
                      gives flexibility for your monthly usage.
                    </p>
                    <p className="text-sm text-gray-700">
                      • Check fee details below to understand how extra
                      mileage, late swaps, or deposits are calculated.
                    </p>
                  </div>
                </div>

                <h3 className="font-semibold text-lg mb-2 flex items-center gap-2">
                  <i className="bi bi-receipt-cutoff text-blue-600" />
                  Fee Details
                </h3>
                <div className="overflow-x-auto rounded-lg border border-gray-200 mb-4">
                  <table className="w-full text-center border-collapse text-sm">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="p-2 text-left pl-4">Fee Type</th>
                        <th>Amount</th>
                        <th>Unit</th>
                        <th>Range</th>
                        <th>Description</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(planDetail.planFees || []).map((fee, index) => (
                        <tr key={index} className="border-t">
                          <td className="p-2 text-left pl-4">
                            <div className="flex items-center gap-2">
                              <i
                                className={`bi ${getFeeIcon(
                                  fee.typeOfFee
                                )} text-blue-600`}
                              />
                              <span>{fee.typeOfFee}</span>
                            </div>
                          </td>
                          <td>{fee.amountFee}</td>
                          <td>{fee.unit}</td>
                          <td>
                            {fee.minValue} - {fee.maxValue}
                          </td>
                          <td className="text-left px-2">
                            {fee.description}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="flex flex-col md:flex-row md:items-center md:justify-between mt-4 gap-3">
                  <div className="text-xs text-gray-500">
                    Once you select this plan, remember to press{" "}
                    <span className="font-semibold">
                      Confirm Registration
                    </span>{" "}
                    on the main page.
                  </div>
                  <div className="space-x-2 text-right">
                    <button
                      onClick={() => setShowModal(false)}
                      className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 text-sm font-medium inline-flex items-center gap-2"
                    >
                      <i className="bi bi-x-lg" />
                      Close
                    </button>
                    <button
                      onClick={() => {
                        setSelected(planDetail.plans);
                        setShowModal(false);
                        alert(
                          `${planDetail.plans.planName} selected! Now press Confirm Registration.`
                        );
                      }}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-semibold inline-flex items-center gap-2"
                    >
                      <i className="bi bi-check2-circle" />
                      Select This Plan
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
