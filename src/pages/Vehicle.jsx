import React, { useEffect, useState } from "react";
import api from "../api/api";
import { useNavigate } from "react-router-dom";

export default function Vehicle() {
    const [vehicles, setVehicles] = useState([]);
    const [newVehicle, setNewVehicle] = useState({
        vin: "",
        name: "",
        batteryCount: "",
    });
    const navigate = useNavigate();

    // ✅ Load danh sách xe từ API
    useEffect(() => {
        const fetch = async () => {
            try {
                const res = await api.get("/Vehicle/GetAll");
                setVehicles(res.data);
            } catch (error) {
                console.error("Failed to load vehicles:", error);
            }
        };
        fetch();
    }, []);

    // ✅ Gợi ý gói dựa theo số pin
    const getSuggestedPlans = (count) => {
        switch (parseInt(count)) {
            case 1:
                return ["G1", "TP1"];
            case 2:
                return ["G2", "TP2"];
            case 3:
                return ["G3", "TP3"];
            case 4:
                return ["GU", "TP4U"];
            default:
                return [];
        }
    };

    // ✅ Thêm xe mới
    const handleAddVehicle = async () => {
        if (!newVehicle.vin || !newVehicle.name || !newVehicle.batteryCount) {
            alert("⚠️ Please fill in all fields before adding a vehicle!");
            return;
        }

        const suggested = getSuggestedPlans(newVehicle.batteryCount);
        try {
            // ➕ Thêm xe
            const res = await api.post("/Vehicle/Add", newVehicle);
            setVehicles([...vehicles, res.data]);

            // 💡 Tạo transaction “Add Vehicle” (0₫)
            await api.post("/Transaction/Create", {
                id: "T" + Date.now(),
                title: `Add Vehicle ${newVehicle.name}`,
                amount: 0,
                date: new Date().toISOString().split("T")[0],
                status: "Paid",
            });

            // ✅ Thông báo & điều hướng
            alert(
                `✅ Vehicle added successfully!\nSuggested Plans: ${suggested.join(
                    " or "
                )}`
            );
            navigate("/user/service/register");
        } catch (err) {
            console.error(err);
            alert("❌ Failed to add vehicle.");
        }
    };

    // ✅ Xoá xe
    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this vehicle?"))
            return;

        try {
            await api.delete(`/Vehicle/Delete/${id}`);
            setVehicles(vehicles.filter((v) => v.id !== id));
            alert("🗑️ Vehicle deleted successfully!");
        } catch (err) {
            console.error(err);
            alert("❌ Failed to delete vehicle.");
        }
    };

    return (
        <div className="p-6 bg-gray-50 min-h-screen">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                🚗 My Vehicles
            </h2>

            {/* 🧾 Form thêm xe */}
            <div className="bg-white p-4 rounded-lg shadow-md mb-6">
                <h3 className="font-semibold mb-3 text-gray-700">Add a new vehicle</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <input
                        placeholder="VIN Number"
                        className="border rounded-md p-2"
                        value={newVehicle.vin}
                        onChange={(e) =>
                            setNewVehicle({ ...newVehicle, vin: e.target.value })
                        }
                    />
                    <input
                        placeholder="Vehicle Name"
                        className="border rounded-md p-2"
                        value={newVehicle.name}
                        onChange={(e) =>
                            setNewVehicle({ ...newVehicle, name: e.target.value })
                        }
                    />
                    <select
                        className="border rounded-md p-2"
                        value={newVehicle.batteryCount}
                        onChange={(e) =>
                            setNewVehicle({ ...newVehicle, batteryCount: e.target.value })
                        }
                    >
                        <option value="">Select battery count</option>
                        {[1, 2, 3, 4].map((n) => (
                            <option key={n} value={n}>
                                {n} battery{n > 1 ? " packs" : ""}
                            </option>
                        ))}
                    </select>
                </div>
                <button
                    onClick={handleAddVehicle}
                    className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition"
                >
                    ➕ Add Vehicle
                </button>
            </div>

            {/* 🚘 Danh sách xe */}
            {vehicles.length === 0 ? (
                <p className="text-gray-600 italic">No vehicles registered yet.</p>
            ) : (
                <div className="space-y-3">
                    {vehicles.map((v) => (
                        <div
                            key={v.id}
                            className="bg-white shadow p-4 rounded-md flex justify-between items-center"
                        >
                            <div>
                                <p className="font-semibold text-gray-800">{v.name}</p>
                                <p className="text-sm text-gray-500">VIN: {v.vin}</p>
                                <p className="text-sm text-gray-600">
                                    Batteries: {v.batteryCount || "N/A"}
                                </p>
                            </div>
                            <button
                                onClick={() => handleDelete(v.id)}
                                className="bg-red-500 text-white px-3 py-1 rounded-md hover:bg-red-600 transition"
                            >
                                Delete
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}