// pages/AdminPage.jsx
/* eslint-disable no-unused-vars */
import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import PageTransition from "@/components/PageTransition";
import api from "@/api/api";

const MONTH_LABELS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const formatNumber = (n) =>
  typeof n === "number" ? n.toLocaleString("vi-VN") : "0";
const formatCurrencyVND = (n) =>
  typeof n === "number"
    ? n.toLocaleString("vi-VN", { style: "currency", currency: "VND" })
    : "₫0";

export default function AdminPage() {
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [overview, setOverview] = useState(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setErr("");
      try {
        const token = localStorage.getItem("token");
        const res = await api.get("Overview/admin-overview", {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        setOverview(res?.data?.data || null);
      } catch (e) {
        console.error("Overview fetch error:", e?.response?.data || e);
        setErr(
          e?.response?.data?.message ||
          e?.message ||
          "Không tải được Overview từ BE."
        );
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // ======= Derive data for UI =======
  const numberOfDriver = overview?.numberOfDriver ?? 0;
  const monthlyRevenueVal = overview?.monthlyRevenue?.totalRevenue ?? 0;

  const totalSwapToday = overview?.numberOfSwapDailyForAdmin?.totalSwap ?? 0;
  const activeStation = overview?.stationOverview?.activeStation ?? 0;
  const totalStation = overview?.stationOverview?.totalStation ?? 0;

  const planActiveCustomer = overview?.planSummary?.activeCustomer ?? 0;
  const planSwapTimes = overview?.planSummary?.swapTimes ?? 0;
  const planTotalMonthlyRevenue = overview?.planSummary?.totalMonthlyRevenue ?? 0;

  const batterySwapMonthly = Array.isArray(overview?.batterySwapMonthly)
    ? overview.batterySwapMonthly
    : [];

  const monthlySwapsData = useMemo(
    () =>
      batterySwapMonthly.map((m) => ({
        month:
          MONTH_LABELS[(Math.max(1, Math.min(12, Number(m?.month))) - 1) || 0],
        swaps: Number(m?.batterySwapInMonth ?? 0),
      })),
    [batterySwapMonthly]
  );

  const avg = useMemo(() => {
    if (!monthlySwapsData.length) return 0;
    const sum = monthlySwapsData.reduce((s, i) => s + (i.swaps || 0), 0);
    return Math.round(sum / monthlySwapsData.length);
  }, [monthlySwapsData]);

  // Pie: BE không trả breakdown theo gói → dùng Plan Summary Breakdown
  // Để không lệch tỷ lệ, quy đổi totalMonthlyRevenue về "nghìn VND"
  const revenueInThousands = Math.round(planTotalMonthlyRevenue / 1000); // nghìn
  const pieData = [
    { name: "Active Customers", value: Number(planActiveCustomer) || 0, color: "#10B981" },
    { name: "Swap Times", value: Number(planSwapTimes) || 0, color: "#3B82F6" },
    { name: "Total Revenue (x1k ₫)", value: revenueInThousands || 0, color: "#F59E0B" },
  ];

  const statisticCards = [
    {
      title: "Total Customers",
      value: formatNumber(numberOfDriver),
      icon: <i className="bi bi-people-fill"></i>,
      color: "bg-blue-500",
      change: "",
      changeColor: "text-green-600",
    },
    {
      title: "Monthly Revenue",
      value: formatCurrencyVND(monthlyRevenueVal),
      icon: <i className="bi bi-coin"></i>,
      color: "bg-green-500",
      change: "",
      changeColor: "text-green-600",
    },
    {
      title: "Swaps Today",
      value: formatNumber(totalSwapToday),
      icon: <i className="bi bi-lightning-charge-fill"></i>,
      color: "bg-yellow-500",
      change: "",
      changeColor: "text-green-600",
    },
    {
      title: "Active Stations",
      value: `${formatNumber(activeStation)}/${formatNumber(totalStation)}`,
      icon: <i className="bi bi-geo-fill"></i>,
      color: "bg-purple-500",
      change: totalStation
        ? `${Math.round((activeStation / totalStation) * 100)}%`
        : "0%",
      changeColor: "text-blue-600",
    },
  ];

  const CustomPieTooltip = ({ active, payload }) =>
    active && payload?.length ? (
      <div className="bg-white p-3 rounded-lg shadow-lg border">
        <p className="font-semibold">{payload[0].name}</p>
        <p className="text-sm text-gray-600">
          {formatNumber(payload[0].value)}
        </p>
      </div>
    ) : null;

  const CustomBarTooltip = ({ active, payload, label }) =>
    active && payload?.length ? (
      <div className="bg-white p-3 rounded-lg shadow-lg border">
        <p className="font-semibold">{label}</p>
        <p className="text-sm text-gray-600">
          {formatNumber(payload[0].value)} swaps
        </p>
      </div>
    ) : null;

  return (
    <PageTransition>
      <div className="p-2 md:p-4">
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
            Welcome back! Here's what's happening with your EV stations today.
          </p>
        </motion.div>

        {/* Loading / Error */}
        {loading && (
          <div className="flex items-center justify-center my-10">
            <div className="h-10 w-10 border-4 border-blue-400 border-t-transparent rounded-full animate-spin" />
          </div>
        )}
        {!loading && err && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded">
            {err}
          </div>
        )}

        {/* Statistics Cards */}
        {!loading && (
          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            {statisticCards.map((card, index) => (
              <motion.div
                key={index}
                className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all duration-300"
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
                  {card.change ? (
                    <span className={`text-sm font-medium ${card.changeColor}`}>
                      {card.change}
                    </span>
                  ) : (
                    <span />
                  )}
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-1">
                  {card.value}
                </h3>
                <p className="text-gray-600 text-sm">{card.title}</p>
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* Charts */}
        {!loading && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* Pie */}
            <motion.div
              className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all duration-300"
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              whileHover={{ y: -2 }}
            >
              <h2 className="text-xl font-bold text-gray-900 mb-6">
                Plan Summary Breakdown
              </h2>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      innerRadius={40}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {pieData.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomPieTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-4 space-y-2">
                {pieData.map((item, i) => (
                  <motion.div
                    key={i}
                    className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                    whileHover={{ x: 5 }}
                  >
                    <div className="flex items-center space-x-3">
                      <div
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="text-sm font-medium text-gray-700">
                        {item.name}
                      </span>
                    </div>
                    <span className="text-sm text-gray-600">
                      {formatNumber(item.value)}
                    </span>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Bar */}
            <motion.div
              className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all duration-300"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              whileHover={{ y: -2 }}
            >
              <h2 className="text-xl font-bold text-gray-900 mb-6">
                Monthly Battery Swaps
              </h2>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={monthlySwapsData}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis
                      dataKey="month"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 12, fill: "#6b7280" }}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 12, fill: "#6b7280" }}
                    />
                    <Tooltip content={<CustomBarTooltip />} />
                    <Bar
                      dataKey="swaps"
                      fill="#3B82F6"
                      radius={[4, 4, 0, 0]}
                      className="hover:opacity-80 transition-opacity duration-200"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-4 flex items-center justify-between text-sm text-gray-600">
                <span>Average: {formatNumber(avg)} swaps/month</span>
                {/* Có thể tính % MoM khi BE cung cấp thêm */}
                <span className="text-green-600 font-medium">
                  ↗ up-to-date
                </span>
              </div>
            </motion.div>
          </div>
        )}

        {/* Recent Activity (giữ layout, tạm ẩn nếu muốn chờ BE cung cấp feed) */}
        {!loading && (
          <motion.div
            className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all duration-300"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            whileHover={{ y: -2 }}
          >
            <h2 className="text-xl font-bold text-gray-900 mb-6">
              Recent Activity
            </h2>
            <div className="text-sm text-gray-500">
              (Đang chờ endpoint activity feed từ BE)
            </div>
          </motion.div>
        )}
      </div>
    </PageTransition>
  );
}
