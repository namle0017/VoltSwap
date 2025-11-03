import React, { useState, useEffect } from "react";
import api from "@/api/api";

export default function Profile() {
    const [form, setForm] = useState({
        driverName: "",
        driverEmail: "",
        password: "",
        driverAddress: "",
        driverTele: "",
        driverStatus: "",
    });

    const [loading, setLoading] = useState(true);
    const userId = localStorage.getItem("userId"); // 👈 Lấy từ localStorage

    useEffect(() => {
        const fetchUserInfo = async () => {
            try {
                const res = await api.get(`/User/user-information?UserId=${userId}`);
                console.log("✅ User Data:", res.data);

                const userData = res.data?.data || {};
                setForm({
                    driverName: userData.driverName || "",
                    driverEmail: userData.driverEmail || "",
                    password: "", // password không load từ BE
                    driverAddress: userData.driverAddress || "",
                    driverTele: userData.driverTele || "",
                    driverStatus: userData.driverStatus || "",
                });
            } catch (error) {
                console.error("❌ Failed to load user info:", error);
                alert("Unable to fetch user information!");
            } finally {
                setLoading(false);
            }
        };

        fetchUserInfo();
    }, [userId]);

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleUpdate = async () => {
        try {
            const token = localStorage.getItem("token");

            const payload = {
                userDriverId: userId, // 👈 BE cần UserId để biết ai update
                driverName: form.driverName,
                driverEmail: form.driverEmail,
                driverAddress: form.driverAddress,
                driverTele: form.driverTele,
                // password: form.password,
            };

            console.log("📤 Sending payload:", payload);

            await api.post("/User/update-user-information", payload, {
                headers: { Authorization: `Bearer ${token}` },
            });

            alert("✅ Information updated successfully!");
        } catch (error) {
            console.error("❌ Update failed:", error);
            alert("Update failed! Please try again.");
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-screen text-gray-600">
                <div className="animate-spin h-10 w-10 border-4 border-blue-500 border-t-transparent rounded-full"></div>
                <p className="ml-3">Loading profile...</p>
            </div>
        );
    }

    return (
        <div className="flex justify-center items-center min-h-screen bg-gray-50">
            <div className="bg-white shadow-lg rounded-2xl p-8 w-full max-w-lg">
                <h2 className="text-2xl font-bold mb-1">Account Information</h2>
                <p className="text-gray-500 mb-6">Manage your personal details</p>

                {/* Name */}
                <div className="mb-4">
                    <label className="block text-gray-700 font-medium">Name</label>
                    <input
                        type="text"
                        name="driverName"
                        value={form.driverName}
                        onChange={handleChange}
                        className="w-full mt-1 p-2 border rounded-md bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-400"
                    />
                </div>

                {/* Email */}
                <div className="mb-4">
                    <label className="block text-gray-700 font-medium">Email</label>
                    <input
                        type="email"
                        name="driverEmail"
                        value={form.driverEmail}
                        onChange={handleChange}
                        className="w-full mt-1 p-2 border rounded-md bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-400"
                    />
                </div>

                {/* Password */}
                <div className="mb-4">
                    <label className="block text-gray-700 font-medium">Password</label>
                    <input
                        type="password"
                        name="password"
                        value={form.password}
                        onChange={handleChange}
                        placeholder="Enter new password (optional)"
                        className="w-full mt-1 p-2 border rounded-md bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-400"
                    />
                </div>

                {/* Address */}
                <div className="mb-4">
                    <label className="block text-gray-700 font-medium">Address</label>
                    <input
                        type="text"
                        name="driverAddress"
                        value={form.driverAddress}
                        onChange={handleChange}
                        className="w-full mt-1 p-2 border rounded-md bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-400"
                    />
                </div>

                {/* Phone */}
                <div className="mb-4">
                    <label className="block text-gray-700 font-medium">Phone</label>
                    <input
                        type="text"
                        name="driverTele"
                        value={form.driverTele}
                        onChange={handleChange}
                        className="w-full mt-1 p-2 border rounded-md bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-400"
                    />
                </div>

                {/* Button Update */}
                <button
                    onClick={handleUpdate}
                    className="w-full bg-black text-white py-2 rounded-md hover:bg-gray-800 transition"
                >
                    Update Information
                </button>
            </div>
        </div>
    );
}