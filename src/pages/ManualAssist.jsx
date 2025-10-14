import React, { useMemo, useState } from "react";
import { manualAssist } from "../api/batterySwapApi";

export default function ManualAssist() {
    const [stationId] = useState("st-01");
    const [staffId] = useState("staff-001");

    const [subscriptionId, setSubscriptionId] = useState("sub-001");
    const [errorType, setErrorType] = useState(""); // '' | 'pinIn' | 'pinOut'
    const [inBatteryId, setInBatteryId] = useState("bat-err-001");
    const [outBatteryId, setOutBatteryId] = useState("bat-new-9001");

    const [submitting, setSubmitting] = useState(false);
    const [resp, setResp] = useState(null);
    const [err, setErr] = useState("");

    const wizardReady = useMemo(
        () => subscriptionId.trim() && (errorType === "pinIn" || errorType === "pinOut"),
        [subscriptionId, errorType]
    );

    const canConfirm = useMemo(() => {
        if (!wizardReady) return false;
        if (!outBatteryId.trim()) return false;
        if (errorType === "pinIn" && !inBatteryId.trim()) return false;
        return true;
    }, [wizardReady, outBatteryId, inBatteryId, errorType]);

    async function onConfirm() {
        if (!canConfirm) return;
        setSubmitting(true);
        setErr("");
        setResp(null);

        try {
            const data = await manualAssist({
                stationId,
                staffId,
                subscriptionId,      // ✅ gửi key subscriptionId cho batterySwapApi
                errorType,            // "pinIn" | "pinOut"
                inBatteryId,          // dùng khi pinIn
                outBatteryId,         // id pin xuất
            });
            setResp(data);
        } catch (e) {
            console.error(e);
            setErr(e.message || "Manual Assist failed");
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <section>
            <h2 className="h1" style={{ marginTop: 0 }}>Manual Assist</h2>

            {/* Wizard */}
            <div className="card" style={{ marginTop: 12 }}>
                <h3 style={{ marginTop: 0 }}>Chọn loại xử lý</h3>
                <div style={grid2}>
                    <label>
                        Subscription Id
                        <input
                            className="input"
                            value={subscriptionId}
                            onChange={(e) => setSubscriptionId(e.target.value)}
                            placeholder="sub-001"
                        />
                    </label>
                    <div>
                        <div className="small muted" style={{ marginBottom: 6 }}>
                            * Station/Staff gửi ngầm: <b>{stationId}</b> • <b>{staffId}</b>
                        </div>
                        <div style={{ display: "flex", gap: 16 }}>
                            <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                <input
                                    type="radio"
                                    name="errType"
                                    value="pinIn"
                                    checked={errorType === "pinIn"}
                                    onChange={() => setErrorType("pinIn")}
                                />
                                Pin In (pin KH đưa vào bị lỗi)
                            </label>
                            <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                <input
                                    type="radio"
                                    name="errType"
                                    value="pinOut"
                                    checked={errorType === "pinOut"}
                                    onChange={() => setErrorType("pinOut")}
                                />
                                Pin Out (máy không nhả pin)
                            </label>
                        </div>
                    </div>
                </div>
            </div>

            {!wizardReady ? null : (
                <>
                    {errorType === "pinIn" && (
                        <div style={grid2}>
                            <div className="card">
                                <h3 style={{ marginTop: 0 }}>Nhận pin khách (Pin In)</h3>
                                <label>
                                    Battery Id (pin KH)
                                    <input
                                        className="input"
                                        value={inBatteryId}
                                        onChange={(e) => setInBatteryId(e.target.value)}
                                        placeholder="bat-err-001"
                                    />
                                </label>
                            </div>

                            <div className="card">
                                <h3 style={{ marginTop: 0 }}>Xuất pin cho khách</h3>
                                <label>
                                    Out Battery ID
                                    <input
                                        className="input"
                                        value={outBatteryId}
                                        onChange={(e) => setOutBatteryId(e.target.value)}
                                        placeholder="bat-new-9001"
                                    />
                                </label>
                            </div>
                        </div>
                    )}

                    {errorType === "pinOut" && (
                        <div className="card" style={{ marginTop: 16 }}>
                            <h3 style={{ marginTop: 0 }}>Xuất pin cho khách</h3>
                            <label>
                                Out Battery ID
                                <input
                                    className="input"
                                    value={outBatteryId}
                                    onChange={(e) => setOutBatteryId(e.target.value)}
                                    placeholder="bat-new-9001"
                                />
                            </label>
                        </div>
                    )}

                    <div style={{ marginTop: 12 }}>
                        <button className="btn btn-primary" onClick={onConfirm} disabled={!canConfirm || submitting}>
                            {submitting ? "Processing…" : "Xác nhận & gửi Manual Assist"}
                        </button>
                    </div>

                    {err && (
                        <div className="card mt-3" style={{ borderColor: "#ef4444", background: "#fef2f2" }}>
                            <div style={{ color: "#dc2626", fontWeight: 700, whiteSpace: "pre-wrap" }}>
                                ❌ {err}
                            </div>
                        </div>
                    )}

                    {resp && (
                        <div className="card mt-3">
                            <div style={{ fontWeight: 700, marginBottom: 6 }}>✅ BE trả về</div>
                            <pre style={pre}>{JSON.stringify(resp, null, 2)}</pre>
                        </div>
                    )}
                </>
            )}
        </section>
    );
}

const grid2 = { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 };
const pre = { background: "#0f172a", color: "#e5e7eb", padding: 12, borderRadius: 8, overflowX: "auto" };
