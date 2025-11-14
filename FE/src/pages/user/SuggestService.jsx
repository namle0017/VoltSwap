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

  // icon fee → Bootstrap Icons
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

  const queryParams = new URLSearchParams(location.search);
  const planList = queryParams.get("planList"); // ví dụ: "G2,GU"

  // 🧭 Load danh sách gợi ý
  useEffect(() => {
    const fetchSuggestedPlans = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!planList) {
          alert("No suggested plans found, please select your vehicle again.");
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

  // 📄 Xem chi tiết plan
  const handleViewPlanDetail = async (planId) => {
    if (!planId) {
      alert("Plan ID is missing!");
      return;
    }

    try {
      setDetailLoading(true);
      const res = await api.get(`/Plan/plan-detail/${planId}`);
      if (res.data?.data) {
        setPlanDetail(res.data.data);
        setShowModal(true);
      } else {
        alert("No plan details found!");
      }
    } catch (err) {
      console.error("❌ Failed to fetch plan details:", err);
      alert(err.response?.data?.message || "Cannot load plan details!");
    } finally {
      setDetailLoading(false);
    }
  };

  // 📌 Đăng ký gói thuê
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
        Loading suggested plans...
      </div>
    );

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 py-10 px-4">
      <div className="max-w-6xl mx-auto bg-white rounded-2xl p-6 shadow-lg border border-gray-200">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-6">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-gray-800 flex items-center gap-2">
              <i className="bi bi-stars text-yellow-500 text-2xl" />
              Suggested Subscription Plans
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Based on your vehicle information, we recommend the following
              plans:
              <span className="font-semibold text-blue-600 ml-1">
                {planList}
              </span>
            </p>
          </div>
          <button
            onClick={() => navigate("/user/vehicle")}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-sm font-medium text-gray-700"
          >
            <i className="bi bi-arrow-left" />
            Change vehicle
          </button>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-center border-collapse">
            <thead>
              <tr className="bg-gray-100 text-gray-700 text-sm">
                <th className="p-3 text-left pl-4">Package</th>
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
                    className={`border-b text-sm transition ${p.isSuggest
                        ? "bg-green-50 hover:bg-green-100"
                        : "hover:bg-gray-50"
                      } ${selected?.planId === p.planId
                        ? "ring-2 ring-yellow-300"
                        : ""
                      }`}
                  >
                    <td className="p-3 text-left pl-4">
                      <div className="flex flex-col items-start">
                        <span className="font-semibold text-gray-800">
                          {p.planName}
                        </span>
                        <span className="text-xs text-gray-500">
                          Ideal for {p.numberBattery} batteries /{" "}
                          {p.durationDays} days
                        </span>
                      </div>
                    </td>
                    <td>{p.numberBattery}</td>
                    <td>{p.durationDays}</td>
                    <td className="font-medium">
                      {Number(p.price || 0).toLocaleString("vi-VN")}
                    </td>
                    <td>
                      {p.isSuggest ? (
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-green-100 text-green-700 text-xs font-semibold">
                          <i className="bi bi-star-fill" />
                          Recommended
                        </span>
                      ) : (
                        <span className="text-gray-400 text-xs">—</span>
                      )}
                    </td>
                    <td className="space-x-2">
                      <button
                        onClick={() => handleViewPlanDetail(p.planId)}
                        className="inline-flex items-center gap-1 px-3 py-1 bg-blue-50 hover:bg-blue-100 rounded-lg text-sm"
                      >
                        <i className="bi bi-info-circle" />
                        Details
                      </button>
                      <button
                        onClick={() => setSelected(p)}
                        className={`px-3 py-1 rounded-full text-sm ${selected?.planId === p.planId
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

        {/* Footer actions */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mt-8 gap-3">
          <div className="text-sm text-gray-500">
            Tip: You can view details of each plan before confirming your
            registration.
          </div>
          <div className="space-x-3 text-right">
            <button
              onClick={register}
              disabled={!selected}
              className={`px-6 py-2 rounded-lg font-semibold inline-flex items-center gap-2 ${selected
                  ? "bg-green-600 text-white hover:bg-green-700"
                  : "bg-gray-400 text-gray-100 cursor-not-allowed"
                }`}
            >
              <i className="bi bi-check-circle-fill" />
              Confirm Registration
            </button>
            <button
              onClick={() => navigate("/user/service")}
              className="px-6 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 font-semibold inline-flex items-center gap-2"
            >
              <i className="bi bi-arrow-left" />
              Back
            </button>
          </div>
        </div>
      </div>

      {/* Detail "modal" – không nền đen full, card nổi rõ ràng */}
      {showModal && planDetail && (
        <div className="fixed inset-0 z-50 pointer-events-none">
          <div className="flex justify-center mt-20 px-4 pointer-events-none">
            <div className="w-full max-w-4xl pointer-events-auto">
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
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-semibold inline-flex items-center gap-2"
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
