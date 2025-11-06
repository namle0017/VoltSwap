// pages/AdminPage.jsx
/* eslint-disable no-unused-vars */
import { useEffect, useMemo, useRef, useState } from "react";
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

const MONTH_LABELS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
];
const formatNumber = (n) => (typeof n === "number" ? n.toLocaleString("vi-VN") : "0");
const formatCurrencyVND = (n) =>
  typeof n === "number"
    ? n.toLocaleString("vi-VN", { style: "currency", currency: "VND" })
    : "₫0";

/** Safe getter: chấp nhận nhiều đường dẫn khác nhau */
const pick = (obj, paths, fallback = undefined) => {
  for (const p of paths) {
    try {
      const val = p.split(".").reduce((o, k) => (o ?? {})[k], obj);
      if (val !== undefined && val !== null) return val;
      // eslint-disable-next-line no-empty
    } catch (_) { }
  }
  return fallback;
};

/** Chuẩn hoá nhiều biến thể payload từ BE về 1 shape thống nhất */
/** Chuẩn hoá nhiều biến thể payload từ BE về 1 shape thống nhất */
function normalizeOverview(raw) {
  if (!raw || typeof raw !== "object") return null;

  // Customers / Drivers
  const numberOfDriver =
    Number(pick(raw, ["numberOfDriver", "drivers.total", "driver.total", "totals.driver"])) || 0;

  // Monthly Revenue
  const monthlyRevenueVal =
    Number(pick(raw, ["monthlyRevenue.totalRevenue", "revenue.monthly.total", "revenueTotalMonth"])) || 0;

  // Daily swap
  const totalSwapToday =
    Number(pick(raw, ["numberOfSwapDailyForAdmin.totalSwap", "dailySwap.total", "swaps.today"])) || 0;

  // Stations
  const activeStation =
    Number(pick(raw, ["stationOverview.activeStation", "stations.active", "station.active"])) || 0;
  const totalStation =
    Number(pick(raw, ["stationOverview.totalStation", "stations.total", "station.total"])) || 0;

  // === Plan summary (BE mới: planSummary.reportSummary.*) ===
  const report = pick(raw, ["planSummary.reportSummary"], {}) || {};
  const planActiveCustomer = Number(report.activeCustomer || 0);
  const planSwapTimes = Number(report.swapTimes || 0);
  const planTotalMonthlyRevenue = Number(report.totalMonthlyRevenue || 0);

  // === Monthly swaps (BE mới: batterySwapMonthly.batterySwapMonthlyLists) ===
  const bsm =
    pick(raw, ["batterySwapMonthly.batterySwapMonthlyLists", "batterySwapMonthly", "swaps.monthly", "monthlySwaps"], []) || [];
  const arr = Array.isArray(bsm)
    ? bsm
    : Array.isArray(bsm?.batterySwapMonthlyLists)
      ? bsm.batterySwapMonthlyLists
      : [];

  const avgBatterySwap = Number(pick(raw, ["batterySwapMonthly.avgBatterySwap"])) || 0;

  const monthlySwapsData = arr.map((m) => {
    const mNum =
      Number(m?.month ?? m?.m ?? m?.idx) ||
      (typeof m?.month === "string"
        ? Math.max(1, MONTH_LABELS.findIndex((x) => x === m.month) + 1)
        : 0);
    const monthLabel = MONTH_LABELS[(Math.max(1, Math.min(12, mNum)) - 1) || 0] || "—";
    const swaps = Number(m?.batterySwapInMonth ?? m?.count ?? m?.swaps ?? m?.total ?? 0);
    return { month: monthLabel, swaps };
  });

  return {
    numberOfDriver,
    monthlyRevenueVal,
    totalSwapToday,
    activeStation,
    totalStation,
    planActiveCustomer,
    planSwapTimes,
    planTotalMonthlyRevenue,
    monthlySwapsData,
    avgBatterySwap, // <- dùng nếu BE đã tính sẵn
  };
}

export default function AdminPage() {
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [ov, setOv] = useState(null);
  const fetchedRef = useRef(false); // chặn fetch 2 lần do StrictMode dev

  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;

    const load = async () => {
      setLoading(true);
      setErr("");
      try {
        const token = localStorage.getItem("token");
        const res = await api.get("/Overview/admin-overview", {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        const raw = res?.data?.data ?? res?.data ?? null;
        const normalized = normalizeOverview(raw);
        if (!normalized) throw new Error("Overview payload không đúng định dạng.");
        setOv(normalized);
      } catch (e) {
        console.error("Overview fetch error:", e?.response?.data || e);
        setErr(
          e?.response?.data?.message || e?.message || "Không tải được Overview từ BE."
        );
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // ======= Derive data for UI =======
  const numberOfDriver = ov?.numberOfDriver ?? 0;
  const monthlyRevenueVal = ov?.monthlyRevenueVal ?? 0;

  const totalSwapToday = ov?.totalSwapToday ?? 0;
  const activeStation = ov?.activeStation ?? 0;
  const totalStation = ov?.totalStation ?? 0;

  const planActiveCustomer = ov?.planActiveCustomer ?? 0;
  const planSwapTimes = ov?.planSwapTimes ?? 0;
  const planTotalMonthlyRevenue = ov?.planTotalMonthlyRevenue ?? 0;

  const monthlySwapsData = Array.isArray(ov?.monthlySwapsData) ? ov.monthlySwapsData : [];

  const avg = useMemo(() => {
    if (!monthlySwapsData.length) return 0;
    const sum = monthlySwapsData.reduce((s, i) => s + (i.swaps || 0), 0);
    return Math.round(sum / monthlySwapsData.length);
  }, [monthlySwapsData]);

  // Pie: quy đổi totalMonthlyRevenue về "nghìn VND" để dễ nhìn
  const revenueInThousands = Math.round(planTotalMonthlyRevenue / 1000);
  const pieData = [
    { name: "Active Customers", value: Number(planActiveCustomer) || 0, color: "#10B981" },
    { name: "Swap Times", value: Number(planSwapTimes) || 0, color: "#3B82F6" },
    { name: "Total Revenue (x1k ₫)", value: revenueInThousands || 0, color: "#F59E0B" },
  ];

  const allPieZero = pieData.every((d) => !Number(d.value));
  const barEmpty = monthlySwapsData.length === 0;

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
      change: totalStation ? `${Math.round((activeStation / totalStation) * 100)}%` : "0%",
      changeColor: "text-blue-600",
    },
  ];

  const CustomPieTooltip = ({ active, payload }) =>
    active && payload?.length ? (
      <div className="bg-white p-3 rounded-lg shadow-lg border">
        <p className="font-semibold">{payload[0].name}</p>
        <p className="text-sm text-gray-600">{formatNumber(payload[0].value)}</p>
      </div>
    ) : null;

  const CustomBarTooltip = ({ active, payload, label }) =>
    active && payload?.length ? (
      <div className="bg-white p-3 rounded-lg shadow-lg border">
        <p className="font-semibold">{label}</p>
        <p className="text-sm text-gray-600">{formatNumber(payload[0].value)} swaps</p>
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard Overview</h1>
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
        {!loading && !err && (
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
                  <div className={`p-3 rounded-lg ${card.color} text-white text-2xl`}>{card.icon}</div>
                  {card.change ? (
                    <span className={`text-sm font-medium ${card.changeColor}`}>{card.change}</span>
                  ) : (
                    <span />
                  )}
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-1">{card.value}</h3>
                <p className="text-gray-600 text-sm">{card.title}</p>
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* Charts */}
        {!loading && !err && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* Pie */}
            <motion.div
              className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all duration-300"
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              whileHover={{ y: -2 }}
            >
              <h2 className="text-xl font-bold text-gray-900 mb-6">Plan Summary Breakdown</h2>
              <div className="h-80">
                {allPieZero ? (
                  <div className="h-full flex items-center justify-center text-sm text-gray-500">
                    No plan summary data (all zeros).
                  </div>
                ) : (
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
                )}
              </div>
              <div className="mt-4 space-y-2">
                {pieData.map((item, i) => (
                  <motion.div
                    key={i}
                    className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                    whileHover={{ x: 5 }}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-4 h-4 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="text-sm font-medium text-gray-700">{item.name}</span>
                    </div>
                    <span className="text-sm text-gray-600">{formatNumber(item.value)}</span>
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
              <h2 className="text-xl font-bold text-gray-900 mb-6">Monthly Battery Swaps</h2>
              <div className="h-80">
                {barEmpty ? (
                  <div className="h-full flex items-center justify-center text-sm text-gray-500">
                    No monthly swap data.
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={monthlySwapsData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis
                        dataKey="month"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 12, fill: "#6b7280" }}
                      />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#6b7280" }} />
                      <Tooltip content={<CustomBarTooltip />} />
                      <Bar
                        dataKey="swaps"
                        fill="#3B82F6"
                        radius={[4, 4, 0, 0]}
                        className="hover:opacity-80 transition-opacity duration-200"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
              <div className="mt-4 flex items-center justify-between text-sm text-gray-600">
                <span>Average: {formatNumber(avg)} swaps/month</span>
                <span className="text-green-600 font-medium">↗ up-to-date</span>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </PageTransition>
  );
}
