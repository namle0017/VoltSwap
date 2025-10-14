// src/pages/StationSwap.jsx
import { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import { StationApi } from "../api/stationApi"; // vẫn import; Demo mode sẽ không dùng

export default function StationSwap() {
  const location = useLocation();
  const sp = new URLSearchParams(location.search);

  // === DEMO MODE (không gọi API) ===
  const DEMO = sp.get("demo") === "1" || import.meta.env.VITE_DEMO_MODE === "1";
  const STATION_ID = sp.get("stationId") || "ST001";
  const initialStep = DEMO ? 0 : 1; // 0 = Preview (đọc-only), 1 = login

  const [step, setStep] = useState(initialStep);
  const [station, setStation] = useState(null);
  const [loadingStation, setLoadingStation] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loadingAction, setLoadingAction] = useState(false);

  // Session/User state
  const [user, setUser] = useState(null);            // { id, packageCount }
  const [sessionId, setSessionId] = useState(null);  // "S-xxx" (DEMO sẽ giả lập)

  // Insert state
  const [batteryIdInputs, setBatteryIdInputs] = useState({}); // { [slotId]: "BAT-..." }
  const [pendingSlots, setPendingSlots] = useState(new Set());
  const [insertedDetails, setInsertedDetails] = useState([]); // { slotId, id, soh, soc, cycles }
  const [availableSlots, setAvailableSlots] = useState([]);   // output slots mở khi validate OK

  // (tuỳ chọn) Lịch sử giao dịch
  const [transactions, setTransactions] = useState([]);

  // ===== MOCK cho DEMO MODE =====
  const genMockStation = (id) => ({
    stationId: id,
    name: `Trạm Demo ${id}`,
    location: "—",
    totalSlots: 20,
    slots: Array.from({ length: 20 }, (_, i) => ({
      id: i + 1,
      type: i < 4 ? "INPUT" : "OUTPUT",
      hasBattery: i >= 4 ? Math.random() > 0.2 : false,
      battery:
        i >= 4
          ? {
            id: `PIN-${1000 + i}`,
            soh: Math.floor(Math.random() * 35) + 65, // 65–100
            soc: Math.floor(Math.random() * 70) + 20, // 20–90
            cycles: Math.floor(Math.random() * 500),  // 0–499
          }
          : null,
    })),
  });

  const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

  // ===== Load station =====
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoadingStation(true);
        if (DEMO) {
          // Không gọi API
          const mock = genMockStation(STATION_ID);
          if (mounted) setStation(mock);
        } else {
          const data = await StationApi.getStation(STATION_ID);
          if (mounted) setStation(data);
        }
      } catch (e) {
        console.error("getStation failed:", e?.response || e);
        setError("Không tải được thông tin trạm. Vui lòng thử lại.");
      } finally {
        setLoadingStation(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [DEMO, STATION_ID]);

  const inputSlots = useMemo(
    () => station?.slots?.filter((s) => s.type === "INPUT") || [],
    [station]
  );

  // ===== Handlers =====
  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    const userId = e.target.userId.value?.trim();
    const packageCount = Number(e.target.packageId.value);
    const subscriptionId = e.target.subscriptionId.value?.trim();

    if (!userId || !packageCount || packageCount < 1 || packageCount > 4) {
      setError("Vui lòng nhập User ID và số pin (1–4).");
      return;
    }

    if (DEMO) {
      // Không gọi API – tạo session giả
      setUser({ id: userId, packageCount });
      setSessionId(`DEMO-${Date.now()}`);
      setStep(2);
      return;
    }

    try {
      setLoadingAction(true);
      const res = await StationApi.createSession({
        userId,
        packageCount,
        stationId: STATION_ID,
        subscriptionId,
      });
      setUser(res.user);
      setSessionId(res.sessionId);
      setStep(2);
    } catch (e2) {
      setError(e2?.response?.data?.message || "Đăng nhập/tạo phiên thất bại.");
    } finally {
      setLoadingAction(false);
    }
  };

  const handleConfirmExchange = () => {
    setMessage("");
    setStep(3);
  };

  const handleBatteryIdChange = (slotId, v) => {
    setBatteryIdInputs((prev) => ({ ...prev, [slotId]: v }));
  };

  const handleInsertPin = async (slotId) => {
    if (!user) return;
    if (insertedDetails.length >= user.packageCount) {
      setMessage("⚠️ Bạn đã bỏ đủ pin theo gói");
      return;
    }
    if (pendingSlots.has(slotId)) return;

    const batteryId = (batteryIdInputs[slotId] || "").trim();
    if (!batteryId) {
      setMessage("Vui lòng nhập/scan Battery ID trước khi bỏ pin.");
      return;
    }

    setPendingSlots((prev) => new Set(prev).add(slotId));

    if (DEMO) {
      // Không gọi API – tạo số liệu giả
      const soh = rand(60, 100);
      const soc = rand(10, 90);
      const cycles = rand(0, 800);
      const pin = { id: batteryId, soh, soc, cycles };

      setInsertedDetails((prev) => [...prev, { slotId, ...pin }]);
      setMessage(`📥 Đã bỏ pin ${batteryId} vào slot ${slotId}`);

      setTransactions((prev) => [
        ...prev,
        {
          id: prev.length + 1,
          userId: user.id,
          action: "Insert pin (demo)",
          slotIn: String(slotId),
          slotOut: "-",
          packageCount: user.packageCount,
          status: "success",
          time: new Date().toLocaleString(),
        },
      ]);

      setPendingSlots((prev) => {
        const next = new Set(prev);
        next.delete(slotId);
        return next;
      });
      return;
    }

    try {
      setLoadingAction(true);
      const res = await StationApi.insertPin(sessionId, { slotId, batteryId });
      setInsertedDetails((prev) => [...prev, { slotId, ...res.pin }]);
      setMessage(res.message || `📥 Đã bỏ pin ${batteryId} vào slot ${slotId}`);
    } catch (e2) {
      const msg =
        e2?.response?.data?.message ||
        "Không thể bỏ pin vào khoang (slot không hợp lệ/subscription mismatch).";
      setError(msg);
      setMessage(msg);
    } finally {
      setLoadingAction(false);
      setPendingSlots((prev) => {
        const next = new Set(prev);
        next.delete(slotId);
        return next;
      });
    }
  };

  const handleValidatePins = async () => {
    if (!user) return;
    if (insertedDetails.length < user.packageCount) {
      setMessage("Bạn chưa bỏ đủ số pin theo gói.");
      return;
    }
    setError("");
    setMessage("🔄 Đang kiểm tra pin...");

    if (DEMO) {
      // Không gọi API – validate local: soh >= 65 && cycles <= 800
      const failed = insertedDetails.filter(
        (p) => p.soh < 65 || p.cycles > 800
      );
      if (failed.length) {
        setMessage(
          `❌ Pin ${failed[0].id} không đạt tiêu chuẩn (SoH>=65, Cycles<=800).`
        );
        setStep(3);
        return;
      }
      // Mở ngẫu nhiên các OUTPUT slot = packageCount
      const outputs =
        station?.slots?.filter((s) => s.type === "OUTPUT") || [];
      const pick = [...outputs]
        .sort(() => 0.5 - Math.random())
        .slice(0, user.packageCount)
        .map((s) => s.id);
      setAvailableSlots(pick);
      setMessage(`✅ Pin hợp lệ! Đang mở khoang ${pick.join(", ")}`);
      setStep(5);
      return;
    }

    try {
      setLoadingAction(true);
      const key = crypto.randomUUID?.() || String(Date.now());
      const res = await StationApi.validate(sessionId, key);
      if (!res.success) {
        setMessage(res.message || "❌ Kiểm tra pin thất bại");
        setStep(3);
      } else {
        setAvailableSlots(res.outputSlots || []);
        setMessage(
          res.message || `✅ Pin hợp lệ! Đang mở khoang ${res.outputSlots?.join(", ")}`
        );
        setStep(5);
      }
    } catch (e2) {
      const msg = e2?.response?.data?.message || "Kiểm tra pin thất bại.";
      setError(msg);
      setMessage(msg);
      setStep(3);
    } finally {
      setLoadingAction(false);
    }
  };

  const handleFinish = async () => {
    if (!user) return;

    if (DEMO) {
      setMessage("🎉 Giao dịch thành công (demo). Vui lòng lấy pin.");
      setStep(6);
      return;
    }

    try {
      setLoadingAction(true);
      const key = crypto.randomUUID?.() || String(Date.now());
      const res = await StationApi.finish(sessionId, key);
      setMessage(res.message || "🎉 Giao dịch thành công, vui lòng lấy pin");
      setStep(6);
    } catch (e2) {
      const msg =
        e2?.response?.data?.message || "Hoàn tất giao dịch thất bại.";
      setError(msg);
      setMessage(msg);
    } finally {
      setLoadingAction(false);
    }
  };

  // ===== UI =====
  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold text-center">
        {DEMO ? "🔋 Xem & thao tác DEMO (không gọi API)" : "🔋 Mô phỏng đổi pin EV (API thật)"}
      </h1>

      {error && (
        <div className="p-3 rounded border border-red-200 bg-red-50 text-red-700">
          {error}
        </div>
      )}

      {loadingStation && (
        <div className="text-center text-gray-600">Đang tải thông tin trạm...</div>
      )}

      {/* Station card */}
      {station && (
        <div className="rounded-xl border bg-white p-4 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <div className="font-semibold text-gray-900">{station.name}</div>
              <div className="text-sm text-gray-600">
                {station.location} • {station.totalSlots} slots
              </div>
            </div>
            <div className="text-xs text-gray-500">ID: {station.stationId}</div>
          </div>
        </div>
      )}

      {/* STEP 0: Preview (DEMO) */}
      {step === 0 && station && DEMO && (
        <div className="space-y-4">
          <div className="rounded-xl border bg-white p-6 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Sơ đồ khoang trạm</h2>
              <div className="text-xs text-gray-500">Demo • không gọi API</div>
            </div>
            <div className="flex items-center gap-3 text-sm mb-4">
              <span className="inline-flex items-center gap-1">
                <span className="w-3 h-3 rounded bg-yellow-200 inline-block" /> INPUT
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="w-3 h-3 rounded bg-gray-200 inline-block" /> OUTPUT
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="w-3 h-3 rounded bg-green-300 inline-block" /> OUTPUT có pin
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              {station.slots.map((slot) => (
                <div
                  key={slot.id}
                  className={`p-3 border rounded-lg ${slot.type === "INPUT"
                      ? "bg-yellow-200"
                      : slot.hasBattery
                        ? "bg-green-300"
                        : "bg-gray-200"
                    }`}
                >
                  <div className="text-sm font-medium">
                    Slot {slot.id}{" "}
                    <span className="text-xs text-gray-700">({slot.type})</span>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 text-center">
              <button
                onClick={() => setStep(1)}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              >
                Bắt đầu đổi pin (demo)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STEP 1: Login  */}
      {step === 1 && (
        <form
          onSubmit={handleLogin}
          className="space-y-4 rounded-xl border bg-white p-6 shadow-sm"
        >
          <h2 className="text-lg font-semibold">
            {DEMO ? "Đăng nhập (demo, không cần subscriptionId)" : "Đăng nhập / Tạo session"}
          </h2>
          <div className="grid md:grid-cols-3 gap-3">
            <input name="userId" placeholder="User ID" className="w-full px-3 py-2 border rounded" />
            <input name="packageId" placeholder="Số pin trong gói (1-4)" type="number" min="1" max="4" className="w-full px-3 py-2 border rounded" />
            {!DEMO && (
              <input name="subscriptionId" placeholder="Subscription ID" className="w-full px-3 py-2 border rounded" />
            )}
          </div>
          <button type="submit" disabled={loadingAction} className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:opacity-60">
            {loadingAction ? "Đang xử lý..." : (DEMO ? "Vào demo" : "Đăng nhập & tạo phiên")}
          </button>
        </form>
      )}

      {/* STEP 2: Confirm */}
      {step === 2 && user && (
        <div className="rounded-xl border bg-white p-6 shadow-sm space-y-4 text-center">
          <p>Xin chào <b>{user.id}</b>, gói thuê: <b>{user.packageCount} pin</b></p>
          <button onClick={handleConfirmExchange} className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">
            Xác nhận đổi pin
          </button>
        </div>
      )}

      {/* STEP 3: Insert pins */}
      {step === 3 && station && user && (
        <div className="space-y-4">
          <div className="rounded-xl border bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold mb-3">
              📥 Hãy bỏ {user.packageCount} pin vào các slot INPUT
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              {station.slots.map((slot) => {
                const isInput = slot.type === "INPUT";
                const isPending = pendingSlots.has(slot.id);
                return (
                  <div key={slot.id} className={`p-3 border rounded-lg ${isInput ? "bg-yellow-50" : "bg-gray-50"}`}>
                    <div className="text-sm font-medium mb-2">
                      Slot {slot.id}{" "}
                      <span className={`ml-1 text-xs ${isInput ? "text-yellow-700" : "text-gray-500"}`}>
                        ({isInput ? "INPUT" : "OUTPUT"})
                      </span>
                    </div>

                    {isInput ? (
                      <>
                        <input
                          placeholder="Nhập/Quét Battery ID…"
                          value={batteryIdInputs[slot.id] || ""}
                          onChange={(e) => handleBatteryIdChange(slot.id, e.target.value)}
                          className="w-full mb-2 px-2 py-1 border rounded"
                        />
                        <button
                          disabled={loadingAction || isPending}
                          onClick={() => handleInsertPin(slot.id)}
                          className="w-full bg-yellow-400 hover:bg-yellow-500 text-black py-2 rounded disabled:opacity-60"
                        >
                          {isPending ? "Đang gửi..." : "Bỏ pin vào slot này"}
                        </button>
                      </>
                    ) : (
                      <div className="text-xs text-gray-500">
                        OUTPUT • {slot.hasBattery ? "Có pin" : "Trống"}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Bảng pin đã nhập */}
            {insertedDetails.length > 0 && (
              <div className="mt-4 rounded-xl border bg-white p-4 shadow-sm">
                <h3 className="font-semibold mb-2">Pin đã nhập</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-gray-600">
                        <th className="py-2">Slot</th>
                        <th className="py-2">Battery ID</th>
                        <th className="py-2">SoH</th>
                        <th className="py-2">SoC</th>
                        <th className="py-2">Cycles</th>
                      </tr>
                    </thead>
                    <tbody>
                      {insertedDetails.map((p) => (
                        <tr key={`${p.slotId}-${p.id}`}>
                          <td className="py-1">{p.slotId}</td>
                          <td className="py-1">{p.id}</td>
                          <td className="py-1">{p.soh}%</td>
                          <td className="py-1">{p.soc}%</td>
                          <td className="py-1">{p.cycles}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <div className="mt-4 text-center text-sm">{message}</div>

            {/* Nút Validate */}
            <div className="text-center mt-2">
              <button
                onClick={handleValidatePins}
                disabled={loadingAction || !user || insertedDetails.length < user.packageCount}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-60"
              >
                {loadingAction ? "Đang kiểm tra..." : "Kiểm tra pin"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STEP 5: Output slots mở */}
      {step === 5 && station && (
        <div className="rounded-xl border bg-white p-6 shadow-sm space-y-4 text-center">
          <p className="font-medium">{message}</p>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {station.slots.map((slot) => (
              <div
                key={slot.id}
                className={`p-3 border rounded-lg ${availableSlots.includes(slot.id) ? "bg-green-400 animate-pulse" : "bg-gray-100"
                  }`}
              >
                Slot {slot.id}
              </div>
            ))}
          </div>
          <button
            onClick={handleFinish}
            disabled={loadingAction}
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-60"
          >
            {loadingAction ? "Đang xác nhận..." : "Tôi đã lấy pin"}
          </button>
        </div>
      )}

      {/* STEP 6: Done */}
      {step === 6 && (
        <div className="rounded-xl border bg-white p-6 shadow-sm text-center">
          <p>{message}</p>
        </div>
      )}

      {/* Lịch sử (ẩn trong demo để gọn) */}
      {!DEMO && (
        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold mb-3">📜 Lịch sử giao dịch</h2>
          {!transactions?.length ? (
            <p className="text-gray-500">Chưa có giao dịch nào</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border text-sm">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border px-2 py-1">ID</th>
                    <th className="border px-2 py-1">User</th>
                    <th className="border px-2 py-1">Action</th>
                    <th className="border px-2 py-1">Slot In</th>
                    <th className="border px-2 py-1">Slot Out</th>
                    <th className="border px-2 py-1">Gói</th>
                    <th className="border px-2 py-1">Trạng thái</th>
                    <th className="border px-2 py-1">Thời gian</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((tx) => (
                    <tr key={tx.id} className="text-center">
                      <td className="border px-2 py-1">{tx.id}</td>
                      <td className="border px-2 py-1">{tx.userId}</td>
                      <td className="border px-2 py-1">{tx.action}</td>
                      <td className="border px-2 py-1">{tx.slotIn}</td>
                      <td className="border px-2 py-1">{tx.slotOut ?? "-"}</td>
                      <td className="border px-2 py-1">{tx.packageCount}</td>
                      <td className={`border px-2 py-1 ${tx.status === "success" ? "text-green-600" : "text-red-600"}`}>
                        {tx.status}
                      </td>
                      <td className="border px-2 py-1">{tx.time}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
