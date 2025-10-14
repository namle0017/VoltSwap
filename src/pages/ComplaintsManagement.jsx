// src/pages/ComplaintsManagement.jsx
import { useEffect, useMemo, useState } from "react";
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from "framer-motion";
import PageTransition from "../components/PageTransition";
import { fetchComplaints, fetchStaffList, assignStaff } from "../api/complaintsApi";

const STATUS = {
    OPEN: "Open",
    ASSIGNED: "Assigned",
    RESOLVED: "Resolved",
};

const ComplaintsManagement = () => {
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [showFilters, setShowFilters] = useState(false);

    // Data
    const [complaints, setComplaints] = useState([]);
    const [loadingComplaints, setLoadingComplaints] = useState(true);
    const [complaintsError, setComplaintsError] = useState("");

    const [staffs, setStaffs] = useState([]);
    const [loadingStaffs, setLoadingStaffs] = useState(false);
    const [staffsError, setStaffsError] = useState("");

    // Modals
    const [assignModal, setAssignModal] = useState(null);     // { complaintId }
    const [assignSubmitting, setAssignSubmitting] = useState(false);
    const [responseModal, setResponseModal] = useState(null); // { complaintId }

    // ==== Effects: fetch complaints on mount ====
    useEffect(() => {
        (async () => {
            setLoadingComplaints(true);
            setComplaintsError("");
            try {
                const list = await fetchComplaints();
                // Chuẩn hoá dữ liệu BE -> dữ liệu FE đang dùng
                const normalized = list.map((r) => ({
                    // FE hiện đang hiển thị: id, title, customerName/Email, createdAt, station, content, status, assignedTo, timeline
                    id: `CMP-${r.reportId}`, // hiển thị đẹp; nếu cần nguyên gốc, giữ thêm reportId
                    reportId: r.reportId,
                    title: r.note || "(No title)",
                    customerName: r.userDriverId || "Unknown Driver",
                    customerEmail: "", // nếu BE chưa có
                    createdAt: r.createAt?.slice(0, 10) ?? "",
                    station: r.stationName || "", // nếu BE có, còn không để trống
                    content: r.note || "",
                    status:
                        (r.status === "Processing" && STATUS.ASSIGNED) ||
                        (r.status === "Resolved" && STATUS.RESOLVED) ||
                        STATUS.OPEN,
                    assignedTo: r.userStaffId
                        ? { id: r.userStaffId, name: r.userStaffId }
                        : null,
                    timeline: [
                        {
                            time: (r.createAt || "").replace("T", " ").slice(0, 16),
                            text: "Report created",
                        },
                    ],
                }));
                setComplaints(normalized);
            } catch (e) {
                setComplaintsError(
                    e?.response?.data?.message ||
                    e?.message ||
                    "Không tải được danh sách complaints."
                );
            } finally {
                setLoadingComplaints(false);
            }
        })();
    }, []);

    // ==== Helpers UI ====
    const badge = (st) =>
    ({
        [STATUS.OPEN]: "bg-gray-100 text-gray-800",
        [STATUS.ASSIGNED]: "bg-indigo-100 text-indigo-800",
        [STATUS.RESOLVED]: "bg-green-100 text-green-800",
    }[st] || "bg-gray-100 text-gray-800");

    const filtered = useMemo(() => {
        const s = search.trim().toLowerCase();
        return complaints.filter((c) => {
            const matchSearch =
                !s ||
                c.title.toLowerCase().includes(s) ||
                c.customerName.toLowerCase().includes(s) ||
                c.id.toLowerCase().includes(s) ||
                String(c.reportId).includes(s);
            const matchStatus =
                statusFilter === "all" || c.status.toLowerCase() === statusFilter;
            return matchSearch && matchStatus;
        });
    }, [complaints, search, statusFilter]);

    // ==== Actions ====
    const openAssign = async (complaintId) => {
        setAssignModal({ complaintId });
        if (!staffs.length) {
            setLoadingStaffs(true);
            setStaffsError("");
            try {
                const list = await fetchStaffList();
                setStaffs(list);
            } catch (e) {
                setStaffsError(
                    e?.response?.data?.message ||
                    e?.message ||
                    "Không tải được danh sách nhân viên."
                );
            } finally {
                setLoadingStaffs(false);
            }
        }
    };

    const handleAssign = async (staffId) => {
        if (!assignModal?.complaintId) return;
        setAssignSubmitting(true);
        try {
            const assigned = await assignStaff({
                reportId: Number(
                    complaints.find((c) => c.id === assignModal.complaintId)?.reportId
                ),
                staffId,
            });
            // Cập nhật complaint trong state
            setComplaints((prev) =>
                prev.map((c) =>
                    c.id === assignModal.complaintId
                        ? {
                            ...c,
                            status: STATUS.ASSIGNED,
                            assignedTo: { id: assigned.staffId, name: assigned.staffName },
                            timeline: [
                                ...c.timeline,
                                {
                                    time: new Date().toISOString().slice(0, 16).replace("T", " "),
                                    text: `Assigned to ${assigned.staffName} (${assigned.staffId})`,
                                },
                            ],
                        }
                        : c
                )
            );
            setAssignModal(null);
        } catch (e) {
            alert(
                e?.response?.data?.message ||
                e?.message ||
                "Gán nhân viên thất bại. Vui lòng thử lại."
            );
        } finally {
            setAssignSubmitting(false);
        }
    };

    const handleAddResponse = (content) => {
        if (!responseModal?.complaintId) return;
        const text = content.trim();
        if (!text) return;
        setComplaints((prev) =>
            prev.map((c) =>
                c.id === responseModal.complaintId
                    ? {
                        ...c,
                        timeline: [
                            ...c.timeline,
                            {
                                time: new Date().toISOString().slice(0, 16).replace("T", " "),
                                text: `Admin response: ${text}`,
                            },
                        ],
                    }
                    : c
            )
        );
        setResponseModal(null);
    };

    const markResolved = (id) => {
        setComplaints((prev) =>
            prev.map((c) =>
                c.id === id
                    ? {
                        ...c,
                        status: STATUS.RESOLVED,
                        timeline: [
                            ...c.timeline,
                            {
                                time: new Date().toISOString().slice(0, 16).replace("T", " "),
                                text: "Marked as Resolved",
                            },
                        ],
                    }
                    : c
            )
        );
    };

    // ==== Render ====
    return (
        <PageTransition>
            <div className="flex h-screen bg-gray-50">
                <div className="hidden md:block w-64 bg-white shadow-lg fixed h-full z-10" />
                <div className="flex-1 md:ml-64 overflow-y-auto">
                    <div className="p-8">
                        <motion.div
                            className="mb-8"
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                        >
                            <h1 className="text-3xl font-bold text-gray-900 mb-2">
                                Admin Dashboard
                            </h1>
                            <p className="text-gray-600">Customer Complaints</p>
                        </motion.div>

                        <motion.div
                            className="bg-white rounded-xl shadow-lg p-6 mb-8"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                        >
                            <div className="flex items-center justify-between gap-4">
                                <div className="flex-1 relative">
                                    <i className="bi bi-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                    <input
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                        placeholder="Search by title, ID or customer name..."
                                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                                    />
                                </div>
                                <motion.button
                                    onClick={() => setShowFilters(!showFilters)}
                                    className="px-4 py-3 bg-gray-100 hover:bg-gray-200 rounded-lg"
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                >
                                    <i className="bi bi-funnel" /> Filters
                                </motion.button>
                            </div>

                            <AnimatePresence>
                                {showFilters && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: "auto" }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className="mt-4 pt-4 border-t border-gray-200"
                                    >
                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Status
                                                </label>
                                                <select
                                                    value={statusFilter}
                                                    onChange={(e) => setStatusFilter(e.target.value)}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                                                >
                                                    <option value="all">All</option>
                                                    <option value="open">Open</option>
                                                    <option value="assigned">Assigned</option>
                                                    <option value="resolved">Resolved</option>
                                                </select>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.div>

                        {loadingComplaints ? (
                            <div className="text-gray-600">Đang tải complaints...</div>
                        ) : complaintsError ? (
                            <div className="text-red-600">{complaintsError}</div>
                        ) : (
                            <div className="space-y-6">
                                {filtered.map((c, idx) => (
                                    <motion.div
                                        key={c.id}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: idx * 0.04 }}
                                        className="bg-white rounded-xl shadow-md border p-5"
                                    >
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <h3 className="text-lg font-semibold text-gray-900">
                                                    <i className="bi bi-chat-left-text mr-2" />
                                                    {c.title}
                                                </h3>
                                                <div className="text-sm text-gray-600">
                                                    ReportID: <span className="font-medium">{c.reportId}</span>{" "}
                                                    · <span>{c.createdAt}</span>
                                                </div>
                                            </div>
                                            <span
                                                className={`px-3 py-1 rounded-full text-xs font-medium ${badge(
                                                    c.status
                                                )}`}
                                            >
                                                {c.status}
                                            </span>
                                        </div>

                                        <p className="mt-4 text-gray-700">{c.content}</p>

                                        {c.assignedTo && (
                                            <div className="mt-2 text-sm text-indigo-700">
                                                Assigned to:{" "}
                                                <span className="font-medium">
                                                    {c.assignedTo.name} ({c.assignedTo.id})
                                                </span>
                                            </div>
                                        )}

                                        <div className="mt-4 flex flex-wrap gap-3">
                                            {c.status !== STATUS.RESOLVED && (
                                                <motion.button
                                                    className="px-3 py-2 bg-gray-900 text-white rounded-lg"
                                                    whileHover={{ scale: 1.02 }}
                                                    onClick={() => openAssign(c.id)}
                                                >
                                                    <i className="bi bi-person-gear mr-1" />
                                                    Assign Staff
                                                </motion.button>
                                            )}

                                            <motion.a
                                                href={`mailto:${c.customerEmail || ""}`}
                                                className="px-3 py-2 bg-white border rounded-lg hover:bg-gray-50"
                                                whileHover={{ scale: 1.02 }}
                                            >
                                                <i className="bi bi-envelope mr-1" />
                                                Contact Customer
                                            </motion.a>

                                            {c.status !== STATUS.RESOLVED && (
                                                <motion.button
                                                    className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                                                    whileHover={{ scale: 1.02 }}
                                                    onClick={() => markResolved(c.id)}
                                                >
                                                    <i className="bi bi-check2-circle mr-1" />
                                                    Mark Resolved
                                                </motion.button>
                                            )}
                                        </div>

                                        <div className="mt-5 border-t pt-4">
                                            <div className="text-sm font-medium text-gray-800 mb-2">
                                                Timeline
                                            </div>
                                            <ul className="space-y-1 text-sm text-gray-600">
                                                {c.timeline.map((t, i) => (
                                                    <li key={i}>
                                                        <span className="text-gray-400 mr-2">•</span>
                                                        <span className="font-mono text-xs mr-2">{t.time}</span>
                                                        {t.text}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    </motion.div>
                                ))}

                                {!filtered.length && (
                                    <div className="text-center text-gray-500">
                                        No complaints found.
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Assign Staff Modal */}
                <AnimatePresence>
                    {assignModal && (
                        <motion.div
                            className="fixed inset-0 bg-black/50 grid place-items-center z-50 p-4"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                        >
                            <motion.div
                                className="bg-white rounded-2xl shadow-2xl w-full max-w-md"
                                initial={{ scale: 0.95, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.95, opacity: 0 }}
                            >
                                <div className="p-5 border-b flex items-center justify-between">
                                    <div className="text-lg font-semibold">Assign Staff</div>
                                    <button
                                        className="p-2 hover:bg-gray-100 rounded-lg"
                                        onClick={() => setAssignModal(null)}
                                    >
                                        <i className="bi bi-x-lg" />
                                    </button>
                                </div>

                                <div className="p-5 space-y-4">
                                    {loadingStaffs ? (
                                        <div className="text-gray-600">Đang tải nhân viên…</div>
                                    ) : staffsError ? (
                                        <div className="text-red-600">{staffsError}</div>
                                    ) : staffs.length === 0 ? (
                                        <div className="text-gray-600">
                                            Không có nhân viên khả dụng.
                                        </div>
                                    ) : (
                                        <>
                                            <label className="block text-sm text-gray-600">
                                                Choose a staff
                                            </label>
                                            <select
                                                id="assign-select"
                                                className="w-full border rounded-lg px-3 py-2"
                                                defaultValue={staffs[0]?.staffId}
                                            >
                                                {staffs.map((s) => (
                                                    <option key={s.staffId} value={s.staffId}>
                                                        {s.staffName} ({s.staffId}) · {s.stationName}
                                                    </option>
                                                ))}
                                            </select>
                                        </>
                                    )}
                                </div>

                                <div className="p-5 border-t flex justify-end gap-2">
                                    <button
                                        className="px-4 py-2 rounded-lg border"
                                        onClick={() => setAssignModal(null)}
                                        disabled={assignSubmitting}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        className="px-4 py-2 rounded-lg bg-gray-900 text-white disabled:opacity-50"
                                        disabled={
                                            assignSubmitting || loadingStaffs || staffs.length === 0
                                        }
                                        onClick={() =>
                                            handleAssign(document.getElementById("assign-select").value)
                                        }
                                    >
                                        {assignSubmitting ? "Assigning..." : "Assign"}
                                    </button>
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Add Response Modal (nếu cần giữ) */}
                <AnimatePresence>
                    {responseModal && (
                        <motion.div
                            className="fixed inset-0 bg-black/50 grid place-items-center z-50 p-4"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                        >
                            <motion.div
                                className="bg-white rounded-2xl shadow-2xl w-full max-w-lg"
                                initial={{ scale: 0.95, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.95, opacity: 0 }}
                            >
                                <div className="p-5 border-b flex items-center justify-between">
                                    <div className="text-lg font-semibold">Add Response</div>
                                    <button
                                        className="p-2 hover:bg-gray-100 rounded-lg"
                                        onClick={() => setResponseModal(null)}
                                    >
                                        <i className="bi bi-x-lg" />
                                    </button>
                                </div>
                                <div className="p-5">
                                    <textarea
                                        id="response-text"
                                        rows={5}
                                        placeholder="Write your response to the customer..."
                                        className="w-full border rounded-lg px-3 py-2"
                                    />
                                </div>
                                <div className="p-5 border-t flex justify-end gap-2">
                                    <button
                                        className="px-4 py-2 rounded-lg border"
                                        onClick={() => setResponseModal(null)}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        className="px-4 py-2 rounded-lg bg-primary text-white"
                                        onClick={() =>
                                            handleAddResponse(
                                                document.getElementById("response-text").value.trim()
                                            )
                                        }
                                    >
                                        Save
                                    </button>
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </PageTransition>
    );
};

export default ComplaintsManagement;
