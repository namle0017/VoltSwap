// pages/Stations.jsx
/* eslint-disable no-unused-vars */
import { useEffect, useMemo, useState } from "react";
import {
    ResponsiveContainer,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
} from "recharts";
import api from "@/api/api";

const MONTH_LABELS = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
];
const formatNumber = (n) =>
    typeof n === "number" ? n.toLocaleString("vi-VN") : "0";

export default function Stations() {
    // ===== Chart (Overview) =====
    const [loadingChart, setLoadingChart] = useState(true);
    const [chartErr, setChartErr] = useState("");
    const [batterySwapMonthly, setBatterySwapMonthly] = useState([]);

    useEffect(() => {
        const load = async () => {
            setLoadingChart(true);
            setChartErr("");
            try {
                const token = localStorage.getItem("token");
                const res = await api.get("Overview/admin-overview", {
                    headers: token ? { Authorization: `Bearer ${token}` } : {},
                });
                const monthly = Array.isArray(res?.data?.data?.batterySwapMonthly)
                    ? res.data.data.batterySwapMonthly
                    : [];
                setBatterySwapMonthly(monthly);
            } catch (e) {
                console.error("Stations chart fetch error:", e?.response?.data || e);
                setChartErr("Không tải được dữ liệu biểu đồ.");
            } finally {
                setLoadingChart(false);
            }
        };
        load();
    }, []);

    const monthlySwapsData = useMemo(
        () =>
            batterySwapMonthly.map((m) => ({
                month:
                    MONTH_LABELS[(Math.max(1, Math.min(12, Number(m?.month))) - 1) || 0],
                swaps: Number(m?.batterySwapInMonth ?? 0),
            })),
        [batterySwapMonthly]
    );
    const CustomBarTooltip = ({ active, payload, label }) =>
        active && payload?.length ? (
            <div className="bg-white p-3 rounded-lg shadow-lg border">
                <p className="font-semibold">{label}</p>
                <p className="text-sm text-gray-600">
                    {formatNumber(payload[0].value)} swaps
                </p>
            </div>
        ) : null;

    // ===== Stations list (BE) =====
    const [stations, setStations] = useState([]);
    const [loadingStations, setLoadingStations] = useState(true);
    const [stationsErr, setStationsErr] = useState("");

    const stationOptions = useMemo(
        () =>
            stations.map((s) => ({
                stationId: s.stationId,
                stationName: s.stationName,
                stationAddress: s.stationAddress,
                totalBattery: s.totalBattery,
                availablePercent: s.availablePercent,
                batteryAvailable: s.batteryAvailable,
            })),
        [stations]
    );

    useEffect(() => {
        const loadStations = async () => {
            setLoadingStations(true);
            setStationsErr("");
            try {
                const token = localStorage.getItem("token");
                const res = await api.get("/Station/station-list", {
                    headers: token ? { Authorization: `Bearer ${token}` } : {},
                });
                const data = Array.isArray(res?.data?.data) ? res.data.data : [];
                setStations(data);
            } catch (e) {
                console.error("station-list error:", e?.response?.data || e);
                setStationsErr("Không tải được danh sách trạm.");
                setStations([]); // fallback rỗng
            } finally {
                setLoadingStations(false);
            }
        };
        loadStations();
    }, []);

    // ===== Inventory for transfer (BE) =====
    const [inventory, setInventory] = useState([]);
    const [loadingInv, setLoadingInv] = useState(true);
    const [invErr, setInvErr] = useState("");

    useEffect(() => {
        const loadInv = async () => {
            setLoadingInv(true);
            setInvErr("");
            try {
                const token = localStorage.getItem("token");
                const res = await api.get("/BatterySwap/station-inventory-for-transfer", {
                    headers: token ? { Authorization: `Bearer ${token}` } : {},
                });
                const data = Array.isArray(res?.data?.data) ? res.data.data : [];
                setInventory(data);
            } catch (e) {
                console.error("inventory-for-transfer error:", e?.response?.data || e);
                setInvErr("Không tải được danh sách pin điều phối.");
                setInventory([]);
            } finally {
                setLoadingInv(false);
            }
        };
        loadInv();
    }, []);

    // ===== Allocation state =====
    const [fromStation, setFromStation] = useState(""); // filter nguồn (optional)
    const [toStation, setToStation] = useState("");     // bắt buộc chọn đích
    const [selectedBatteryIds, setSelectedBatteryIds] = useState(new Set());

    const inventoryFiltered = useMemo(() => {
        if (!fromStation) return inventory;
        return inventory.filter((b) => String(b.stationId) === String(fromStation));
    }, [inventory, fromStation]);

    const toggleSelect = (batteryId) => {
        setSelectedBatteryIds((prev) => {
            const next = new Set(prev);
            if (next.has(batteryId)) next.delete(batteryId);
            else next.add(batteryId);
            return next;
        });
    };

    const selectAllInFilter = () => {
        const next = new Set(selectedBatteryIds);
        inventoryFiltered.forEach((b) => next.add(b.batteryId));
        setSelectedBatteryIds(next);
    };
    const clearAllSelection = () => setSelectedBatteryIds(new Set());

    const handleTransfer = () => {
        if (!toStation) {
            alert("Vui lòng chọn trạm đích (Destination).");
            return;
        }
        if (selectedBatteryIds.size === 0) {
            alert("Vui lòng chọn ít nhất 1 pin để điều phối.");
            return;
        }
        const payload = {
            destinationStationId: toStation,
            batteryIds: Array.from(selectedBatteryIds),
            // (tuỳ BE) có thể gửi kèm source: fromStation (nếu muốn)
        };
        // TODO: gọi API điều phối khi BE sẵn sàng
        alert(
            `✅ Sẵn sàng điều phối ${payload.batteryIds.length} pin tới trạm ${payload.destinationStationId}.\n` +
            `Payload:\n` + JSON.stringify(payload, null, 2)
        );
        // Sau khi gọi thành công:
        // setSelectedBatteryIds(new Set());
    };

    return (
        <div className="p-8 bg-gray-50 min-h-screen">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
                    <p className="text-gray-600">Battery Swap Station Management</p>
                </div>
                <div className="flex gap-2">
                    <button className="px-4 py-2 border rounded-lg hover:bg-gray-100 flex items-center">
                        <i className="bi bi-funnel"></i>{" "}
                        <span className="ml-2">Filter</span>
                    </button>
                    <button className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 flex items-center">
                        <i className="bi bi-plus-lg"></i>
                        <span className="ml-2">Add New Station</span>
                    </button>
                </div>
            </div>

            {/* Bar Chart */}
            <div className="bg-white rounded-lg shadow p-6 mb-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">
                    Swap Activity by Month
                </h2>

                {loadingChart ? (
                    <div className="text-gray-500 text-center py-12">
                        <div className="h-8 w-8 mx-auto mb-2 border-4 border-blue-400 border-t-transparent rounded-full animate-spin" />
                        Loading chart...
                    </div>
                ) : chartErr ? (
                    <div className="text-red-600 text-center py-8">{chartErr}</div>
                ) : (
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
                )}
            </div>

            {/* Battery Allocation (BE data, checkbox) */}
            <div className="bg-white rounded-lg shadow p-6 mb-8">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">
                    Battery Allocation Between Stations
                </h2>

                {/* Controls */}
                <div className="grid md:grid-cols-3 gap-4 mb-4">
                    <div>
                        <label className="block text-sm text-gray-700 mb-1">Source (filter)</label>
                        <select
                            className="w-full border rounded-lg px-3 py-2"
                            value={fromStation}
                            onChange={(e) => setFromStation(e.target.value)}
                        >
                            <option value="">Tất cả trạm</option>
                            {stationOptions.map((st) => (
                                <option key={st.stationId} value={st.stationId}>
                                    {st.stationName} ({st.stationId})
                                </option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm text-gray-700 mb-1">Destination</label>
                        <select
                            className="w-full border rounded-lg px-3 py-2"
                            value={toStation}
                            onChange={(e) => setToStation(e.target.value)}
                        >
                            <option value="">Chọn trạm đích</option>
                            {stationOptions.map((st) => (
                                <option key={st.stationId} value={st.stationId}>
                                    {st.stationName} ({st.stationId})
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="flex items-end gap-2">
                        <button
                            className="px-3 py-2 border rounded-lg hover:bg-gray-50"
                            onClick={selectAllInFilter}
                            disabled={loadingInv || inventoryFiltered.length === 0}
                        >
                            Select all (filter)
                        </button>
                        <button
                            className="px-3 py-2 border rounded-lg hover:bg-gray-50"
                            onClick={clearAllSelection}
                            disabled={selectedBatteryIds.size === 0}
                        >
                            Clear
                        </button>
                    </div>
                </div>

                {/* Inventory table */}
                {loadingInv ? (
                    <div className="text-gray-500 text-center py-8">
                        <div className="h-8 w-8 mx-auto mb-2 border-4 border-blue-400 border-t-transparent rounded-full animate-spin" />
                        Đang tải danh sách pin...
                    </div>
                ) : invErr ? (
                    <div className="text-red-600">{invErr}</div>
                ) : inventoryFiltered.length === 0 ? (
                    <div className="text-gray-500">Không có pin phù hợp bộ lọc.</div>
                ) : (
                    <div className="overflow-x-auto border rounded-lg">
                        <table className="min-w-full text-sm">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="p-2 text-left">Select</th>
                                    <th className="p-2 text-left">BatteryId</th>
                                    <th className="p-2 text-left">Status</th>
                                    <th className="p-2 text-left">SoC</th>
                                    <th className="p-2 text-left">SoH</th>
                                    <th className="p-2 text-left">Capacity</th>
                                    <th className="p-2 text-left">Station</th>
                                </tr>
                            </thead>
                            <tbody>
                                {inventoryFiltered.map((b) => {
                                    const checked = selectedBatteryIds.has(b.batteryId);
                                    return (
                                        <tr key={b.batteryId} className="border-t">
                                            <td className="p-2">
                                                <input
                                                    type="checkbox"
                                                    checked={checked}
                                                    onChange={() => toggleSelect(b.batteryId)}
                                                />
                                            </td>
                                            <td className="p-2 font-medium">{b.batteryId}</td>
                                            <td className="p-2">{b.status}</td>
                                            <td className="p-2">{b.soc}%</td>
                                            <td className="p-2">{b.soh}</td>
                                            <td className="p-2">{b.capacity}</td>
                                            <td className="p-2">{b.stationId}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}

                <div className="mt-4 flex items-center justify-between">
                    <div className="text-sm text-gray-600">
                        Đã chọn: <b>{selectedBatteryIds.size}</b> pin
                    </div>
                    <button
                        className="px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800"
                        onClick={handleTransfer}
                        disabled={loadingInv || selectedBatteryIds.size === 0 || !toStation}
                    >
                        Schedule Battery Transfer
                    </button>
                </div>
            </div>

            {/* Stations List (từ /Station/station-list) */}
            <div className="grid lg:grid-cols-2 gap-6">
                {loadingStations ? (
                    <div className="col-span-2 text-center text-gray-500 py-8">
                        <div className="h-8 w-8 mx-auto mb-2 border-4 border-blue-400 border-t-transparent rounded-full animate-spin" />
                        Đang tải trạm...
                    </div>
                ) : stationsErr ? (
                    <div className="col-span-2 text-center text-red-600">{stationsErr}</div>
                ) : stations.length === 0 ? (
                    <div className="col-span-2 text-center text-gray-500">
                        Không có trạm nào.
                    </div>
                ) : (
                    stationOptions.map((st) => (
                        <div key={st.stationId} className="bg-white rounded-lg shadow p-6">
                            <div className="flex justify-between items-center mb-4">
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900">
                                        {st.stationName}
                                    </h3>
                                    <p className="text-sm text-gray-600">{st.stationAddress}</p>
                                </div>
                                <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                                    Online
                                </span>
                            </div>
                            <div className="grid grid-cols-2 gap-4 text-center">
                                <div className="bg-blue-50 p-4 rounded-lg">
                                    <i className="bi bi-battery-full text-2xl text-blue-700"></i>
                                    <p className="mt-2 text-xl font-bold">
                                        {st.batteryAvailable}/{st.totalBattery}
                                    </p>
                                    <p className="text-sm text-gray-600">Available batteries</p>
                                </div>
                                <div className="bg-green-50 p-4 rounded-lg">
                                    <i className="bi bi-activity text-2xl text-green-700"></i>
                                    <p className="mt-2 text-xl font-bold">
                                        {st.availablePercent ?? 0}%
                                    </p>
                                    <p className="text-sm text-gray-600">Availability</p>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
