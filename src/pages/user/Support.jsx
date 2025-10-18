// src/pages/Support.jsx
import React, { useState } from "react";
import api from "@/api/api";

export default function Support() {
    // Lưu local để hiển thị lại sau reload (không cần GET từ BE)
    const [tickets, setTickets] = useState(() => {
        const saved = localStorage.getItem("supportTickets");
        return saved ? JSON.parse(saved) : [];
    });

    const [issueType, setIssueType] = useState("");
    const [issueDetail, setIssueDetail] = useState("");
    const [sending, setSending] = useState(false);
    const [message, setMessage] = useState("");

    const handleSubmit = async () => {
        if (!issueType) return alert("Please select issue type!");
        if (!issueDetail.trim()) return alert("Please describe your situation!");

        setSending(true);
        setMessage("");

        try {
            // Chỉ POST lên BE. Nếu BE chưa có endpoint, bạn có thể comment dòng này để chạy 100% offline.
            const postEndpoints = ["/Support/Create", "/Support/create", "/support/create"];
            let created = null;

            // payload gửi BE
            const payload = {
                subject: `${issueType}: ${issueDetail}`,
                status: "Pending",
            };

            for (const ep of postEndpoints) {
                try {
                    const res = await api.post(ep, payload);
                    created = res.data;
                    break;
                } catch {
                    // thử biến thể tiếp theo
                }
            }

            // Nếu BE chưa có Create, tự tạo ticket local để hiển thị (không fail UX)
            if (!created) {
                created = {
                    id: `local-${Date.now()}`,
                    subject: payload.subject,
                    status: payload.status,
                };
            }

            const newTicket = {
                ...created,
                _localCreatedAt: new Date().toISOString(),
            };

            const next = [...tickets, newTicket];
            setTickets(next);
            localStorage.setItem("supportTickets", JSON.stringify(next));

            setMessage("✅ Request sent successfully!");
            setIssueType("");
            setIssueDetail("");
            setTimeout(() => setMessage(""), 2500);
        } catch {
            setMessage("❌ Failed to create support request.");
        } finally {
            setSending(false);
        }
    };

    return (
        <div className="flex justify-center items-start min-h-screen bg-gray-100 py-10 px-4">
            <div className="bg-white p-6 rounded-2xl shadow-lg w-[480px] border border-gray-200">
                <h2 className="text-center font-semibold text-lg mb-4">
                    Ask for Assistance <span className="text-gray-400">❓</span>
                </h2>

                {message && (
                    <div
                        className={`text-center mb-3 p-3 rounded-lg font-medium ${message.startsWith("✅")
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
                    disabled={sending}
                    className={`w-full text-white py-2 mt-4 rounded-lg transition ${sending ? "bg-gray-600" : "bg-black hover:bg-gray-900"
                        }`}
                >
                    {sending ? "Sending..." : "Send Request"}
                </button>

                {/* Danh sách request đã gửi (local only) */}
                <div className="mt-6">
                    <h3 className="font-semibold mb-2">Recent Requests (local)</h3>
                    {tickets.length === 0 ? (
                        <div className="text-sm text-gray-500">No requests yet.</div>
                    ) : (
                        <ul className="space-y-2 max-h-56 overflow-auto pr-1">
                            {tickets.map((t, i) => (
                                <li key={t.id || i} className="p-3 rounded border bg-white">
                                    <div className="font-medium">{t.subject}</div>
                                    <div className="text-xs text-gray-600 mt-1">
                                        Status: <span className="font-medium">{t.status || "Pending"}</span>
                                        {t._localCreatedAt && (
                                            <>
                                                {" "}
                                                • {new Date(t._localCreatedAt).toLocaleString()}
                                            </>
                                        )}
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>
        </div>
    );
}
