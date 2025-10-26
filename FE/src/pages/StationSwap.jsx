/* eslint-disable no-unused-vars */
// src/pages/StationSwap.jsx
import { useEffect, useMemo, useState } from "react";
import { useLocation, useSearchParams, useNavigate } from "react-router-dom";
import {
    getStationList,
    validateSubscription,
    swapInBattery,
    swapOutBattery,
} from "@/api/batterySwapApi";
import api from "@/api/api";

const FALLBACK_STATIONS = [
    { stationId: "STA-10-03-7891", stationName: "Thu Duc Station (Fallback)" },
    { stationId: "STA-01-12-5678", stationName: "District 1 Station (Fallback)" },
];

const toLower = (v) => String(v || "").toLowerCase();
const isValidSubFormat = (sub) => /^SUB-\d{8}$/.test((sub || "").trim());
const isPositiveMsg = (msg = "") => {
    const m = toLower(msg);
    return (
        m.includes("success") ||
        m.includes("ok") ||
        m.includes("please put your battery") ||
        m.includes("validated") ||
        m.includes("valid") ||
        m.includes("please, take batteries")
    );
};

const slotColorClass = (isGreen) => (isGreen ? "bg-emerald-500" : "bg-slate-400");

// ===== Extract từ response BE =====
const extractSlotsFromResponse = (raw) => {
    if (Array.isArray(raw)) return raw;
    if (raw && typeof raw === "object") {
        if (Array.isArray(raw.pillarSlot)) return raw.pillarSlot;
        if (Array.isArray(raw.pillarSlotDtos)) return raw.pillarSlotDtos;
        if (Array.isArray(raw.data)) return raw.data;
    }
    return [];
};
const extractBatTake = (raw) => {
    if (!raw || typeof raw !== "object") return [];
    if (Array.isArray(raw.batTake)) return raw.batTake;
    if (raw.data && Array.isArray(raw.data.batTake)) return raw.data.batTake;
    return [];
};
const extractSlotEmptyIds = (raw) => {
    if (!raw || typeof raw !== "object") return [];
    if (Array.isArray(raw.slotEmpty)) return raw.slotEmpty;
    if (raw.data && Array.isArray(raw.data.slotEmpty)) return raw.data.slotEmpty;
    return [];
};

// ===== Group theo pillarId, luôn 20 slot/trụ =====
const groupSlotsByPillar = (slots = [], currentStationId) => {
    const map = new Map();
    for (const s of slots) {
        const pid = s.pillarId || "UNKNOWN-PILLAR";
        if (!map.has(pid)) map.set(pid, []);
        map.get(pid).push(s);
    }
    for (const [pid, arr] of map) {
        arr.sort((a, b) => (a.slotNumber ?? 0) - (b.slotNumber ?? 0));
        while (arr.length < 20) {
            const nextNum = arr.length + 1;
            arr.push({
                slotId: `fake-${pid}-${nextNum}-${Math.random().toString(36).slice(2, 6)}`,
                slotNumber: nextNum,
                stationId: currentStationId,
                pillarId: pid,
                // trạng thái thật từ BE không còn ý nghĩa ở step 2; vẫn điền để đủ dữ liệu
                pillarStatus: "Unavailable",
                batteryStatus: "Available",
                batterySoc: 0,
                batterySoh: 0,
            });
        }
        map.set(pid, arr.slice(0, 20));
    }
    return map;
};

// === Hiển thị step 3: chỉ tô xanh các slot được mở để LẤY
const makeStep3ViewMap = (pillarMap, pickedList, focusPillarId) => {
    const allowed = new Set((pickedList || []).map((x) => String(x.slotId)));
    const view = new Map();
    for (const [pid, arr] of pillarMap) {
        const show = !focusPillarId || pid === focusPillarId;
        const cloned = arr.map((s) => {
            const isAllowed = allowed.has(String(s.slotId));
            return { ...s, __dim: !show, __green: isAllowed };
        });
        view.set(pid, cloned);
    }
    return view;
};

// === View step 2 (Swap-In): CHỈ xanh các slot có trong slotEmpty từ BE; trụ khác mờ
const makeStep2ViewMap_AllowedSlotsOnly = (
    pillarMap,
    selectedPillarId,
    selectedSlotIds,
    allowedSet
) => {
    const view = new Map();
    const selectedSet = new Set((selectedSlotIds || []).map(String));
    for (const [pid, arr] of pillarMap) {
        const show = !selectedPillarId || pid === selectedPillarId;
        const cloned = arr.map((s) => {
            const isAllowed = allowedSet.has(String(s.slotId));
            return {
                ...s,
                __dim: !show,
                __selected: selectedSet.has(String(s.slotId)),
                __green: isAllowed, // dùng __green để render màu
            };
        });
        view.set(pid, cloned);
    }
    return view;
};

const flattenFromPillarMap = (pillarMap) => {
    const entries = Array.from(pillarMap.entries());
    entries.sort(([a], [b]) => String(a).localeCompare(String(b)));
    return entries;
};

export default function StationSwap() {
    const navigate = useNavigate();
    const location = useLocation();
    const [searchParams] = useSearchParams();

    const presetStationId =
        location.state?.stationId ||
        searchParams.get("stationId") ||
        localStorage.getItem("swap_stationId") ||
        "";
    const presetSubscriptionId =
        location.state?.subscriptionId ||
        searchParams.get("subscriptionId") ||
        localStorage.getItem("swap_subscriptionId") ||
        "";
    const isPreset = Boolean(presetStationId && presetSubscriptionId);

    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [stations, setStations] = useState([]);
    const [stationLoading, setStationLoading] = useState(true);
    const [stationError, setStationError] = useState("");
    const [stationId, setStationId] = useState("");
    const [subscriptionId, setSubscriptionId] = useState("");
    const [subError, setSubError] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [subscriptionInfo, setSubscriptionInfo] = useState(null);

    const [pillarSlotsMap, setPillarSlotsMap] = useState(new Map());
    const [slotIdToPillar, setSlotIdToPillar] = useState(new Map());

    const [batteryIdsInput, setBatteryIdsInput] = useState("");
    const [swapInResult, setSwapInResult] = useState(null);
    const [swapOutResult, setSwapOutResult] = useState(null);
    const [swapInError, setSwapInError] = useState(null);
    const [outOptions, setOutOptions] = useState([]);
    const [autoPicked, setAutoPicked] = useState([]);
    const [autoPickError, setAutoPickError] = useState("");
    const [swapInCount, setSwapInCount] = useState(0);

    const [selectedPillarId, setSelectedPillarId] = useState("");
    const [pickupPillarId, setPickupPillarId] = useState("");

    const [selectedSlotIds, setSelectedSlotIds] = useState([]);

    // ✅ NEW: các slot rỗng cho Swap-In do BE cung cấp
    const [allowedSwapIn, setAllowedSwapIn] = useState(new Set());

    const tryParseStations = (raw) => {
        if (typeof raw === "string") {
            try {
                return JSON.parse(raw);
            } catch {
                return [];
            }
        }
        if (Array.isArray(raw)) return raw;
        if (raw && typeof raw === "object") {
            if (Array.isArray(raw.stations)) return raw.stations;
            if (Array.isArray(raw.data)) return raw.data;
        }
        return [];
    };

    const loadStations = async () => {
        setStationLoading(true);
        setStationError("");
        try {
            const userDriverId = localStorage.getItem("userId");
            let res;
            try {
                res = await api.post("Station/station-list", { DriverId: userDriverId });
            } catch {
                res = await getStationList();
            }
            let list = tryParseStations(res.data);
            list = list.map((s, i) => ({
                stationId: s.stationId ?? s.id ?? s.code ?? `STA-${i}`,
                stationName: s.stationName ?? s.name ?? s.label ?? `Station ${i + 1}`,
            }));
            if (!list.length) throw new Error("Danh sách trạm rỗng từ BE");
            setStations(list);
        } catch (e) {
            console.error("getStationList error:", e?.response?.data || e);
            setStationError(
                e?.response?.data?.message || e?.message || "Không tải được danh sách trạm từ BE."
            );
            setStations(FALLBACK_STATIONS);
        } finally {
            setStationLoading(false);
        }
    };

    useEffect(() => {
        loadStations();
    }, []);

    useEffect(() => {
        if (!stationLoading && isPreset) {
            setStationId(presetStationId);
            setSubscriptionId(presetSubscriptionId);
            setTimeout(() => doValidate(presetSubscriptionId, presetStationId), 0);
        }
    }, [stationLoading]); // eslint-disable-line

    const requiredBatteryCount = useMemo(() => {
        const o = subscriptionInfo || {};
        return (
            o.packagePins ??
            o.batteryCount ??
            o.numberOfBatteries ??
            o.requiredBatteries ??
            0
        );
    }, [subscriptionInfo]);

    const getMustPickCount = () => {
        const beCount = (autoPicked?.length || outOptions?.length || 0);
        return (
            (requiredBatteryCount && requiredBatteryCount > 0 && requiredBatteryCount) ||
            (swapInCount && swapInCount > 0 && swapInCount) ||
            (beCount && beCount > 0 && beCount) ||
            1
        );
    };

    const resetAll = () => {
        setStep(1);
        setStationId("");
        setSubscriptionId("");
        setSubError("");
        setSubscriptionInfo(null);
        setBatteryIdsInput("");
        setSwapInResult(null);
        setSwapOutResult(null);
        setPillarSlotsMap(new Map());
        setSlotIdToPillar(new Map());
        setSwapInError(null);
        setOutOptions([]);
        setAutoPicked([]);
        setAutoPickError("");
        setSwapInCount(0);
        setSelectedPillarId("");
        setPickupPillarId("");
        setSelectedSlotIds([]);
        setAllowedSwapIn(new Set());
    };

    // === validate subscription ===
    const doValidate = async (sub, sta) => {
        setSubError("");
        setSwapInError(null);
        const subTrim = (sub || "").trim();
        if (!sta) return setSubError("Vui lòng chọn trạm trước.");
        if (!isValidSubFormat(subTrim))
            return setSubError("Sai định dạng Subscription ID. Ví dụ: SUB-18779758");

        setSubmitting(true);
        setLoading(true);
        try {
            const res = await validateSubscription(subTrim, sta);
            const data = res.data;
            if (!data || typeof data !== "object") throw new Error("BE trả dữ liệu không hợp lệ");

            if (data.isValid === false || toLower(data.status) === "invalid") {
                setSubError(data.message || "Subscription không hợp lệ.");
                return;
            }

            const positive =
                data.isValid === true ||
                data.valid === true ||
                toLower(data.status) === "valid" ||
                isPositiveMsg(data.message);

            if (!positive) {
                setSubError(data.message || "Không xác thực được Subscription.");
                return;
            }

            const info = data.data ?? data;
            setSubscriptionInfo(info);

            const rawSlots = extractSlotsFromResponse(info);
            const batTake = extractBatTake(info);
            const slotEmptyIds = extractSlotEmptyIds(info); // ✅ danh sách slot rỗng

            // Group không mở thêm ô nào nữa
            const pMap = groupSlotsByPillar(rawSlots, sta);

            // Index slotId -> pillarId
            const indexMap = new Map();
            for (const [pid, arr] of pMap) arr.forEach((s) => indexMap.set(String(s.slotId), pid));
            setPillarSlotsMap(new Map(pMap));
            setSlotIdToPillar(indexMap);

            // ✅ Lưu allowed slot cho Swap-In
            const allowedSet = new Set((slotEmptyIds || []).map(String));
            setAllowedSwapIn(allowedSet);

            // Nếu có slot trống → gợi ý chọn trụ theo slotEmpty đầu tiên
            if (allowedSet.size > 0 && !selectedPillarId) {
                const firstEmpty = String(slotEmptyIds[0]);
                const pid = indexMap.get(firstEmpty);
                if (pid) setSelectedPillarId(pid);
            }

            // Nếu BE gửi batTake → chuẩn bị step 3
            if (Array.isArray(batTake) && batTake.length > 0) {
                const picked = batTake
                    .filter((x) => x?.batteryId && x?.slotId)
                    .map((x) => ({ batteryId: x.batteryId, slotId: x.slotId }));
                setAutoPicked(picked);
                setOutOptions(picked);
                setSwapInCount(picked.length);
                const pid = indexMap.get(String(picked[0]?.slotId)) || "";
                setPickupPillarId(pid);
            } else {
                setAutoPicked([]);
                setOutOptions([]);
                setPickupPillarId("");
            }

            setSelectedSlotIds([]);

            const initialTake = /please,\s*take\s*batteries/i.test(String(data.message || info.message || ""));
            setStep(initialTake ? 3 : 2);
        } catch (err) {
            setSubError(
                `❌ ${err?.response?.data?.message || err?.message || "Không xác thực được Subscription."}`
            );
        } finally {
            setSubmitting(false);
            setLoading(false);
        }
    };

    const handleValidate = (e) => {
        e.preventDefault();
        doValidate(subscriptionId, stationId);
    };

    const parsedBatteryIds = useMemo(() => {
        return batteryIdsInput
            .split(/[\n,]/g)
            .map((s) => s.trim())
            .filter(Boolean);
    }, [batteryIdsInput]);

    const togglePickSlot = (slot) => {
        if (step !== 2) return;
        if (!selectedPillarId) return;
        if (!slot || slot.pillarId !== selectedPillarId) return;
        // ✅ chỉ cho chọn nếu slot thuộc allowedSwapIn
        if (!allowedSwapIn.has(String(slot.slotId))) return;

        const maxNeed = parsedBatteryIds.length || getMustPickCount();
        if (!maxNeed) return;

        setSelectedSlotIds((prev) => {
            const id = String(slot.slotId);
            if (prev.includes(id)) return prev.filter((x) => x !== id);
            if (prev.length >= maxNeed) return prev;
            return [...prev, id];
        });
    };

    // === swap-in ===
    const getFreeSlotIdsOnSelectedPillar = () => {
        if (!selectedPillarId) return [];
        const arr = pillarSlotsMap.get(selectedPillarId) || [];
        // ✅ chỉ lấy free trong allowedSwapIn
        return arr
            .filter((s) => allowedSwapIn.has(String(s.slotId)))
            .map((s) => s.slotId);
    };

    const handleSwapIn = async () => {
        setSwapInError(null);

        if (!selectedPillarId) {
            alert("Vui lòng chọn trụ để nộp pin (Swap-In).");
            return;
        }

        const ids = parsedBatteryIds;

        if (requiredBatteryCount > 0 && ids.length !== requiredBatteryCount) {
            alert(`Cần đúng ${requiredBatteryCount} mã pin theo gói`);
            return;
        }
        if (ids.length === 0) {
            alert("Nhập ít nhất 1 mã pin để Swap-In");
            return;
        }

        const freeSlotIds = getFreeSlotIdsOnSelectedPillar();
        if (freeSlotIds.length < ids.length) {
            alert(
                `Trụ "${selectedPillarId}" không đủ slot trống (theo danh sách BE). Cần ${ids.length}, đang có ${freeSlotIds.length}. Vui lòng chọn trụ khác.`
            );
            return;
        }

        let slotOrder = selectedSlotIds.slice(0, ids.length);
        if (slotOrder.length < ids.length) {
            const chosenSet = new Set(slotOrder.map(String));
            const remain = freeSlotIds.filter((sid) => !chosenSet.has(String(sid)));
            const need = ids.length - slotOrder.length;
            slotOrder = slotOrder.concat(remain.slice(0, need).map(String));
        }
        if (slotOrder.length < ids.length) {
            alert("Chưa đủ slot để gán pin. Vui lòng chọn thêm ô hoặc đổi trụ.");
            return;
        }

        const batteryDtos = ids.map((batteryId, idx) => ({
            batteryId,
            slotId: slotOrder[idx],
        }));

        setSwapInCount(ids.length);
        setLoading(true);
        try {
            const payload = {
                batteryDtos,
                subscriptionId: subscriptionId.trim(),
                accessRequest: {
                    subscriptionId: subscriptionId.trim(),
                    stationId,
                },
                pillarId: selectedPillarId,
            };

            const res = await swapInBattery(payload);
            setSwapInResult(res.data);

            const raw = res?.data?.data ?? res?.data ?? {};
            let fromBE = (raw.BatteryDtos || raw.batteryDtos || []).map((it) => ({
                batteryId: it.batteryId ?? it.BatteryId,
                slotId: it.slotId ?? it.SlotId,
            }));

            // fallback: tự suy ra từ slot đang có pin (nếu cần)
            if (!fromBE.length) {
                const out = [];
                for (const [, arr] of pillarSlotsMap) {
                    arr.forEach((s) => {
                        if (s?.batteryId) out.push({ batteryId: s.batteryId, slotId: s.slotId });
                    });
                }
                fromBE = out;
            }

            setOutOptions(fromBE);

            const mustPick = getMustPickCount();

            if (fromBE.length < mustPick) {
                setAutoPicked([]);
                setAutoPickError(
                    `Không đủ pin khả dụng để nhận. Cần ${mustPick}, đang có ${fromBE.length}.`
                );
            } else {
                const chosen = fromBE.slice(0, mustPick);
                setAutoPicked(chosen);
                setAutoPickError("");
            }

            const firstSlot = (fromBE[0] || {}).slotId;
            const pid = firstSlot ? slotIdToPillar.get(String(firstSlot)) : "";
            setPickupPillarId(pid || "");

            setStep(3);
        } catch (err) {
            const status = err?.response?.status;
            const data = err?.response?.data;

            if (status === 404 && data?.message) {
                setSwapInError({
                    message: data.message,
                    wrongBatteries: Array.isArray(data.data) ? data.data : [],
                });
                return;
            }

            let msg = `Swap-In thất bại${status ? ` (status ${status})` : ""}`;
            if (typeof data === "string") msg += `\n${data}`;
            else if (data?.title) msg += `\n${data.title}`;
            if (data?.errors) {
                msg +=
                    "\n" +
                    Object.entries(data.errors)
                        .map(([k, v]) => `${k}: ${(v || []).join(", ")}`)
                        .join("\n");
            }
            alert(msg);
        } finally {
            setLoading(false);
        }
    };

    // === NÚT XÁC NHẬN ĐÃ LẤY PIN → Swap-Out ===
    const confirmTakeBatteries = async () => {
        const mustPick = getMustPickCount();
        const list = (autoPicked.length ? autoPicked : outOptions).slice(0, mustPick);

        if (!list.length || list.length < mustPick) {
            alert("Danh sách pin cấp chưa đủ. Vui lòng kiểm tra lại.");
            return;
        }

        setLoading(true);
        try {
            await doSwapOut(list);
        } finally {
            setLoading(false);
        }
    };

    // === swap-out ===
    const doSwapOut = async (picked) => {
        setLoading(true);
        try {
            const payload = {
                batteryDtos: picked.map(({ batteryId, slotId }) => ({ batteryId, slotId })),
                subscriptionId: subscriptionId.trim(),
                accessRequest: { subscriptionId: subscriptionId.trim(), stationId },
                pillarId: pickupPillarId || stationId,
            };

            const res = await swapOutBattery(payload);
            setSwapOutResult(res.data);
            setStep(4);
        } catch (err) {
            const v = err?.response?.data;
            let friendly = "Swap-Out thất bại.";
            if (v?.title) friendly = v.title;
            if (v?.errors && typeof v?.errors === "object") {
                const parts = Object.entries(v.errors).map(
                    ([key, arr]) => `${key}: ${(arr || []).join(", ")}`
                );
                friendly += `\n${parts.join("\n")}`;
            } else if (typeof v === "string") {
                friendly += `\n${v}`;
            }
            console.error("swap-out error:", err?.response?.status, v);
            alert(`❌ ${friendly}`);
        } finally {
            setLoading(false);
        }
    };

    // === View map cho UI:
    const mustPickList = useMemo(
        () => (autoPicked.length ? autoPicked : outOptions).slice(0, getMustPickCount()),
        [autoPicked, outOptions, requiredBatteryCount, swapInCount]
    );

    const displayPillarMap = useMemo(() => {
        if (step === 3) {
            const focusPid =
                pickupPillarId ||
                (mustPickList.length
                    ? slotIdToPillar.get(String(mustPickList[0]?.slotId)) || ""
                    : "");
            return makeStep3ViewMap(pillarSlotsMap, mustPickList, focusPid);
        }
        if (step === 2) {
            // ✅ ép xanh đúng các slot trong allowedSwapIn
            return makeStep2ViewMap_AllowedSlotsOnly(
                pillarSlotsMap,
                selectedPillarId,
                selectedSlotIds,
                allowedSwapIn
            );
        }
        return pillarSlotsMap;
    }, [
        pillarSlotsMap,
        step,
        selectedPillarId,
        pickupPillarId,
        mustPickList,
        slotIdToPillar,
        selectedSlotIds,
        allowedSwapIn,
    ]);

    const pillarEntries = useMemo(() => flattenFromPillarMap(displayPillarMap), [displayPillarMap]);

    return (
        <div className="p-6 max-w-5xl mx-auto space-y-6">
            <h1 className="text-2xl font-bold text-center">📗 Battery Swap Simulation</h1>

            {stationLoading && (
                <div className="text-gray-600 text-center">Đang tải danh sách trạm...</div>
            )}

            {!stationLoading && (
                <>
                    {step === 1 && (
                        <form onSubmit={handleValidate} className="card p-6 space-y-3">
                            <h2 className="text-base font-semibold">Bước 1: Chọn trạm & nhập Subscription</h2>
                            <select
                                className="p-3 border rounded-lg w-full"
                                value={stationId}
                                onChange={(e) => setStationId(e.target.value)}
                                required
                            >
                                <option value="">-- Chọn trạm --</option>
                                {stations.map((s, idx) => (
                                    <option key={idx} value={s.stationId}>
                                        {s.stationName} ({s.stationId})
                                    </option>
                                ))}
                            </select>

                            <input
                                className="p-3 border rounded-lg w-full"
                                placeholder="Nhập Subscription ID (VD: SUB-18779758)"
                                value={subscriptionId}
                                onChange={(e) => setSubscriptionId(e.target.value)}
                                required
                            />

                            {subError && <div className="text-sm text-red-600">{subError}</div>}

                            <button
                                type="submit"
                                className="btn-primary w-full"
                                disabled={loading || submitting}
                            >
                                {submitting ? "Đang xác thực..." : "Xác thực gói thuê"}
                            </button>
                        </form>
                    )}

                    {/* Lưới TRỤ PIN */}
                    {subscriptionInfo && (
                        <div className="card p-6 space-y-3">
                            <div className="flex items-center justify-between">
                                <h2 className="text-base font-semibold">⚡ Trạng thái các trụ pin tại trạm</h2>
                                <div className="flex items-center gap-4 text-xs text-gray-600">
                                    <span className="inline-flex items-center gap-1">
                                        <span className="w-3 h-3 rounded bg-emerald-500 inline-block" />
                                        Slot có thể chọn
                                    </span>
                                    <span className="inline-flex items-center gap-1">
                                        <span className="w-3 h-3 rounded bg-slate-400 inline-block" />
                                        Không thể chọn
                                    </span>
                                </div>
                            </div>

                            {step === 2 && (
                                <div className="text-xs text-gray-600 space-y-1">
                                    <div>1) <b>Chọn một trụ</b> để nộp pin (Swap-In).</div>
                                    <div>2) Nhập danh sách <b>BatteryId</b>.</div>
                                    <div>3) <b>Click các ô màu xanh</b> (BE cho phép trong <code>slotEmpty</code>) để gán BatteryId → Slot.</div>
                                </div>
                            )}
                            {step === 3 && (
                                <div className="text-xs text-gray-600">
                                    Chỉ <b>trụ cấp pin</b> sáng; và chỉ các <b>ô màu xanh</b> đã mở để bạn lấy pin.
                                </div>
                            )}

                            {pillarEntries.length === 0 ? (
                                <div className="text-gray-500 text-sm text-center">
                                    Không có dữ liệu slot. Vui lòng thử lại hoặc kiểm tra Subscription.
                                </div>
                            ) : (
                                <div className="grid md:grid-cols-3 sm:grid-cols-2 grid-cols-1 gap-4">
                                    {pillarEntries.map(([pid, slots]) => {
                                        const isSelected = step === 2 && selectedPillarId && pid === selectedPillarId;
                                        const isDim = slots.some((s) => s.__dim);
                                        return (
                                            <button
                                                key={pid}
                                                type="button"
                                                onClick={() => {
                                                    if (step === 2) {
                                                        setSelectedPillarId(pid);
                                                        setSelectedSlotIds((prev) => {
                                                            const set = new Set(
                                                                (pillarSlotsMap.get(pid) || []).map((s) => String(s.slotId))
                                                            );
                                                            return prev.filter((x) => set.has(String(x)));
                                                        });
                                                    }
                                                }}
                                                className={[
                                                    "bg-gray-50 rounded-lg p-3 border text-left",
                                                    step === 2 ? "cursor-pointer hover:shadow" : "cursor-default",
                                                    isSelected ? "ring-2 ring-emerald-400" : "",
                                                    isDim ? "opacity-40 grayscale" : "",
                                                ].join(" ")}
                                                title={step === 2 ? "Click để chọn trụ Swap-In" : ""}
                                            >
                                                <h4 className="text-center font-semibold mb-2 text-gray-700">
                                                    Trụ {pid}
                                                    {step === 2 && selectedPillarId === pid ? " • (đã chọn)" : ""}
                                                </h4>
                                                <div className="grid grid-cols-4 gap-2">
                                                    {slots.map((slot, i) => {
                                                        const pickedIdx =
                                                            selectedSlotIds.findIndex((x) => x === String(slot?.slotId)) + 1;
                                                        const canPick =
                                                            step === 2 &&
                                                            selectedPillarId === pid &&
                                                            allowedSwapIn.has(String(slot?.slotId)); // ✅ chỉ slotEmpty mới xanh/click
                                                        return (
                                                            <div
                                                                key={slot?.slotId ?? `${pid}-${i}`}
                                                                onClick={() => canPick && togglePickSlot(slot)}
                                                                className={[
                                                                    "h-10 rounded-md transition-all relative",
                                                                    slotColorClass(canPick || slot.__green), // __green dùng ở step 3
                                                                    canPick ? "cursor-pointer hover:ring-2 hover:ring-blue-400" : "cursor-default",
                                                                    pickedIdx ? "ring-4 ring-blue-500" : "",
                                                                ].join(" ")}
                                                                title={`Slot ${slot?.slotNumber ?? i + 1}${slot?.batteryId ? ` • ${slot.batteryId}` : ""}`}
                                                            >
                                                                {pickedIdx ? (
                                                                    <span className="absolute -top-1 -right-1 text-[10px] px-1.5 py-0.5 rounded bg-blue-600 text-white">
                                                                        {pickedIdx}
                                                                    </span>
                                                                ) : null}
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    )}

                    {step === 2 && (
                        <div className="card p-6 space-y-3">
                            <h2 className="text-base font-semibold">Bước 2: Swap-In (nộp pin cũ)</h2>

                            <div className="text-sm text-gray-600">
                                Chọn trụ ở khung trên, sau đó nhập mỗi mã pin trên <b>một dòng</b> hoặc phân tách bằng dấu phẩy.
                            </div>

                            <textarea
                                className="p-3 border rounded-lg w-full"
                                rows={4}
                                placeholder={"VD:\nBT-7436-XFRU\nBT-4300-4GPV"}
                                value={batteryIdsInput}
                                onChange={(e) => setBatteryIdsInput(e.target.value)}
                            />

                            {/* Preview mapping BatteryId ↔ Slot (thứ tự click) */}
                            <div className="text-sm text-gray-700">
                                <div className="font-medium mb-1">Preview gán Slot (theo thứ tự bạn click):</div>
                                <div className="max-h-48 overflow-auto border rounded">
                                    <table className="w-full text-sm">
                                        <thead className="bg-gray-50 sticky top-0">
                                            <tr>
                                                <th className="p-2 text-left">#</th>
                                                <th className="p-2 text-left">BatteryId</th>
                                                <th className="p-2 text-left">SlotId</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {parsedBatteryIds.map((bid, idx) => (
                                                <tr key={`${bid}-${idx}`} className="border-t">
                                                    <td className="p-2">{idx + 1}</td>
                                                    <td className="p-2">{bid}</td>
                                                    <td className="p-2">
                                                        {selectedSlotIds[idx] ? String(selectedSlotIds[idx]) : <span className="text-gray-400">chưa chọn</span>}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                                {selectedPillarId ? (
                                    <div className="mt-1 text-xs text-gray-600">
                                        Trụ đã chọn: <b>{selectedPillarId}</b>. Chỉ có thể gán vào <b>các ô xanh</b> BE trả trong <code>slotEmpty</code>.
                                    </div>
                                ) : (
                                    <div className="mt-1 text-xs text-orange-600">Chưa chọn trụ.</div>
                                )}
                            </div>

                            {swapInError?.message && (
                                <div className="bg-red-50 border border-red-200 text-red-700 rounded p-3 text-sm">
                                    <div className="font-medium mb-1">{swapInError.message}</div>
                                </div>
                            )}

                            <div className="flex items-center gap-3">
                                <button
                                    className="btn-primary"
                                    onClick={handleSwapIn}
                                    disabled={
                                        loading ||
                                        !selectedPillarId ||
                                        parsedBatteryIds.length === 0 ||
                                        selectedSlotIds.length < parsedBatteryIds.length
                                    }
                                >
                                    {loading ? "Đang gửi..." : "Gửi Swap-In"}
                                </button>
                                <span className="text-xs text-gray-500">
                                    (Chỉ gán được vào các slot BE cho phép)
                                </span>
                            </div>

                            {swapInResult && (
                                <div className="mt-3">
                                    <div className="font-medium mb-1">Kết quả Swap-In</div>
                                    <pre className="bg-gray-50 p-3 rounded text-sm overflow-x-auto">
                                        {JSON.stringify(swapInResult, null, 2)}
                                    </pre>
                                </div>
                            )}
                        </div>
                    )}

                    {step === 3 && (
                        <div className="card p-6 space-y-3">
                            <h2 className="text-base font-semibold">Bước 3: Swap-Out (xác nhận lấy pin mới)</h2>

                            {autoPickError && (
                                <div className="text-sm text-red-600">{autoPickError}</div>
                            )}

                            {outOptions.length > 0 && !swapInResult?.data?.BatteryDtos && autoPicked.length === 0 && (
                                <div className="text-xs text-yellow-700 bg-yellow-50 p-2 rounded">
                                    Đang dùng danh sách pin khả dụng từ <b>pillarSlot</b> (fallback) vì BE không trả BatteryDtos.
                                </div>
                            )}

                            <div className="text-sm text-gray-600">
                                Danh sách pin hệ thống đã chọn để cấp — số lượng = <b>{getMustPickCount()}</b>:
                            </div>

                            <div className="max-h-72 overflow-auto border rounded">
                                <table className="w-full text-sm">
                                    <thead className="bg-gray-50 sticky top-0">
                                        <tr>
                                            <th className="p-2 text-left">#</th>
                                            <th className="p-2 text-left">BatteryId</th>
                                            <th className="p-2 text-left">SlotId</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {mustPickList.map((opt, idx) => (
                                            <tr key={`${opt.batteryId}-${opt.slotId}-${idx}`} className="border-t">
                                                <td className="p-2">{idx + 1}</td>
                                                <td className="p-2">{opt.batteryId}</td>
                                                <td className="p-2">{opt.slotId}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            <div className="text-sm text-gray-500">
                                Trên lưới bên trên: chỉ <b>trụ cấp pin</b> sáng và chỉ <b>các ô xanh</b> là ô đã mở để lấy.
                            </div>

                            <div className="flex gap-2">
                                <button
                                    className="btn-primary"
                                    onClick={confirmTakeBatteries}
                                    disabled={loading || mustPickList.length < getMustPickCount()}
                                >
                                    {loading ? "Đang xác nhận..." : "✅ Tôi đã lấy đủ pin — Xác nhận"}
                                </button>
                                <button className="btn-ghost" onClick={() => setStep(2)} disabled={loading}>
                                    ⬅ Quay lại bước 2
                                </button>
                            </div>

                            {swapOutResult && (
                                <div className="mt-3">
                                    <div className="font-medium mb-1">Kết quả Swap-Out</div>
                                    <pre className="bg-gray-50 p-3 rounded text-sm overflow-x-auto">
                                        {JSON.stringify(swapOutResult, null, 2)}
                                    </pre>
                                </div>
                            )}
                        </div>
                    )}

                    {step === 4 && (
                        <div className="card p-6 space-y-2">
                            <h2 className="text-base font-semibold">✅ Hoàn tất đổi pin</h2>
                            <div>Trạm: <b>{stationId}</b></div>
                            <div>Subscription: <b>{subscriptionId}</b></div>
                            <div className="pt-2 flex gap-2">
                                <button className="btn-secondary" onClick={() => setStep(2)}>
                                    Đổi tiếp
                                </button>
                                <button className="btn-ghost" onClick={resetAll}>
                                    Làm mới
                                </button>
                                <button className="btn-primary" onClick={() => navigate("/user/service")}>
                                    Hoàn thành
                                </button>
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
