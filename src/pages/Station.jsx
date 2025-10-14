import React, { useEffect, useState, useRef } from "react";
import api from "../api/api";
import { useNavigate } from "react-router-dom";

export default function Station() {
    const navigate = useNavigate();
    const [stations, setStations] = useState([]);
    const [subs, setSubs] = useState([]);
    const [selectedStation, setSelectedStation] = useState(null);
    const [selectedSub, setSelectedSub] = useState("");
    const [bookingDate, setBookingDate] = useState("");
    const [bookingTime, setBookingTime] = useState("");
    const [showModal, setShowModal] = useState(false);
    const [loading, setLoading] = useState(true);
    const arrivalTimer = useRef(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const token = localStorage.getItem("token");
                const userDriverId = localStorage.getItem("userId");

                if (!token || !userDriverId) {
                    alert("Please log in again!");
                    navigate("/login");
                    return;
                }

                const [stationRes, subRes] = await Promise.all([
                    api.get("Station/station-list"),
                    api.get(`Subscription/subscription-user-list?userId=${userDriverId}`),
                ]);

                console.log("✅ Station list:", stationRes.data);
                console.log("✅ Subscription list:", subRes.data);

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

    // 🕒 Kiểm tra đã đến trạm chưa
    const startArrivalCheck = (stationName) => {
        if (arrivalTimer.current) clearTimeout(arrivalTimer.current);

        const askArrival = () => {
            const answer = window.confirm(
                `🚗 Bạn đã đến trạm "${stationName}" chưa?`
            );
            if (!answer) arrivalTimer.current = setTimeout(askArrival, 15000);
            else {
                clearTimeout(arrivalTimer.current);
                arrivalTimer.current = null;
                alert("✅ Cảm ơn! Hệ thống đã xác nhận bạn đã đến trạm.");
            }
        };

        arrivalTimer.current = setTimeout(askArrival, 15000);
    };

    const handleBookSwap = (station) => {
        setSelectedStation(station);
        setShowModal(true);
    };

    // ✅ Tạo booking và transaction tương ứng
    const confirmBooking = async () => {
        if (!selectedSub || !bookingDate || !bookingTime)
            return alert("Please complete all fields");

        const userDriverId = localStorage.getItem("userId");
        if (!userDriverId) {
            alert("⚠️ Please login again!");
            navigate("/login");
            return;
        }

        const formattedDate = new Date(bookingDate).toISOString().split("T")[0];

        const payload = {
            batterySwapStationId: selectedStation.stationId,
            userDriverId,
            note: "Swap battery",
            subscriptionId: selectedSub,
            dateBooking: formattedDate,
            timeBooking: bookingTime,
        };
        console.log("📤 Sending booking payload:", payload);

        try {
            const res = await api.post("/Booking/createBooking", payload);
            console.log("✅ Booking response:", res.data);

            const appointment = res.data.data.appointment;

            // ⚡ Gọi thêm API tạo transaction tạm
            const transactionPayload = {
                transactionId: appointment.appointmentId, // gắn appointmentId
                amount: 0,
                paymentStatus: "Pending",
                transactionNote: appointment.note,
                paymentDate: new Date().toISOString(),
            };

            console.log("💾 Creating transaction placeholder:", transactionPayload);
            localStorage.setItem("lastPlanId", appointment.subscriptionId);

            await api.post("/Transaction/transaction-user-list", {
                PlanId: appointment.subscriptionId,
                DriverId: userDriverId,
                TransactionType: "History",
            });

            alert(
                `✅ Booking created successfully!\n📍 ${selectedStation.stationName}\n📅 ${bookingDate} ${bookingTime}\n🆔 Appointment: ${appointment.appointmentId}`
            );

            setShowModal(false);
            navigate("/user/transaction");
            startArrivalCheck(selectedStation.stationName);
        } catch (err) {
            console.error("❌ Booking error:", err.response?.data || err);
            alert("❌ Booking failed! Please check console for details.");
        }
    };

    if (loading)
        return (
            <div className="flex justify-center mt-20">
                <div className="h-10 w-10 border-4 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <h2 className="text-2xl font-bold mb-3">🗺️ Battery Swap Stations</h2>

            <iframe
                title="Map"
                className="w-full h-72 rounded-2xl mb-6 shadow"
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3919.478471337726!2d106.6621921756895!3d10.776889659195996!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x31752f2b2a8f1ed5%3A0x8a88f40d6b1f1e04!2sHUTECH%20University!5e0!3m2!1sen!2s!4v1699500131224!5m2!1sen!2s"
                allowFullScreen
            ></iframe>

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
                                    ></div>
                                </div>
                            </div>
                            <div className="space-x-2">
                                <button
                                    onClick={() => {
                                        const confirmNav = window.confirm(
                                            `📍 Bạn có muốn mở Google Maps và bắt đầu kiểm tra đến trạm "${st.stationName}" không?`
                                        );

                                        if (confirmNav) {
                                            // 1️⃣ Mở bản đồ trạm
                                            window.open(
                                                `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                                                    st.stationName
                                                )}`,
                                                "_blank"
                                            );

                                            // 2️⃣ Gọi hàm kiểm tra đến trạm
                                            startArrivalCheck(st.stationName);
                                        }
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

            {/* 🪟 Modal Booking */}
            {showModal && (
                <div className="fixed inset-0 bg-black/40 flex justify-center items-center z-50">
                    <div className="bg-white rounded-2xl p-6 shadow-lg w-[380px]">
                        <h3 className="text-lg font-semibold mb-3 text-center">
                            Booking at {selectedStation?.stationName}
                        </h3>

                        <label className="block text-sm font-medium mb-1">
                            Select Subscription
                        </label>
                        <select
                            value={selectedSub}
                            onChange={(e) => setSelectedSub(e.target.value)}
                            className="w-full border p-2 rounded-lg mb-3"
                        >
                            <option value="">Choose plan</option>
                            {subs.length > 0 ? (
                                subs.map((s) => (
                                    <option key={s.subId} value={s.subId}>
                                        {s.planName} — {s.planStatus}
                                    </option>
                                ))
                            ) : (
                                <option disabled>No active subscriptions</option>
                            )}
                        </select>

                        <label className="block text-sm font-medium mb-1">Date</label>
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
        </div>
    );
}