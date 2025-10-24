/* eslint-disable no-unused-vars */
import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import PageTransition from "@/components/PageTransition";
import api from "@/api/api";

export default function Employees() {
    const [staffs, setStaffs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState("");

    const [showModal, setShowModal] = useState(false);
    const [saving, setSaving] = useState(false);
    const [deletingId, setDeletingId] = useState(null);



    const [form, setForm] = useState({
        staffId: "",
        staffName: "",
        staffEmail: "",
        staffTele: "",
        staffAddress: "",
        staffStatus: "Active",
        stationId: "",
        stationName: "",
        shiftStart: "08:00",
        shiftEnd: "17:00",
    });

    // ---- helpers ----
    const hhmm = (t) => (t ? t.slice(0, 5) : "—");
    const toHHMMSS = (hhmmStr) => {
        const v = (hhmmStr || "").trim();
        if (/^\d{2}:\d{2}(:\d{2})?$/.test(v)) {
            return v.length === 5 ? `${v}:00` : v;
        }
        return "00:00:00";
    };
    const workHour = (s, e) => `${hhmm(s)}–${hhmm(e)}`;
    const badgeClass = (status) => {
        const s = String(status || "").toLowerCase();
        if (s === "active") return "bg-green-100 text-green-800";
        if (s === "inactive" || s === "disabled") return "bg-gray-200 text-gray-700";
        if (s === "suspended") return "bg-yellow-100 text-yellow-800";
        return "bg-blue-100 text-blue-800";
    };

    // ---- load staff list ----
    const loadStaffs = async () => {
        setError("");
        setRefreshing(true);
        if (staffs.length === 0) setLoading(true);
        try {
            const token = localStorage.getItem("token");
            const res = await api.get("/User/staff-list", {
                headers: token ? { Authorization: `Bearer ${token}` } : undefined,
            });
            const arr = res?.data?.data && Array.isArray(res.data.data) ? res.data.data : [];
            // normalize
            const mapped = arr.map((x) => ({
                staffId: x.staffId,
                userId: x.userId ?? x.staffId, // fallback nếu BE không trả userId
                staffName: x.staffName,
                staffEmail: x.staffEmail,
                staffTele: x.staffTele,
                staffAddress: x.staffAddress,
                staffStatus: x.staffStatus,
                stationName: x.stationName,
                shiftStart: x.shiftStart, // "HH:mm:ss"
                shiftEnd: x.shiftEnd,     // "HH:mm:ss"
                stationId: x.stationId ?? "", // nếu BE có thì map, không thì để nhập tay
            }));
            setStaffs(mapped);
        } catch (err) {
            console.error("staff-list error:", err?.response?.data || err);
            setError("Không thể tải danh sách nhân viên. Vui lòng thử lại.");
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        loadStaffs();
    }, []);

    // ---- open edit modal ----
    const openEdit = (emp) => {
        setForm({
            staffId: emp.staffId,
            staffName: emp.staffName,
            staffEmail: emp.staffEmail,
            staffTele: emp.staffTele,
            staffStatus: emp.staffStatus || "Active",
            stationId: emp.stationId || "",
            stationName: emp.stationName || "",
            shiftStart: hhmm(emp.shiftStart || "08:00:00"),
            shiftEnd: hhmm(emp.shiftEnd || "17:00:00"),
        });
        setShowModal(true);
    };

    const closeModal = () => {
        if (saving) return;
        setShowModal(false);
    };

    // ---- submit update ----
    const submitUpdate = async (e) => {
        e.preventDefault();
        setSaving(true);
        setError("");
        try {
            const payload = {
                staffId: form.staffId,
                staffName: form.staffName,
                staffEmail: form.staffEmail,
                staffTele: form.staffTele,
                staffStatus: form.staffStatus,
                stationStaff: {
                    stationId: form.stationId || "",     // nếu chưa có, để rỗng hoặc điền đúng ID trạm
                    stationName: form.stationName || "",
                    shiftStart: toHHMMSS(form.shiftStart),
                    shiftEnd: toHHMMSS(form.shiftEnd),
                },
            };

            const token = localStorage.getItem("token");
            await api.put("/User/update-staff-information", payload, {
                headers: token ? { Authorization: `Bearer ${token}` } : undefined,
            });

            // cập nhật lại trong bảng (optimistic)
            setStaffs((prev) =>
                prev.map((s) =>
                    s.staffId === form.staffId
                        ? {
                            ...s,
                            staffName: form.staffName,
                            staffEmail: form.staffEmail,
                            staffTele: form.staffTele,
                            staffAddress: form.staffAddress,
                            staffStatus: form.staffStatus,
                            stationId: form.stationId,
                            stationName: form.stationName,
                            shiftStart: toHHMMSS(form.shiftStart),
                            shiftEnd: toHHMMSS(form.shiftEnd),
                        }
                        : s
                )
            );

            alert("✅ Cập nhật thông tin nhân viên thành công.");
            setShowModal(false);
        } catch (err) {
            console.error("update-staff-information error:", err?.response?.data || err);
            alert("❌ Cập nhật thất bại. Vui lòng kiểm tra dữ liệu và thử lại.");
        } finally {
            setSaving(false);
        }
    };

    // ---- delete staff (by userId) ----
    const deleteStaff = async (emp) => {
        const userId = emp.userId ?? emp.staffId;
        if (!userId) {
            return alert("Không xác định được userId để xoá. Hãy đảm bảo BE trả userId trong staff-list.");
        }
        if (!window.confirm(`Xác nhận xoá người dùng ${emp.staffName} (${userId})?`)) return;

        setDeletingId(emp.staffId);
        try {
            const token = localStorage.getItem("token");
            await api.post(
                "/User/delete-user",
                { userId },
                { headers: token ? { Authorization: `Bearer ${token}` } : undefined }
            );

            setStaffs((prev) => prev.filter((s) => s.staffId !== emp.staffId));
            alert("🗑️ Đã xoá người dùng.");
        } catch (err) {
            console.error("delete-user error:", err?.response?.data || err);
            alert("❌ Xoá thất bại. Vui lòng thử lại.");
        } finally {
            setDeletingId(null);
        }
    };

    return (
        <PageTransition>
            <div className="p-8 bg-gray-50 min-h-screen">
                {/* Header */}
                <motion.div
                    className="mb-8 flex items-end justify-between"
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
                        <p className="text-gray-600">Employee Management</p>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={loadStaffs}
                            disabled={refreshing}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg border
                ${refreshing ? "bg-gray-100 text-gray-400" : "bg-white hover:bg-gray-50"}
              `}
                            title="Refresh"
                        >
                            <i className="bi bi-arrow-clockwise" />
                            {refreshing ? "Refreshing..." : "Refresh"}
                        </button>
                    </div>
                </motion.div>

                {/* Table */}
                <motion.div
                    className="bg-white rounded-xl shadow-lg p-6"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    {loading ? (
                        <div className="flex flex-col items-center py-16 text-gray-600">
                            <div className="animate-spin h-10 w-10 border-4 border-gray-900 border-t-transparent rounded-full mb-3" />
                            <p>Loading staffs…</p>
                        </div>
                    ) : error ? (
                        <div className="p-4 rounded-lg bg-red-50 text-red-700">{error}</div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full border-collapse">
                                <thead className="bg-gray-50 border-b">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Employee</th>
                                        <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Phone</th>
                                        <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Station</th>
                                        <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Work hours</th>
                                        <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Status</th>
                                        <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {staffs.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="px-6 py-10 text-center text-gray-500 italic">
                                                No staff found.
                                            </td>
                                        </tr>
                                    ) : (
                                        staffs.map((emp) => (
                                            <tr key={emp.staffId} className="border-b hover:bg-gray-50">
                                                <td className="px-6 py-4">
                                                    <div className="font-medium text-gray-900">{emp.staffName}</div>
                                                    <div className="text-sm text-gray-500">{emp.staffEmail}</div>
                                                    <div className="text-xs text-gray-400">{emp.staffAddress}</div>
                                                </td>
                                                <td className="px-6 py-4 text-gray-700">{emp.staffTele}</td>
                                                <td className="px-6 py-4 text-gray-700">{emp.stationName || "—"}</td>
                                                <td className="px-6 py-4 text-gray-700">{workHour(emp.shiftStart, emp.shiftEnd)}</td>
                                                <td className="px-6 py-4">
                                                    <span className={`inline-block px-3 py-1 text-xs font-medium rounded-full ${badgeClass(emp.staffStatus)}`}>
                                                        {emp.staffStatus || "—"}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-4">
                                                        <button
                                                            className="flex items-center text-gray-600 hover:text-blue-600"
                                                            onClick={() => openEdit(emp)}
                                                        >
                                                            <i className="bi bi-pencil-square mr-1" /> Edit
                                                        </button>
                                                        <button
                                                            className={`flex items-center ${deletingId === emp.staffId ? "text-gray-400" : "text-red-600 hover:text-red-700"}`}
                                                            onClick={() => deleteStaff(emp)}
                                                            disabled={deletingId === emp.staffId}
                                                            title="Delete user"
                                                        >
                                                            <i className="bi bi-trash mr-1" />
                                                            {deletingId === emp.staffId ? "Deleting…" : "Delete"}
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </motion.div>

                {/* Edit Modal */}
                {showModal && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl p-6">
                            <div className="flex justify-between items-center mb-4 border-b pb-2">
                                <h3 className="text-lg font-semibold text-gray-900">Edit Employee</h3>
                                <button onClick={closeModal} className="p-2 hover:bg-gray-100 rounded-lg">
                                    <i className="bi bi-x-lg" />
                                </button>
                            </div>

                            <form onSubmit={submitUpdate} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="col-span-1">
                                    <label className="block text-sm text-gray-700 mb-1">Staff ID</label>
                                    <input value={form.staffId} disabled className="w-full border rounded-lg px-3 py-2 bg-gray-100 text-gray-500" />
                                </div>
                                <div className="col-span-1">
                                    <label className="block text-sm text-gray-700 mb-1">Status</label>
                                    <select
                                        value={form.staffStatus}
                                        onChange={(e) => setForm({ ...form, staffStatus: e.target.value })}
                                        className="w-full border rounded-lg px-3 py-2"
                                    >
                                        <option>Active</option>
                                        <option>Suspended</option>
                                        <option>Inactive</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm text-gray-700 mb-1">Name</label>
                                    <input
                                        value={form.staffName}
                                        onChange={(e) => setForm({ ...form, staffName: e.target.value })}
                                        className="w-full border rounded-lg px-3 py-2"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm text-gray-700 mb-1">Email</label>
                                    <input
                                        type="email"
                                        value={form.staffEmail}
                                        onChange={(e) => setForm({ ...form, staffEmail: e.target.value })}
                                        className="w-full border rounded-lg px-3 py-2"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm text-gray-700 mb-1">Phone</label>
                                    <input
                                        value={form.staffTele}
                                        onChange={(e) => setForm({ ...form, staffTele: e.target.value })}
                                        className="w-full border rounded-lg px-3 py-2"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm text-gray-700 mb-1">Station ID</label>
                                    <input
                                        value={form.stationId}
                                        onChange={(e) => setForm({ ...form, stationId: e.target.value })}
                                        className="w-full border rounded-lg px-3 py-2"
                                        placeholder="VD: ST001"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm text-gray-700 mb-1">Station Name</label>
                                    <input
                                        value={form.stationName}
                                        onChange={(e) => setForm({ ...form, stationName: e.target.value })}
                                        className="w-full border rounded-lg px-3 py-2"
                                        placeholder="VD: Trạm Hồ Gươm"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm text-gray-700 mb-1">Shift Start (HH:mm)</label>
                                    <input
                                        value={form.shiftStart}
                                        onChange={(e) => setForm({ ...form, shiftStart: e.target.value })}
                                        className="w-full border rounded-lg px-3 py-2"
                                        placeholder="08:00"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm text-gray-700 mb-1">Shift End (HH:mm)</label>
                                    <input
                                        value={form.shiftEnd}
                                        onChange={(e) => setForm({ ...form, shiftEnd: e.target.value })}
                                        className="w-full border rounded-lg px-3 py-2"
                                        placeholder="17:00"
                                    />
                                </div>

                                <div className="md:col-span-2 flex justify-end gap-3 pt-2">
                                    <button type="button" onClick={closeModal} className="px-4 py-2 border rounded-lg">
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={saving}
                                        className={`px-4 py-2 rounded-lg text-white ${saving ? "bg-gray-400" : "bg-gray-900 hover:bg-gray-800"}`}
                                    >
                                        {saving ? "Saving..." : "Save Changes"}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </PageTransition>
    );
}
