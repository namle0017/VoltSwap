/* Subscription.jsx */
import { useEffect, useMemo, useState } from "react";
import api from "@/api/api";

/** Helpers: format & parse currency inline (vi-VN) */
const formatCurrencyInput = (val) => {
    const digits = String(val || "").replace(/\D/g, "");
    if (!digits) return "";
    const n = Number(digits);
    return n.toLocaleString("vi-VN");
};
const parseCurrencyToNumber = (val) => {
    const digits = String(val || "").replace(/\D/g, "");
    return digits ? Number(digits) : 0;
};

export default function Subscription() {
    /** ===== State ===== */
    const [packages, setPackages] = useState([]);
    const [apiRevenue, setApiRevenue] = useState(0);
    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState("");

    // (Giữ nguyên phần penalty UI của bạn)
    const [penalty, setPenalty] = useState({
        bookingFee: 20000,
        swapFee: 15000,
        excessMileageFee: 3500,
        depositBatteryFee: 1000000,
        updatedAt: "-",
    });

    // Modal create/update (GIỮ UI, nhưng bỏ date)
    const [isPkgModalOpen, setIsPkgModalOpen] = useState(false);
    const [pkgMode, setPkgMode] = useState("create"); // "create" | "edit"
    const [editingId, setEditingId] = useState(null);
    const [pkgForm, setPkgForm] = useState({
        name: "",
        batteries: "",
        baseMileage: "",
        basePriceText: "",
    });

    /** ===== Fetch from BE ===== */
    useEffect(() => {
        const load = async () => {
            setLoading(true);
            setErr("");
            try {
                const token = localStorage.getItem("token");
                const res = await api.get("/Plan/view-plan-detail", {
                    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
                });

                const list = res?.data?.data?.planDetail ?? [];
                const revenue = Number(res?.data?.data?.totalRevenue || 0);
                setApiRevenue(revenue);

                // Chuẩn hoá thành data cho cards
                const mapped = list.map((item, idx) => {
                    const p = item?.plans || {};
                    return {
                        id: idx + 1,
                        planId: p.planId, // để dùng khi update nếu cần
                        name: `${p.planName} Package`,
                        users: item?.totalUsers ?? 0,
                        batteries: p.numberBattery ?? 0,
                        baseMileage: p.milleageBaseUsed ?? 0,
                        basePrice: Number(p.price || 0),
                        createdAt: "-", // BE không trả -> hiển thị "-"
                        updatedAt: "-",
                    };
                });
                setPackages(mapped);
            } catch (e) {
                console.error("view-plan-detail error", e?.response?.data || e);
                setErr("Không thể tải danh sách gói.");
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    /** ===== Derived ===== */
    // Nếu BE không trả revenue, fallback tính tạm theo client (giữ logic cũ)
    const monthlyRevenue = useMemo(() => {
        return apiRevenue || packages.reduce((s, p) => s + (p.users || 0) * (p.basePrice || 0), 0);
    }, [apiRevenue, packages]);

    /** ===== Modal handlers (bỏ date) ===== */
    const openCreatePackage = () => {
        setPkgMode("create");
        setEditingId(null);
        setPkgForm({
            name: "",
            batteries: "",
            baseMileage: "",
            basePriceText: "",
        });
        setIsPkgModalOpen(true);
    };

    const openEditPackage = (pkg) => {
        setPkgMode("edit");
        setEditingId(pkg.id);
        setPkgForm({
            name: pkg.name,
            batteries: String(pkg.batteries ?? ""),
            baseMileage: String(pkg.baseMileage ?? ""),
            basePriceText: formatCurrencyInput(pkg.basePrice),
        });
        setIsPkgModalOpen(true);
    };

    const closePkgModal = () => setIsPkgModalOpen(false);

    // Create/Update: KHÔNG gửi ngày — BE tự set theo thời điểm request
    const submitPackage = async (e) => {
        e.preventDefault();
        const payload = {
            // gợi ý: nếu bạn đặt tên theo "G1 Package" -> cắt "G1"
            planName: (pkgForm.name || "").split(" ")[0].trim() || pkgForm.name.trim(),
            numberBattery: Number(pkgForm.batteries || 0),
            milleageBaseUsed: Number(pkgForm.baseMileage || 0),
            price: parseCurrencyToNumber(pkgForm.basePriceText),
            // KHÔNG có createdAt/updatedAt trong payload
        };

        if (!payload.planName || !payload.numberBattery || isNaN(payload.milleageBaseUsed) || !payload.price) {
            alert("Vui lòng điền đầy đủ thông tin gói.");
            return;
        }

        try {
            // eslint-disable-next-line no-unused-vars
            const token = localStorage.getItem("token");
            if (pkgMode === "create") {
                // TODO: thay endpoint thật nếu khác
                // await api.post("/Plan/create-plan", payload, { headers: token ? { Authorization: `Bearer ${token}` } : undefined });
                console.log("[CREATE] payload gửi BE (không có date):", payload);
            } else {
                // Tìm planId từ item đang edit (nếu cần gửi kèm)
                const item = packages.find((p) => p.id === editingId);
                const planId = item?.planId;
                const body = planId ? { planId, ...payload } : payload;

                // TODO: thay endpoint thật nếu khác
                // await api.post("/Plan/update-plan", body, { headers: token ? { Authorization: `Bearer ${token}` } : undefined });
                console.log("[UPDATE] payload gửi BE (không có date):", body);
            }

            // Sau khi BE OK: reload lại danh sách cho chắc
            // Bạn có thể gọi lại API thay vì reload trang
            // window.location.reload();

            // Tạm thời đóng modal
            setIsPkgModalOpen(false);
        } catch (err) {
            console.error("create/update plan error", err?.response?.data || err);
            alert("❌ Thao tác thất bại.");
        }
    };

    /** ===== Penalty modal (giữ như cũ) ===== */
    const [isPenaltyOpen, setIsPenaltyOpen] = useState(false);
    const [penaltyForm, setPenaltyForm] = useState({
        bookingFeeText: formatCurrencyInput(penalty.bookingFee),
        swapFeeText: formatCurrencyInput(penalty.swapFee),
        excessMileageFeeText: formatCurrencyInput(penalty.excessMileageFee),
        depositBatteryFeeText: formatCurrencyInput(penalty.depositBatteryFee),
    });

    const openPenalty = () => {
        setPenaltyForm({
            bookingFeeText: formatCurrencyInput(penalty.bookingFee),
            swapFeeText: formatCurrencyInput(penalty.swapFee),
            excessMileageFeeText: formatCurrencyInput(penalty.excessMileageFee),
            depositBatteryFeeText: formatCurrencyInput(penalty.depositBatteryFee),
        });
        setIsPenaltyOpen(true);
    };
    const closePenalty = () => setIsPenaltyOpen(false);

    const submitPenalty = (e) => {
        e.preventDefault();
        const next = {
            bookingFee: parseCurrencyToNumber(penaltyForm.bookingFeeText),
            swapFee: parseCurrencyToNumber(penaltyForm.swapFeeText),
            excessMileageFee: parseCurrencyToNumber(penaltyForm.excessMileageFeeText),
            depositBatteryFee: parseCurrencyToNumber(penaltyForm.depositBatteryFeeText),
            updatedAt: "-", // không nhập ngày
        };
        if (!next.bookingFee && !next.swapFee && !next.excessMileageFee && !next.depositBatteryFee) {
            alert("Vui lòng nhập ít nhất một loại phí.");
            return;
        }
        setPenalty(next);
        setIsPenaltyOpen(false);
    };

    /** ===== UI ===== */
    return (
        <div className="p-8 bg-gray-50 min-h-screen">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
                    <p className="text-gray-600">Service Package Management</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={openPenalty}
                        className="px-4 py-2 border rounded-lg hover:bg-gray-100 flex items-center"
                    >
                        <i className="bi bi-cash-coin" />
                        <span className="ml-2">Update Penalty Fee</span>
                    </button>
                    <button
                        onClick={openCreatePackage}
                        className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 flex items-center"
                    >
                        <i className="bi bi-plus-lg" />
                        <span className="ml-2">Create New Package</span>
                    </button>
                </div>
            </div>

            {/* Summary */}
            <div className="grid md:grid-cols-3 gap-6 mb-6">
                <div className="bg-white rounded-lg shadow p-6">
                    <div className="text-sm text-gray-500">Monthly Revenue (est.)</div>
                    <div className="text-2xl font-bold mt-2">
                        {monthlyRevenue.toLocaleString("vi-VN")} VND
                    </div>
                </div>
                <div className="bg-white rounded-lg shadow p-6">
                    <div className="text-sm text-gray-500">Total Packages</div>
                    <div className="text-2xl font-bold mt-2">{packages.length}</div>
                </div>
                <div className="bg-white rounded-lg shadow p-6">
                    <div className="text-sm text-gray-500">Penalty Fee (updated)</div>
                    <div className="text-base mt-2 text-gray-800">
                        <div>Booking: {penalty.bookingFee.toLocaleString("vi-VN")} VND</div>
                        <div>Swap: {penalty.swapFee.toLocaleString("vi-VN")} VND</div>
                        <div>Excess km: {penalty.excessMileageFee.toLocaleString("vi-VN")} VND</div>
                        <div>Deposit: {penalty.depositBatteryFee.toLocaleString("vi-VN")} VND</div>
                        <div className="text-xs text-gray-500 mt-1">Date update: {penalty.updatedAt}</div>
                    </div>
                </div>
            </div>

            {/* Package cards */}
            <div className="grid lg:grid-cols-3 sm:grid-cols-2 grid-cols-1 gap-6">
                {loading ? (
                    <div className="col-span-full flex flex-col items-center py-16 text-gray-600">
                        <div className="animate-spin h-10 w-10 border-4 border-gray-900 border-t-transparent rounded-full mb-3" />
                        <p>Loading plans…</p>
                    </div>
                ) : err ? (
                    <div className="col-span-full text-red-600">{err}</div>
                ) : (
                    packages.map((pkg) => (
                        <div key={pkg.id} className="bg-white rounded-lg shadow p-6">
                            <div className="flex items-start justify-between">
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900">{pkg.name}</h3>
                                    <p className="text-sm text-gray-500">Users: {pkg.users}</p>
                                </div>
                                <button
                                    onClick={() => openEditPackage(pkg)}
                                    className="px-3 py-1.5 text-sm border rounded-lg hover:bg-gray-100"
                                    title="Edit Package"
                                >
                                    <i className="bi bi-pencil-square" /> Edit
                                </button>
                            </div>

                            <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                                <div className="p-3 bg-gray-50 rounded-lg">
                                    <div className="text-gray-500">Number of batteries</div>
                                    <div className="font-semibold text-gray-900">{pkg.batteries}</div>
                                </div>
                                <div className="p-3 bg-gray-50 rounded-lg">
                                    <div className="text-gray-500">Base mileage</div>
                                    <div className="font-semibold text-gray-900">
                                        {(pkg.baseMileage || 0).toLocaleString("vi-VN")} km/mo
                                    </div>
                                </div>
                                <div className="p-3 bg-gray-50 rounded-lg col-span-2">
                                    <div className="text-gray-500">Base price (VND / month)</div>
                                    <div className="font-semibold text-gray-900">
                                        {pkg.basePrice.toLocaleString("vi-VN")} VND
                                    </div>
                                </div>
                            </div>

                            <div className="mt-4 text-xs text-gray-500">
                                <div>Day create: {pkg.createdAt}</div>
                                <div>Day update: {pkg.updatedAt}</div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* ===== Modal: Create/Update Package (bỏ date) ===== */}
            {isPkgModalOpen && (
                <div className="fixed inset-0 bg-black/50 grid place-items-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl">
                        <div className="p-5 border-b flex items-center justify-between">
                            <div className="text-lg font-semibold">
                                {pkgMode === "create" ? "Create Package" : "Update Package"}
                            </div>
                            <button className="p-2 hover:bg-gray-100 rounded-lg" onClick={closePkgModal}>
                                <i className="bi bi-x-lg" />
                            </button>
                        </div>

                        <form className="p-5 space-y-4" onSubmit={submitPackage}>
                            <div>
                                <label className="block text-sm text-gray-700 mb-1">Package Name</label>
                                <input
                                    value={pkgForm.name}
                                    onChange={(e) => setPkgForm((s) => ({ ...s, name: e.target.value }))}
                                    className="w-full border rounded-lg px-3 py-2"
                                    placeholder="VD: G1 Package, TP1 Package…"
                                    required
                                />
                            </div>

                            <div className="grid md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm text-gray-700 mb-1">Number of batteries</label>
                                    <input
                                        type="number"
                                        min={1}
                                        value={pkgForm.batteries}
                                        onChange={(e) => setPkgForm((s) => ({ ...s, batteries: e.target.value }))}
                                        className="w-full border rounded-lg px-3 py-2"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm text-gray-700 mb-1">Base mileage (km/month)</label>
                                    <input
                                        type="number"
                                        min={0}
                                        value={pkgForm.baseMileage}
                                        onChange={(e) => setPkgForm((s) => ({ ...s, baseMileage: e.target.value }))}
                                        className="w-full border rounded-lg px-3 py-2"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm text-gray-700 mb-1">Base price (VND/month)</label>
                                <input
                                    inputMode="numeric"
                                    value={pkgForm.basePriceText}
                                    onChange={(e) =>
                                        setPkgForm((s) => ({
                                            ...s,
                                            basePriceText: formatCurrencyInput(e.target.value),
                                        }))
                                    }
                                    placeholder="vd: 3,000,000"
                                    className="w-full border rounded-lg px-3 py-2"
                                    required
                                />
                                <p className="text-xs text-gray-500 mt-1">Số tiền sẽ tự format khi gõ (vi-VN).</p>
                            </div>

                            <div className="pt-2 flex justify-end gap-2">
                                <button type="button" onClick={closePkgModal} className="px-4 py-2 border rounded-lg">
                                    Cancel
                                </button>
                                <button type="submit" className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800">
                                    {pkgMode === "create" ? "Create" : "Save changes"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ===== Modal: Update Penalty Fee (giữ nguyên) ===== */}
            {isPenaltyOpen && (
                <div className="fixed inset-0 bg-black/50 grid place-items-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl">
                        <div className="p-5 border-b flex items-center justify-between">
                            <div className="text-lg font-semibold">Update Penalty Fee</div>
                            <button className="p-2 hover:bg-gray-100 rounded-lg" onClick={closePenalty}>
                                <i className="bi bi-x-lg" />
                            </button>
                        </div>

                        <form className="p-5 space-y-4" onSubmit={submitPenalty}>
                            <div className="grid md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm text-gray-700 mb-1">Booking fee</label>
                                    <input
                                        inputMode="numeric"
                                        value={penaltyForm.bookingFeeText}
                                        onChange={(e) =>
                                            setPenaltyForm((s) => ({
                                                ...s,
                                                bookingFeeText: formatCurrencyInput(e.target.value),
                                            }))
                                        }
                                        className="w-full border rounded-lg px-3 py-2"
                                        placeholder="vd: 20,000"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm text-gray-700 mb-1">Swap fee</label>
                                    <input
                                        inputMode="numeric"
                                        value={penaltyForm.swapFeeText}
                                        onChange={(e) =>
                                            setPenaltyForm((s) => ({
                                                ...s,
                                                swapFeeText: formatCurrencyInput(e.target.value),
                                            }))
                                        }
                                        className="w-full border rounded-lg px-3 py-2"
                                        placeholder="vd: 15,000"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm text-gray-700 mb-1">Excess base mileage fee</label>
                                    <input
                                        inputMode="numeric"
                                        value={penaltyForm.excessMileageFeeText}
                                        onChange={(e) =>
                                            setPenaltyForm((s) => ({
                                                ...s,
                                                excessMileageFeeText: formatCurrencyInput(e.target.value),
                                            }))
                                        }
                                        className="w-full border rounded-lg px-3 py-2"
                                        placeholder="vd: 3,500"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm text-gray-700 mb-1">Deposit Battery fee</label>
                                    <input
                                        inputMode="numeric"
                                        value={penaltyForm.depositBatteryFeeText}
                                        onChange={(e) =>
                                            setPenaltyForm((s) => ({
                                                ...s,
                                                depositBatteryFeeText: formatCurrencyInput(e.target.value),
                                            }))
                                        }
                                        className="w-full border rounded-lg px-3 py-2"
                                        placeholder="vd: 1,000,000"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="pt-2 flex justify-end gap-2">
                                <button type="button" onClick={closePenalty} className="px-4 py-2 border rounded-lg">
                                    Cancel
                                </button>
                                <button type="submit" className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800">
                                    Save fees
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
