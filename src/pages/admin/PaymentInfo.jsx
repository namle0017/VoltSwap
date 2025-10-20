import { useState } from "react";

export default function PaymentInfo() {
    // Mock data
    const [payments, setPayments] = useState([
        {
            id: 1,
            customerName: "John Smith",
            customerEmail: "johnsmith@email.com",
            subscriptionId: "BS-67536343",
            paymentId: 2,
            amount: 3000000,
            status: "Pending",
        },
        {
            id: 2,
            customerName: "Jane Doe",
            customerEmail: "janedoe@email.com",
            subscriptionId: "BS-67536343",
            paymentId: 1,
            amount: 250000,
            status: "Completed",
        },
    ]);

    // Format VND
    const formatVND = (value) =>
        value.toLocaleString("vi-VN", { style: "currency", currency: "VND" });

    // Handle action buttons
    const handleStatusChange = (id, newStatus) => {
        setPayments((prev) =>
            prev.map((p) => (p.id === id ? { ...p, status: newStatus } : p))
        );
    };

    return (
        <div className="p-8 bg-gray-50 min-h-screen">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                    Admin Dashboard
                </h1>
                <p className="text-gray-600">Payment Confirm</p>
            </div>

            {/* Table Section */}
            <div className="bg-white rounded-xl shadow-lg p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-3">
                    Customer Payment List
                </h2>

                <div className="overflow-x-auto">
                    <table className="min-w-full border-collapse">
                        <thead className="bg-gray-50 border-b">
                            <tr>
                                <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">
                                    Customer
                                </th>
                                <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">
                                    Subscription ID
                                </th>
                                <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">
                                    Payment ID
                                </th>
                                <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">
                                    Amount
                                </th>
                                <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {payments.map((p) => (
                                <tr
                                    key={p.id}
                                    className="border-b hover:bg-gray-50 transition duration-150"
                                >
                                    <td className="px-6 py-4">
                                        <div className="font-medium text-gray-900">
                                            {p.customerName}
                                        </div>
                                        <div className="text-sm text-gray-500">
                                            {p.customerEmail}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-gray-700">
                                        {p.subscriptionId}
                                    </td>
                                    <td className="px-6 py-4 text-gray-700">{p.paymentId}</td>
                                    <td className="px-6 py-4 text-gray-700">
                                        {formatVND(p.amount)}
                                    </td>
                                    <td className="px-6 py-4">
                                        {p.status === "Pending" && (
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => handleStatusChange(p.id, "Accepted")}
                                                    className="px-3 py-1 border border-green-600 text-green-600 rounded-lg hover:bg-green-600 hover:text-white transition"
                                                >
                                                    Accept
                                                </button>
                                                <button
                                                    onClick={() => handleStatusChange(p.id, "Denied")}
                                                    className="px-3 py-1 border border-red-600 text-red-600 rounded-lg hover:bg-red-600 hover:text-white transition"
                                                >
                                                    Denied
                                                </button>
                                            </div>
                                        )}
                                        {p.status === "Accepted" && (
                                            <span className="px-3 py-1 text-green-700 bg-green-100 rounded-lg">
                                                Accepted
                                            </span>
                                        )}
                                        {p.status === "Denied" && (
                                            <span className="px-3 py-1 text-red-700 bg-red-100 rounded-lg">
                                                Denied
                                            </span>
                                        )}
                                        {p.status === "Completed" && (
                                            <span className="px-3 py-1 text-gray-700 bg-gray-100 rounded-lg">
                                                Completed
                                            </span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}