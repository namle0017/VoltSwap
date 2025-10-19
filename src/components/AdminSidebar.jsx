import { NavLink } from "react-router-dom";
// eslint-disable-next-line no-unused-vars
import { motion } from "framer-motion";

const menu = [
  { name: "Overview", path: "/admin", icon: "📊", end: true },
  { name: "Customers", path: "/admin/customers", icon: "👥" },
  { name: "Complaints", path: "/admin/complaints", icon: "📝" }, // 👈 NEW
  { name: "Reports", path: "/admin/reports", icon: "📈" }, // NEW
  { name: "Employees", path: "/admin/employees", icon: "💼" }, // NEW
  { name: "Stations", path: "/admin/stations", icon: "⛽" }, // NEW
  { name: "Subscriptions", path: "/admin/subscriptions", icon: "📦" },
  { name: "Payments", path: "/admin/payments", icon: "💰" },
  // có thể thêm: { name: "Transactions", path: "/admin/transactions", icon: "💳" },
];

export default function AdminSidebar({ onSignOut }) {
  return (
    <motion.aside
      className="w-64 bg-white shadow-lg h-full fixed z-10"
      initial={{ x: -250 }}
      animate={{ x: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center space-x-2">
          <div className="text-2xl">⚡</div>
          <div className="text-xl font-bold text-gray-900">EV Admin</div>
        </div>
      </div>

      <nav className="mt-6 space-y-1">
        {menu.map((item, i) => (
          <NavLink
            key={i}
            to={item.path}
            end={item.end}
            className={({ isActive }) =>
              `mx-3 block px-4 py-3 rounded-lg text-left transition-all duration-200 ${
                isActive
                  ? "bg-blue-500 text-white"
                  : "text-gray-700 hover:bg-gray-100"
              }`
            }
          >
            <span className="mr-2">{item.icon}</span>
            {item.name}
          </NavLink>
        ))}

        <motion.button
          onClick={onSignOut}
          className="w-[88%] flex items-center justify-center text-white bg-red-500 hover:bg-red-600 transition-colors duration-200 mt-4 mx-auto py-2 rounded-lg"
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.98 }}
        >
          🚪 Sign Out
        </motion.button>
      </nav>
    </motion.aside>
  );
}
