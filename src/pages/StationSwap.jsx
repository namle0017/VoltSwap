// src/pages/StationSwap.jsx
import { useEffect, useMemo, useState } from "react";
import {
    getStationList,
    validateSubscription,
    swapInBattery,
    swapOutBattery,
} from "../api/batterySwapApi";

const FALLBACK_STATIONS = [
    { stationId: "STA-10-03-7891", stationName: "Thu Duc Station (Fallback)" },
    { stationId: "STA-01-12-5678", stationName: "District 1 Station (Fallback)" },
];

const isValidSubFormat = (sub) => /^SUB-\d{8}$/.test((sub || "").trim());

export default function StationSwap() {
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);

    // Stations
    const [stations, setStations] = useState([]);
    const [stationLoading, setStationLoading] = useState(true);
    const [stationError, setStationError] = useState("");

    // Inputs
    const [stationId, setStationId] = useState("");
    const [subscriptionId, setSubscriptionId] = useState("");
    const [subError, setSubError] = useState("");
    const [submitting, setSubmitting] = useState(false);

    // Slots từ BE (sau validate)
    const [stationSlots, setStationSlots] = useState([]);

    // Infos & results
    const [subscriptionInfo, setSubscriptionInfo] = useState(null);
    const [batteryIdsInput, setBatteryIdsInput] = useState("");
    const [swapInResult, setSwapInResult] = useState(null);
    const [swapOutResult, setSwapOutResult] = useState(null);
    const [swapInError, setSwapInError] = useState(null);

    // Bước 3 - tự động
    const [outOptions, setOutOptions] = useState([]);      // danh sách pin khả dụng (Use + Available)
    const [autoPicked, setAutoPicked] = useState([]);      // danh sách pin đã auto-chọn để swap-out
    const [autoPickError, setAutoPickError] = useState(""); // lỗi nếu không đủ pin
    const [swapInCount, setSwapInCount] = useState(0);     // số pin đã nộp ở bước 2

    // Lấy pin khả dụng từ pillarSlotDtos: chỉ Use + Available
    const getAvailableFromSlots = (slots = []) => {
        return (slots || [])
            .filter(
                (s) =>
                    String(s?.pillarStatus).toLowerCase() === "use" &&
                    String(s?.batteryStatus).toLowerCase() === "available" &&
                    s?.batteryId
            )
            .map((s) => ({
                batteryId: s.batteryId,
                slotId: s.slotId,
            }));
    };

    // Lấy slot Not use để đón pin swap-in
    const getFreeSlotIds = () =>
        (stationSlots || [])
            .filter((s) => String(s.pillarStatus).toLowerCase() === "not use")
            .map((s) => s.slotId);

    const isPositiveMsg = (msg = "") => {
        const m = String(msg).toLowerCase();
        return (
            m.includes("success") ||
            m.includes("ok") ||
            m.includes("please put your battery") ||
            m.includes("validated") ||
            m.includes("valid") ||
            m.includes("Please, take batteries")
        );
    };

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

    const tryParseStations = (raw) => {
        if (typeof raw === "string") {
            const lower = raw.trim().toLowerCase();
            if (lower.startsWith("<!doctype") || lower.startsWith("<html")) return [];
            try {
                const parsed = JSON.parse(raw);
                return tryParseStations(parsed);
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
            const res = await getStationList();
            console.log("🔍 Raw /get-station-list:", res.data);
            let list = tryParseStations(res.data);
            list = list.map((s, i) => ({
                stationId: s.stationId ?? s.id ?? s.code ?? `STA-${i}`,
                stationName: s.stationName ?? s.name ?? s.label ?? `Station ${i + 1}`,
            }));
            if (!list.length) throw new Error("Danh sách trạm rỗng từ BE");
            setStations(list);
        } catch (e) {
            console.error(
                "getStationList error:",
                e?.response?.status,
                e?.response?.data || e?.message
            );
            setStationError(
                e?.response?.data?.message ||
                e?.message ||
                "Không tải được danh sách trạm từ BE (có thể BE trả HTML)."
            );
            setStations(FALLBACK_STATIONS);
        } finally {
            setStationLoading(false);
        }
    };

    useEffect(() => {
        loadStations();
    }, []);

    // B1: validate
    const handleValidate = async (e) => {
        e.preventDefault();
        setSubError("");
        setSwapInError(null);

        const sub = subscriptionId.trim();

        if (!stationId) {
            setSubError("Vui lòng chọn trạm trước.");
            return;
        }
        if (!isValidSubFormat(sub)) {
            setSubError("Sai định dạng Subscription ID. Ví dụ đúng: SUB-18779758");
            return;
        }

        setSubmitting(true);
        setLoading(true);
        try {
            const res = await validateSubscription(sub, stationId);
            console.log("🔎 validate-subscription raw:", res.data);

            if (!res || typeof res.data !== "object" || Array.isArray(res.data)) {
                setSubError("BE trả dữ liệu không hợp lệ (không phải JSON).");
                return;
            }

            const data = res.data;

            const explicitInvalid =
                data.isValid === false ||
                String(data.status || "").toLowerCase() === "invalid";
            if (explicitInvalid) {
                setSubError(data.error || data.message || "Subscription không hợp lệ.");
                return;
            }

            const positiveFlags =
                data.isValid === true ||
                data.valid === true ||
                String(data.status || "").toLowerCase() === "valid" ||
                isPositiveMsg(data.message);

            const serverEchoMatches =
                !data.subscriptionId || String(data.subscriptionId).trim() === sub;

            const hasPackageInfo =
                data.packagePins || data.batteryCount || data.numberOfBatteries;

            if (positiveFlags || (serverEchoMatches && hasPackageInfo)) {
                const info = data.data ?? data;
                setSubscriptionInfo(info);
                setSubError("");

                if (Array.isArray(info?.pillarSlotDtos)) {
                    setStationSlots(info.pillarSlotDtos);
                    console.log(
                        "📦 Loaded slots from subscription info:",
                        info.pillarSlotDtos.length
                    );
                } else {
                    setStationSlots([]);
                    console.warn("⚠️ pillarSlotDtos không có trong response.");
                }

                setStep(2);
            } else {
                setSubError(
                    data.error || data.message || "Không xác thực được Subscription."
                );
            }
        } catch (err) {
            console.error(
                "validate error:",
                err?.response?.status,
                err?.response?.data || err?.message
            );
            const msg =
                err?.response?.data?.message ||
                err?.response?.data ||
                err?.message ||
                "Không xác thực được Subscription.";
            setSubError(`❌ ${msg}`);
        } finally {
            setSubmitting(false);
            setLoading(false);
        }
    };

    // B2: swap-in
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

        // map BatteryId -> SlotId
        const batteryDtos = ids.map((batteryId, idx) => ({
            batteryId,
            slotId: freeSlotIds[idx],
        }));

        // ghi nhớ số pin đã nộp để bước 3 auto-chọn đúng bằng số này (nếu gói không quy định)
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

            console.log("📤 Swap-In payload:", payload);
            const res = await swapInBattery(payload);
            console.log("✅ Swap-In success:", res.status, res.data);
            setSwapInResult(res.data);

            // Danh sách pin khả dụng BE trả về (nếu có)
            const raw = res?.data?.data ?? res?.data ?? {};
            const fromBE = (raw.BatteryDtos || raw.batteryDtos || []).map((it) => ({
                batteryId: it.batteryId ?? it.BatteryId,
                slotId: it.slotId ?? it.SlotId,
            }));

            // Lọc BE theo Use + Available dựa trên stationSlots hiện có
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

            // Fallback nếu BE không trả hoặc lọc xong rỗng
            if (options.length === 0) {
                options = getAvailableFromSlots(subscriptionInfo?.pillarSlotDtos);
                console.warn(
                    "⚠️ BE không trả BatteryDtos (hoặc không hợp lệ), dùng fallback từ pillarSlotDtos:",
                    options.length
                );
            }

            setOutOptions(options);

            // ✅ AUTO-PICK & AUTO CALL SWAP-OUT
            const mustPick = requiredBatteryCount > 0 ? requiredBatteryCount : ids.length;
            if (options.length < mustPick) {
                setAutoPicked([]);
                setAutoPickError(
                    `Không đủ pin khả dụng để nhận. Cần ${mustPick}, đang có ${options.length}.`
                );
                setStep(3); // vẫn sang step 3 để hiển thị lỗi + danh sách hiện có
                return;
            }

            const chosen = options.slice(0, mustPick);
            setAutoPicked(chosen);
            setAutoPickError("");
            setStep(3);

            // Gọi swap-out ngay lập tức với danh sách auto-picked
            await doSwapOut(chosen);
        } catch (err) {
            const status = err?.response?.status;
            const data = err?.response?.data;

            if (status === 404 && data?.message) {
                setSwapInError({
                    message: data.message,
                    wrongBatteries: Array.isArray(data.data) ? data.data : [],
                });
                return; // ở lại step 2 để người dùng sửa
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

    // HÀM DÙNG CHUNG ĐỂ GỌI SWAP-OUT VỚI DANH SÁCH ĐÃ CHỌN
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

    // ---- UI ----
    return (
        <div className="p-6 max-w-3xl mx-auto space-y-6">
            <h1 className="text-2xl font-bold text-center">📗 Battery Swap - BE Integration</h1>

            {stationLoading && (
                <div className="card p-4 text-gray-600">Đang tải danh sách trạm...</div>
            )}
            {!stationLoading && stationError && (
                <div className="card p-4 bg-yellow-50 text-yellow-800 space-y-3">
                    <div className="font-semibold">Cảnh báo: {stationError}</div>
                    <div className="text-sm">
                        Đang dùng danh sách trạm dự phòng (Fallback) để bạn có thể tiếp tục test.
                    </div>
                    <button className="btn-secondary" onClick={loadStations}>
                        Thử tải lại
                    </button>
                </div>
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

                    {subscriptionInfo && (
                        <div className="card p-4">
                            <div className="font-semibold mb-1">Thông tin gói thuê</div>
                            <pre className="bg-gray-50 p-3 rounded text-sm overflow-x-auto">
                                {JSON.stringify(subscriptionInfo, null, 2)}
                            </pre>
                            {requiredBatteryCount > 0 && (
                                <div className="text-sm text-gray-600">
                                    Số pin cần nộp theo gói: <b>{requiredBatteryCount}</b>
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
                                    Gợi ý: hệ thống sẽ gán lần lượt vào các Slot đang <b>Not use</b>.
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
                                    {Array.isArray(swapInError.wrongBatteries) &&
                                        swapInError.wrongBatteries.length > 0 && (
                                            <ul className="list-disc list-inside">
                                                {swapInError.wrongBatteries.map((b, i) => (
                                                    <li key={i}>
                                                        <span className="font-semibold">{b.batteryId}</span>
                                                        {typeof b.slotId !== "undefined" && (
                                                            <span className="opacity-70"> (slot {b.slotId})</span>
                                                        )}
                                                    </li>
                                                ))}
                                            </ul>
                                        )}
                                    <div className="mt-1">
                                        Vui lòng nhập <b>đúng mã pin</b> đã/đang gắn với subscription này.
                                    </div>
                                </div>
                            )}

                            {/* Preview BatteryId -> SlotId */}
                            {batteryIdsInput.trim() && (
                                <div className="bg-gray-50 border rounded-lg p-3 text-sm">
                                    <div className="font-medium mb-2">Xem trước SlotId sẽ gửi lên BE:</div>
                                    <ul className="list-disc list-inside space-y-1">
                                        {(() => {
                                            const ids = batteryIdsInput
                                                .split(/[\n,]/g)
                                                .map((s) => s.trim())
                                                .filter(Boolean);
                                            const freeIds = getFreeSlotIds();
                                            return ids.map((id, idx) => (
                                                <li key={idx}>
                                                    <span className="text-gray-700">{id}</span>
                                                    <span className="text-gray-400"> → </span>
                                                    <span className="font-semibold">
                                                        SlotId = {freeIds[idx] ?? "Hết slot"}
                                                    </span>
                                                </li>
                                            ));
                                        })()}
                                    </ul>
                                    <div className="mt-2 text-gray-500">
                                        (Chỉ dùng các slot có <b>pillarStatus = "Not use"</b>.)
                                    </div>
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
                                        {(autoPicked.length ? autoPicked : outOptions).slice(
                                            0,
                                            requiredBatteryCount > 0 ? requiredBatteryCount : swapInCount || 1
                                        ).map((opt, idx) => (
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
