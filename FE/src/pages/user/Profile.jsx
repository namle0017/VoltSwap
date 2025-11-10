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
  const userId = localStorage.getItem("userId");

  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        const res = await api.get(`/User/user-information?UserId=${userId}`);
        const userData = res.data?.data || {};
        setForm({
          driverName: userData.driverName || "",
          driverEmail: userData.driverEmail || "",
          password: "",
          driverAddress: userData.driverAddress || "",
          driverTele: userData.driverTele || "",
          driverStatus: userData.driverStatus || "",
        });
      } catch {
        alert("Unable to fetch user information!");
      } finally {
        setLoading(false);
      }
    };
    fetchUserInfo();
  }, [userId]);

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleUpdate = async () => {
    try {
      const token = localStorage.getItem("token");
      const payload = {
        userDriverId: userId,
        driverName: form.driverName,
        driverEmail: form.driverEmail,
        driverAddress: form.driverAddress,
        driverTele: form.driverTele,
      };
      await api.post("/User/update-user-information", payload, {
        headers: { Authorization: `Bearer ${token}` },
      });
      alert("✅ Information updated successfully!");
    } catch {
      alert("Update failed! Please try again.");
    }
  };

  if (loading)
    return (
      <div className="flex justify-center items-center min-h-screen text-gray-600">
        <div className="animate-spin h-10 w-10 border-4 border-blue-500 border-t-transparent rounded-full"></div>
        <p className="ml-3">Loading profile...</p>
      </div>
    );

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#01E6FF] to-[#78FC92] flex items-center justify-center py-10 px-4">
      <div className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-2xl border border-white/20">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-blue-500 to-green-500 flex items-center justify-center text-white text-2xl font-bold shadow-md">
            {form.driverName?.charAt(0)?.toUpperCase() || "U"}
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-800">
              Account Information
            </h2>
            <p className="text-gray-500 text-sm">
              Manage your personal details
            </p>
          </div>
        </div>

        {/* Form */}
        <div className="grid sm:grid-cols-2 gap-5">
          {/* Name */}
          <div>
            <label className="block text-gray-700 font-medium mb-1">Name</label>
            <div className="relative">
              <input
                type="text"
                name="driverName"
                value={form.driverName}
                onChange={handleChange}
                className="w-full p-2 pl-10 border rounded-xl bg-gray-50 focus:ring-2 focus:ring-blue-400 transition"
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="block text-gray-700 font-medium mb-1">
              Email
            </label>
            <div className="relative">
              <input
                type="email"
                name="driverEmail"
                value={form.driverEmail}
                onChange={handleChange}
                className="w-full p-2 pl-10 border rounded-xl bg-gray-50 focus:ring-2 focus:ring-blue-400 transition"
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="block text-gray-700 font-medium mb-1">
              Password
            </label>
            <div className="relative">
              <input
                type="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                placeholder="Enter new password (optional)"
                className="w-full p-2 pl-10 border rounded-xl bg-gray-50 focus:ring-2 focus:ring-blue-400 transition"
              />
            </div>
          </div>

          {/* Phone */}
          <div>
            <label className="block text-gray-700 font-medium mb-1">
              Phone
            </label>
            <div className="relative">
              <input
                type="text"
                name="driverTele"
                value={form.driverTele}
                onChange={handleChange}
                className="w-full p-2 pl-10 border rounded-xl bg-gray-50 focus:ring-2 focus:ring-blue-400 transition"
              />
            </div>
          </div>

          {/* Address */}
          <div className="sm:col-span-2">
            <label className="block text-gray-700 font-medium mb-1">
              Address
            </label>
            <div className="relative">
              <input
                type="text"
                name="driverAddress"
                value={form.driverAddress}
                onChange={handleChange}
                className="w-full p-2 pl-10 border rounded-xl bg-gray-50 focus:ring-2 focus:ring-blue-400 transition"
              />
            </div>
          </div>
        </div>

        {/* Button */}
        <button
          onClick={handleUpdate}
          className="w-full mt-8 bg-gradient-to-r from-blue-500 to-green-500 text-white py-3 rounded-xl font-semibold hover:opacity-90 transition-all shadow-md"
        >
          Save Changes
        </button>
      </div>
    </div>
  );
}
