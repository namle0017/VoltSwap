// layouts/AdminLayout.jsx
import { Outlet } from "react-router-dom";
import AdminSidebar from "../components/AdminDashboard";

export default function AdminLayout() {
    const handleSignOut = () => {
        alert("Signing out...");
        // TODO: sign-out logic
    };

    return (
        <div className="flex h-screen bg-gray-50">
            {/* Sidebar cố định */}
            <AdminSidebar onSignOut={handleSignOut} />

            {/* Nội dung cuộn */}
            <main className="flex-1 ml-64 overflow-y-auto p-6">
                <Outlet />
            </main>
        </div>
    );
}
