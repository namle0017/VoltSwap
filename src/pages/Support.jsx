import React, { useState, useEffect } from "react";
import api from "../api/api";

export default function Support() {
  const [tickets, setTickets] = useState([]);
  const [issueType, setIssueType] = useState("");
  const [issueDetail, setIssueDetail] = useState("");
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const fetchTickets = async () => {
      try {
        const res = await api.get("/Support/GetAll");
        setTickets(res.data);
      } catch {
        setMessage("❌ Failed to load support tickets.");
      } finally {
        setLoading(false);
      }
    };
    fetchTickets();
  }, []);

  const handleSubmit = async () => {
    if (!issueType) return alert("Please select issue type!");
    if (!issueDetail.trim()) return alert("Please describe your situation!");
    try {
      const res = await api.post("/Support/Create", {
        subject: `${issueType}: ${issueDetail}`,
        status: "Pending",
      });
      setTickets([...tickets, res.data]);
      setMessage("✅ Request sent successfully!");
      setIssueType("");
      setIssueDetail("");
      setTimeout(() => setMessage(""), 2500);
    } catch {
      setMessage("❌ Failed to create support request.");
    }
  };

  if (loading)
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="h-10 w-10 animate-spin border-4 border-blue-400 border-t-transparent rounded-full"></div>
        <p className="ml-3 text-gray-600">Loading support center...</p>
      </div>
    );

  return (
    <div className="flex justify-center items-start min-h-screen bg-gray-100 py-10 px-4">
      <div className="bg-white p-6 rounded-2xl shadow-lg w-[420px] border border-gray-200">
        <h2 className="text-center font-semibold text-lg mb-4">
          Ask for Assistance <span className="text-gray-400">❓</span>
        </h2>

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

        <label className="font-medium block mb-1">Type of Issue</label>
        <select
          value={issueType}
          onChange={(e) => setIssueType(e.target.value)}
          className="w-full p-2 mb-4 bg-yellow-100 border border-yellow-200 rounded-lg focus:ring-2 focus:ring-yellow-300"
        >
          <option value="">Choose Type</option>
          <option>Login Problem</option>
          <option>Battery Swap Issue</option>
          <option>Payment / Billing</option>
          <option>Technical Support</option>
          <option>Other</option>
        </select>

        <label className="font-medium block mb-1">Issue detail</label>
        <textarea
          rows="4"
          placeholder="Describe your situation..."
          value={issueDetail}
          onChange={(e) => setIssueDetail(e.target.value)}
          className="w-full p-2 bg-cyan-100 border border-cyan-200 rounded-lg focus:ring-2 focus:ring-cyan-300 resize-none"
        ></textarea>

        <button
          onClick={handleSubmit}
          className="w-full bg-black text-white py-2 mt-4 rounded-lg hover:bg-gray-900 transition"
        >
          Send Request
        </button>
      </div>
    </div>
  );
}
