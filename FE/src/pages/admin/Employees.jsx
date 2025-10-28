/* eslint-disable no-unused-vars */
import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import PageTransition from "@/components/PageTransition";
import api from "@/api/api";

const roleBadge = (role) => {
    const r = String(role || "").toLowerCase();
    if (r.includes("admin")) return "bg-purple-100 text-purple-800";
    if (r.includes("manager")) return "bg-amber-100 text-amber-800";
    if (r.includes("staff") || r.includes("operator")) return "bg-blue-100 text-blue-800";
    if (r.includes("technician")) return "bg-teal-100 text-teal-800";
    return "bg-gray-100 text-gray-800";
};
const statusBadge = (status) =>
    String(status || "").toLowerCase() === "active"
        ? "bg-green-100 text-green-800"
        : "bg-red-100 text-red-800";

export default function StaffManagement() {
    const [staffs, setStaffs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadingDetail, setLoadingDetail] = useState(false);
    const [deletingId, setDeletingId] = useState(null);

    // filters
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [roleFilter, setRoleFilter] = useState("all");
    const [stationFilter, setStationFilter] = useState("all");
    const [showFilters, setShowFilters] = useState(false);

    const [selectedStaff, setSelectedStaff] = useState(null);

    // ===== Load staff list =====
    const loadStaffs = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem("token");
            // TODO: nếu BE khác path, đổi ở đây
            const res = await api.get("/User/staff-list", {
                headers: token ? { Authorization: `Bearer ${token}` } : undefined,
            });

            const arr = res?.data?.data ?? [];

            const mapped = arr.map((x) => ({
                staffId: x.staffId ?? x.userId ?? x.employeeId ?? x.id,
                userId: x.userId ?? x.staffId ?? x.employeeId ?? x.id, // dùng để delete
                name: x.staffName ?? x.fullName ?? x.employeeName ?? x.name,
                email: x.staffEmail ?? x.email,
                phone: x.staffPhone ?? x.phone ?? x.telephone,
                role: x.role ?? x.position ?? "Staff",
                stationName: x.stationName ?? x.station?.name ?? x.stationId ?? "—",
                status: x.staffStatus ?? x.status ?? "Active",
                // thêm vài số liệu nếu có
                shifts: x.totalShifts ?? x.shifts ?? 0,
            }));
            setStaffs(mapped);
        } catch (err) {
            console.error("staff-list error", err?.response?.data || err);
            alert("❌ Không thể tải danh sách nhân viên.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadStaffs();
    }, []);

    // ===== Load staff detail =====
    const openDetail = async (row) => {
        setLoadingDetail(true);
        try {
            const token = localStorage.getItem("token");
            // TODO: nếu BE khác path/param, đổi ở đây
            const res = await api.get("/User/staff-detail", {
                params: { UserId: row.staffId },
                headers: token ? { Authorization: `Bearer ${token}` } : undefined,
            });

            const d = res?.data?.data;
            if (!d) throw new Error("No data");

            const detail = {
                staffId: d.staffId ?? d.userId ?? row.staffId,
                name: d.staffName ?? d.fullName ?? row.name,
                email: d.staffEmail ?? d.email ?? row.email,
                phone: d.staffPhone ?? d.phone ?? row.phone ?? "—",
                role: d.role ?? d.position ?? row.role,
                stationName:
                    d.stationName ?? d.station?.name ?? d.stationId ?? row.stationName,
                status: d.staffStatus ?? d.status ?? row.status,
                registrationDate: d.registation ?? d.createdAt ?? "—",
                // optional blocks
                certifications: d.certifications ?? [],
                shiftHistory: Array.isArray(d.shiftHistory) ? d.shiftHistory : [],
            };

            setSelectedStaff(detail);
        } catch (err) {
            console.error("staff-detail error", err?.response?.data || err);
            alert("❌ Không thể tải chi tiết nhân viên.");
        } finally {
            setLoadingDetail(false);
        }
    };

    // ===== Delete staff =====
    const deleteStaff = async (row) => {
        const userId = row.userId ?? row.staffId;
        if (!userId) return alert("Không xác định được userId để xoá.");
        if (!window.confirm(`Xác nhận xoá nhân viên ${row.name} (${userId})?`)) return;

        setDeletingId(row.staffId);
        try {
            const token = localStorage.getItem("token");
            // TODO: nếu BE có endpoint xoá riêng cho staff, đổi ở đây
            await api.post(
                "/User/delete-user",
                { userId },
                { headers: token ? { Authorization: `Bearer ${token}` } : undefined }
            );
            setStaffs((prev) => prev.filter((s) => s.staffId !== row.staffId));
            if (selectedStaff?.staffId === row.staffId) setSelectedStaff(null);
            alert("🗑️ Đã xoá nhân viên.");
        } catch (err) {
            console.error("delete-user error", err?.response?.data || err);
            alert("❌ Xoá thất bại. Vui lòng thử lại.");
        } finally {
            setDeletingId(null);
        }
    };

    // ===== Derived filters =====
    const roleOptions = useMemo(() => {
        const set = new Set(
            staffs
                .map((s) => String(s.role || "").trim())
                .filter((x) => x && x !== "—")
        );
        return Array.from(set);
    }, [staffs]);

    const stationOptions = useMemo(() => {
        const set = new Set(
            staffs
                .map((s) => String(s.stationName || "").trim())
                .filter((x) => x && x !== "—")
        );
        return Array.from(set);
    }, [staffs]);

    const filteredStaffs = useMemo(() => {
        const q = searchTerm.toLowerCase();
        return staffs.filter((s) => {
            const matchesSearch =
                String(s.name || "").toLowerCase().includes(q) ||
                String(s.email || "").toLowerCase().includes(q);
            const matchesStatus =
                statusFilter === "all" ||
                String(s.status || "").toLowerCase() === statusFilter;
            const matchesRole =
                roleFilter === "all" ||
                String(s.role || "").toLowerCase() === roleFilter.toLowerCase();
            const matchesStation =
                stationFilter === "all" ||
                String(s.stationName || "").toLowerCase() ===
                stationFilter.toLowerCase();

            return matchesSearch && matchesStatus && matchesRole && matchesStation;
        });
    }, [staffs, searchTerm, statusFilter, roleFilter, stationFilter]);

    return (
        <PageTransition>
            <div className="p-8">
                {/* Header */}
                <motion.div
                    className="mb-8 flex items-center justify-between"
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">
                            Staff Management
                        </h1>
                        <p className="text-gray-600">
                            Search, filter and manage station staff accounts.
                        </p>
                    </div>
                    <button
                        onClick={loadStaffs}
                        disabled={loading}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg border ${loading ? "text-gray-400" : "hover:bg-gray-50"
                            }`}
                    >
                        <i className="bi bi-arrow-clockwise" />
                        Refresh
                    </button>
                </motion.div>

                {/* Filters */}
                <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
                    <div className="flex gap-4 items-center">
                        <div className="flex-1 relative">
                            <i className="bi bi-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search staff by name or email..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg"
                            />
                        </div>
                        <button
                            onClick={() => setShowFilters((s) => !s)}
                            className="flex items-center gap-2 px-4 py-3 bg-gray-100 hover:bg-gray-200 rounded-lg"
                        >
                            <i className="bi bi-funnel" /> Filters
                        </button>
                    </div>

                    <AnimatePresence>
                        {showFilters && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                exit={{ opacity: 0, height: 0 }}
                                transition={{ duration: 0.3 }}
                                className="mt-4 pt-4 border-t border-gray-200 grid md:grid-cols-4 sm:grid-cols-2 gap-4"
                            >
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Status
                                    </label>
                                    <select
                                        value={statusFilter}
                                        onChange={(e) => setStatusFilter(e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                    >
                                        <option value="all">All</option>
                                        <option value="active">Active</option>
                                        <option value="inactive">Inactive</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Role
                                    </label>
                                    <select
                                        value={roleFilter}
                                        onChange={(e) => setRoleFilter(e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                    >
                                        <option value="all">All</option>
                                        {roleOptions.map((r) => (
                                            <option key={r} value={r}>
                                                {r}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Station
                                    </label>
                                    <select
                                        value={stationFilter}
                                        onChange={(e) => setStationFilter(e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                    >
                                        <option value="all">All</option>
                                        {stationOptions.map((s) => (
                                            <option key={s} value={s}>
                                                {s}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Table */}
                <motion.div
                    className="bg-white rounded-xl shadow-lg overflow-hidden"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    {loading ? (
                        <div className="flex flex-col items-center py-16 text-gray-600">
                            <div className="animate-spin h-10 w-10 border-4 border-gray-900 border-t-transparent rounded-full mb-3" />
                            <p>Loading staff…</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50 border-b border-gray-200">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                                            Staff
                                        </th>
                                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                                            Role
                                        </th>
                                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                                            Station
                                        </th>
                                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                                            Shifts
                                        </th>
                                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                                            Status
                                        </th>
                                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {filteredStaffs.map((s) => (
                                        <tr key={s.staffId} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="font-medium text-gray-900">{s.name}</div>
                                                <div className="text-sm text-gray-500">{s.email}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span
                                                    className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${roleBadge(
                                                        s.role
                                                    )}`}
                                                >
                                                    {s.role}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-gray-900">{s.stationName}</td>
                                            <td className="px-6 py-4 text-gray-900">{s.shifts}</td>
                                            <td className="px-6 py-4">
                                                <span
                                                    className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${statusBadge(
                                                        s.status
                                                    )}`}
                                                >
                                                    {s.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={() => openDetail(s)}
                                                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                                                        title="View Details"
                                                    >
                                                        <i className="bi bi-eye" />
                                                    </button>
                                                    <button
                                                        onClick={() => deleteStaff(s)}
                                                        className={`p-2 rounded-lg ${deletingId === s.staffId
                                                                ? "text-gray-400 cursor-not-allowed"
                                                                : "text-red-600 hover:bg-red-50"
                                                            }`}
                                                        disabled={deletingId === s.staffId}
                                                        title="Delete staff"
                                                    >
                                                        {deletingId === s.staffId ? (
                                                            <i className="bi bi-hourglass-split" />
                                                        ) : (
                                                            <i className="bi bi-trash" />
                                                        )}
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </motion.div>

                {/* Detail Modal */}
                <AnimatePresence>
                    {selectedStaff && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
                        >
                            <motion.div
                                initial={{ scale: 0.9, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.9, opacity: 0 }}
                                className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto"
                            >
                                <div className="p-6 border-b flex justify-between items-center">
                                    <h2 className="text-2xl font-bold text-gray-900">
                                        Staff Details
                                    </h2>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() =>
                                                deleteStaff({
                                                    staffId: selectedStaff.staffId,
                                                    userId:
                                                        staffs.find((x) => x.staffId === selectedStaff.staffId)
                                                            ?.userId ?? selectedStaff.staffId,
                                                    name: selectedStaff.name,
                                                })
                                            }
                                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                                            title="Delete staff"
                                        >
                                            <i className="bi bi-trash" />
                                        </button>
                                        <button
                                            onClick={() => setSelectedStaff(null)}
                                            className="p-2 hover:bg-gray-100 rounded-lg"
                                        >
                                            <i className="bi bi-x-lg" />
                                        </button>
                                    </div>
                                </div>

                                {loadingDetail ? (
                                    <div className="flex justify-center py-10 text-gray-500">
                                        Loading details…
                                    </div>
                                ) : (
                                    <div className="p-6 space-y-6">
                                        <div className="grid md:grid-cols-2 gap-6">
                                            <div>
                                                <h3 className="text-lg font-semibold mb-3">
                                                    Personal Info
                                                </h3>
                                                <InfoRow icon="bi-person" title="Full Name" value={selectedStaff.name} />
                                                <InfoRow icon="bi-envelope" title="Email" value={selectedStaff.email} />
                                                <InfoRow icon="bi-telephone" title="Phone" value={selectedStaff.phone || "—"} />
                                                <InfoRow icon="bi-card-checklist" title="Role" value={selectedStaff.role} />
                                                <InfoRow icon="bi-building" title="Station" value={selectedStaff.stationName} />
                                                <InfoRow icon="bi-calendar" title="Registration" value={selectedStaff.registrationDate || "—"} />
                                            </div>
                                            <div>
                                                <h3 className="text-lg font-semibold mb-3">Status</h3>
                                                <div className="p-3 bg-gray-50 rounded-lg flex items-center justify-between">
                                                    <span className="text-gray-600">Current status</span>
                                                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusBadge(selectedStaff.status)}`}>
                                                        {selectedStaff.status}
                                                    </span>
                                                </div>

                                                {!!selectedStaff.certifications?.length && (
                                                    <div className="mt-4">
                                                        <div className="text-gray-600 mb-2">Certifications</div>
                                                        <div className="flex flex-wrap gap-2">
                                                            {selectedStaff.certifications.map((c, i) => (
                                                                <span key={i} className="px-3 py-1 rounded-full text-xs bg-gray-100 text-gray-800">
                                                                    {c}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {!!selectedStaff.shiftHistory?.length && (
                                            <div>
                                                <h3 className="text-lg font-semibold mb-3 flex items-center">
                                                    <i className="bi bi-clock-history mr-2" /> Recent Shifts
                                                </h3>
                                                <div className="overflow-x-auto border rounded-lg">
                                                    <table className="min-w-full text-sm">
                                                        <thead className="bg-gray-50">
                                                            <tr>
                                                                <th className="p-2 text-left">Date</th>
                                                                <th className="p-2 text-left">Station</th>
                                                                <th className="p-2 text-left">Role</th>
                                                                <th className="p-2 text-left">Notes</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {selectedStaff.shiftHistory.map((sh, idx) => (
                                                                <tr key={idx} className="border-t">
                                                                    <td className="p-2">{sh.date || "—"}</td>
                                                                    <td className="p-2">{sh.stationName || "—"}</td>
                                                                    <td className="p-2">{sh.role || "—"}</td>
                                                                    <td className="p-2">{sh.note || "—"}</td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </PageTransition>
    );
}

function InfoRow({ icon, title, value }) {
    return (
        <div className="flex items-center space-x-3 mb-2">
            <i className={`bi ${icon} text-gray-400`} />
            <div>
                <div className="font-medium text-gray-900">{value}</div>
                <div className="text-sm text-gray-500">{title}</div>
            </div>
        </div>
    );
}
