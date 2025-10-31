/* eslint-disable no-unused-vars */
import { useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import PageTransition from "@/components/PageTransition";
import api from "@/api/api";

const CustomerManagement = () => {
    const [customers, setCustomers] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [packageFilter, setPackageFilter] = useState("all");
    const [showFilters, setShowFilters] = useState(false);
    const [loading, setLoading] = useState(true);
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [loadingDetail, setLoadingDetail] = useState(false);
    const [deletingId, setDeletingId] = useState(null);

    // --- color helpers for package/status ---
    const getPackageBadgeColor = (pkg) => {
        const p = String(pkg || "").toUpperCase();
        if (p === "GU") return "bg-purple-100 text-purple-800";
        if (p === "G1") return "bg-green-100 text-green-800";
        if (p === "G2") return "bg-blue-100 text-blue-800";
        if (p === "G3") return "bg-teal-100 text-teal-800";
        if (p.startsWith("TP")) return "bg-amber-100 text-amber-800"; // TP1, TP3U...
        return "bg-gray-100 text-gray-800";
    };
    const getStatusBadgeColor = (status) =>
        String(status).toLowerCase() === "active"
            ? "bg-green-100 text-green-800"
            : "bg-red-100 text-red-800";

    // --- API: driver list ---
    const loadDrivers = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem("token");
            const res = await api.get("/User/driver-list", {
                headers: token ? { Authorization: `Bearer ${token}` } : undefined,
            });
            const arr = res?.data?.data ?? [];
            const mapped = arr.map((x) => ({
                driverId: x.driverId,
                userId: x.userId ?? x.driverId, // fallback nếu BE không trả userId
                name: x.driverName,
                email: x.driverEmail,
                status: x.driverStatus,
                packages: Array.isArray(x.currentPackage) ? x.currentPackage : [],
                vehicles: x.numberOfVehicle,
                swaps: x.totalSwaps,
            }));
            setCustomers(mapped);
        } catch (err) {
            console.error("driver-list error", err?.response?.data || err);
            alert("❌ Không thể tải danh sách khách hàng.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadDrivers();
    }, []);

    // --- API: driver detail ---
    const openDetail = async (driver) => {
        setLoadingDetail(true);
        try {
            const token = localStorage.getItem("token");
            const res = await api.get(`/User/driver-detail`, {
                params: { UserId: driver.driverId }, // ✅ dùng driverId
                headers: token ? { Authorization: `Bearer ${token}` } : undefined,
            });
            const d = res?.data?.data;
            if (!d) throw new Error("No data");

            // currentPackage: [{ planName, swap }]
            const packages = Array.isArray(d.currentPackage)
                ? d.currentPackage.map((p) => ({
                    name: p.planName,
                    swap: Number(p.swap || 0),
                }))
                : [];

            const detail = {
                driverId: d.driverId,
                name: driver.name,
                email: d.driverEmail,
                phone: d.driverTele,
                registrationDate: d.registation,
                packages, // mảng object {name, swap}
                vehicles: d.driverVehicles?.length ?? driver.vehicles,
                swaps: d.totalSwaps, // tổng swap của tài khoản
                status: driver.status,
                vehicleList:
                    (d.driverVehicles || []).map((v, i) => ({
                        id: i + 1,
                        model: v.vehicleModel,
                        year: v.registation,
                        numberOfBattery: v.numberOfBattery,
                    })) ?? [],
            };

            setSelectedCustomer(detail);
        } catch (err) {
            console.error("driver-detail error", err?.response?.data || err);
            alert("❌ Không thể tải chi tiết khách hàng.");
        } finally {
            setLoadingDetail(false);
        }
    };

    // --- DELETE driver (POST /api/User/delete-user { userId }) ---
    const deleteDriver = async (driver) => {
        const userId = driver.userId ?? driver.driverId;
        if (!userId) return alert("Không xác định được userId để xoá.");
        if (!window.confirm(`Xác nhận xoá khách hàng ${driver.name} (${userId})?`)) return;

        setDeletingId(driver.driverId);
        try {
            const token = localStorage.getItem("token");
            await api.post(
                "/User/delete-user",
                { userId },
                { headers: token ? { Authorization: `Bearer ${token}` } : undefined }
            );
            setCustomers((prev) => prev.filter((c) => c.driverId !== driver.driverId));
            setSelectedCustomer((prev) =>
                prev && prev.driverId === driver.driverId ? null : prev
            );
            alert("🗑️ Đã xoá khách hàng.");
        } catch (err) {
            console.error("delete-user error:", err?.response?.data || err);
            alert("❌ Xoá thất bại. Vui lòng thử lại.");
        } finally {
            setDeletingId(null);
        }
    };

    // --- filters ---
    const filteredCustomers = useMemo(() => {
        const q = searchTerm.toLowerCase();
        return customers.filter((c) => {
            const matchesSearch =
                c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q);
            const matchesStatus =
                statusFilter === "all" ||
                String(c.status).toLowerCase() === statusFilter;
            const matchesPackage =
                packageFilter === "all" ||
                (Array.isArray(c.packages) &&
                    c.packages.some((p) => String(p).toUpperCase() === packageFilter));
            return matchesSearch && matchesStatus && matchesPackage;
        });
    }, [customers, searchTerm, statusFilter, packageFilter]);

    // render small package chips with +N (unique keys)
    const renderPackageChips = (pkgs, ownerKey = "row") => {
        const arr = Array.isArray(pkgs) ? pkgs : [];
        if (arr.length === 0) return <span className="text-gray-400">—</span>;
        const firstTwo = arr.slice(0, 2);
        const rest = arr.length - firstTwo.length;
        return (
            <div className="flex items-center gap-2" title={arr.join(", ")}>
                {firstTwo.map((p, idx) => (
                    <span
                        key={`${ownerKey}-${p}-${idx}`} // ✅ key duy nhất
                        className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${getPackageBadgeColor(
                            p
                        )}`}
                    >
                        {p}
                    </span>
                ))}
                {rest > 0 && <span className="text-xs text-gray-600">+{rest} more</span>}
            </div>
        );
    };

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
                            Customer Management
                        </h1>
                        <p className="text-gray-600">
                            Manage customer information and service packages.
                        </p>
                    </div>
                    <button
                        onClick={loadDrivers}
                        disabled={loading}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg border ${loading ? "text-gray-400" : "hover:bg-gray-50"
                            }`}
                    >
                        <i className="bi bi-arrow-clockwise"></i>
                        Refresh
                    </button>
                </motion.div>

                {/* Filters */}
                <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
                    <div className="flex gap-4 items-center">
                        <div className="flex-1 relative">
                            <i className="bi bi-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
                            <input
                                type="text"
                                placeholder="Search customers by name or email..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg"
                            />
                        </div>
                        <button
                            onClick={() => setShowFilters(!showFilters)}
                            className="flex items-center gap-2 px-4 py-3 bg-gray-100 hover:bg-gray-200 rounded-lg"
                        >
                            <i className="bi bi-funnel"></i> Filters
                        </button>
                    </div>

                    <AnimatePresence>
                        {showFilters && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                exit={{ opacity: 0, height: 0 }}
                                transition={{ duration: 0.3 }}
                                className="mt-4 pt-4 border-t border-gray-200 grid grid-cols-2 gap-4"
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
                                        Package
                                    </label>
                                    <select
                                        value={packageFilter}
                                        onChange={(e) => setPackageFilter(e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                    >
                                        <option value="all">All</option>
                                        <option value="GU">GU</option>
                                        <option value="G1">G1</option>
                                        <option value="G2">G2</option>
                                        <option value="G3">G3</option>
                                        <option value="TP1">TP1</option>
                                        <option value="TP3U">TP3U</option>
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
                            <p>Loading customers…</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50 border-b border-gray-200">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                                            Customer
                                        </th>
                                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                                            Packages
                                        </th>
                                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                                            Vehicles
                                        </th>
                                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                                            Swaps
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
                                    {filteredCustomers.map((c) => (
                                        <tr key={c.driverId} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="font-medium text-gray-900">{c.name}</div>
                                                <div className="text-sm text-gray-500">{c.email}</div>
                                            </td>
                                            <td className="px-6 py-4">{renderPackageChips(c.packages, c.driverId)}</td>
                                            <td className="px-6 py-4 text-gray-900">{c.vehicles}</td>
                                            <td className="px-6 py-4 text-gray-900">{c.swaps}</td>
                                            <td className="px-6 py-4">
                                                <span
                                                    className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${getStatusBadgeColor(
                                                        c.status
                                                    )}`}
                                                >
                                                    {c.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={() => openDetail(c)}
                                                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                                                        title="View Details"
                                                    >
                                                        <i className="bi bi-eye"></i>
                                                    </button>
                                                    <button
                                                        onClick={() => deleteDriver(c)}
                                                        className={`p-2 rounded-lg ${deletingId === c.driverId
                                                            ? "text-gray-400 cursor-not-allowed"
                                                            : "text-red-600 hover:bg-red-50"
                                                            }`}
                                                        disabled={deletingId === c.driverId}
                                                        title="Delete user"
                                                    >
                                                        {deletingId === c.driverId ? (
                                                            <i className="bi bi-hourglass-split"></i>
                                                        ) : (
                                                            <i className="bi bi-trash"></i>
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
                    {selectedCustomer && (
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
                                        Customer Details
                                    </h2>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() =>
                                                deleteDriver({
                                                    driverId: selectedCustomer.driverId,
                                                    userId:
                                                        customers.find((c) => c.driverId === selectedCustomer.driverId)?.userId ??
                                                        selectedCustomer.driverId,
                                                    name: selectedCustomer.name,
                                                })
                                            }
                                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                                            title="Delete user"
                                        >
                                            <i className="bi bi-trash"></i>
                                        </button>
                                        <button
                                            onClick={() => setSelectedCustomer(null)}
                                            className="p-2 hover:bg-gray-100 rounded-lg"
                                        >
                                            <i className="bi bi-x-lg"></i>
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
                                                <InfoRow icon="bi-person" title="Full Name" value={selectedCustomer.name} />
                                                <InfoRow icon="bi-envelope" title="Email" value={selectedCustomer.email} />
                                                <InfoRow icon="bi-telephone" title="Phone" value={selectedCustomer.phone || "—"} />
                                                <InfoRow icon="bi-calendar" title="Registration" value={selectedCustomer.registrationDate || "—"} />
                                            </div>
                                            <div>
                                                <h3 className="text-lg font-semibold mb-3">
                                                    Service Info
                                                </h3>
                                                <div className="mb-2">
                                                    <span className="text-gray-600 mr-3">Current Packages</span>
                                                    <div className="mt-2 flex flex-wrap gap-2">
                                                        {selectedCustomer.packages?.length ? (
                                                            selectedCustomer.packages.map((p, idx) => (
                                                                <span
                                                                    key={`${selectedCustomer.driverId}-${p.name}-${idx}`} // ✅ key duy nhất
                                                                    className={`px-3 py-1 rounded-full text-xs font-medium ${getPackageBadgeColor(
                                                                        p.name
                                                                    )}`}
                                                                    title={`${p.name}: ${p.swap} swaps`}
                                                                >
                                                                    {p.name}
                                                                </span>
                                                            ))
                                                        ) : (
                                                            <span className="text-gray-400">—</span>
                                                        )}
                                                    </div>
                                                </div>

                                                <KeyValueRow label="Total Vehicles" value={selectedCustomer.vehicles} />
                                                <KeyValueRow label="Total Swaps" value={selectedCustomer.swaps} />
                                                <KeyValueRow
                                                    label="Status"
                                                    value={
                                                        <span
                                                            className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusBadgeColor(
                                                                selectedCustomer.status
                                                            )}`}
                                                        >
                                                            {selectedCustomer.status}
                                                        </span>
                                                    }
                                                />
                                            </div>
                                        </div>

                                        <div>
                                            <h3 className="text-lg font-semibold mb-3 flex items-center">
                                                <i className="bi bi-car-front mr-2"></i>Vehicles
                                            </h3>
                                            <div className="grid md:grid-cols-2 gap-4">
                                                {selectedCustomer.vehicleList?.length ? (
                                                    selectedCustomer.vehicleList.map((v) => (
                                                        <div key={v.id} className="p-4 border rounded-lg hover:shadow-md transition">
                                                            <div className="flex justify-between mb-2">
                                                                <span className="font-medium text-gray-900">{v.model}</span>
                                                                <span className="text-sm text-gray-500">{v.year}</span>
                                                            </div>
                                                            <div className="text-sm text-gray-600">
                                                                Batteries: {v.numberOfBattery ?? 1}
                                                            </div>
                                                        </div>
                                                    ))
                                                ) : (
                                                    <div className="text-gray-400">No vehicles.</div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </PageTransition>
    );
};

function InfoRow({ icon, title, value }) {
    return (
        <div className="flex items-center space-x-3 mb-2">
            <i className={`bi ${icon} text-gray-400`}></i>
            <div>
                <div className="font-medium text-gray-900">{value}</div>
                <div className="text-sm text-gray-500">{title}</div>
            </div>
        </div>
    );
}
function KeyValueRow({ label, value }) {
    return (
        <div className="flex justify-between p-3 bg-gray-50 rounded-lg mb-2">
            <span className="text-gray-600">{label}</span>
            <span className="font-semibold text-gray-900">{value}</span>
        </div>
    );
}

export default CustomerManagement;
