// src/pages/user/Support.jsx
import React, { useEffect, useState, useMemo } from "react";
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

    const MAX_LEN = 300;

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

    const leftChars = useMemo(
        () => Math.max(0, MAX_LEN - reportNote.length),
        [reportNote]
    );

    if (loading)
        return (
            <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-blue-50 to-blue-100">
                <div className="h-10 w-10 animate-spin border-4 border-blue-600 border-t-transparent rounded-full" />
                <p className="ml-3 text-gray-600">Loading support center...</p>
            </div>
        );

    return (
        <div className="min-h-screen flex justify-center items-center bg-gradient-to-br from-[#E8F1FF] via-[#DDEBFF] to-[#F2F7FF] px-4 py-10">
            <motion.div
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative w-[420px]"
            >
                {/* Blue glow ring */}
                <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 via-blue-400 to-indigo-500 rounded-[28px] blur-lg opacity-20" />
                <div className="relative bg-white p-8 rounded-3xl shadow-2xl border border-blue-100">
                    {/* Header */}
                    <div className="flex items-center justify-center gap-3 mb-6">
                        <div className="h-10 w-10 rounded-xl bg-blue-600 text-white grid place-items-center shadow">
                            <i className="bi bi-tools text-lg" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900">
                            <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                                Report an Issue
                            </span>
                        </h2>
                    </div>

                    {/* Toast/notice */}
                    {message && (
                        <div
                            className={`mb-4 rounded-xl px-3 py-2 text-sm font-medium ${message.startsWith("✅")
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                : "bg-rose-50 text-rose-700 border border-rose-200"
                                }`}
                        >
                            {message}
                        </div>
                    )}

                    {/* Type */}
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Report Type
                    </label>
                    <div className="relative mb-4">
                        <i className="bi bi-ui-checks-grid absolute left-3 top-2.5 text-blue-500/70" />
                        <select
                            value={selectedType}
                            onChange={(e) => setSelectedType(e.target.value)}
                            className="w-full pl-9 pr-3 py-2.5 bg-white border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600"
                        >
                            <option value="">Choose type</option>
                            {reportTypes.map((r) => (
                                <option key={r.reportTypeId} value={r.reportTypeId}>
                                    {r.reportType}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Detail */}
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Report Detail
                    </label>
                    <div className="relative">
                        <textarea
                            rows={5}
                            value={reportNote}
                            onChange={(e) =>
                                setReportNote(e.target.value.slice(0, MAX_LEN))
                            }
                            className="w-full px-3 py-2.5 bg-white border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 resize-y"
                            placeholder="Describe your issue, steps to reproduce, station/subscription involved…"
                        />
                        <div className="mt-1 flex items-center justify-between text-xs">
                            <span className="text-gray-500">
                                Tip: Attach exact error text if any.
                            </span>
                            <span
                                className={`px-2 py-0.5 rounded-full border ${leftChars <= 20
                                    ? "bg-amber-50 border-amber-200 text-amber-700"
                                    : "bg-blue-50 border-blue-200 text-blue-700"
                                    }`}
                                title="Characters remaining"
                            >
                                {leftChars} / {MAX_LEN}
                            </span>
                        </div>
                    </div>

                    {/* Submit */}
                    <button
                        onClick={handleSubmit}
                        disabled={submitting}
                        className={`w-full mt-6 py-2.5 rounded-xl text-white font-semibold transition ${submitting
                            ? "bg-blue-400 cursor-not-allowed"
                            : "bg-gradient-to-r from-blue-600 to-indigo-600 hover:opacity-95"
                            }`}
                    >
                        <span className="inline-flex items-center gap-2">
                            {submitting ? (
                                <>
                                    <span className="h-4 w-4 border-2 border-white/70 border-t-transparent rounded-full inline-block animate-spin" />
                                    Sending…
                                </>
                            ) : (
                                <>
                                    <i className="bi bi-send" />
                                    Send Report
                                </>
                            )}
                        </span>
                    </button>

                    {/* Small blue tip box */}
                    <div className="mt-4 rounded-xl border border-blue-200 bg-blue-50 p-3 text-xs text-gray-700">
                        <div className="font-medium text-gray-900 mb-1">
                            Help us fix it faster
                        </div>
                        <ul className="list-disc pl-4 space-y-1">
                            <li>Tell us when/where it happened (Station ID, time).</li>
                            <li>Mention your Subscription ID if related to billing/swap.</li>
                            <li>Include any screenshots or error codes if available.</li>
                        </ul>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
