// src/pages/Vehicle.jsx
import React, { useEffect, useState } from "react";
import api from "@/api/api";

export default function Vehicle() {
    const [vehicles, setVehicles] = useState([]);
    const [driverId, setDriverId] = useState("");
    const [showModal, setShowModal] = useState(false);
    const [loading, setLoading] = useState(false);
    const [pendingRecs, setPendingRecs] = useState([]); // VIN đang đợi recommend
    const [newVehicle, setNewVehicle] = useState({
        vin: "",
        model: "",
        batteryCount: "",
    });

    // ---- helper: map dữ liệu BE -> shape FE
    const mapVehicle = (x, i = 0) => ({
        id: x?.id ?? x?.vehicleId ?? x?.vin ?? `v-${i}`,
        vin: x?.vin ?? "--",
        model: x?.vehicleModel ?? x?.model ?? "Unknown Model",
        // list trả numberOfBattery, create có thể trả numberOfBat
        batteryCount:
            x?.numberOfBattery ?? x?.numberOfBat ?? x?.batteryCount ?? "N/A",
        recommendPlan: Array.isArray(x?.recommendPlan) ? x.recommendPlan : [],
        createdAt: x?.createdAt ?? null,
    });

    const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

    // ✅ Lấy driverId từ localStorage sau khi đăng nhập (KHÔNG đổi key bạn dùng)
    useEffect(() => {
        const id = localStorage.getItem("userId");
        if (id) {
            console.log("🔑 Driver ID found:", id);
            setDriverId(id);
        } else {
            console.warn("⚠️ No driverId found in localStorage!");
        }
    }, []);

    // ✅ Gọi API lấy danh sách xe (thêm _ts chống cache)
    const fetchVehicles = async () => {
        if (!driverId) return;
        try {
            setLoading(true);
            console.log("📡 GET /Vehicle/vehicle-list", { UserDriverId: driverId });
            const res = await api.get("/Vehicle/vehicle-list", {
                params: { UserDriverId: driverId, _ts: Date.now() },
            });

            const raw =
                (Array.isArray(res.data) && res.data) ||
                (Array.isArray(res.data?.data) && res.data.data) ||
                [];

            setVehicles(raw.map(mapVehicle));
        } catch (err) {
            console.error("❌ Error loading vehicles:", err);
            alert("❌ Failed to load vehicles. Check BE endpoint or UserDriverId param.");
            setVehicles([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (driverId) fetchVehicles();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [driverId]);

    // 🔁 Poll tới khi recommendPlan của VIN có dữ liệu (giới hạn lần thử)
    const refreshUntilRecommend = async (vin) => {
        const VIN = (vin || "").trim().toLowerCase();
        setPendingRecs((prev) => (prev.includes(VIN) ? prev : [...prev, VIN]));

        const MAX_TRIES = 8;      // ~10s nếu interval 1200ms
        const INTERVAL_MS = 1200; // chỉnh nếu cần

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
                if (found && Array.isArray(found.recommendPlan) && found.recommendPlan.length > 0) {
                    // có recommend rồi → bỏ khỏi pending
                    setPendingRecs((prev) => prev.filter((x) => x !== VIN));
                    return true;
                }
            } catch (e) {
                // ignore và thử lại
            }
        }
        // hết lượt mà chưa có → bỏ pending để không hiển thị vòng quay mãi
        setPendingRecs((prev) => prev.filter((x) => x !== VIN));
        return false;
    };

    // ✅ Thêm xe mới (gửi đúng schema BE + refetch + poll recommend)
    const handleCreateVehicle = async () => {
        if (!newVehicle.vin || !newVehicle.model || !newVehicle.batteryCount) {
            alert("⚠️ Please fill all fields before submitting!");
            return;
        }

        const numberOfBat = parseInt(newVehicle.batteryCount, 10);
        if (Number.isNaN(numberOfBat) || numberOfBat <= 0) {
            alert("⚠️ Battery Count must be a positive number!");
            return;
        }

        const vinInput = newVehicle.vin.trim();
        const body = {
            driverId,                              // lấy từ localStorage('userId')
            vin: vinInput,
            vehicleModel: newVehicle.model.trim(), // đúng key BE
            numberOfBat,                           // đúng key BE
        };

        try {
            console.log("📡 POST /Vehicle/Create-vehicle", body);
            await api.post("/Vehicle/Create-vehicle", body);

            // 1) Lấy lại list để xuất hiện xe vừa tạo
            await fetchVehicles();

            // 2) Poll nhẹ cho tới khi BE tính xong recommendPlan của VIN vừa tạo
            refreshUntilRecommend(vinInput); // không chặn UI

            alert("✅ Vehicle created successfully!");
            setShowModal(false);
            setNewVehicle({ vin: "", model: "", batteryCount: "" });
        } catch (err) {
            const detail =
                err?.response?.data?.message ||
                (typeof err?.response?.data === "string" ? err.response.data : "") ||
                JSON.stringify(err?.response?.data || {});
            console.error("❌ Failed to create vehicle:", err);
            alert("❌ Failed to create vehicle.\n" + detail);
        }
    };

    // ✅ DELETE đúng theo BE: /Vehicle/delete-vehicle + query
    const handleDeleteVehicle = async (vin) => {
        if (!window.confirm("🗑️ Are you sure you want to delete this vehicle?")) return;

        const VIN = (vin || "").trim();
        const VIN_LC = VIN.toLowerCase();

        // Optimistic UI
        const prev = vehicles;
        setVehicles((cur) => cur.filter((x) => (x.vin || "").trim() !== VIN));

        // chỉ dùng 1 endpoint, thử vài casing của param (query only)
        const queries = [
            { VIN: VIN, UserDriverId: driverId },
            { Vin: VIN, UserDriverId: driverId },
            { vin: VIN, UserDriverId: driverId },
            { VIN: VIN, userDriverId: driverId },
            { vin: VIN, driverId: driverId },
        ];

        let deleted = false;
        let lastErr = null;

        try {
            for (const q of queries) {
                try {
                    console.log("🗑️ DELETE /Vehicle/delete-vehicle", q);
                    await api.delete("/Vehicle/delete-vehicle", {
                        params: { ...q, _ts: Date.now() }, // chống cache
                    });

                    // Verify: refetch list rồi kiểm tra VIN còn hay không
                    const res = await api.get("/Vehicle/vehicle-list", {
                        params: { UserDriverId: driverId, _ts: Date.now() },
                    });
                    const raw =
                        (Array.isArray(res.data) && res.data) ||
                        (Array.isArray(res.data?.data) && res.data.data) ||
                        [];
                    const mapped = raw.map(mapVehicle);
                    setVehicles(mapped);

                    const still = mapped.some(
                        (v) => (v.vin || "").trim().toLowerCase() === VIN_LC
                    );
                    if (!still) {
                        deleted = true;
                        break;
                    }
                    // nếu BE trả 200 nhưng vẫn còn → thử casing kế tiếp
                } catch (e) {
                    lastErr = e; // lưu lại lỗi cuối
                    // thử casing tiếp theo
                }
            }
        } finally {
            if (!deleted) {
                // rollback nếu server chưa xóa thật
                setVehicles(prev);
                const apiMsg =
                    lastErr?.response?.data?.message ||
                    (typeof lastErr?.response?.data === "string"
                        ? lastErr.response.data
                        : "") ||
                    (lastErr ? JSON.stringify(lastErr?.response?.data || {}) : "Server error");
                alert(
                    "❌ Failed to delete on server.\n" +
                    (apiMsg ||
                        "Route đúng là /Vehicle/delete-vehicle nhưng query param chưa trúng. Kiểm tra Swagger: tên param chính xác (VIN/UserDriverId hay vin/driverId).")
                );
            } else {
                alert("✅ Vehicle deleted successfully!");
            }
        }
    };


    return (
        <div className="min-h-screen bg-gray-50 p-6">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                    🚗 My Vehicles
                </h1>
                <button
                    onClick={() => setShowModal(true)}
                    className="bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition"
                >
                    ➕ Add Vehicle
                </button>
            </div>

            {/* Modal thêm xe */}
            {showModal && (
                <div className="fixed inset-0 flex items-center justify-center bg-black/30 backdrop-blur-sm z-50">
                    <div className="bg-white p-6 rounded-2xl shadow-xl w-full max-w-md border border-gray-200">
                        <h2 className="text-xl font-semibold mb-4 text-center">
                            Create New Vehicle
                        </h2>

                        <div className="space-y-3">
                            <input
                                type="text"
                                placeholder="VIN"
                                value={newVehicle.vin}
                                onChange={(e) =>
                                    setNewVehicle({ ...newVehicle, vin: e.target.value })
                                }
                                className="w-full border rounded-md p-2 focus:ring-2 focus:ring-blue-400"
                            />
                            <input
                                type="text"
                                placeholder="Model"
                                value={newVehicle.model}
                                onChange={(e) =>
                                    setNewVehicle({ ...newVehicle, model: e.target.value })
                                }
                                className="w-full border rounded-md p-2 focus:ring-2 focus:ring-blue-400"
                            />
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
                                className="w-full border rounded-md p-2 focus:ring-2 focus:ring-blue-400"
                            />
                        </div>

                        <div className="flex justify-end gap-3 mt-5">
                            <button
                                onClick={handleCreateVehicle}
                                className="bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition"
                            >
                                ✅ Create
                            </button>
                            <button
                                onClick={() => setShowModal(false)}
                                className="bg-gray-200 px-4 py-2 rounded-lg hover:bg-gray-300 transition"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Danh sách xe */}
            {loading ? (
                <p className="text-center text-gray-500">Loading vehicles...</p>
            ) : vehicles.length > 0 ? (
                <div className="grid md:grid-cols-2 gap-6">
                    {vehicles.map((v) => {
                        const VIN = (v.vin || "").trim().toLowerCase();
                        const waiting = pendingRecs.includes(VIN) && (!v.recommendPlan || v.recommendPlan.length === 0);

                        return (
                            <div
                                key={v.id || v.vin}
                                className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-all"
                            >
                                <h3 className="font-semibold text-gray-800 text-lg mb-2">
                                    {v.model || "Unknown Model"}
                                </h3>

                                <p className="text-sm text-gray-600">
                                    <span className="font-medium">VIN:</span> {v.vin}
                                </p>
                                <p className="text-sm text-gray-600">
                                    <span className="font-medium">Battery:</span>{" "}
                                    {v.batteryCount ?? "N/A"}
                                </p>

                                <div className="mt-4 flex justify-between items-center">
                                    {/* Status → Recommend */}
                                    {waiting ? (
                                        <span className="text-sm text-purple-700 flex items-center gap-2">
                                            <span className="inline-block h-3 w-3 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" />
                                            Calculating recommend…
                                        </span>
                                    ) : (
                                        <span className="text-sm font-medium text-purple-700">
                                            Recommend:{" "}
                                            {v.recommendPlan?.length
                                                ? v.recommendPlan.join(", ")
                                                : "--"}
                                        </span>
                                    )}

                                    <button
                                        onClick={() => handleDeleteVehicle(v.vin)}
                                        className="text-red-600 hover:underline text-sm font-medium"
                                    >
                                        🗑️ Delete
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <p className="text-gray-500 text-center">No vehicles found.</p>
            )}
        </div>
    );
}
