/* eslint-disable no-unused-vars */
/* Subscription.jsx */
import { useEffect, useMemo, useState } from "react";
import api from "@/api/api";

/* ===== Helpers ===== */
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

const isAmountObj = (v) =>
    v && typeof v === "object" && "amount" in v && typeof v.amount === "number";
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

/* ===== Mapping fee key <-> API name ===== */
const KEY_TO_API = {
    booking: "Booking",
    batteryDeposit: "Battery Deposit",
    batterySwap: "Battery Swap",
    excessMileage: "Excess Mileage",
};
const toApiFeeName = (k) => KEY_TO_API[k] || k;

/* ===== Component ===== */
export default function Subscription() {
    const [packages, setPackages] = useState([]);
    const [apiRevenue, setApiRevenue] = useState(0);
    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState("");

    // Fee groups
    const [feeGroups, setFeeGroups] = useState([]); // [{groupKey, feeSummary}, ...]
    const [activeGroupKey, setActiveGroupKey] = useState("");

    // Package modal (giữ như cũ, không gửi date)
    const [isPkgModalOpen, setIsPkgModalOpen] = useState(false);
    const [pkgMode, setPkgMode] = useState("create");
    const [editingId, setEditingId] = useState(null);
    const [pkgForm, setPkgForm] = useState({
        name: "",
        batteries: "",
        baseMileage: "",
        basePriceText: "",
    });

    // ===== Fee Update Modal =====
    const [isFeeModalOpen, setIsFeeModalOpen] = useState(false);
    const [modalGroupKey, setModalGroupKey] = useState("");
    const [simpleFeeEdits, setSimpleFeeEdits] = useState([]); // [{typeOfFee, amountText, unit}]
    const [tierFeeEdits, setTierFeeEdits] = useState([]); // [{typeOfFee, tiers:[{minValue,maxValue,amountText,unit}]}]
    const [submittingFees, setSubmittingFees] = useState(false);

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

                const mapped = list.map((item, idx) => {
                    const p = item?.plans || {};
                    const createdAtRaw = p.createdAt || null; // (BE có thể trả cratedAt -> đã fix)
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
                        createdAt,
                    };
                });

                setPackages(mapped);
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

    const monthlyRevenue = useMemo(() => {
        return (
            apiRevenue ||
            packages.reduce((s, p) => s + (p.users || 0) * (p.basePrice || 0), 0)
        );
    }, [apiRevenue, packages]);

    const getFeeSummaryByGroup = (gk) => {
        const found = feeGroups.find((g) => g.groupKey === gk);
        return found?.feeSummary || {};
    };

    const activeFeeSummary = useMemo(
        () => getFeeSummaryByGroup(activeGroupKey),
        [feeGroups, activeGroupKey]
    );

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

    /* ===== Package Modal handlers (giữ như cũ, không gửi date) ===== */
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

    const submitPackage = async (e) => {
        e.preventDefault();
        const payload = {
            planName: (pkgForm.name || "").split(" ")[0].trim() || pkgForm.name.trim(),
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
            const token = localStorage.getItem("token");
            if (pkgMode === "create") {
                // await api.post("/Plan/create-plan", payload, { headers: token ? { Authorization: `Bearer ${token}` } : undefined });
                console.log("[CREATE] payload gửi BE (không có date):", payload);
            } else {
                const item = packages.find((p) => p.id === editingId);
                const planId = item?.planId;
                const body = planId ? { planId, ...payload } : payload;
                // await api.post("/Plan/update-plan", body, { headers: token ? { Authorization: `Bearer ${token}` } : undefined });
                console.log("[UPDATE] payload gửi BE (không có date):", body);
            }
            setIsPkgModalOpen(false);
        } catch (err) {
            console.error("create/update plan error", err?.response?.data || err);
            alert("❌ Thao tác thất bại.");
        }
    };

    /* ===== Fee Update Modal: open with current group data ===== */
    const openFeeModal = () => {
        if (!activeGroupKey) {
            alert("Chưa chọn Fee Group.");
            return;
        }
        const gk = activeGroupKey;
        setModalGroupKey(gk);

        const summary = getFeeSummaryByGroup(gk);

        const simple = [];
        const tiered = [];

        Object.entries(summary || {}).forEach(([key, val]) => {
            if (isAmountObj(val)) {
                simple.push({
                    typeOfFee: toApiFeeName(key), // ✅ Booking / Battery Deposit / Battery Swap
                    amountText: formatCurrencyInput(val.amount),
                    unit: val.unit || "VND",
                });
            } else if (isTierArray(val)) {
                tiered.push({
                    typeOfFee: toApiFeeName(key), // ✅ Excess Mileage
                    tiers: val.map((t) => ({
                        minValue: Number(t.minValue ?? 0),
                        maxValue: Number(t.maxValue ?? 0),
                        amountText: formatCurrencyInput(t.amount ?? 0),
                        unit: t.unit || "VND/km",
                    })),
                });
            }
        });

        setSimpleFeeEdits(simple);
        setTierFeeEdits(tiered);
        setIsFeeModalOpen(true); // ✅ luôn mở, không ẩn khi đổi group
    };

    const closeFeeModal = () => setIsFeeModalOpen(false);

    // Handlers chỉnh simple fees
    const onSimpleChange = (idx, field, value) => {
        setSimpleFeeEdits((prev) => {
            const copy = [...prev];
            copy[idx] = { ...copy[idx], [field]: value };
            return copy;
        });
    };

    // Handlers chỉnh tier fees
    const addTierRow = (feeIdx) => {
        setTierFeeEdits((prev) => {
            const copy = [...prev];
            copy[feeIdx] = {
                ...copy[feeIdx],
                tiers: [
                    ...(copy[feeIdx]?.tiers || []),
                    { minValue: 0, maxValue: 0, amountText: "", unit: "VND/km" },
                ],
            };
            return copy;
        });
    };
    const removeTierRow = (feeIdx, rowIdx) => {
        setTierFeeEdits((prev) => {
            const copy = [...prev];
            const ts = [...(copy[feeIdx]?.tiers || [])];
            ts.splice(rowIdx, 1);
            copy[feeIdx] = { ...copy[feeIdx], tiers: ts };
            return copy;
        });
    };
    const onTierChange = (feeIdx, rowIdx, field, value) => {
        setTierFeeEdits((prev) => {
            const copy = [...prev];
            const ts = [...(copy[feeIdx]?.tiers || [])];
            ts[rowIdx] = { ...ts[rowIdx], [field]: value };
            copy[feeIdx] = { ...copy[feeIdx], tiers: ts };
            return copy;
        });
    };

    // Submit update fees
    const submitUpdateFee = async () => {
        if (!modalGroupKey) {
            alert("Thiếu groupKey!");
            return;
        }

        const fees = [];

        // Simple
        for (const f of simpleFeeEdits) {
            const amount = parseCurrencyToNumber(f.amountText);
            if (!f.typeOfFee) continue;
            fees.push({
                typeOfFee: f.typeOfFee, // đã là tên đúng cho BE
                amount,
                unit: f.unit || "VND",
            });
        }

        // Tiered
        for (const f of tierFeeEdits) {
            if (!f.typeOfFee) continue;
            const tiers = (f.tiers || [])
                .map((t) => ({
                    minValue: Number(t.minValue || 0),
                    maxValue: Number(t.maxValue || 0),
                    amount: parseCurrencyToNumber(t.amountText),
                    unit: t.unit || "VND/km",
                }))
                .filter((t) => t.maxValue >= t.minValue);
            fees.push({
                typeOfFee: f.typeOfFee, // "Excess Mileage"
                tiers,
            });
        }

        if (!fees.length) {
            alert("Không có fee nào để cập nhật.");
            return;
        }

        const payload = { groupKey: modalGroupKey, fees };
        // console.log("PAYLOAD /Fee/update-fee:", payload);

        try {
            setSubmittingFees(true);
            const token = localStorage.getItem("token");
            await api.post("/Fee/update-fee", payload, {
                headers: token ? { Authorization: `Bearer ${token}` } : undefined,
            });
            alert("✅ Cập nhật phí thành công.");
            setIsFeeModalOpen(false);
        } catch (e) {
            console.error("update-fee error", e?.response?.data || e);
            alert(
                e?.response?.data?.message ||
                e?.response?.data?.title ||
                "❌ Cập nhật phí thất bại."
            );
        } finally {
            setSubmittingFees(false);
        }
    };

    /* ===== UI ===== */
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
                        onClick={openFeeModal}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                        title="Update penalty/extra fees for current group"
                    >
                        <i className="bi bi-currency-exchange mr-1" />
                        Update Fees (Group {activeGroupKey || "—"})
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
                    <div className="text-sm text-gray-500">Monthly Revenue</div>
                    <div className="text-2xl font-bold mt-2">{formatVND(monthlyRevenue)}</div>
                </div>
                <div className="bg-white rounded-lg shadow p-6">
                    <div className="text-sm text-gray-500">Total Packages</div>
                    <div className="text-2xl font-bold mt-2">{packages.length}</div>
                </div>

                {/* Group selector + quick summary simple fees */}
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
                    <div className="mt-3 text-sm text-gray-800 space-y-1">
                        {simpleAmountFees.length === 0 ? (
                            <div className="text-gray-500">Không có fee đơn trị.</div>
                        ) : (
                            simpleAmountFees.map((f) => (
                                <div key={f.key} className="flex justify-between">
                                    <span className="capitalize">{toApiFeeName(f.key)}:</span>
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

            {/* Fee Groups detail */}
            <div className="bg-white rounded-lg shadow p-6 mb-6">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-gray-900">
                        Fees by Group: {activeGroupKey || "—"}
                    </h2>
                </div>

                {"batteryDeposit" in activeFeeSummary &&
                    isAmountObj(activeFeeSummary.batteryDeposit) && (
                        <div className="mb-4 p-4 rounded-lg bg-amber-50 border border-amber-200">
                            <div className="text-sm text-gray-600">Battery Deposit</div>
                            <div className="text-xl font-bold">
                                {formatVND(activeFeeSummary.batteryDeposit.amount)}
                            </div>
                        </div>
                    )}

                {simpleAmountFees.filter((f) => f.key !== "batteryDeposit").length > 0 && (
                    <div className="grid md:grid-cols-2 gap-4 mb-4">
                        {simpleAmountFees
                            .filter((f) => f.key !== "batteryDeposit")
                            .map((f) => (
                                <div key={f.key} className="p-4 rounded-lg bg-gray-50 border">
                                    <div className="text-sm text-gray-600 capitalize">
                                        {toApiFeeName(f.key)}
                                    </div>
                                    <div className="text-lg font-semibold">
                                        {f.unit?.toUpperCase().includes("VND")
                                            ? formatVND(f.amount)
                                            : `${f.amount} ${f.unit || ""}`}
                                    </div>
                                </div>
                            ))}
                    </div>
                )}

                {tierFees.length === 0 ? (
                    <div className="text-gray-500">Không có biểu phí bậc thang.</div>
                ) : (
                    tierFees.map((grp) => (
                        <div key={grp.key} className="mb-6">
                            <h3 className="font-semibold mb-2 capitalize">
                                {toApiFeeName(grp.key)} (tiered)
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

            {/* ===== Modal: Create/Update Package ===== */}
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

            {/* ===== Modal: Update Fees (Group) ===== */}
            {isFeeModalOpen && (
                <div className="fixed inset-0 bg-black/50 grid place-items-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl">
                        <div className="p-5 border-b flex items-center justify-between">
                            <div className="text-lg font-semibold">Update Fees — Group {modalGroupKey}</div>
                            <button className="p-2 hover:bg-gray-100 rounded-lg" onClick={closeFeeModal}>
                                <i className="bi bi-x-lg" />
                            </button>
                        </div>

                        <div className="p-5 space-y-6 max-h-[75vh] overflow-auto">
                            {/* Simple fees */}
                            <div>
                                <h4 className="font-semibold mb-2">Simple Fees</h4>
                                {simpleFeeEdits.length === 0 ? (
                                    <div className="text-sm text-gray-500">Không có fee đơn trị.</div>
                                ) : (
                                    <div className="grid md:grid-cols-2 gap-4">
                                        {simpleFeeEdits.map((f, idx) => (
                                            <div key={idx} className="border rounded-lg p-3">
                                                <div className="text-xs text-gray-500 mb-1">{f.typeOfFee}</div>
                                                <div className="flex gap-2">
                                                    <input
                                                        value={f.amountText}
                                                        onChange={(e) =>
                                                            onSimpleChange(idx, "amountText", formatCurrencyInput(e.target.value))
                                                        }
                                                        className="w-full border rounded-lg px-3 py-2"
                                                        placeholder="số tiền"
                                                    />
                                                    <input
                                                        value={f.unit}
                                                        onChange={(e) => onSimpleChange(idx, "unit", e.target.value)}
                                                        className="w-36 border rounded-lg px-3 py-2"
                                                        placeholder="đơn vị"
                                                    />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Tiered fees */}
                            <div>
                                <h4 className="font-semibold mb-2">Tiered Fees</h4>
                                {tierFeeEdits.length === 0 ? (
                                    <div className="text-sm text-gray-500">Không có biểu phí bậc thang.</div>
                                ) : (
                                    tierFeeEdits.map((f, feeIdx) => (
                                        <div key={feeIdx} className="border rounded-lg p-3 mb-3">
                                            <div className="text-xs text-gray-500 mb-2">{f.typeOfFee}</div>
                                            <div className="overflow-x-auto">
                                                <table className="min-w-full text-sm">
                                                    <thead className="bg-gray-50">
                                                        <tr>
                                                            <th className="p-2 text-left">Min</th>
                                                            <th className="p-2 text-left">Max</th>
                                                            <th className="p-2 text-left">Amount</th>
                                                            <th className="p-2 text-left">Unit</th>
                                                            <th className="p-2"></th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {f.tiers.map((t, rowIdx) => (
                                                            <tr key={rowIdx} className="border-t">
                                                                <td className="p-2">
                                                                    <input
                                                                        type="number"
                                                                        className="border rounded px-2 py-1 w-28"
                                                                        value={t.minValue}
                                                                        onChange={(e) =>
                                                                            onTierChange(feeIdx, rowIdx, "minValue", Number(e.target.value))
                                                                        }
                                                                    />
                                                                </td>
                                                                <td className="p-2">
                                                                    <input
                                                                        type="number"
                                                                        className="border rounded px-2 py-1 w-28"
                                                                        value={t.maxValue}
                                                                        onChange={(e) =>
                                                                            onTierChange(feeIdx, rowIdx, "maxValue", Number(e.target.value))
                                                                        }
                                                                    />
                                                                </td>
                                                                <td className="p-2">
                                                                    <input
                                                                        className="border rounded px-2 py-1 w-36"
                                                                        value={t.amountText}
                                                                        onChange={(e) =>
                                                                            onTierChange(
                                                                                feeIdx,
                                                                                rowIdx,
                                                                                "amountText",
                                                                                formatCurrencyInput(e.target.value)
                                                                            )
                                                                        }
                                                                    />
                                                                </td>
                                                                <td className="p-2">
                                                                    <input
                                                                        className="border rounded px-2 py-1 w-36"
                                                                        value={t.unit}
                                                                        onChange={(e) =>
                                                                            onTierChange(feeIdx, rowIdx, "unit", e.target.value)
                                                                        }
                                                                    />
                                                                </td>
                                                                <td className="p-2">
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => removeTierRow(feeIdx, rowIdx)}
                                                                        className="px-2 py-1 text-red-600 hover:bg-red-50 rounded"
                                                                    >
                                                                        Xoá
                                                                    </button>
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                            <div className="mt-2">
                                                <button
                                                    type="button"
                                                    onClick={() => addTierRow(feeIdx)}
                                                    className="px-3 py-1.5 text-sm border rounded hover:bg-gray-50"
                                                >
                                                    + Thêm bậc
                                                </button>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        {/* Footer luôn hiển thị (fix mất nút khi đổi group) */}
                        <div className="p-5 border-t flex justify-end gap-2">
                            <button
                                type="button"
                                onClick={closeFeeModal}
                                className="px-4 py-2 border rounded-lg"
                                disabled={submittingFees}
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={submitUpdateFee}
                                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-60"
                                disabled={submittingFees}
                            >
                                {submittingFees ? "Saving..." : "Save update"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}