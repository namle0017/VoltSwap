// pages/CustomerManagement.jsx
import { useState, useMemo } from "react";
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from "framer-motion";
import PageTransition from "@/components/PageTransition";

const CustomerManagement = () => {
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [showFilters, setShowFilters] = useState(false);
    const [statusFilter, setStatusFilter] = useState("all");
    const [packageFilter, setPackageFilter] = useState("all");

    // Mock customer data (giữ nguyên)
    const customers = useMemo(() => [
        {
            id: 1,
            name: "Sarah Johnson",
            email: "sarah.johnson@email.com",
            phone: "+1 (555) 123-4567",
            package: "GU",
            vehicles: 2,
            swaps: 47,
            status: "Active",
            registrationDate: "2024-01-15",
            vehicleList: [
                { id: 1, model: "Tesla Model 3", year: 2023, batteryHealth: 95 },
                { id: 2, model: "BMW iX3", year: 2022, batteryHealth: 88 },
            ],
            swapHistory: [
                { date: "2024-12-20", station: "District 1 Station", duration: "4 min" },
                { date: "2024-12-18", station: "Thu Duc Station", duration: "3 min" },
                { date: "2024-12-15", station: "Tan Binh Station", duration: "5 min" },
            ],
        },
        {
            id: 2,
            name: "Michael Chen",
            email: "michael.chen@email.com",
            phone: "+1 (555) 234-5678",
            package: "G2",
            vehicles: 1,
            swaps: 23,
            status: "Active",
            registrationDate: "2024-02-20",
            vehicleList: [{ id: 1, model: "Audi e-tron", year: 2023, batteryHealth: 92 }],
            swapHistory: [
                { date: "2024-12-19", station: "District 1 Station", duration: "4 min" },
                { date: "2024-12-16", station: "Thu Duc Station", duration: "3 min" },
            ],
        },
        {
            id: 3,
            name: "Emily Rodriguez",
            email: "emily.rodriguez@email.com",
            phone: "+1 (555) 345-6789",
            package: "G1",
            vehicles: 1,
            swaps: 12,
            status: "Inactive",
            registrationDate: "2024-03-10",
            vehicleList: [{ id: 1, model: "Nissan Leaf", year: 2021, batteryHealth: 85 }],
            swapHistory: [
                { date: "2024-12-10", station: "Tan Binh Station", duration: "6 min" },
            ],
        },
        {
            id: 4,
            name: "David Kim",
            email: "david.kim@email.com",
            phone: "+1 (555) 456-7890",
            package: "GU",
            vehicles: 3,
            swaps: 89,
            status: "Active",
            registrationDate: "2023-11-05",
            vehicleList: [
                { id: 1, model: "Tesla Model S", year: 2023, batteryHealth: 97 },
                { id: 2, model: "Tesla Model Y", year: 2022, batteryHealth: 91 },
                { id: 3, model: "Mercedes EQS", year: 2023, batteryHealth: 94 },
            ],
            swapHistory: [
                { date: "2024-12-21", station: "District 1 Station", duration: "3 min" },
                { date: "2024-12-20", station: "Thu Duc Station", duration: "4 min" },
                { date: "2024-12-19", station: "Tan Binh Station", duration: "3 min" },
            ],
        },
        {
            id: 5,
            name: "Lisa Wang",
            email: "lisa.wang@email.com",
            phone: "+1 (555) 567-8901",
            package: "G2",
            vehicles: 1,
            swaps: 34,
            status: "Active",
            registrationDate: "2024-01-28",
            vehicleList: [
                { id: 1, model: "Hyundai IONIQ 5", year: 2023, batteryHealth: 93 },
            ],
            swapHistory: [
                { date: "2024-12-18", station: "District 1 Station", duration: "4 min" },
                { date: "2024-12-15", station: "Thu Duc Station", duration: "5 min" },
            ],
        },
    ], []);

    const getPackageBadgeColor = (pkg) => {
        switch (pkg) {
            case "GU":
                return "bg-purple-100 text-purple-800";
            case "G2":
                return "bg-blue-100 text-blue-800";
            case "G1":
                return "bg-green-100 text-green-800";
            default:
                return "bg-gray-100 text-gray-800";
        }
    };

    const getStatusBadgeColor = (status) =>
        status === "Active" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800";

    const filteredCustomers = useMemo(() => {
        return customers.filter((c) => {
            const q = searchTerm.toLowerCase();
            const matchesSearch =
                c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q);
            const matchesStatus = statusFilter === "all" || c.status.toLowerCase() === statusFilter;
            const matchesPackage = packageFilter === "all" || c.package === packageFilter;
            return matchesSearch && matchesStatus && matchesPackage;
        });
    }, [customers, searchTerm, statusFilter, packageFilter]);

    const handleDelete = (customerId) => {
        if (window.confirm("Are you sure you want to delete this customer?")) {
            console.log("Deleting customer:", customerId);
            // TODO: delete logic
        }
    };

    return (
        <PageTransition>
            <div className="p-8">
                {/* Header */}
                <motion.div
                    className="mb-8"
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Customer Management</h1>
                    <p className="text-gray-600">
                        Manage customer information and service packages.
                    </p>
                </motion.div>

                {/* Search & Filters */}
                <motion.div
                    className="bg-white rounded-xl shadow-lg p-6 mb-8"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                >
                    <div className="flex items-center justify-between gap-4">
                        <div className="flex-1 relative">
                            <i className="bi bi-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
                            <input
                                type="text"
                                placeholder="Search customers by name or email..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-300"
                            />
                        </div>

                        <motion.button
                            onClick={() => setShowFilters(!showFilters)}
                            className="flex items-center space-x-2 px-4 py-3 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors duration-300"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            aria-label="Xem chi tiết khách hàng"
                        >
                            <i className="bi bi-funnel"></i>
                            <span>Filters</span>
                        </motion.button>
                    </div>

                    <AnimatePresence>
                        {showFilters && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                exit={{ opacity: 0, height: 0 }}
                                transition={{ duration: 0.3 }}
                                className="mt-4 pt-4 border-t border-gray-200"
                            >
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Status
                                        </label>
                                        <select
                                            value={statusFilter}
                                            onChange={(e) => setStatusFilter(e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                                        >
                                            <option value="all">All Status</option>
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
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                                        >
                                            <option value="all">All Packages</option>
                                            <option value="GU">GU Package</option>
                                            <option value="G2">G2 Package</option>
                                            <option value="G1">G1 Package</option>
                                        </select>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>

                {/* Table */}
                <motion.div
                    className="bg-white rounded-xl shadow-lg overflow-hidden"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                >
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                                        Customer
                                    </th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                                        Package
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
                                {filteredCustomers.map((c, idx) => (
                                    <motion.tr
                                        key={c.id}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.3, delay: idx * 0.05 }}
                                        className="hover:bg-gray-50 transition-colors duration-200"
                                    >
                                        <td className="px-6 py-4">
                                            <div>
                                                <div className="font-medium text-gray-900">{c.name}</div>
                                                <div className="text-sm text-gray-500">{c.email}</div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span
                                                className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${getPackageBadgeColor(
                                                    c.package
                                                )}`}
                                            >
                                                {c.package}
                                            </span>
                                        </td>
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
                                            <div className="flex items-center space-x-2">
                                                <motion.button
                                                    onClick={() => setSelectedCustomer(c)}
                                                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors duration-200"
                                                    whileHover={{ scale: 1.1 }}
                                                    whileTap={{ scale: 0.9 }}
                                                >
                                                    <i className="bi bi-eye"></i>
                                                </motion.button>
                                                <motion.button
                                                    className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors duration-200"
                                                    whileHover={{ scale: 1.1 }}
                                                    whileTap={{ scale: 0.9 }}
                                                >
                                                    <i className="bi bi-pencil"></i>
                                                </motion.button>
                                                <motion.button
                                                    onClick={() => handleDelete(c.id)}
                                                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200"
                                                    whileHover={{ scale: 1.1 }}
                                                    whileTap={{ scale: 0.9 }}
                                                >
                                                    <i className="bi bi-trash"></i>
                                                </motion.button>
                                            </div>
                                        </td>
                                    </motion.tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </motion.div>

                {/* Modal */}
                <AnimatePresence>
                    {selectedCustomer && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
                        >
                            <motion.div
                                initial={{ scale: 0.9, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.9, opacity: 0 }}
                                className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto"
                            >
                                {/* Header */}
                                <div className="p-6 border-b border-gray-200">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center space-x-3">
                                            <motion.button
                                                onClick={() => setSelectedCustomer(null)}
                                                className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200"
                                                whileHover={{ scale: 1.1 }}
                                                whileTap={{ scale: 0.9 }}
                                            >
                                                <i className="bi bi-arrow-left"></i>
                                            </motion.button>
                                            <div>
                                                <h2 className="text-2xl font-bold text-gray-900">
                                                    Customer Details
                                                </h2>
                                                <p className="text-gray-600">
                                                    Complete customer information and history
                                                </p>
                                            </div>
                                        </div>
                                        <motion.button
                                            onClick={() => setSelectedCustomer(null)}
                                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200"
                                            whileHover={{ scale: 1.1 }}
                                            whileTap={{ scale: 0.9 }}
                                            aria-label="Xoá khách hàng"
                                        >
                                            <i className="bi bi-x-lg"></i>
                                        </motion.button>
                                    </div>
                                </div>

                                {/* Content */}
                                <div className="p-6">
                                    {/* Personal + Service */}
                                    <div className="grid md:grid-cols-2 gap-8 mb-8">
                                        <div className="space-y-6">
                                            <h3 className="text-lg font-semibold text-gray-900 mb-4">
                                                Personal Information
                                            </h3>
                                            <div className="space-y-4">
                                                <InfoRow icon="bi-person" title="Full Name" value={selectedCustomer.name} />
                                                <InfoRow icon="bi-envelope" title="Email Address" value={selectedCustomer.email} />
                                                <InfoRow icon="bi-telephone" title="Phone Number" value={selectedCustomer.phone} />
                                                <InfoRow icon="bi-calendar" title="Registration Date" value={selectedCustomer.registrationDate} />
                                            </div>
                                        </div>

                                        <div className="space-y-6">
                                            <h3 className="text-lg font-semibold text-gray-900 mb-4">
                                                Service Information
                                            </h3>
                                            <div className="space-y-4">
                                                <KeyValueRow
                                                    label="Current Package"
                                                    value={
                                                        <span
                                                            className={`px-3 py-1 rounded-full text-sm font-medium ${getPackageBadgeColor(
                                                                selectedCustomer.package
                                                            )}`}
                                                        >
                                                            {selectedCustomer.package}
                                                        </span>
                                                    }
                                                />
                                                <KeyValueRow label="Total Vehicles" value={selectedCustomer.vehicles} />
                                                <KeyValueRow label="Total Swaps" value={selectedCustomer.swaps} />
                                                <KeyValueRow
                                                    label="Account Status"
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
                                    </div>

                                    {/* Vehicles */}
                                    <div className="mb-8">
                                        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                                            <i className="bi bi-car-front mr-2"></i>
                                            Registered Vehicles
                                        </h3>
                                        <div className="grid md:grid-cols-2 gap-4">
                                            {selectedCustomer.vehicleList.map((v) => (
                                                <motion.div
                                                    key={v.id}
                                                    className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-all duration-200"
                                                    whileHover={{ scale: 1.02 }}
                                                >
                                                    <div className="flex items-center justify-between mb-2">
                                                        <h4 className="font-medium text-gray-900">{v.model}</h4>
                                                        <span className="text-sm text-gray-500">{v.year}</span>
                                                    </div>
                                                    <div className="flex items-center space-x-2">
                                                        <i className="bi bi-battery-charging text-green-500"></i>
                                                        <span className="text-sm text-gray-600">
                                                            Battery Health: {v.batteryHealth}%
                                                        </span>
                                                    </div>
                                                </motion.div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Swap History */}
                                    <div>
                                        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                                            <i className="bi bi-activity mr-2"></i>
                                            Recent Swap History
                                        </h3>
                                        <div className="space-y-3">
                                            {selectedCustomer.swapHistory.map((s, i) => (
                                                <motion.div
                                                    key={i}
                                                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-200"
                                                    initial={{ opacity: 0, x: -20 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    transition={{ duration: 0.3, delay: i * 0.1 }}
                                                >
                                                    <div>
                                                        <div className="font-medium text-gray-900">{s.station}</div>
                                                        <div className="text-sm text-gray-500">{s.date}</div>
                                                    </div>
                                                    <div className="text-right">
                                                        <div className="font-medium text-gray-900">{s.duration}</div>
                                                        <div className="text-sm text-gray-500">Duration</div>
                                                    </div>
                                                </motion.div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </PageTransition>
    );
};

// Small presentational helpers
function InfoRow({ icon, title, value }) {
    return (
        <div className="flex items-center space-x-3">
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
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <span className="text-gray-600">{label}</span>
            <span className="font-semibold text-gray-900">{value}</span>
        </div>
    );
}

export default CustomerManagement;
