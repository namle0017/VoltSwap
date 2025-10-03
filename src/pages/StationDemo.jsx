import { useState, useEffect } from "react";

// Fake data generator
const generateSlots = () =>
  Array.from({ length: 20 }, (_, i) => ({
    id: i + 1,
    type: i < 4 ? "INPUT" : "OUTPUT", // 4 slot đầu để người dùng bỏ pin vào
    status: i < 4 ? "empty" : "occupied",
    pinId: i < 4 ? null : `PIN-${1000 + i}`,
    health: i < 4 ? null : Math.floor(Math.random() * 40) + 60,
    estimatedTime: i < 4 ? null : `${10 + Math.floor(Math.random() * 30)} phút`,
  }));

const StationDemo = () => {
  const [step, setStep] = useState(1);
  const [user, setUser] = useState(null);
  const [slots, setSlots] = useState([]);
  const [insertedPins, setInsertedPins] = useState([]);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [message, setMessage] = useState("");
  const [transactions, setTransactions] = useState([]);

  useEffect(() => {
    setSlots(generateSlots());
  }, []);

  // Login
  const handleLogin = (e) => {
    e.preventDefault();
    const userId = e.target.userId.value;
    const packageId = Number(e.target.packageId.value);
    if (userId && packageId) {
      setUser({ id: userId, packageId });
      setStep(2);
    }
  };

  // Confirm
  const handleConfirmExchange = () => {
    setStep(3);
  };

  // Insert pin vào slot INPUT
  const handleInsertPin = (slotId) => {
    if (insertedPins.length >= user.packageId) {
      setMessage("⚠️ Bạn đã bỏ đủ pin theo gói");
      return;
    }
    const newPin = {
      id: `USER-PIN-${slotId}-${Date.now()}`,
      soh: Math.floor(Math.random() * 35) + 65,
      cycles: Math.floor(Math.random() * 500),
    };
    setInsertedPins((prev) => [...prev, newPin]);
    setMessage(`📥 Pin đã được bỏ vào slot ${slotId}`);

    setTransactions((prev) => [
      ...prev,
      {
        id: prev.length + 1,
        user: user.id,
        action: "Bỏ pin vào khoang",
        slotIn: slotId,
        slotOut: null,
        package: user.packageId,
        status: "in-progress",
        time: new Date().toLocaleString(),
      },
    ]);
  };

  // Validate pins
  const handleValidatePins = () => {
    setStep(4);
    setMessage("🔄 Đang kiểm tra pin...");

    setTimeout(() => {
      const success = Math.random() > 0.2; // 80% thành công
      if (!success) {
        setMessage("❌ Kiểm tra pin thất bại, vui lòng thử lại!");
        setInsertedPins([]);
        setStep(3);

        setTransactions((prev) => [
          ...prev,
          {
            id: prev.length + 1,
            user: user.id,
            action: "Đổi pin thất bại",
            slotIn: insertedPins.map((p) => p.id).join(", "),
            slotOut: null,
            package: user.packageId,
            status: "failed",
            time: new Date().toLocaleString(),
          },
        ]);
        return;
      }

      // Thành công → mở slot OUTPUT
      const outputs = slots.filter(
        (s) => s.type === "OUTPUT" && s.status === "occupied"
      );
      const openSlots = outputs.slice(0, user.packageId);
      setAvailableSlots(openSlots);

      setMessage(
        `✅ Pin hợp lệ! Đang mở khoang ${openSlots.map((s) => s.id).join(", ")}`
      );
      setStep(5);

      setTransactions((prev) => [
        ...prev,
        {
          id: prev.length + 1,
          user: user.id,
          action: "Đổi pin thành công",
          slotIn: insertedPins.map((p) => p.id).join(", "),
          slotOut: openSlots.map((s) => s.id).join(", "),
          package: user.packageId,
          status: "success",
          time: new Date().toLocaleString(),
        },
      ]);
    }, 1500);
  };

  const handleFinish = () => {
    setMessage("🎉 Giao dịch thành công, vui lòng lấy pin");
    setStep(6);
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-center">
        🔋 Mô phỏng trạm đổi pin EV
      </h1>

      {/* Step 1: Login */}
      {step === 1 && (
        <form
          onSubmit={handleLogin}
          className="space-y-4 bg-gray-100 p-6 rounded-xl"
        >
          <h2 className="text-xl font-semibold">Đăng nhập</h2>
          <input
            name="userId"
            placeholder="Nhập ID"
            className="w-full p-2 border rounded"
          />
          <input
            name="packageId"
            placeholder="Số pin trong gói (1-4)"
            type="number"
            min="1"
            max="4"
            className="w-full p-2 border rounded"
          />
          <button
            type="submit"
            className="w-full bg-blue-500 text-white p-2 rounded"
          >
            Đăng nhập
          </button>
        </form>
      )}

      {/* Step 2: Confirm */}
      {step === 2 && (
        <div className="text-center space-y-4">
          <p>
            Xin chào <b>{user.id}</b>, gói thuê: <b>{user.packageId} pin</b>
          </p>
          <button
            onClick={handleConfirmExchange}
            className="bg-green-500 text-white px-4 py-2 rounded"
          >
            Xác nhận đổi pin
          </button>
        </div>
      )}

      {/* Step 3: Insert */}
      {step === 3 && (
        <div>
          <h2 className="text-lg font-semibold mb-4">
            📥 Hãy bỏ {user.packageId} pin vào 4 slot INPUT
          </h2>
          <div className="grid grid-cols-5 gap-3">
            {slots.map((slot) => (
              <button
                key={slot.id}
                disabled={slot.type !== "INPUT"}
                onClick={() => handleInsertPin(slot.id)}
                className={`p-4 rounded-lg border ${
                  slot.type === "INPUT"
                    ? "bg-yellow-200 hover:bg-yellow-300"
                    : "bg-gray-300"
                }`}
              >
                Slot {slot.id} {slot.type === "INPUT" ? "(INPUT)" : ""}
              </button>
            ))}
          </div>

          <div className="mt-4 text-center">
            <p>{message}</p>
            {insertedPins.length === user.packageId && (
              <button
                onClick={handleValidatePins}
                className="mt-4 bg-blue-500 text-white px-4 py-2 rounded"
              >
                Kiểm tra pin
              </button>
            )}
          </div>
        </div>
      )}

      {/* Step 4: Validation */}
      {step === 4 && (
        <div className="text-center">
          <p>{message}</p>
        </div>
      )}

      {/* Step 5: Output */}
      {step === 5 && (
        <div className="text-center space-y-4">
          <p>{message}</p>
          <div className="grid grid-cols-5 gap-3">
            {slots.map((slot) => (
              <div
                key={slot.id}
                className={`p-4 rounded-lg border ${
                  availableSlots.find((s) => s.id === slot.id)
                    ? "bg-green-400 animate-pulse"
                    : "bg-gray-200"
                }`}
              >
                Slot {slot.id}
              </div>
            ))}
          </div>
          <button
            onClick={handleFinish}
            className="mt-4 bg-green-600 text-white px-4 py-2 rounded"
          >
            Tôi đã lấy pin
          </button>
        </div>
      )}

      {/* Step 6: Success */}
      {step === 6 && (
        <div className="text-center">
          <p>{message}</p>
        </div>
      )}

      {/* Transaction History */}
      <div className="p-4 bg-gray-50 rounded-lg shadow">
        <h2 className="text-xl font-bold mb-3">📜 Lịch sử giao dịch</h2>
        {transactions.length === 0 ? (
          <p className="text-gray-500">Chưa có giao dịch nào</p>
        ) : (
          <table className="w-full border text-sm">
            <thead>
              <tr className="bg-gray-200">
                <th className="border px-2 py-1">ID</th>
                <th className="border px-2 py-1">Người dùng</th>
                <th className="border px-2 py-1">Hành động</th>
                <th className="border px-2 py-1">Ô vào</th>
                <th className="border px-2 py-1">Ô ra</th>
                <th className="border px-2 py-1">Gói</th>
                <th className="border px-2 py-1">Trạng thái</th>
                <th className="border px-2 py-1">Thời gian</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((tx) => (
                <tr key={tx.id} className="text-center">
                  <td className="border px-2 py-1">{tx.id}</td>
                  <td className="border px-2 py-1">{tx.user}</td>
                  <td className="border px-2 py-1">{tx.action}</td>
                  <td className="border px-2 py-1">{tx.slotIn}</td>
                  <td className="border px-2 py-1">{tx.slotOut ?? "-"}</td>
                  <td className="border px-2 py-1">{tx.package}</td>
                  <td
                    className={`border px-2 py-1 ${
                      tx.status === "success"
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  >
                    {tx.status}
                  </td>
                  <td className="border px-2 py-1">{tx.time}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default StationDemo;
