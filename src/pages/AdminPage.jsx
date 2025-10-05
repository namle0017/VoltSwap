import { useState } from "react";
// eslint-disable-next-line no-unused-vars
import { motion } from "framer-motion";
import PageTransition from "../components/PageTransition";

const AdminDashboard = () => {
  const [activeMenuItem, setActiveMenuItem] = useState("Overview");

  const menuItems = [
    { name: "Overview", icon: "📊" },
    { name: "Customers", icon: "👥" },
    { name: "Reports", icon: "📈" },
    { name: "Stations", icon: "⚡" },
    { name: "Employees", icon: "👨‍💼" },
    { name: "Complaints", icon: "📝" },
    { name: "Packages", icon: "📦" },
  ];

  const statisticCards = [
    {
      title: "Total Customers",
      value: "1,247",
      icon: "👥",
      color: "bg-blue-500",
      change: "+12%",
    },
    {
      title: "Monthly Revenue",
      value: "$248M",
      icon: "💰",
      color: "bg-green-500",
      change: "+8%",
    },
    {
      title: "Swaps Today",
      value: "489",
      icon: "⚡",
      color: "bg-yellow-500",
      change: "+15%",
    },
    {
      title: "Active Stations",
      value: "45/47",
      icon: "📍",
      color: "bg-purple-500",
      change: "95%",
    },
  ];

  const revenueData = [
    {
      package: "GU Package",
      customers: 179,
      revenue: "$125M",
      color: "bg-green-500",
    },
    {
      package: "G2 Package",
      customers: 198,
      revenue: "$89M",
      color: "bg-blue-500",
    },
    {
      package: "G1 Package",
      customers: 114,
      revenue: "$34M",
      color: "bg-yellow-500",
    },
  ];

  const topStations = [
    { rank: 1, name: "Tan Binh Station", swaps: 1247 },
    { rank: 2, name: "District 1 Station", swaps: 1589 },
    { rank: 3, name: "Thu Duc Station", swaps: 891 },
  ];

  const handleSignOut = () => {
    alert("Signing out...");
    // Add sign out logic here
  };

  return (
    <PageTransition>
      <div className="flex h-screen bg-gray-50">
        {/* Sidebar */}
        <motion.div
          className="w-64 bg-white shadow-lg fixed h-full z-10"
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

          <nav className="mt-6">
            {menuItems.map((item, index) => (
              <motion.button
                key={index}
                onClick={() => setActiveMenuItem(item.name)}
                className={`w-full flex items-center px-6 py-3 text-left transition-colors duration-200 ${activeMenuItem === item.name
                    ? "bg-primary text-white border-r-4 border-blue-600"
                    : "text-gray-700 hover:bg-gray-100"
                  }`}
                whileHover={{ x: 5 }}
                whileTap={{ scale: 0.98 }}
              >
                <span className="text-xl mr-3">{item.icon}</span>
                <span className="font-medium">{item.name}</span>
              </motion.button>
            ))}

            <div className="p-6 border-t border-gray-200">
              <motion.button
                onClick={handleSignOut}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600 transition-colors duration-200"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
              >
                <span className="text-xl">🚪</span>
                Sign Out
              </motion.button>
            </div>
          </nav>
        </motion.div>

        {/* Main Content */}
        <div className="flex-1 ml-64 overflow-y-auto">
          <div className="p-8">
            {/* Header */}
            <motion.div
              className="mb-8"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Dashboard Overview
              </h1>
              <p className="text-gray-600">
                Welcome back! Here's what's happening with your EV stations
                today.
              </p>
            </motion.div>

            {/* Statistics Cards */}
            <motion.div
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              {statisticCards.map((card, index) => (
                <motion.div
                  key={index}
                  className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow duration-300"
                  whileHover={{ y: -5, scale: 1.02 }}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div
                      className={`p-3 rounded-lg ${card.color} text-white text-2xl`}
                    >
                      {card.icon}
                    </div>
                    <span className="text-sm font-medium text-green-600">
                      {card.change}
                    </span>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-1">
                    {card.value}
                  </h3>
                  <p className="text-gray-600 text-sm">{card.title}</p>
                </motion.div>
              ))}
            </motion.div>

            {/* Data Panels */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Revenue by Service Package */}
              <motion.div
                className="bg-white rounded-xl shadow-lg p-6"
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
              >
                <h2 className="text-xl font-bold text-gray-900 mb-6">
                  Revenue by Service Package
                </h2>
                <div className="space-y-4">
                  {revenueData.map((item, index) => (
                    <motion.div
                      key={index}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-200"
                      whileHover={{ scale: 1.02 }}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.5, delay: 0.4 + index * 0.1 }}
                    >
                      <div className="flex items-center space-x-4">
                        <div
                          className={`w-4 h-4 rounded-full ${item.color}`}
                        ></div>
                        <div>
                          <h3 className="font-semibold text-gray-900">
                            {item.package}
                          </h3>
                          <p className="text-sm text-gray-600">
                            {item.customers} customers
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-gray-900">
                          {item.revenue}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>

              {/* Top Performing Stations */}
              <motion.div
                className="bg-white rounded-xl shadow-lg p-6"
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
              >
                <h2 className="text-xl font-bold text-gray-900 mb-6">
                  Top Performing Stations
                </h2>
                <div className="space-y-4">
                  {topStations.map((station, index) => (
                    <motion.div
                      key={index}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-200"
                      whileHover={{ scale: 1.02 }}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.5, delay: 0.4 + index * 0.1 }}
                    >
                      <div className="flex items-center space-x-4">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${station.rank === 1
                              ? "bg-yellow-500"
                              : station.rank === 2
                                ? "bg-gray-400"
                                : "bg-orange-500"
                            }`}
                        >
                          {station.rank}
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">
                            {station.name}
                          </h3>
                          <p className="text-sm text-gray-600">Battery swaps</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-gray-900">
                          {station.swaps.toLocaleString()}
                        </p>
                        <p className="text-sm text-gray-600">swaps</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            </div>

            {/* Additional Dashboard Content */}
            <motion.div
              className="mt-8 bg-white rounded-xl shadow-lg p-6"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.5 }}
            >
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                Recent Activity
              </h2>
              <div className="space-y-3">
                <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <p className="text-gray-700">
                    New customer registered at District 1 Station
                  </p>
                  <span className="text-sm text-gray-500 ml-auto">
                    2 min ago
                  </span>
                </div>
                <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <p className="text-gray-700">
                    Battery swap completed at Thu Duc Station
                  </p>
                  <span className="text-sm text-gray-500 ml-auto">
                    5 min ago
                  </span>
                </div>
                <div className="flex items-center space-x-3 p-3 bg-yellow-50 rounded-lg">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                  <p className="text-gray-700">
                    Maintenance scheduled for Tan Binh Station
                  </p>
                  <span className="text-sm text-gray-500 ml-auto">
                    10 min ago
                  </span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </PageTransition>
  );
};

export default AdminDashboard;
