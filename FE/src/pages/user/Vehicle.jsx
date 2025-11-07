/* eslint-disable no-unused-vars */
/* eslint-disable no-empty */
import React, { useEffect, useState } from "react";
import api from "@/api/api";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

export default function Vehicle() {
  const [vehicles, setVehicles] = useState([]);
  const [driverId, setDriverId] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [pendingRecs, setPendingRecs] = useState([]);
  const [apiMessage, setApiMessage] = useState("");
  const [newVehicle, setNewVehicle] = useState({
    vin: "",
    model: "",
    batteryCount: "",
  });
  const navigate = useNavigate();

  const mapVehicle = (x, i = 0) => ({
    id: x?.id ?? x?.vehicleId ?? x?.vin ?? `v-${i}`,
    vin: x?.vin ?? "--",
    model: x?.vehicleModel ?? x?.model ?? "Unknown Model",
    batteryCount:
      x?.numberOfBattery ?? x?.numberOfBat ?? x?.batteryCount ?? "N/A",
    recommendPlan: Array.isArray(x?.recommendPlan) ? x.recommendPlan : [],
    createdAt: x?.createdAt ?? null,
  });

  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  useEffect(() => {
    const id = localStorage.getItem("userId");
    if (id) setDriverId(id);
  }, []);

  const fetchVehicles = async () => {
    if (!driverId) return;
    try {
      setLoading(true);
      const res = await api.get("/Vehicle/vehicle-list", {
        params: { UserDriverId: driverId, _ts: Date.now() },
      });
      const raw =
        (Array.isArray(res.data) && res.data) ||
        (Array.isArray(res.data?.data) && res.data.data) ||
        [];
      setVehicles(raw.map(mapVehicle));
    } catch (err) {
      const msg = err?.response?.data?.message;
      if (msg) {
        setVehicles([]);
        setApiMessage(msg);
        alert(msg);
      } else alert("⚠️ Could not load vehicles.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (driverId) fetchVehicles();
  }, [driverId]);

  const refreshUntilRecommend = async (vin) => {
    const VIN = (vin || "").trim().toLowerCase();
    setPendingRecs((prev) => (prev.includes(VIN) ? prev : [...prev, VIN]));
    const MAX_TRIES = 8;
    const INTERVAL_MS = 1200;

    for (let i = 0; i < MAX_TRIES; i++) {
      await sleep(INTERVAL_MS);
      try {
        const res = await api.get("/Vehicle/vehicle-list", {
          params: { UserDriverId: driverId, _ts: Date.now() },
        });
        const raw =
          (Array.isArray(res.data) && res.data) ||
          (Array.isArray(res.data?.data) && res.data.data) ||
          [];
        const mapped = raw.map(mapVehicle);
        setVehicles(mapped);

        const found = mapped.find(
          (v) => (v.vin || "").trim().toLowerCase() === VIN
        );
        if (found?.recommendPlan?.length > 0) {
          setPendingRecs((prev) => prev.filter((x) => x !== VIN));
          return true;
        }
      } catch { }
    }
    setPendingRecs((prev) => prev.filter((x) => x !== VIN));
    return false;
  };

  const handleCreateVehicle = async () => {
    if (!newVehicle.vin || !newVehicle.model || !newVehicle.batteryCount)
      return alert("⚠️ Please fill all fields!");
    const numberOfBat = parseInt(newVehicle.batteryCount, 10);
    if (isNaN(numberOfBat) || numberOfBat <= 0)
      return alert("⚠️ Battery count must be positive!");
    const body = {
      driverId,
      vin: newVehicle.vin.trim(),
      vehicleModel: newVehicle.model.trim(),
      numberOfBat,
    };
    try {
      await api.post("/Vehicle/Create-vehicle", body);
      await fetchVehicles();
      refreshUntilRecommend(newVehicle.vin);
      alert("✅ Vehicle created successfully!");
      setShowModal(false);
      setNewVehicle({ vin: "", model: "", batteryCount: "" });
    } catch (err) {
      alert("❌ Failed to create vehicle.");
    }
  };

  const handleDeleteVehicle = async (vin) => {
    if (!window.confirm("🗑️ Are you sure you want to delete this vehicle?"))
      return;
    try {
      await api.delete("/Vehicle/delete-vehicle", {
        params: { VIN: vin, UserDriverId: driverId },
      });
      await fetchVehicles();
      alert("✅ Vehicle deleted successfully!");
    } catch {
      alert("❌ Failed to delete vehicle!");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#01E6FF]/20 to-[#78FC92]/20 py-10 px-6">
      <div className="max-w-6xl mx-auto bg-white/80 backdrop-blur-md border border-gray-100 shadow-2xl rounded-3xl p-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
            <i className="bi bi-car-front-fill text-blue-600 text-3xl"></i> My
            Vehicles
          </h1>
          <button
            onClick={() => setShowModal(true)}
            className="px-5 py-2 bg-gradient-to-r from-blue-500 to-green-500 text-white rounded-xl hover:opacity-90 transition font-semibold"
          >
            ➕ Add Vehicle
          </button>
        </div>

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm z-50">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 border"
            >
              <h2 className="text-xl font-bold text-gray-800 text-center mb-5">
                Create New Vehicle
              </h2>
              <div className="space-y-3">
                <div className="relative">
                  <i className="bi bi-upc-scan absolute left-3 top-3 text-gray-400"></i>
                  <input
                    type="text"
                    placeholder="VIN"
                    value={newVehicle.vin}
                    onChange={(e) =>
                      setNewVehicle({ ...newVehicle, vin: e.target.value })
                    }
                    className="w-full border rounded-xl p-2 pl-10 bg-gray-50 focus:ring-2 focus:ring-blue-400"
                  />
                </div>
                <div className="relative">
                  <i className="bi bi-car-front absolute left-3 top-3 text-gray-400"></i>
                  <input
                    type="text"
                    placeholder="Model"
                    value={newVehicle.model}
                    onChange={(e) =>
                      setNewVehicle({ ...newVehicle, model: e.target.value })
                    }
                    className="w-full border rounded-xl p-2 pl-10 bg-gray-50 focus:ring-2 focus:ring-blue-400"
                  />
                </div>
                <div className="relative">
                  <i className="bi bi-battery-charging absolute left-3 top-3 text-gray-400"></i>
                  <input
                    type="number"
                    placeholder="Battery Count"
                    value={newVehicle.batteryCount}
                    onChange={(e) =>
                      setNewVehicle({
                        ...newVehicle,
                        batteryCount: e.target.value,
                      })
                    }
                    className="w-full border rounded-xl p-2 pl-10 bg-gray-50 focus:ring-2 focus:ring-blue-400"
                  />
                </div>
              </div>
              <div className="flex justify-center gap-3 mt-6">
                <button
                  onClick={handleCreateVehicle}
                  className="px-5 py-2 bg-gradient-to-r from-blue-500 to-green-500 text-white rounded-xl hover:opacity-90"
                >
                  ✅ Create
                </button>
                <button
                  onClick={() => setShowModal(false)}
                  className="px-5 py-2 bg-gray-200 rounded-xl hover:bg-gray-300"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* Vehicle List */}
        {loading ? (
          <div className="text-center text-gray-600">
            <div className="inline-block h-8 w-8 border-4 border-t-transparent border-blue-500 rounded-full animate-spin mr-2"></div>
            Loading vehicles...
          </div>
        ) : vehicles.length > 0 ? (
          <div className="grid md:grid-cols-2 gap-6">
            {vehicles.map((v) => {
              const VIN = (v.vin || "").trim().toLowerCase();
              const waiting =
                pendingRecs.includes(VIN) &&
                (!v.recommendPlan || v.recommendPlan.length === 0);
              return (
                <motion.div
                  key={v.id || v.vin}
                  whileHover={{ scale: 1.02 }}
                  className="bg-white rounded-2xl border shadow-md p-5 hover:shadow-xl transition-all"
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-bold text-lg text-gray-800 flex items-center gap-2">
                      <i className="bi bi-ev-front-fill text-green-500"></i>{" "}
                      {v.model}
                    </h3>
                    <button
                      onClick={() => handleDeleteVehicle(v.vin)}
                      className="text-red-500 hover:text-red-700 text-sm font-medium"
                    >
                      🗑️ Delete
                    </button>
                  </div>

                  <p className="text-sm text-gray-600">
                    <span className="font-medium">VIN:</span> {v.vin}
                  </p>
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Battery:</span>{" "}
                    {v.batteryCount}
                  </p>

                  <div className="mt-4 flex justify-between items-center">
                    {waiting ? (
                      <span className="text-sm text-purple-700 flex items-center gap-2">
                        <span className="inline-block h-3 w-3 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" />
                        Calculating recommend...
                      </span>
                    ) : (
                      <span
                        className="text-sm text-blue-700 font-medium cursor-pointer hover:underline"
                        onClick={() =>
                          navigate(
                            `/user/service/suggest?planList=${encodeURIComponent(
                              v.recommendPlan.join(",")
                            )}`
                          )
                        }
                      >
                        Recommend:{" "}
                        {v.recommendPlan?.length
                          ? v.recommendPlan.join(", ")
                          : "--"}
                      </span>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        ) : (
          <p className="text-gray-500 text-center mt-10">No vehicles found.</p>
        )}
      </div>
    </div>
  );
}
