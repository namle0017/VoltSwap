// src/pages/user/Service.jsx
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
        // 🌟 Lấy message từ BE trả về (dynamic)
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
      setSelectedStation(data[0]?.stationId || ""); // chọn mặc định
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
  // ♻️ Renew plan
  const handleRenew = async () => {
    if (!current) return alert("No active subscription to renew!");
    const driverId = localStorage.getItem("userId");
    const token = localStorage.getItem("token");

    try {
      await api.post(
        "/Subscription/renew",
        {
          driverId: driverId,
          subId: current.subId,
        },
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
      <div className="flex justify-center items-center min-h-screen">
        <div className="h-10 w-10 border-4 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );

  // 🧩 Nếu chưa có gói nào -> hiện form register
  if (!current)
    return (
      <div className="text-center bg-white p-8 rounded-2xl shadow-md border max-w-xl mx-auto mt-16">
        <h3 className="text-xl font-semibold mb-2">{apiMessage}</h3>
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
    );

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
        📦 Subscription
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* LEFT CARD - CURRENT PLAN */}
        <div
          className="p-6 rounded-2xl shadow-lg text-gray-800"
          style={{
            background: "linear-gradient(135deg, #01e6ffff 0%, #78fc92ff 100%)",
          }}
        >
          <h3 className="text-lg text-gray-700 mb-1">Current subscription</h3>
          <h2 className="text-3xl font-bold text-blue-900 mb-2">
            {current.planName}
          </h2>
          <div className="mb-4">
            <label className="block text-gray-700 font-semibold mb-1">
              Select Subscription:
            </label>
            <select
              value={selected}
              onChange={(e) => setSelected(e.target.value)}
              className="w-full border px-3 py-2 rounded-lg bg-white"
            >
              {subs.map((s) => (
                <option key={s.subId} value={s.subId}>
                  {s.subId} — {s.planName}
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-between items-center mb-4">
            <div>
              <p className="text-gray-600 text-sm">Status</p>
              <p className="font-semibold text-green-700 capitalize">
                {current.planStatus || "Active"}
              </p>
            </div>
            <div className="text-right">
              <p className="text-gray-600 text-sm">End Date</p>
              <p className="font-semibold text-gray-800">
                {current.endDate || "—"}
              </p>
            </div>
          </div>

          <div className="bg-white bg-opacity-30 rounded-xl p-3 mb-4">
            <p className="font-semibold">Battery Usage</p>
            <p className="text-sm text-gray-700">
              Remaining swaps: {current.remaining_swap} | Mileage:{" "}
              {current.current_miligate} km
            </p>
          </div>

          <div className="flex flex-col gap-2">
            {/* <button
              onClick={() => navigate("/user/service/change")}
              className="w-full bg-black text-white rounded-lg py-2 hover:bg-gray-900 transition mb-1 flex items-center justify-center gap-2"
            >
              <span>🔁</span> Change Plan →
            </button>

            <button
              onClick={() => setShowRenewModal(true)}
              className="w-full bg-blue-600 text-white rounded-lg py-2 hover:bg-blue-700 transition flex items-center justify-center gap-2"
            >
              <span>♻️</span> Renew Plan
            </button> */}
            <button
              onClick={() => {
                setShowCancelModal(true);
                loadStations();
              }}
              className="bg-red-600 text-white w-full py-2 rounded-lg hover:bg-red-700"
            >
              ❌ Cancel Subscription
            </button>
            <button
              onClick={() => navigate("/user/service/register")}
              className="w-full bg-indigo-500 text-white rounded-lg py-2 hover:bg-indigo-600 transition flex items-center justify-center gap-2"
            >
              <span>➕</span> Register new Service
            </button>
          </div>
        </div>

        {/* RIGHT CARD - STATISTICS */}
        <div className="p-6 bg-white rounded-2xl shadow-lg">
          <h3 className="text-lg font-semibold mb-4 text-gray-700">
            Usage Statistics
          </h3>

          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-blue-50 text-center">
              <p className="text-3xl font-bold text-blue-600">
                {current.remaining_swap}
              </p>
              <p className="text-gray-600 text-sm">Swaps remaining</p>
            </div>
            <div className="p-4 rounded-xl bg-green-50 text-center">
              <p className="text-3xl font-bold text-green-600">
                {current.current_miligate} km
              </p>
              <p className="text-gray-600 text-sm">Distance traveled</p>
            </div>
            <div className="p-4 rounded-xl bg-purple-50 text-center">
              <p className="text-3xl font-bold text-purple-600">
                {Number(current.subFee).toLocaleString("vi-VN")}VND
              </p>
              <p className="text-gray-600 text-sm">Total Charge</p>
            </div>
          </div>
        </div>
      </div>
      {/* 🔹 Modal xác nhận Cancel */}
      {showCancelModal && (
        <div className="fixed inset-0 flex justify-center items-center bg-black/40 z-50">
          <div className="bg-white rounded-2xl p-6 w-[90%] max-w-md shadow-xl">
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

            <div className="flex justify-center gap-4">
              <button
                onClick={() => setShowCancelModal(false)}
                className="px-5 py-2 bg-gray-300 rounded-lg hover:bg-gray-400"
              >
                Cancel
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
      {/* 🔹 Modal xác nhận Renew */}
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
                className="px-5 py-2 bg-gray-300 rounded-lg hover:bg-gray-400"
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
