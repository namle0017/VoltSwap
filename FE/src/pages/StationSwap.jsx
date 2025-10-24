/* eslint-disable no-unused-vars */
// src/pages/StationSwap.jsx
import { useEffect, useMemo, useState } from "react";
import { useLocation, useSearchParams } from "react-router-dom";
import {
    getStationList,
    validateSubscription,
    swapInBattery,
    swapOutBattery,
} from "@/api/batterySwapApi";
import api from "@/api/api";

// === FALLBACK data ===
const FALLBACK_STATIONS = [
    { stationId: "STA-10-03-7891", stationName: "Thu Duc Station (Fallback)" },
    { stationId: "STA-01-12-5678", stationName: "District 1 Station (Fallback)" },
];

const isValidSubFormat = (sub) => /^SUB-\d{8}$/.test((sub || "").trim());
const isPositiveMsg = (msg = "") => {
    const m = String(msg).toLowerCase();
    return (
        m.includes("success") ||
        m.includes("ok") ||
        m.includes("please put your battery") ||
        m.includes("validated") ||
        m.includes("valid") ||
        m.includes("please, take batteries")
    );
};

// ===== Helpers cho lưới slot (đơn giản hoá cho người dùng) =====
const isNotUse = (slot) =>
    String(slot?.pillarStatus || "").toLowerCase().includes("not"); // Not use

const isUse = (slot) =>
    !isNotUse(slot) && String(slot?.pillarStatus || "").length > 0;

/** Chỉ 2 màu:
 *  - Xanh (emerald): Not use (mở/đang trống để thao tác)
 *  - Xám (slate): Use (đang khoá/đang dùng/không khả dụng)
 */
const slotColorClass = (slot) => (isNotUse(slot) ? "bg-emerald-500" : "bg-slate-400");

const splitToPillars = (slots = []) => {
    const ordered = [...slots].sort(
        (a, b) => (a.slotNumber ?? 0) - (b.slotNumber ?? 0)
    );
    // 3 trụ × 20 ô
    return [ordered.slice(0, 20), ordered.slice(20, 40), ordered.slice(40, 60)];
};

// LẤY DANH SÁCH SLOT từ mọi kiểu response BE có thể trả
const extractSlotsFromResponse = (raw) => {
    if (Array.isArray(raw)) return raw;
    if (raw && typeof raw === "object") {
        if (Array.isArray(raw.pillarSlotDtos)) return raw.pillarSlotDtos;
        if (Array.isArray(raw.data)) return raw.data;
    }
    return [];
};

export default function StationSwap() {
    const location = useLocation();
    const [searchParams] = useSearchParams();

    // === preset từ Booking ===
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

    // === states chính ===
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
    const [stationSlots, setStationSlots] = useState([]);
    const [batteryIdsInput, setBatteryIdsInput] = useState("");
    const [swapInResult, setSwapInResult] = useState(null);
    const [swapOutResult, setSwapOutResult] = useState(null);
    const [swapInError, setSwapInError] = useState(null);
    const [outOptions, setOutOptions] = useState([]);
    const [autoPicked, setAutoPicked] = useState([]);
    const [autoPickError, setAutoPickError] = useState("");
    const [swapInCount, setSwapInCount] = useState(0);

    // === parse & load stations ===
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

    // === Auto fill preset ===
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

    const resetAll = () => {
        setStep(1);
        setStationId("");
        setSubscriptionId("");
        setSubError("");
        setSubscriptionInfo(null);
        setBatteryIdsInput("");
        setSwapInResult(null);
        setSwapOutResult(null);
        setStationSlots([]);
        setSwapInError(null);
        setOutOptions([]);
        setAutoPicked([]);
        setAutoPickError("");
        setSwapInCount(0);
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
            if (!data || typeof data !== "object")
                throw new Error("BE trả dữ liệu không hợp lệ");

            if (data.isValid === false || data.status?.toLowerCase() === "invalid") {
                setSubError(data.message || "Subscription không hợp lệ.");
                return;
            }

            const positive =
                data.isValid === true ||
                data.valid === true ||
                String(data.status || "").toLowerCase() === "valid" ||
                isPositiveMsg(data.message);

            if (!positive) {
                setSubError(data.message || "Không xác thực được Subscription.");
                return;
            }

            const info = data.data ?? data;
            setSubscriptionInfo(info);

            // lấy slots từ mọi format
            const slots = extractSlotsFromResponse(info);
            setStationSlots(slots);

            setStep(2);
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

    // === swap-in (giữ nguyên logic) ===
    const getFreeSlotIds = () =>
        (stationSlots || []).filter((s) => isNotUse(s)).map((s) => s.slotId);

    const getAvailableFromSlots = (slots = []) =>
        (slots || [])
            .filter(
                (s) =>
                    String(s?.pillarStatus).toLowerCase() === "use" &&
                    String(s?.batteryStatus).toLowerCase() === "available" &&
                    s?.batteryId
            )
            .map((s) => ({ batteryId: s.batteryId, slotId: s.slotId }));

    const handleSwapIn = async () => {
        setSwapInError(null);

        const ids = batteryIdsInput
            .split(/[\n,]/g)
            .map((s) => s.trim())
            .filter(Boolean);

        if (requiredBatteryCount > 0 && ids.length !== requiredBatteryCount) {
            alert(`Cần đúng ${requiredBatteryCount} mã pin theo gói`);
            return;
        }
        if (ids.length === 0) {
            alert("Nhập ít nhất 1 mã pin để Swap-In");
            return;
        }

        const freeSlotIds = getFreeSlotIds();
        if (freeSlotIds.length < ids.length) {
            alert(
                `Không đủ slot trống (Not use). Cần ${ids.length} slot, hiện có ${freeSlotIds.length}.`
            );
            return;
        }

        const batteryDtos = ids.map((batteryId, idx) => ({
            batteryId,
            slotId: freeSlotIds[idx],
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
                pillarId: stationId,
            };

            const res = await swapInBattery(payload);
            setSwapInResult(res.data);

            const raw = res?.data?.data ?? res?.data ?? {};
            const fromBE = (raw.BatteryDtos || raw.batteryDtos || []).map((it) => ({
                batteryId: it.batteryId ?? it.BatteryId,
                slotId: it.slotId ?? it.SlotId,
            }));

            const statusMap = new Map(
                (stationSlots || []).map((s) => [
                    String(s.batteryId || ""),
                    {
                        pillarStatus: String(s.pillarStatus || "").toLowerCase(),
                        batteryStatus: String(s.batteryStatus || "").toLowerCase(),
                        slotId: s.slotId,
                    },
                ])
            );

            let options = fromBE.filter((x) => {
                const st = statusMap.get(String(x.batteryId || ""));
                return st && st.pillarStatus === "use" && st.batteryStatus === "available";
            });

            if (options.length === 0) {
                options = getAvailableFromSlots(extractSlotsFromResponse(subscriptionInfo));
            }

            setOutOptions(options);

            const mustPick = requiredBatteryCount > 0 ? requiredBatteryCount : ids.length;
            if (options.length < mustPick) {
                setAutoPicked([]);
                setAutoPickError(
                    `Không đủ pin khả dụng để nhận. Cần ${mustPick}, đang có ${options.length}.`
                );
                setStep(3);
                return;
            }

            const chosen = options.slice(0, mustPick);
            setAutoPicked(chosen);
            setAutoPickError("");
            setStep(3);

            await doSwapOut(chosen);
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

    // === swap-out (giữ nguyên logic) ===
    const doSwapOut = async (picked) => {
        setLoading(true);
        try {
            const payload = {
                batteryDtos: picked.map(({ batteryId, slotId }) => ({ batteryId, slotId })),
                subscriptionId: subscriptionId.trim(),
                accessRequest: { subscriptionId: subscriptionId.trim(), stationId },
                pillarId: stationId,
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

    // === UI ===
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

                    {/* Lưới TRỤ PIN (chỉ 2 màu) hiển thị NGAY sau validate */}
                    {subscriptionInfo && (
                        <div className="card p-6 space-y-3">
                            <div className="flex items-center justify-between">
                                <h2 className="text-base font-semibold">⚡ Trạng thái các trụ pin tại trạm</h2>
                                {/* Legend hai màu */}
                                <div className="flex items-center gap-4 text-xs text-gray-600">
                                    <span className="inline-flex items-center gap-1">
                                        <span className="w-3 h-3 rounded bg-emerald-500 inline-block" />
                                        Mở (Not use)
                                    </span>
                                    <span className="inline-flex items-center gap-1">
                                        <span className="w-3 h-3 rounded bg-slate-400 inline-block" />
                                        Khoá (Use)
                                    </span>
                                </div>
                            </div>

                            {stationSlots.length === 0 ? (
                                <div className="text-gray-500 text-sm text-center">
                                    Không có dữ liệu slot. Vui lòng thử lại hoặc kiểm tra Subscription.
                                </div>
                            ) : (
                                <div className="grid grid-cols-3 gap-4">
                                    {splitToPillars(stationSlots).map((pillarSlots, idx) => (
                                        <div key={idx} className="bg-gray-50 rounded-lg p-3 border">
                                            <h4 className="text-center font-semibold mb-2 text-gray-700">
                                                Trụ {idx + 1}
                                            </h4>
                                            {/* 4 cột × 5 hàng = 20 ô. Chỉ hiển thị màu, không text/tooltip */}
                                            <div className="grid grid-cols-4 gap-2">
                                                {pillarSlots.map((slot, i) => (
                                                    <div
                                                        key={slot?.slotId ?? i}
                                                        aria-label={isNotUse(slot) ? "Mở" : "Khoá"}
                                                        className={`h-10 rounded-md ${slotColorClass(slot)} transition-colors`}
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {step === 2 && (
                        <div className="card p-6 space-y-3">
                            <h2 className="text-base font-semibold">Bước 2: Swap-In (nộp pin cũ)</h2>

                            <div className="text-sm text-gray-600">
                                Nhập mỗi mã pin trên <b>một dòng</b> hoặc phân tách bằng dấu phẩy.
                                <br />
                                <span className="inline-block mt-1 px-2 py-1 rounded bg-blue-50 text-blue-700">
                                    Gợi ý: hệ thống sẽ gán lần lượt vào các ô <b>màu xanh</b> (Not use).
                                </span>
                            </div>

                            <textarea
                                className="p-3 border rounded-lg w-full"
                                rows={4}
                                placeholder={"VD:\nBT-7436-XFRU\nBT-4300-4GPV"}
                                value={batteryIdsInput}
                                onChange={(e) => setBatteryIdsInput(e.target.value)}
                            />

                            {/* Hiển thị lỗi 404 business từ BE */}
                            {swapInError?.message && (
                                <div className="bg-red-50 border border-red-200 text-red-700 rounded p-3 text-sm">
                                    <div className="font-medium mb-1">{swapInError.message}</div>
                                </div>
                            )}

                            <button className="btn-primary" onClick={handleSwapIn} disabled={loading}>
                                {loading ? "Đang gửi..." : "Gửi Swap-In"}
                            </button>

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
                            <h2 className="text-base font-semibold">Bước 3: Swap-Out (tự động chọn pin mới)</h2>

                            {autoPickError && (
                                <div className="text-sm text-red-600">{autoPickError}</div>
                            )}

                            {outOptions.length > 0 && !swapInResult?.data?.BatteryDtos && (
                                <div className="text-xs text-yellow-700 bg-yellow-50 p-2 rounded">
                                    Đang dùng danh sách pin khả dụng từ <b>pillarSlotDtos</b> (fallback) vì BE không trả BatteryDtos.
                                </div>
                            )}

                            <div className="text-sm text-gray-600">
                                Danh sách pin hệ thống đã tự chọn để cấp (số lượng ={" "}
                                <b>
                                    {autoPicked.length ||
                                        (requiredBatteryCount > 0 ? requiredBatteryCount : swapInCount)}
                                </b>
                                ):
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
                                        {(autoPicked.length ? autoPicked : outOptions)
                                            .slice(
                                                0,
                                                requiredBatteryCount > 0 ? requiredBatteryCount : swapInCount || 1
                                            )
                                            .map((opt, idx) => (
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
                                Hệ thống đã tự động gọi Swap-Out ngay sau khi chuẩn bị danh sách.
                                Nếu thành công sẽ chuyển sang bước 4.
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
                            <div>
                                Trạm: <b>{stationId}</b>
                            </div>
                            <div>
                                Subscription: <b>{subscriptionId}</b>
                            </div>
                            <div className="pt-2 flex gap-2">
                                <button className="btn-secondary" onClick={() => setStep(2)}>
                                    Đổi tiếp
                                </button>
                                <button className="btn-ghost" onClick={resetAll}>
                                    Làm mới
                                </button>
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
