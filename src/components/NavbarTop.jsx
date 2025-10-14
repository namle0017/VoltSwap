import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function NavbarTop() {
    const navigate = useNavigate();
    const [menuOpen, setMenuOpen] = useState(false);

    // ✅ Dữ liệu user giả — bạn có thể lấy từ localStorage hoặc API
    const user = {
        name: "Xinh Gai",
        email: "GmailXinhgai@gmail.com",
    };

    const handleLogout = () => {
        localStorage.removeItem("authToken");
        alert("You have logged out!");
        navigate("/");
    };

    const goToPersonalInfo = () => {
        setMenuOpen(false);
        navigate("/user/profile");
    };

    const goToPortal = () => {
        setMenuOpen(false);
        navigate("/user/station");
    };

    return (
        <nav className="bg-white shadow-md px-6 py-3 flex justify-between items-center border-b">
            {/* 🔋 Logo */}
            <div
                className="text-2xl font-bold text-lime-500 cursor-pointer"
                onClick={() => navigate("/")}
            >
                VoltSwap
            </div>

            {/* 🟡 User info dropdown */}
            <div className="relative">
                <button
                    onClick={() => setMenuOpen(!menuOpen)}
                    className="bg-yellow-400 hover:bg-yellow-300 text-black font-semibold px-4 py-2 rounded-lg transition-all"
                >
                    {user.name || "Your Name"}
                </button>

                {menuOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                        <div className="px-4 py-2 border-b">
                            <p className="text-sm font-semibold">{user.name}</p>
                            <p className="text-xs text-gray-500">{user.email}</p>
                        </div>

                        <ul className="py-1">
                            <li>
                                <button
                                    onClick={goToPersonalInfo}
                                    className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100 transition"
                                >
                                    👤 Personal Information
                                </button>
                            </li>
                            <li>
                                <button
                                    onClick={goToPortal}
                                    className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100 transition"
                                >
                                    🚪 Portal
                                </button>
                            </li>
                        </ul>

                        <div className="border-t px-4 py-2">
                            <button
                                onClick={handleLogout}
                                className="w-full text-left text-red-600 hover:text-red-700 font-semibold"
                            >
                                Sign Out
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </nav>
    );
}