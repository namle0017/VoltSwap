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
const formatVND = (n) =>
    typeof n === "number"
        ? n.toLocaleString("vi-VN", { style: "currency", currency: "VND" })
        : "₫0";

/** Nhận biết object là fee đơn trị có `amount` (vd: batteryDeposit) */
const isAmountObj = (v) =>
    v && typeof v === "object" && "amount" in v && typeof v.amount === "number";

/** Nhận biết mảng bậc thang (vd: excessMileage[]) */
const isTierArray = (v) =>
    Array.isArray(v) &&
    v.length > 0 &&
    v.every(
        (t) =>
            typeof t === "object" &&
            "minValue" in t &&
            "maxValue" in t &&
            "amount" in t
    );

export default function Subscription() {
    /** ===== State ===== */
    const [packages, setPackages] = useState([]);
    const [apiRevenue, setApiRevenue] = useState(0);
    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState("");

    // NEW: fee groups từ BE
    const [feeGroups, setFeeGroups] = useState([]); // [{groupKey, feeSummary}, ...]
    const [activeGroupKey, setActiveGroupKey] = useState(""); // chọn group đang xem

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

                const data = res?.data?.data || {};
                const list = data?.planDetail ?? [];
                const revenue = Number(data?.totalRevenue || 0);
                const groups = Array.isArray(data?.feeGroups) ? data.feeGroups : [];

                setApiRevenue(revenue);

                // Chuẩn hoá package cards
                const mapped = list.map((item, idx) => {
                    const p = item?.plans || {};
                    const createdAtRaw = p.createdAt || null; // <-- BE đang trả cratedAt
                    const createdAt = createdAtRaw
                        ? new Date(createdAtRaw).toLocaleDateString("vi-VN")
                        : "-";

                    return {
                        id: idx + 1,
                        planId: p.planId,
                        name: `${p.planName} Package`,
                        users: item?.totalUsers ?? 0,
                        batteries: p.numberBattery ?? 0,
                        baseMileage: p.milleageBaseUsed ?? 0,
                        basePrice: Number(p.price || 0),
                        createdAt,      // <-- gán ngày tạo đã format
                    };
                });

                setPackages(mapped);

                // Lưu feeGroups và set group mặc định
                setFeeGroups(groups);
                if (groups.length && !activeGroupKey) {
                    setActiveGroupKey(groups[0].groupKey || "");
                }
            } catch (e) {
                console.error("view-plan-detail error", e?.response?.data || e);
                setErr("Không thể tải danh sách gói / fees.");
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []); // eslint-disable-line

    /** ===== Derived ===== */
    const monthlyRevenue = useMemo(() => {
        return (
            apiRevenue ||
            packages.reduce((s, p) => s + (p.users || 0) * (p.basePrice || 0), 0)
        );
    }, [apiRevenue, packages]);

    const activeFeeSummary = useMemo(() => {
        const found = feeGroups.find((g) => g.groupKey === activeGroupKey);
        return found?.feeSummary || {};
    }, [feeGroups, activeGroupKey]);

    // Phân loại các thuộc tính trong feeSummary
    const simpleAmountFees = useMemo(() => {
        const out = [];
        Object.entries(activeFeeSummary || {}).forEach(([key, val]) => {
            if (isAmountObj(val)) {
                out.push({ key, amount: val.amount, unit: val.unit || "VND" });
            }
        });
        return out;
    }, [activeFeeSummary]);

    const tierFees = useMemo(() => {
        const out = [];
        Object.entries(activeFeeSummary || {}).forEach(([key, val]) => {
            if (isTierArray(val)) {
                out.push({ key, tiers: val });
            }
        });
        return out;
    }, [activeFeeSummary]);

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
            planName:
                (pkgForm.name || "").split(" ")[0].trim() || pkgForm.name.trim(),
            numberBattery: Number(pkgForm.batteries || 0),
            milleageBaseUsed: Number(pkgForm.baseMileage || 0),
            price: parseCurrencyToNumber(pkgForm.basePriceText),
        };

        if (
            !payload.planName ||
            !payload.numberBattery ||
            isNaN(payload.milleageBaseUsed) ||
            !payload.price
        ) {
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
                const item = packages.find((p) => p.id === editingId);
                const planId = item?.planId;
                const body = planId ? { planId, ...payload } : payload;

                // TODO: thay endpoint thật nếu khác
                // await api.post("/Plan/update-plan", body, { headers: token ? { Authorization: `Bearer ${token}` } : undefined });
                console.log("[UPDATE] payload gửi BE (không có date):", body);
            }
            setIsPkgModalOpen(false);
        } catch (err) {
            console.error("create/update plan error", err?.response?.data || err);
            alert("❌ Thao tác thất bại.");
        }
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
                    {/* ĐÃ BỎ nút Update Penalty Fee cũ */}
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
                    <div className="text-sm text-gray-500">Monthly Revenue</div>
                    <div className="text-2xl font-bold mt-2">
                        {formatVND(monthlyRevenue)}
                    </div>
                </div>
                <div className="bg-white rounded-lg shadow p-6">
                    <div className="text-sm text-gray-500">Total Packages</div>
                    <div className="text-2xl font-bold mt-2">{packages.length}</div>
                </div>

                {/* NEW: Chọn Fee Group + hiển thị nhanh các fee đơn trị của group */}
                <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center justify-between">
                        <div className="text-sm text-gray-500">Fees — Group</div>
                        <select
                            className="border rounded-lg px-2 py-1 text-sm"
                            value={activeGroupKey}
                            onChange={(e) => setActiveGroupKey(e.target.value)}
                        >
                            {feeGroups.map((g) => (
                                <option key={g.groupKey} value={g.groupKey}>
                                    {g.groupKey}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Tóm tắt nhanh (nếu có) */}
                    <div className="mt-3 text-sm text-gray-800 space-y-1">
                        {simpleAmountFees.length === 0 ? (
                            <div className="text-gray-500">Không có fee đơn trị.</div>
                        ) : (
                            simpleAmountFees.map((f) => (
                                <div key={f.key} className="flex justify-between">
                                    <span className="capitalize">{f.key}:</span>
                                    <span>
                                        {f.unit?.toUpperCase().includes("VND")
                                            ? formatVND(f.amount)
                                            : `${f.amount} ${f.unit || ""}`}
                                    </span>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* Fee Groups chi tiết */}
            <div className="bg-white rounded-lg shadow p-6 mb-6">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-gray-900">
                        Fees by Group: {activeGroupKey || "—"}
                    </h2>
                    <div className="text-sm text-gray-500">
                        (Dữ liệu theo /Plan/view-plan-detail)
                    </div>
                </div>

                {/* Battery Deposit (nếu có) hiển thị nổi bật */}
                {"batteryDeposit" in activeFeeSummary && isAmountObj(activeFeeSummary.batteryDeposit) && (
                    <div className="mb-4 p-4 rounded-lg bg-amber-50 border border-amber-200">
                        <div className="text-sm text-gray-600">Battery Deposit</div>
                        <div className="text-xl font-bold">
                            {formatVND(activeFeeSummary.batteryDeposit.amount)}
                        </div>
                    </div>
                )}

                {/* Render mọi fee đơn trị khác (ngoài batteryDeposit) */}
                {simpleAmountFees.filter((f) => f.key !== "batteryDeposit").length > 0 && (
                    <div className="grid md:grid-cols-2 gap-4 mb-4">
                        {simpleAmountFees
                            .filter((f) => f.key !== "batteryDeposit")
                            .map((f) => (
                                <div key={f.key} className="p-4 rounded-lg bg-gray-50 border">
                                    <div className="text-sm text-gray-600 capitalize">{f.key}</div>
                                    <div className="text-lg font-semibold">
                                        {f.unit?.toUpperCase().includes("VND")
                                            ? formatVND(f.amount)
                                            : `${f.amount} ${f.unit || ""}`}
                                    </div>
                                </div>
                            ))}
                    </div>
                )}

                {/* Bảng bậc thang cho các fee dạng tiers (vd: excessMileage) */}
                {tierFees.length === 0 ? (
                    <div className="text-gray-500">Không có biểu phí bậc thang.</div>
                ) : (
                    tierFees.map((grp) => (
                        <div key={grp.key} className="mb-6">
                            <h3 className="font-semibold mb-2 capitalize">
                                {grp.key} (tiered)
                            </h3>
                            <div className="overflow-x-auto border rounded-lg">
                                <table className="min-w-full text-sm">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="p-2 text-left">Min</th>
                                            <th className="p-2 text-left">Max</th>
                                            <th className="p-2 text-left">Amount</th>
                                            <th className="p-2 text-left">Unit</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {grp.tiers.map((t, i) => (
                                            <tr key={i} className="border-t">
                                                <td className="p-2">{t.minValue}</td>
                                                <td className="p-2">{t.maxValue}</td>
                                                <td className="p-2">
                                                    {t.unit?.toUpperCase().includes("VND")
                                                        ? formatVND(t.amount)
                                                        : t.amount}
                                                </td>
                                                <td className="p-2">{t.unit || "-"}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    ))
                )}
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
                                    <h3 className="text-lg font-semibold text-gray-900">
                                        {pkg.name}
                                    </h3>
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
                                    <div className="font-semibold text-gray-900">
                                        {pkg.batteries}
                                    </div>
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
                                        {formatVND(pkg.basePrice)}
                                    </div>
                                </div>
                            </div>

                            <div className="mt-4 text-xs text-gray-500">
                                <div>Day create: {pkg.createdAt}</div>
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
                            <button
                                className="p-2 hover:bg-gray-100 rounded-lg"
                                onClick={closePkgModal}
                            >
                                <i className="bi bi-x-lg" />
                            </button>
                        </div>

                        <form className="p-5 space-y-4" onSubmit={submitPackage}>
                            <div>
                                <label className="block text-sm text-gray-700 mb-1">
                                    Package Name
                                </label>
                                <input
                                    value={pkgForm.name}
                                    onChange={(e) =>
                                        setPkgForm((s) => ({ ...s, name: e.target.value }))
                                    }
                                    className="w-full border rounded-lg px-3 py-2"
                                    placeholder="VD: G1 Package, TP1 Package…"
                                    required
                                />
                            </div>

                            <div className="grid md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm text-gray-700 mb-1">
                                        Number of batteries
                                    </label>
                                    <input
                                        type="number"
                                        min={1}
                                        value={pkgForm.batteries}
                                        onChange={(e) =>
                                            setPkgForm((s) => ({ ...s, batteries: e.target.value }))
                                        }
                                        className="w-full border rounded-lg px-3 py-2"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm text-gray-700 mb-1">
                                        Base mileage (km/month)
                                    </label>
                                    <input
                                        type="number"
                                        min={0}
                                        value={pkgForm.baseMileage}
                                        onChange={(e) =>
                                            setPkgForm((s) => ({ ...s, baseMileage: e.target.value }))
                                        }
                                        className="w-full border rounded-lg px-3 py-2"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm text-gray-700 mb-1">
                                    Base price (VND/month)
                                </label>
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
                                <p className="text-xs text-gray-500 mt-1">
                                    Số tiền sẽ tự format khi gõ (vi-VN).
                                </p>
                            </div>

                            <div className="pt-2 flex justify-end gap-2">
                                <button
                                    type="button"
                                    onClick={closePkgModal}
                                    className="px-4 py-2 border rounded-lg"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800"
                                >
                                    {pkgMode === "create" ? "Create" : "Save changes"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
