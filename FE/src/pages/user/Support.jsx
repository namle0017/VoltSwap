import React, { useState, useEffect } from "react";
import api from "@/api/api";

export default function Support() {
  const [reportTypes, setReportTypes] = useState([]); // lấy từ /Report/get-report-list
  const [selectedType, setSelectedType] = useState("");
  const [reportNote, setReportNote] = useState("");
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // 🔹 Load danh sách loại report
  useEffect(() => {
    const fetchReportTypes = async () => {
      try {
        const res = await api.get("/Report/get-report-list");
        const data = res.data?.data || [];
        setReportTypes(data);
      } catch (err) {
        console.error("❌ Failed to load report types:", err);
        setMessage("❌ Failed to load report types.");
      } finally {
        setLoading(false);
      }
    };
    fetchReportTypes();
  }, []);

  // 🔸 Gửi report mới
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
      const res = await api.post("/Report/Driver-create-report", payload);
      console.log("✅ Report created:", res.data);
      setMessage("✅ Report sent successfully!");
      setReportNote("");
      setSelectedType("");
      setTimeout(() => setMessage(""), 3000);
    } catch (err) {
      console.error("❌ Error creating report:", err);
      setMessage("❌ Failed to send report.");
    } finally {
      setSubmitting(false);
    }
  };

  // ⏳ Loading UI
  if (loading)
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="h-10 w-10 animate-spin border-4 border-blue-400 border-t-transparent rounded-full"></div>
        <p className="ml-3 text-gray-600">Loading support center...</p>
      </div>
    );

  return (
    <div className="flex justify-center items-start min-h-screen bg-gray-100 py-10 px-4">
      <div className="bg-white p-6 rounded-2xl shadow-lg w-[440px] border border-gray-200">
        <h2 className="text-center font-semibold text-lg mb-4">
          Report an Issue <span className="text-gray-400">🛠️</span>
        </h2>

        {/* Thông báo */}
        {message && (
          <div
            className={`text-center mb-3 p-3 rounded-lg font-medium ${
              message.startsWith("✅")
                ? "bg-green-100 text-green-700"
                : "bg-red-100 text-red-600"
            }`}
          >
            {message}
          </div>
        )}

        {/* Loại report */}
        <label className="font-medium block mb-1">Report Type</label>
        <select
          value={selectedType}
          onChange={(e) => setSelectedType(e.target.value)}
          className="w-full p-2 mb-4 bg-yellow-100 border border-yellow-200 rounded-lg focus:ring-2 focus:ring-yellow-300"
        >
          <option value="">Choose Type</option>
          {reportTypes.map((r) => (
            <option key={r.reportTypeId} value={r.reportTypeId}>
              {r.reportType}
            </option>
          ))}
        </select>

        {/* Nội dung */}
        <label className="font-medium block mb-1">Report Detail</label>
        <textarea
          rows="4"
          placeholder="Describe the issue..."
          value={reportNote}
          onChange={(e) => setReportNote(e.target.value)}
          className="w-full p-2 bg-cyan-100 border border-cyan-200 rounded-lg focus:ring-2 focus:ring-cyan-300 resize-none"
        ></textarea>

        <button
          onClick={handleSubmit}
          disabled={submitting}
          className={`w-full mt-4 py-2 rounded-lg text-white font-semibold transition ${
            submitting
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-black hover:bg-gray-900"
          }`}
        >
          {submitting ? "Sending..." : "Send Report"}
        </button>
      </div>
    </div>
  );
}
