import React, { useState, useEffect } from "react";
import api from "@/api/api";
// eslint-disable-next-line no-unused-vars
import { motion } from "framer-motion";

export default function Support() {
    const [reportTypes, setReportTypes] = useState([]);
    const [selectedType, setSelectedType] = useState("");
    const [reportNote, setReportNote] = useState("");
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState("");
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        const fetchReportTypes = async () => {
            try {
                const res = await api.get("/Report/get-driver-report-list");
                setReportTypes(res.data?.data || []);
            } catch {
                setMessage("❌ Failed to load report types.");
            } finally {
                setLoading(false);
            }
        };
        fetchReportTypes();
    }, []);

    const handleSubmit = async () => {
        if (!selectedType) return alert("⚠️ Please select report type!");
        if (!reportNote.trim()) return alert("⚠️ Please enter report details!");
        const driverId = localStorage.getItem("userId");
        if (!driverId) return alert("⚠️ Please log in first!");

        const payload = {
            driverId,
            reportTypeId: parseInt(selectedType),
            reportNote: reportNote.trim(),
        };

        try {
            setSubmitting(true);
            await api.post("/Report/Driver-create-report", payload);
            setMessage("✅ Report sent successfully!");
            setReportNote("");
            setSelectedType("");
            setTimeout(() => setMessage(""), 3000);
        } catch {
            setMessage("❌ Failed to send report.");
        } finally {
            setSubmitting(false);
        }
    };

    if (loading)
        return (
            <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-cyan-100 to-yellow-100">
                <div className="h-10 w-10 animate-spin border-4 border-blue-400 border-t-transparent rounded-full"></div>
                <p className="ml-3 text-gray-600">Loading support center...</p>
            </div>
        );

    return (
        <div className="min-h-screen flex justify-center items-center bg-gradient-to-br from-[#01E6FF] to-[#78FC92] px-4 py-10">
            <motion.div
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white w-[420px] p-8 rounded-3xl shadow-2xl border"
            >
                <div className="flex items-center justify-center gap-2 mb-6">
                    <i className="bi bi-tools text-3xl text-blue-500"></i>
                    <h2 className="text-2xl font-bold text-gray-800">Report an Issue</h2>
                </div>

                {message && (
                    <div
                        className={`text-center mb-3 p-3 rounded-xl font-medium ${message.startsWith("✅")
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700"
                            }`}
                    >
                        {message}
                    </div>
                )}

                <label className="block text-gray-700 font-medium mb-1">
                    Report Type
                </label>
                <select
                    value={selectedType}
                    onChange={(e) => setSelectedType(e.target.value)}
                    className="w-full mb-4 p-3 bg-gray-50 border rounded-xl focus:ring-2 focus:ring-blue-400"
                >
                    <option value="">Choose type</option>
                    {reportTypes.map((r) => (
                        <option key={r.reportTypeId} value={r.reportTypeId}>
                            {r.reportType}
                        </option>
                    ))}
                </select>

                <label className="block text-gray-700 font-medium mb-1">
                    Report Detail
                </label>
                <textarea
                    rows="4"
                    value={reportNote}
                    onChange={(e) => setReportNote(e.target.value)}
                    className="w-full p-3 bg-gray-50 border rounded-xl focus:ring-2 focus:ring-green-400 resize-none"
                    placeholder="Describe your issue..."
                ></textarea>

                <button
                    onClick={handleSubmit}
                    disabled={submitting}
                    className={`w-full mt-6 py-2.5 rounded-xl text-white font-semibold transition ${submitting
                        ? "bg-gray-400"
                        : "bg-gradient-to-r from-blue-500 to-green-500 hover:opacity-90"
                        }`}
                >
                    {submitting ? "Sending..." : "Send Report"}
                </button>
            </motion.div>
        </div>
    );
}
