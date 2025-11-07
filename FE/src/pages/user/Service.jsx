import React, { useEffect, useState } from "react";
import api from "@/api/api";
import { useNavigate } from "react-router-dom";

export default function Service() {
  const navigate = useNavigate();
  const [subs, setSubs] = useState([]);
  const [selected, setSelected] = useState("");
  const [loading, setLoading] = useState(true);
  const [showRenewModal, setShowRenewModal] = useState(false);
  const [apiMessage, setApiMessage] = useState("");
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelNote, setCancelNote] = useState("");
  const [stations, setStations] = useState([]);
  const [selectedStation, setSelectedStation] = useState("");

  // 🧭 Load danh sách subscription đang dùng
  useEffect(() => {
    const fetchSubs = async () => {
      try {
        const token = localStorage.getItem("token");
        const userId = localStorage.getItem("userId");

        const res = await api.get(
          `/Subscription/subscription-user-list?DriverId=${userId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        const data = Array.isArray(res.data?.data) ? res.data.data : [];
        setSubs(data);
        setSelected(data[0]?.subId || "");
      } catch (err) {
        const apiMessage = err?.response?.data?.message;
        if (apiMessage) {
          setSubs([]);
          setApiMessage(apiMessage);
        } else {
          console.error("❌ Unexpected error:", err);
          alert("⚠️ Could not load subscriptions.");
        }
      } finally {
        setLoading(false);
      }
    };
    fetchSubs();
  }, []);

  const loadStations = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await api.get("/Station/station-list", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = Array.isArray(res.data.data) ? res.data.data : [];
      setStations(data);
      setSelectedStation(data[0]?.stationId || "");
    } catch (err) {
      console.error("❌ Failed to load stations:", err);
      alert("Failed to load stations!");
    }
  };

  const current = subs.find((s) => s.subId === selected);

  // 🔄 Hủy gói dịch vụ
  const handleCancelSubscription = async () => {
    if (!selectedStation) return alert("Please select a station!");
    const driverId = localStorage.getItem("userId");
    const token = localStorage.getItem("token");
    const payload = {
      stationId: selectedStation,
      driverId,
      note: cancelNote,
      subscriptionId: current.subId,
      dateBooking: new Date().toISOString().split("T")[0],
      timeBooking: new Date().toLocaleTimeString("en-GB", {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };

    try {
      await api.post("/Booking/booking-cancel-plan", payload, {
        headers: { Authorization: `Bearer ${token}` },
      });
      alert("✅ Subscription canceled successfully!");
      setShowCancelModal(false);
      navigate("/user/transaction");
    } catch (err) {
      console.error("❌ Cancel failed:", err.response?.data || err);
      alert(err.response?.data?.message || "Failed to cancel!");
    }
  };

  // ♻️ Gia hạn
  const handleRenew = async () => {
    if (!current) return alert("No active subscription to renew!");
    const driverId = localStorage.getItem("userId");
    const token = localStorage.getItem("token");
    try {
      await api.post(
        "/Subscription/renew",
        { driverId, subId: current.subId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert("✅ Subscription renewed successfully!");
      navigate("/user/transaction");
    } catch (error) {
      console.error("❌ Renew failed:", error);
      alert("Failed to renew subscription!");
    } finally {
      setShowRenewModal(false);
    }
  };

  if (loading)
    return (
      <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-[#01E6FF] to-[#78FC92]">
        <div className="h-10 w-10 border-4 border-t-transparent border-white rounded-full animate-spin"></div>
      </div>
    );

  // 🧩 Nếu chưa có gói nào
  if (!current)
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-[#01E6FF] to-[#78FC92]">
        <div className="bg-white/70 backdrop-blur-md p-10 rounded-3xl shadow-2xl max-w-lg text-center border border-white/30">
          <h3 className="text-2xl font-bold mb-3 text-gray-800">
            {apiMessage}
          </h3>
          <p className="text-gray-600 mb-5">
            Register now to enjoy battery swaps and exclusive benefits.
          </p>
          <button
            onClick={() => navigate("/user/service/register")}
            className="px-6 py-3 bg-gradient-to-r from-blue-500 to-green-500 text-white font-semibold rounded-xl hover:opacity-90 transition"
          >
            ➕ Register new Service
          </button>
        </div>
      </div>
    );

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#01E6FF] to-[#78FC92] py-6 px-6 flex justify-center items-center">
      <div className="max-w-6xl w-full grid md:grid-cols-2 gap-8 bg-white/60 backdrop-blur-lg p-8 rounded-3xl shadow-2xl border border-white/30">
        {/* LEFT: Subscription Card */}
        <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100 flex flex-col">
          <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <i className="bi bi-box-seam text-blue-600"></i> Subscription
          </h2>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-600 mb-1">
              Select Subscription
            </label>
            <select
              value={selected}
              onChange={(e) => setSelected(e.target.value)}
              className="w-full border border-gray-300 rounded-xl p-2 focus:ring-2 focus:ring-blue-400"
            >
              {subs.map((s) => (
                <option key={s.subId} value={s.subId}>
                  {s.subId} — {s.planName}
                </option>
              ))}
            </select>
          </div>

          {/* Current Plan Info */}
          <div className="bg-gradient-to-r from-cyan-400 to-green-300 rounded-xl p-4 text-white mb-4">
            <p className="text-sm font-semibold">Current Plan</p>
            <h3 className="text-2xl font-bold">{current.planName}</h3>
            <p className="text-sm mt-1">End date: {current.endDate || "—"}</p>
            <p className="text-sm mt-1">
              Battery ID:{" "}
              {Array.isArray(current.batteryDtos) &&
                current.batteryDtos.length > 0
                ? current.batteryDtos.map((b) => b.batteryId).join(", ")
                : "You have no batteries assigned!"}
            </p>
            <p className="text-sm mt-2 text-white/90">
              Status: {current.planStatus || "Active"}
            </p>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-3 mt-auto">
            <button
              onClick={() => {
                setShowCancelModal(true);
                loadStations();
              }}
              className="w-full bg-red-500 text-white py-2.5 rounded-xl font-semibold hover:bg-red-600 transition"
            >
              ❌ Cancel Subscription
            </button>
            <button
              onClick={() => navigate("/user/service/register")}
              className="w-full bg-indigo-500 text-white py-2.5 rounded-xl font-semibold hover:bg-indigo-600 transition"
            >
              ✚ Register new Service
            </button>
          </div>
        </div>

        {/* RIGHT: Usage Statistics */}
        <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100 flex flex-col">
          <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <i className="bi bi-graph-up-arrow text-green-600"></i> Usage
            Statistics
          </h2>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="bg-blue-50 rounded-xl p-4">
              <p className="text-3xl font-bold text-blue-600">
                {current.remaining_swap}
              </p>
              <p className="text-gray-600 text-sm">Swaps remaining</p>
            </div>
            <div className="bg-green-50 rounded-xl p-4">
              <p className="text-3xl font-bold text-green-600">
                {current.current_miligate} km
              </p>
              <p className="text-gray-600 text-sm">Distance traveled</p>
            </div>
            <div className="bg-purple-50 rounded-xl p-4">
              <p className="text-2xl font-bold text-purple-600">
                {Number(current.subFee).toLocaleString("vi-VN")} VND
              </p>
              <p className="text-gray-600 text-sm">Total Charge</p>
            </div>
          </div>
        </div>
      </div>

      {/* Cancel Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 flex justify-center items-center bg-black/40 backdrop-blur-sm z-50">
          <div className="bg-white rounded-2xl p-6 w-[90%] max-w-md shadow-2xl border border-gray-200">
            <h3 className="text-xl font-bold mb-3 text-red-600">
              Cancel Subscription
            </h3>

            <label className="block text-gray-700 font-medium mb-2">
              Select Station
            </label>
            <select
              className="w-full border rounded-lg p-2 mb-4"
              value={selectedStation}
              onChange={(e) => setSelectedStation(e.target.value)}
            >
              {stations.map((st) => (
                <option key={st.stationId} value={st.stationId}>
                  {st.stationName}
                </option>
              ))}
            </select>

            <label className="block text-gray-700 font-medium mb-2">
              Reason (optional)
            </label>
            <textarea
              className="w-full border rounded-lg p-2 mb-4"
              placeholder="Enter note..."
              value={cancelNote}
              onChange={(e) => setCancelNote(e.target.value)}
            />

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowCancelModal(false)}
                className="px-5 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
              >
                Close
              </button>
              <button
                onClick={handleCancelSubscription}
                className="px-5 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Renew Modal */}
      {showRenewModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex justify-center items-center z-50">
          <div className="bg-white rounded-2xl p-6 w-[90%] max-w-md shadow-2xl text-center">
            <h3 className="text-xl font-semibold text-gray-800 mb-3">
              Renew Subscription
            </h3>
            <p className="text-gray-600 mb-6">
              Do you want to renew your current plan{" "}
              <strong>{current.planName}</strong>?
            </p>
            <div className="flex justify-center gap-4">
              <button
                onClick={() => setShowRenewModal(false)}
                className="px-5 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={handleRenew}
                className="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
