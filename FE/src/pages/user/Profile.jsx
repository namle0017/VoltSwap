import React, { useState } from "react";

export default function Profile() {
    const [form, setForm] = useState({
        name: "Xinh Gai",
        email: "GmailXinhgai@gmail.com",
        password: "*******",
        address: "123 Main Street",
        phone: "0909123456",
    });

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleUpdate = () => {
        alert("✅ Information updated successfully!");
    };

    return (
        <div className="flex justify-center items-center min-h-screen bg-gray-50">
            <div className="bg-white shadow-lg rounded-2xl p-8 w-full max-w-lg">
                <h2 className="text-2xl font-bold mb-1">Account Information</h2>
                <p className="text-gray-500 mb-6">Manage your account</p>

                {["name", "email", "password", "address", "phone"].map((field) => (
                    <div key={field} className="mb-4">
                        <label className="block text-gray-700 font-medium capitalize">
                            {field}
                        </label>
                        <input
                            type={field === "password" ? "password" : "text"}
                            name={field}
                            value={form[field]}
                            onChange={handleChange}
                            className="w-full mt-1 p-2 border rounded-md bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-400"
                            placeholder={`Enter ${field}`}
                        />
                    </div>
                ))}

                <button
                    onClick={handleUpdate}
                    className="w-full bg-black text-white py-2 rounded-md hover:bg-gray-800 transition"
                >
                    Update Information
                </button>
            </div>
        </div>
    );
}
