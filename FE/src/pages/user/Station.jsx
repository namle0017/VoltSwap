// src/pages/user/Station.jsx
import React, { useEffect, useRef, useState } from "react";
import api from "@/api/api";
import { useNavigate } from "react-router-dom";
import { MapContainer, TileLayer, Marker, Popup, Circle, Polyline } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Leaflet default icon fix
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl:
        "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
    iconUrl:
        "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
    shadowUrl:
        "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

// User location icon
const userIcon = L.divIcon({
    className: "user-pin",
    html: `<div style="
    display:grid;place-items:center;width:28px;height:28px;border-radius:50%;
    background:#2563eb;color:#fff;font-size:14px;font-weight:700;
    box-shadow:0 0 0 3px rgba(37,99,235,.2)
  ">🧍</div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
});

// distance (km)
const haversineKm = (a, b) => {
    if (!a || !b) return 0;
    const R = 6371;
    const dLat = ((b.lat - a.lat) * Math.PI) / 180;
    const dLon = ((b.lng - a.lng) * Math.PI) / 180;
    const lat1 = (a.lat * Math.PI) / 180;
    const lat2 = (b.lat * Math.PI) / 180;
    const x =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(x));
};

// small helper: format seconds -> mm:ss
const formatMMSS = (sec) => {
    const s = Math.max(0, Number(sec) || 0);
    const mm = Math.floor(s / 60);
    const ss = s % 60;
    return `${mm}m ${String(ss).padStart(2, "0")}s`;
};

export default function Station() {
    const navigate = useNavigate();

    // BE state
    const [stations, setStations] = useState([]);
    const [subs, setSubs] = useState([]);
    const [loading, setLoading] = useState(true);

    // booking/modal
    const [selectedStation, setSelectedStation] = useState(null);
    const [selectedSub, setSelectedSub] = useState("");
    const [bookingDate, setBookingDate] = useState("");
    const [bookingTime, setBookingTime] = useState("");
    const [showModal, setShowModal] = useState(false);

    // navigate-modal
    const [navStation, setNavStation] = useState(null);
    const [navSub, setNavSub] = useState("");

    // navigate visualization
    const [userPos, setUserPos] = useState(null);
    const [targetId, setTargetId] = useState(null);
    const [route, setRoute] = useState(null);
    const mapRef = useRef(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const token = localStorage.getItem("token");
                const userId = localStorage.getItem("userId");
                if (!token || !userId) {
                    alert("Please log in again!");
                    navigate("/login");
                    return;
                }

                const [stationRes, subRes] = await Promise.all([
                    api.get("Station/station-list"),
                    api.get(`/Subscription/subscription-user-list?DriverId=${userId}`),
                ]);

                setStations(stationRes.data?.data || []);
                setSubs(subRes.data?.data || []);
            } catch (err) {
                console.error("❌ Failed to load data:", err.response?.data || err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [navigate]);

    // draw route & highlight
    const handleNavigateVisual = (st) => {
        setTargetId(st.stationId);

        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    const up = { lat: pos.coords.latitude, lng: pos.coords.longitude };
                    setUserPos(up);
                    const tp = { lat: st.locationLat, lng: st.locationLon };
                    setRoute([
                        [up.lat, up.lng],
                        [tp.lat, tp.lng],
                    ]);

                    if (mapRef.current) {
                        const bounds = L.latLngBounds(
                            L.latLng(up.lat, up.lng),
                            L.latLng(tp.lat, tp.lng)
                        );
                        mapRef.current.fitBounds(bounds.pad(0.25));
                    }
                },
                () => {
                    const tp = { lat: st.locationLat, lng: st.locationLon };
                    setUserPos(null);
                    setRoute(null);
                    if (mapRef.current) mapRef.current.setView([tp.lat, tp.lng], 15);
                },
                { enableHighAccuracy: true, maximumAge: 10000, timeout: 8000 }
            );
        } else {
            const tp = { lat: st.locationLat, lng: st.locationLon };
            if (mapRef.current) mapRef.current.setView([tp.lat, tp.lng], 15);
        }
    };

    const handleBookSwap = (station) => {
        setSelectedStation(station);
        setShowModal(true);
    };

    // ===== NAVIGATE MODAL flow =====
    const openNavigateModal = (station) => {
        setNavStation(station);
        setNavSub(selectedSub || "");
    };

    const confirmNavigate = () => {
        if (!navSub) {
            alert("Vui lòng chọn subscription trước khi tiếp tục.");
            return;
        }
        const chosen = subs.find((s) => s.subId === navSub);
        if (!chosen) {
            alert("Subscription không hợp lệ.");
            return;
        }

        // Lưu preset cho StationSwap.jsx
        localStorage.setItem("swap_stationId", navStation.stationId);
        localStorage.setItem("swap_stationName", navStation.stationName || "");
        localStorage.setItem("swap_subscriptionId", chosen.subId);
        localStorage.setItem("swap_subscriptionName", chosen.planName);

        navigate("/stations", {
            state: {
                stationId: navStation.stationId,
                stationName: navStation.stationName,
                subscriptionId: chosen.subId,
                subscriptionName: chosen.planName,
            },
        });

        setNavStation(null);
        setNavSub("");
    };

    // ====== Booking flow (UPDATED to match new BE response) ======
    const confirmBooking = async () => {
        if (!selectedSub || !bookingDate || !bookingTime)
            return alert("Please complete all fields");

        const token = localStorage.getItem("token");
        const userDriverId = localStorage.getItem("userId");
        if (!token || !userDriverId) {
            alert("⚠️ Please login again!");
            navigate("/login");
            return;
        }

        const dateBooking = new Date(bookingDate).toISOString().split("T")[0];
        const timeBooking =
            bookingTime && bookingTime.length === 5 ? `${bookingTime}:00` : bookingTime;

        const payload = {
            stationId: selectedStation.stationId,
            driverId: userDriverId,
            note: "Swap battery",
            subscriptionId: selectedSub,
            dateBooking,
            timeBooking,
        };

        try {
            const res = await api.post("/Booking/create-booking", payload, {
                headers: { Authorization: `Bearer ${token}` },
            });

            // NEW: BE now returns { data: { booking: {...}, time: seconds } }
            const booking =
                res?.data?.data?.booking || res?.data?.booking || {};
            const lockSeconds =
                Number(res?.data?.data?.time ?? res?.data?.time ?? 0) || 0;

            // Stash for next steps (payment / simulation)
            localStorage.setItem("swap_stationId", selectedStation.stationId);
            localStorage.setItem("swap_subscriptionId", selectedSub);

            // Optional: keep for quick lookup in transactions
            if (booking.transactionId) {
                localStorage.setItem("lastTransactionId", booking.transactionId);
            }
            if (booking.appointmentId) {
                localStorage.setItem("lastAppointmentId", booking.appointmentId);
            }
            // Also keep lastPlanId (for legacy flows using it)
            localStorage.setItem("lastPlanId", booking.subscriptionId || selectedSub);

            // Save a lock-expire timestamp (client-side hint)
            if (lockSeconds > 0) {
                const expireAt = Date.now() + lockSeconds * 1000;
                localStorage.setItem("lockExpireAt", String(expireAt));
            }

            alert(
                [
                    "✅ Booking created & battery locked!",
                    `📍 ${selectedStation.stationName}`,
                    `🧾 Transaction: ${booking.transactionId || "—"}`,
                    `📄 Appointment: ${booking.appointmentId || "—"}`,
                    `📅 ${dateBooking} ${timeBooking}`,
                    lockSeconds
                        ? `⏳ Lock time: ${formatMMSS(lockSeconds)}`
                        : undefined,
                    "",
                    "➡ Tiếp theo: vào Transactions để thanh toán.",
                ]
                    .filter(Boolean)
                    .join("\n")
            );

            setShowModal(false);

            // Navigate to transactions with context
            navigate("/user/transaction", {
                state: { transactionId: booking.transactionId || null },
            });
        } catch (err) {
            const v = err?.response?.data;
            const msg =
                (typeof v === "object" && (v.message || v.title)) ||
                (typeof v === "string" && v) ||
                err.message;
            console.error("❌ Booking error:", err?.response || err);
            alert(`❌ Booking failed!\n${msg || "Unknown error"}`);
        }
    };

    if (loading)
        return (
            <div className="flex justify-center mt-20">
                <div className="h-10 w-10 border-4 border-blue-400 border-t-transparent rounded-full animate-spin" />
            </div>
        );

    const defaultCenter = [10.7769, 106.7009];

    // helper: render option label with name + ID + status
    // eslint-disable-next-line no-unused-vars
    const subOptionLabel = (s) => `${s.planName} — ID: ${s.subId} — ${s.planStatus}`;

    // helper: detail line for selected sub
    const SelectedSubInfo = ({ subId }) => {
        const s = subs.find((x) => x.subId === subId);
        if (!s) return null;
        return (
            <div className="text-xs text-gray-600 bg-gray-50 border rounded-md px-2 py-1">
                Selected: <span className="font-medium">{s.planName}</span> —{" "}
                <span className="font-mono">ID: {s.subId}</span>
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <h2 className="text-2xl font-bold mb-3">🗺️ Battery Swap Stations</h2>

            {/* ==== MAP (Leaflet) ==== */}
            <div className="rounded-2xl mb-6 shadow overflow-hidden">
                <MapContainer
                    center={defaultCenter}
                    zoom={6}
                    scrollWheelZoom
                    className="h-80 w-full z-0"
                    whenCreated={(m) => (mapRef.current = m)}
                >
                    <TileLayer
                        attribution="&copy; OpenStreetMap"
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />

                    {/* Station markers */}
                    {stations.map((st) => (
                        <Marker key={st.stationId} position={[st.locationLat, st.locationLon]}>
                            <Popup>
                                <div className="text-sm">
                                    <strong>{st.stationName}</strong>
                                    <p className="text-gray-600">{st.stationAddress}</p>
                                    <p className="text-gray-500">
                                        ⚡ {st.batteryAvailable}/{st.totalBattery} batteries
                                    </p>

                                    {userPos && (
                                        <p className="mt-1 text-xs text-gray-500">
                                            📏 ~
                                            {haversineKm(userPos, {
                                                lat: st.locationLat,
                                                lng: st.locationLon,
                                            }).toFixed(1)}
                                            km • ETA ~
                                            {Math.round(
                                                (haversineKm(userPos, {
                                                    lat: st.locationLat,
                                                    lng: st.locationLon,
                                                }) / 40) * 60
                                            )}{" "}
                                            mins
                                        </p>
                                    )}

                                    <div className="mt-2 flex gap-2">
                                        <button
                                            onClick={() => handleBookSwap(st)}
                                            className="px-2 py-1 bg-black text-white text-xs rounded-lg"
                                        >
                                            🔋 Book Swap
                                        </button>
                                        <button
                                            onClick={() => {
                                                handleNavigateVisual(st); // preview route
                                                openNavigateModal(st); // open modal to go to simulation
                                            }}
                                            className="px-2 py-1 border text-xs rounded-lg hover:bg-gray-100"
                                        >
                                            📍 Navigate
                                        </button>
                                    </div>
                                </div>
                            </Popup>

                            {targetId === st.stationId && (
                                <Circle
                                    center={[st.locationLat, st.locationLon]}
                                    radius={450}
                                    pathOptions={{
                                        color: "#22c55e",
                                        fillColor: "#22c55e",
                                        fillOpacity: 0.15,
                                    }}
                                />
                            )}
                        </Marker>
                    ))}

                    {userPos && <Marker position={[userPos.lat, userPos.lng]} icon={userIcon} />}
                    {route && (
                        <Polyline positions={route} dashArray="6 8" color="#2563eb" weight={4} />
                    )}
                </MapContainer>
            </div>

            {/* ==== Station list ==== */}
            <h3 className="font-semibold mb-3">Nearby Stations</h3>
            <div className="space-y-4">
                {stations.map((st) => {
                    const color =
                        st.availablePercent >= 70
                            ? "bg-green-400"
                            : st.availablePercent >= 40
                                ? "bg-yellow-400"
                                : "bg-red-400";
                    return (
                        <div
                            key={st.stationId}
                            className="bg-white p-4 rounded-xl shadow flex justify-between items-center"
                        >
                            <div>
                                <h4 className="font-semibold">{st.stationName}</h4>
                                <p className="text-sm text-gray-500">
                                    {st.batteryAvailable}/{st.totalBattery} batteries
                                </p>
                                <div className="w-40 bg-gray-200 rounded-full h-2 mt-2">
                                    <div
                                        className={`${color} h-2 rounded-full`}
                                        style={{ width: `${st.availablePercent}%` }}
                                    />
                                </div>
                            </div>
                            <div className="space-x-2">
                                <button
                                    onClick={() => handleNavigateVisual(st)}
                                    className="px-3 py-1 border rounded-lg hover:bg-gray-100"
                                >
                                    👀 Preview Route
                                </button>
                                <button
                                    onClick={() => {
                                        handleNavigateVisual(st);
                                        openNavigateModal(st);
                                    }}
                                    className="px-3 py-1 border rounded-lg hover:bg-gray-100"
                                >
                                    📍 Navigate
                                </button>
                                <button
                                    onClick={() => handleBookSwap(st)}
                                    className="px-3 py-1 bg-black text-white rounded-lg hover:bg-gray-900"
                                >
                                    🔋 Book Swap
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* ==== Modal Booking ==== */}
            {showModal && (
                <div className="fixed inset-0 bg-black/40 flex justify-center items-center z-50">
                    <div className="bg-white rounded-2xl p-6 shadow-lg w-[380px]">
                        <h3 className="text-lg font-semibold mb-3 text-center">
                            Booking at {selectedStation?.stationName}
                        </h3>

                        <label className="block text-sm font-medium mb-1">Select Subscription</label>
                        <select
                            value={selectedSub}
                            onChange={(e) => setSelectedSub(e.target.value)}
                            className="w-full border p-2 rounded-lg mb-2"
                        >
                            <option value="">Choose plan</option>
                            {subs.length > 0 ? (
                                subs.map((s) => (
                                    <option key={s.subId} value={s.subId}>
                                        {`${s.planName} — ID: ${s.subId} — ${s.planStatus}`}
                                    </option>
                                ))
                            ) : (
                                <option disabled>No active subscriptions</option>
                            )}
                        </select>
                        {/* show chosen sub name + ID */}
                        <SelectedSubInfo subId={selectedSub} />

                        <label className="block text-sm font-medium mb-1 mt-3">Date</label>
                        <input
                            type="date"
                            value={bookingDate}
                            onChange={(e) => setBookingDate(e.target.value)}
                            className="w-full border p-2 rounded-lg mb-3"
                        />

                        <label className="block text-sm font-medium mb-1">Time</label>
                        <input
                            type="time"
                            value={bookingTime}
                            onChange={(e) => setBookingTime(e.target.value)}
                            className="w-full border p-2 rounded-lg mb-4"
                        />

                        <div className="flex justify-between">
                            <button
                                onClick={confirmBooking}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                            >
                                Confirm
                            </button>
                            <button
                                onClick={() => setShowModal(false)}
                                className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ==== Modal Navigate ==== */}
            {navStation && (
                <div className="fixed inset-0 bg-black/40 flex justify-center items-center z-50">
                    <div className="bg-white rounded-2xl p-6 shadow-lg w-[380px]">
                        <h3 className="text-lg font-semibold mb-3 text-center">
                            Navigate to {navStation?.stationName}
                        </h3>

                        <label className="block text-sm font-medium mb-1">Select Subscription</label>
                        <select
                            value={navSub}
                            onChange={(e) => setNavSub(e.target.value)}
                            className="w-full border p-2 rounded-lg mb-2"
                        >
                            <option value="">Choose plan</option>
                            {subs.length > 0 ? (
                                subs.map((s) => (
                                    <option key={s.subId} value={s.subId}>
                                        {`${s.planName} — ID: ${s.subId} — ${s.planStatus}`}
                                    </option>
                                ))
                            ) : (
                                <option disabled>No active subscriptions</option>
                            )}
                        </select>
                        {/* show chosen sub name + ID */}
                        <SelectedSubInfo subId={navSub} />

                        <div className="flex justify-between mt-4">
                            <button
                                onClick={confirmNavigate}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                            >
                                Go to Simulation
                            </button>
                            <button
                                onClick={() => {
                                    setNavStation(null);
                                    setNavSub("");
                                }}
                                className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
