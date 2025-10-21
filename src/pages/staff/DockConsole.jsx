// src/pages/DockConsole.jsx
import React, { useState } from "react";
import { staffAddNewBattery } from "@/api/batterySwapApi";

export default function DockConsole() {
    // Ẩn nhưng gửi lên BE
    const [stationId] = useState("STA-10-06-5678");
    const [staffId] = useState("ST-2000000");

    // Form input
    const [slotIdIn, setSlotIdIn] = useState("80");
    const [batteryIdIn, setBatteryIdIn] = useState("BAT-1234-ABCD");

    const [busy, setBusy] = useState(false);
    const [msg, setMsg] = useState("");

    const toast = (t, isErr = false) => {
        setMsg(t ? (isErr ? `❌ ${t}` : `✅ ${t}`) : "");
        if (t) setTimeout(() => setMsg(""), 2500);
    };

    async function onDock() {
        if (!slotIdIn.trim() || !batteryIdIn.trim()) {
            toast("Vui lòng nhập SlotId và BatteryId", true);
            return;
        }
        setBusy(true);
        try {
            const data = await staffAddNewBattery({
                slotId: slotIdIn,
                batteryId: batteryIdIn,
                stationId,
                staffId,
            });
            toast(data?.message || `Đã gửi yêu cầu dock: ${batteryIdIn} → slot ${slotIdIn}`);
        } catch (e) {
            console.error(e);
            // Hiện nguyên văn lỗi BE trả
            toast(e.message || "Dock failed", true);
        } finally {
            setBusy(false);
        }
    }

    function onReset() {
        setSlotIdIn("80")
        setBatteryIdIn("BAT-1234-ABCD");
        toast("Đã reset");
    }

    return (
        <section>
            <h2 className="h1" style={{ marginTop: 0 }}>Dock Console</h2>
            <p className="muted">Gửi đúng 4 tham số: <b>slotId, batteryId, stationId, staffId</b> (GET).</p>

            <div className="grid" style={{ gridTemplateColumns: "1fr 1fr", gap: 24 }}>
                <div className="card">
                    <h3 style={{ marginTop: 0 }}>Nhập (dock)</h3>
                    <div className="grid" style={{ gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                        <label>
                            Slot Id
                            <input className="input" value={slotIdIn} onChange={(e) => setSlotIdIn(e.target.value)} />
                        </label>
                        <label>
                            Battery Id
                            <input className="input" value={batteryIdIn} onChange={(e) => setBatteryIdIn(e.target.value)} />
                        </label>
                    </div>

                    <div className="mt-3" style={{ display: "flex", gap: 8 }}>
                        <button className="btn btn-primary" onClick={onDock} disabled={busy}>
                            {busy ? "Processing…" : "Dock (Gửi GET)"}
                        </button>
                        <button className="btn" onClick={onReset} disabled={busy}>Reset</button>
                    </div>

                    {!!msg && <div className="mt-3" style={{ fontWeight: 600 }}>{msg}</div>}
                    <div className="small muted mt-2">
                        * Station/Staff gửi ngầm: <b>{stationId}</b> • <b>{staffId}</b>
                    </div>
                </div>

                <div className="card">
                    <h3 style={{ marginTop: 0 }}>Ghi chú</h3>
                    <div className="small muted">
                        Không load slots khi vào trang. Chỉ gửi request dock sang BE bằng GET.<br />
                        Nếu BE cần tên key khác (ví dụ <code>SlotId/BatteryInId/StataionId/staffId</code>),
                        hàm API đã tự thử các biến thể đó. Nếu vẫn lỗi, lỗi BE sẽ hiện ra nguyên văn.
                    </div>
                </div>
            </div>
        </section>
    );
}
