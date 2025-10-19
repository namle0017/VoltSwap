import { useState } from "react";

export default function Stations() {
  // Mock data
  const stationsMock = [
    {
      id: 1,
      name: "Tan Binh Station",
      address: "123 Truong Chinh St, Tan Binh",
      available: 16,
      capacity: 20,
      swapsToday: 45,
      batteryHealth: 85,
      status: "Online",
    },
    {
      id: 2,
      name: "District 1 Station",
      address: "456 Nguyen Hue St, District 1",
      available: 12,
      capacity: 20,
      swapsToday: 67,
      batteryHealth: 90,
      status: "Online",
    },
  ];

  const [stations] = useState(stationsMock);
  const [fromStation, setFromStation] = useState("");
  const [toStation, setToStation] = useState("");
  const [transferQty, setTransferQty] = useState("");

  const handleTransfer = () => {
    if (!fromStation || !toStation) {
      alert("Please select both source and destination stations.");
      return;
    }
    if (fromStation === toStation) {
      alert("Source and destination cannot be the same.");
      return;
    }
    if (!transferQty || transferQty <= 0) {
      alert("Please enter a valid number of batteries to transfer.");
      return;
    }
    alert(
      `✅ Scheduled transfer of ${transferQty} batteries from "${fromStation}" to "${toStation}". (Mock Action)`
    );
    setTransferQty("");
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

      {/* Chart Placeholder */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">
          Swap Activity by Month
        </h2>
        <div className="text-gray-500 text-center py-12">
          {/* Placeholder for chart */}
          📊 Chart will be added here
        </div>
      </div>

      {/* Battery Allocation */}
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">
          Battery Allocation Between Stations
        </h2>
        <div className="grid md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-sm text-gray-700 mb-1">From</label>
            <select
              className="w-full border rounded-lg px-3 py-2"
              value={fromStation}
              onChange={(e) => setFromStation(e.target.value)}
            >
              <option value="">Select source</option>
              {stations.map((st) => (
                <option key={st.id} value={st.name}>
                  {st.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-700 mb-1">To</label>
            <select
              className="w-full border rounded-lg px-3 py-2"
              value={toStation}
              onChange={(e) => setToStation(e.target.value)}
            >
              <option value="">Select destination</option>
              {stations.map((st) => (
                <option key={st.id} value={st.name}>
                  {st.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-700 mb-1">
              Number of Batteries
            </label>
            <input
              type="number"
              className="w-full border rounded-lg px-3 py-2"
              placeholder="Enter quantity"
              value={transferQty}
              onChange={(e) => setTransferQty(e.target.value)}
            />
          </div>
        </div>
        <button
          className="px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800"
          onClick={handleTransfer}
        >
          Schedule Battery Transfer
        </button>
      </div>

      {/* Stations List */}
      <div className="grid lg:grid-cols-2 gap-6">
        {stations.map((st) => (
          <div key={st.id} className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {st.name}
                </h3>
                <p className="text-sm text-gray-600">{st.address}</p>
              </div>
              <span
                className={`px-3 py-1 rounded-full text-xs font-medium ${
                  st.status === "Online"
                    ? "bg-green-100 text-green-700"
                    : "bg-gray-200 text-gray-700"
                }`}
              >
                {st.status}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-4 text-center">
              <div className="bg-blue-50 p-4 rounded-lg">
                <i className="bi bi-battery-full text-2xl text-blue-700"></i>
                <p className="mt-2 text-xl font-bold">
                  {st.available}/{st.capacity}
                </p>
                <p className="text-sm text-gray-600">Available batteries</p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <i className="bi bi-lightning-charge text-2xl text-green-700"></i>
                <p className="mt-2 text-xl font-bold">{st.swapsToday}</p>
                <p className="text-sm text-gray-600">Swaps today</p>
              </div>
            </div>
            <div className="mt-4">
              <p className="text-sm text-gray-600 mb-1">
                Average battery health
              </p>
              <div className="w-full bg-gray-200 h-2 rounded-full">
                <div
                  className="bg-green-600 h-2 rounded-full"
                  style={{ width: `${st.batteryHealth}%` }}
                ></div>
              </div>
              <p className="text-right text-sm text-gray-600 mt-1">
                {st.batteryHealth}%
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
