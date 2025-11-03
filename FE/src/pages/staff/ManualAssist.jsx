// src/pages/staff/ManualAssist.jsx
import React, { useMemo, useState } from "react";
import api from "@/api/api"; // axios instance

export default function ManualAssist() {
    // 👤 StaffId lấy từ localStorage (không hard-code)
    const [staffId] = useState(
        localStorage.getItem("StaffId") ||
        localStorage.getItem("userId") ||
        ""
    );

    // ====== Step 1: Check subscription ======
    const [subscriptionId, setSubscriptionId] = useState(""); // subId nhập tay
    const [checkingSub, setCheckingSub] = useState(false);
    const [checkErr, setCheckErr] = useState("");
    const [validated, setValidated] = useState(false);

    // dữ liệu phụ: stationId trả về khi check
    const [stationId, setStationId] = useState("");

    // danh sách pin BE trả về sau khi check subscription
    // => đây là các pin mà khách đã/đang giữ (Pin In)
    const [subBatteries, setSubBatteries] = useState([]);

    // có pin KH hay không (để disable Pin In nếu không có)
    const hasCustomerBatteries = subBatteries.length > 0;

    // ====== Step 2 & 3 shared state ======
    const [errorType, setErrorType] = useState(""); // '' | 'pinIn' | 'pinOut'
    const [inBatteryId, setInBatteryId] = useState("");  // Customer Battery ID (pin khách trả vào)
    const [outBatteryId, setOutBatteryId] = useState(""); // Out Battery ID (pin mình đưa cho khách)

    const [submitting, setSubmitting] = useState(false);
    const [resp, setResp] = useState(null);
    const [err, setErr] = useState("");

    async function checkSubscription() {
        if (!subscriptionId.trim() || !staffId.trim()) {
            setCheckErr("Missing subscriptionId or staffId.");
            return;
        }

        setCheckingSub(true);
        setCheckErr("");
        setValidated(false);
        setSubBatteries([]);
        setStationId("");
        setInBatteryId("");
        setOutBatteryId("");
        setErrorType("");

        try {
            // ✅ BE yêu cầu GET — params: StaffId + SubscriptionId
            const res = await api.get("/Subscription/staff-get-battery", {
                params: {
                    StaffId: staffId,
                    SubscriptionId: subscriptionId,
                },
            });

            // ---- Chuẩn hoá theo JSON mới của BE ----
            // {
            //   message: "...",
            //   data: {
            //     stationId: "STA-21-05-1234",
            //     subscriptionId: "SUB-49094107",
            //     batteries: { result: [ {batteryId:"BT-..."} , ... ] }
            //   }
            // }
            const rawBlock =
                res?.data?.data?.batteries?.result ??
                res?.data?.data?.batteries ??
                res?.data?.data ??
                res?.data ??
                [];

            const arr = Array.isArray(rawBlock) ? rawBlock : [];
            const ids = arr
                .map((x) =>
                    typeof x === "string"
                        ? x
                        : x?.batteryId || x?.id || x?.batteryID || ""
                )
                .filter(Boolean);

            const uniqueIds = Array.from(new Set(ids));
            setSubBatteries(uniqueIds);

            // Lưu stationId để show
            setStationId(res?.data?.data?.stationId || "");

            // Nếu có pin từ khách -> default Pin In, và autofill Customer Battery ID
            // Nếu không có pin -> default Pin Out
            if (uniqueIds.length > 0) {
                setErrorType("pinIn");
                setInBatteryId(uniqueIds[0]); // <-- autofill Customer Battery ID
            } else {
                setErrorType("pinOut");
            }

            setValidated(true);
        } catch (e) {
            console.error(e);
            setCheckErr(
                e?.response?.data?.message ||
                e.message ||
                "Subscription check failed"
            );
            setValidated(false);
        } finally {
            setCheckingSub(false);
        }
    }

    // ====== Điều kiện enable nút Confirm ======
    const canConfirm = useMemo(() => {
        if (!validated) return false;
        if (!(errorType === "pinIn" || errorType === "pinOut")) return false;
        if (!subscriptionId.trim()) return false;

        if (errorType === "pinIn") {
            // Pin In: cần Customer Battery ID + Out Battery ID
            if (!hasCustomerBatteries) return false; // safety: không cho pinIn nếu BE không có data
            if (!inBatteryId.trim()) return false;
            if (!outBatteryId.trim()) return false;
        } else if (errorType === "pinOut") {
            // Pin Out: chỉ cần Out Battery ID
            if (!outBatteryId.trim()) return false;
        }

        return true;
    }, [
        validated,
        errorType,
        subscriptionId,
        hasCustomerBatteries,
        inBatteryId,
        outBatteryId,
    ]);

    async function onConfirm() {
        if (!canConfirm) return;

        setSubmitting(true);
        setErr("");
        setResp(null);

        try {
            const payload = {
                staffId,
                subId: subscriptionId,
                batteryOutId: outBatteryId || null, // pin mình đưa khách
                batteryInId:
                    errorType === "pinIn"
                        ? inBatteryId || null // pin khách trả vào
                        : null,
            };

            // POST hỗ trợ thủ công
            const res = await api.post(
                "/BatterySwap/staff-help-customer",
                payload
            );
            setResp(res.data);
        } catch (e) {
            console.error(e);
            setErr(
                e?.response?.data?.message ||
                e.message ||
                "Manual Assist failed"
            );
        } finally {
            setSubmitting(false);
        }
    }

    /* ================== Warehouse picker ================== */
    // modal chọn pin trong kho -> chỉ gửi staffId để lấy pin warehouse
    const [openPicker, setOpenPicker] = useState(false);
    const [pickLoading, setPickLoading] = useState(false);
    const [pickErr, setPickErr] = useState("");
    const [batteries, setBatteries] = useState([]);
    const [minSoc, setMinSoc] = useState(0); // lọc SOC tối thiểu

    const loadWarehouse = async () => {
        setPickLoading(true);
        setPickErr("");
        try {
            if (!staffId.trim()) {
                setPickErr("Please provide staffId.");
                setBatteries([]);
                return;
            }
            const res = await api.get("/Station/station-inventory", {
                params: { staffId },
            });

            const list = Array.isArray(res.data)
                ? res.data
                : res.data?.data || [];

            const mapped = list.map((it) => ({
                id: it.batteryId || it.id || "",
                soh: clamp01(it.soh),
                soc: clamp01(it.soc),
                capacityKWh: Number(
                    it.capacity ?? it.capacityKWh ?? 0
                ),
                status: it.status || "Warehouse",
            }));
            setBatteries(mapped);
        } catch (e) {
            console.error(e);
            setPickErr(
                e?.response?.data?.message ||
                e.message ||
                "Failed to load battery warehouse."
            );
            setBatteries([]);
        } finally {
            setPickLoading(false);
        }
    };

    // lọc pin status 'warehouse' + SOC >= minSoc
    const filteredBatteries = useMemo(
        () =>
            batteries
                .filter((b) => isWarehouse(b.status))
                .filter(
                    (b) =>
                        Number.isFinite(b.soc) && b.soc >= minSoc
                )
                .sort(
                    (a, b) => (b.soc ?? 0) - (a.soc ?? 0)
                ),
        [batteries, minSoc]
    );

    return (
        <section>
            <h2 className="h1" style={{ marginTop: 0 }}>
                Manual Assist
            </h2>

            {/* ===== STEP 1: CHECK SUBSCRIPTION ===== */}
            <div
                className="card"
                style={{ marginTop: 12 }}
            >
                <h3 style={{ marginTop: 0 }}>
                    Step 1. Check Subscription
                </h3>

                <div style={grid2}>
                    <label>
                        Subscription ID
                        <input
                            className="input"
                            value={subscriptionId}
                            onChange={(e) =>
                                setSubscriptionId(
                                    e.target.value
                                )
                            }
                            placeholder="e.g. SUB-12345678"
                        />
                    </label>

                    <div>
                        <div
                            className="small muted"
                            style={{
                                marginBottom: 6,
                            }}
                        >
                            * Hidden param: Staff{" "}
                            <b>{staffId || "—"}</b>
                        </div>

                        <button
                            className="btn btn-primary"
                            type="button"
                            disabled={
                                checkingSub ||
                                !subscriptionId.trim() ||
                                !staffId.trim()
                            }
                            onClick={checkSubscription}
                        >
                            {checkingSub
                                ? "Checking…"
                                : "Check subscription"}
                        </button>

                        {checkErr && (
                            <div
                                style={{
                                    color: "#dc2626",
                                    fontWeight: 600,
                                    marginTop: 8,
                                    whiteSpace:
                                        "pre-wrap",
                                    fontSize: 12,
                                }}
                            >
                                ❌ {checkErr}
                            </div>
                        )}

                        {validated && !checkErr && (
                            <div
                                style={{
                                    color: "#059669",
                                    fontWeight: 600,
                                    marginTop: 8,
                                    fontSize: 12,
                                }}
                            >
                                ✅ Subscription OK{" "}
                                {stationId
                                    ? `• Station: ${stationId}`
                                    : ""}
                            </div>
                        )}
                    </div>
                </div>

                {validated &&
                    subBatteries.length > 0 && (
                        <div
                            style={{
                                marginTop: 12,
                            }}
                        >
                            <div
                                className="small muted"
                                style={{
                                    marginBottom: 4,
                                }}
                            >
                                Suggested Battery IDs
                                (click to fill
                                "Customer Battery ID"):
                            </div>

                            <div
                                style={{
                                    display:
                                        "flex",
                                    flexWrap:
                                        "wrap",
                                    gap: 8,
                                }}
                            >
                                {subBatteries.map(
                                    (id) => (
                                        <button
                                            key={id}
                                            type="button"
                                            className="btn"
                                            onClick={() =>
                                                setInBatteryId(
                                                    id
                                                )
                                            }
                                            style={{
                                                fontSize: 12,
                                                borderColor:
                                                    inBatteryId ===
                                                        id
                                                        ? "#10b981"
                                                        : undefined,
                                                background:
                                                    inBatteryId ===
                                                        id
                                                        ? "rgba(16,185,129,.1)"
                                                        : undefined,
                                            }}
                                        >
                                            {id}
                                        </button>
                                    )
                                )}
                            </div>

                            <div
                                className="small muted"
                                style={{
                                    marginTop: 4,
                                }}
                            >
                                You can still
                                edit manually.
                            </div>
                        </div>
                    )}
            </div>

            {/* ===== STEP 2: CHỌN TÌNH HUỐNG ===== */}
            {validated && (
                <div
                    className="card"
                    style={{ marginTop: 16 }}
                >
                    <h3 style={{ marginTop: 0 }}>
                        Step 2. Select Action
                        Type
                    </h3>

                    <div style={grid2}>
                        <div
                            style={{
                                display:
                                    "flex",
                                flexDirection:
                                    "column",
                                gap: 8,
                            }}
                        >
                            <label
                                style={{
                                    display:
                                        "flex",
                                    alignItems:
                                        "center",
                                    gap: 8,
                                }}
                            >
                                <input
                                    type="radio"
                                    name="errType"
                                    value="pinIn"
                                    checked={
                                        errorType ===
                                        "pinIn"
                                    }
                                    onChange={() =>
                                        setErrorType(
                                            "pinIn"
                                        )
                                    }
                                    disabled={
                                        !hasCustomerBatteries
                                    } // ❗ Khoá Pin In nếu BE không trả pin
                                />
                                Pin In
                                (customer
                                returns faulty
                                battery)
                            </label>

                            <label
                                style={{
                                    display:
                                        "flex",
                                    alignItems:
                                        "center",
                                    gap: 8,
                                }}
                            >
                                <input
                                    type="radio"
                                    name="errType"
                                    value="pinOut"
                                    checked={
                                        errorType ===
                                        "pinOut"
                                    }
                                    onChange={() =>
                                        setErrorType(
                                            "pinOut"
                                        )
                                    }
                                />
                                Pin Out
                                (machine
                                didn’t release
                                battery)
                            </label>
                        </div>

                        <div
                            className="small muted"
                            style={{
                                alignSelf:
                                    "flex-start",
                            }}
                        >
                            * Choose what
                            happened so we
                            know if
                            customer gave us
                            a broken battery
                            (Pin In) or
                            machine failed
                            to give them one
                            (Pin Out).
                            {!hasCustomerBatteries && (
                                <span
                                    className="small"
                                    style={{
                                        color: "#b45309",
                                        display:
                                            "block",
                                        marginTop: 6,
                                    }}
                                >
                                    Note: No
                                    customer
                                    battery found
                                    for this
                                    subscription
                                    — only{" "}
                                    <b>
                                        Pin Out
                                    </b>{" "}
                                    is
                                    available.
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* ===== STEP 3A: PIN IN (chỉ render khi chọn Pin In) ===== */}
            {validated &&
                errorType ===
                "pinIn" && (
                    <div
                        style={grid2}
                    >
                        <div className="card">
                            <h3
                                style={{
                                    marginTop: 0,
                                }}
                            >
                                Step 3A.
                                Receive
                                Customer
                                Battery
                                (Pin In)
                            </h3>
                            <label>
                                Customer
                                Battery ID
                                <input
                                    className="input"
                                    value={
                                        inBatteryId
                                    }
                                    onChange={(
                                        e
                                    ) =>
                                        setInBatteryId(
                                            e
                                                .target
                                                .value
                                        )
                                    }
                                    placeholder="e.g. BAT-ERR-001"
                                />
                            </label>
                        </div>

                        <div className="card">
                            <h3
                                style={{
                                    marginTop: 0,
                                }}
                            >
                                Give Battery
                                to Customer
                            </h3>
                            <label>
                                Out Battery
                                ID
                                <div
                                    style={{
                                        display:
                                            "flex",
                                        gap: 8,
                                    }}
                                >
                                    <input
                                        className="input"
                                        value={
                                            outBatteryId
                                        }
                                        onChange={(
                                            e
                                        ) =>
                                            setOutBatteryId(
                                                e
                                                    .target
                                                    .value
                                            )
                                        }
                                        placeholder="Select from warehouse…"
                                        aria-label="Out Battery ID"
                                    />
                                    <button
                                        className="btn"
                                        type="button"
                                        onClick={() => {
                                            setOpenPicker(
                                                true
                                            );
                                            loadWarehouse();
                                        }}
                                        disabled={
                                            !staffId.trim()
                                        }
                                        title={
                                            !staffId.trim()
                                                ? "Missing staffId"
                                                : ""
                                        }
                                    >
                                        From
                                        warehouse
                                    </button>
                                </div>
                            </label>
                            <p
                                className="small muted"
                                style={{
                                    marginTop: 6,
                                }}
                            >
                                * Only
                                batteries
                                with status{" "}
                                <b>
                                    warehouse
                                </b>{" "}
                                are shown
                                in warehouse
                                picker.
                            </p>
                        </div>
                    </div>
                )}

            {/* ===== STEP 3B: PIN OUT ===== */}
            {validated &&
                errorType ===
                "pinOut" && (
                    <div
                        className="card"
                        style={{
                            marginTop: 16,
                        }}
                    >
                        <h3
                            style={{
                                marginTop: 0,
                            }}
                        >
                            Step 3B.
                            Give Battery
                            to Customer
                        </h3>
                        <label>
                            Out Battery ID
                            <div
                                style={{
                                    display:
                                        "flex",
                                    gap: 8,
                                }}
                            >
                                <input
                                    className="input"
                                    value={
                                        outBatteryId
                                    }
                                    onChange={(
                                        e
                                    ) =>
                                        setOutBatteryId(
                                            e
                                                .target
                                                .value
                                        )
                                    }
                                    placeholder="Select from warehouse…"
                                    aria-label="Out Battery ID"
                                />
                                <button
                                    className="btn"
                                    type="button"
                                    onClick={() => {
                                        setOpenPicker(
                                            true
                                        );
                                        loadWarehouse();
                                    }}
                                    disabled={
                                        !staffId.trim()
                                    }
                                    title={
                                        !staffId.trim()
                                            ? "Missing staffId"
                                            : ""
                                    }
                                >
                                    From
                                    warehouse
                                </button>
                            </div>
                        </label>
                        <p
                            className="small muted"
                            style={{
                                marginTop: 6,
                            }}
                        >
                            * Only
                            batteries
                            with status{" "}
                            <b>
                                warehouse
                            </b>{" "}
                            are shown in
                            warehouse
                            picker.
                        </p>
                    </div>
                )}

            {/* ===== CONFIRM BUTTON + RESULT ===== */}
            {validated && (
                <>
                    <div style={{ marginTop: 12 }}>
                        <button
                            className="btn btn-primary"
                            onClick={onConfirm}
                            disabled={
                                !canConfirm ||
                                submitting
                            }
                        >
                            {submitting
                                ? "Processing…"
                                : "Confirm & Send Manual Assist"}
                        </button>
                    </div>

                    {err && (
                        <div
                            className="card mt-3"
                            style={{
                                borderColor:
                                    "#ef4444",
                                background:
                                    "#fef2f2",
                            }}
                        >
                            <div
                                style={{
                                    color: "#dc2626",
                                    fontWeight: 700,
                                    whiteSpace:
                                        "pre-wrap",
                                }}
                            >
                                ❌ {err}
                            </div>
                        </div>
                    )}

                    {resp && (
                        <div className="card mt-3">
                            <div
                                style={{
                                    fontWeight: 700,
                                    marginBottom: 6,
                                }}
                            >
                                ✅ Response
                                from BE
                            </div>
                            <pre
                                style={pre}
                            >
                                {JSON.stringify(
                                    resp,
                                    null,
                                    2
                                )}
                            </pre>
                        </div>
                    )}
                </>
            )}

            {/* ===== MODAL KHO PIN ===== */}
            {openPicker && (
                <div
                    className="overlay"
                    onClick={() =>
                        setOpenPicker(
                            false
                        )
                    }
                >
                    <aside
                        className="drawer"
                        onClick={(e) =>
                            e.stopPropagation()
                        }
                    >
                        <header className="drawer-head">
                            <h4 className="m-0">
                                Select
                                Battery
                                from
                                Warehouse
                            </h4>
                            <button
                                className="btn-close"
                                onClick={() =>
                                    setOpenPicker(
                                        false
                                    )
                                }
                                aria-label="Close"
                            >
                                ×
                            </button>
                        </header>

                        <div
                            className="drawer-body"
                            style={{
                                display:
                                    "flex",
                                flexDirection:
                                    "column",
                                gap: 12,
                            }}
                        >
                            <div className="row-between">
                                <div className="small muted">
                                    Staff:{" "}
                                    <b>
                                        {staffId ||
                                            "—"}
                                    </b>
                                </div>

                                <div
                                    style={{
                                        display:
                                            "flex",
                                        alignItems:
                                            "center",
                                        gap: 8,
                                    }}
                                >
                                    <label className="small muted">
                                        Min SOC
                                        filter
                                    </label>
                                    <input
                                        type="number"
                                        min={
                                            0
                                        }
                                        max={
                                            100
                                        }
                                        value={
                                            minSoc
                                        }
                                        onChange={(
                                            e
                                        ) =>
                                            setMinSoc(
                                                clamp01(
                                                    e
                                                        .target
                                                        .value
                                                )
                                            )
                                        }
                                        style={{
                                            width: 72,
                                        }}
                                        aria-label="Min SOC filter"
                                    />
                                </div>
                            </div>

                            {pickErr && (
                                <div
                                    className="card"
                                    style={{
                                        color: "#991b1b",
                                        background:
                                            "#fee2e2",
                                        border:
                                            "1px solid #fecaca",
                                    }}
                                >
                                    {pickErr}
                                </div>
                            )}

                            <div
                                className="slots-grid"
                                role="list"
                                aria-label="Warehouse battery list"
                            >
                                {pickLoading
                                    ? Array.from(
                                        {
                                            length: 8,
                                        }
                                    ).map(
                                        (
                                            _,
                                            i
                                        ) => (
                                            <div
                                                key={
                                                    i
                                                }
                                                className="slot-card skeleton"
                                            />
                                        )
                                    )
                                    : filteredBatteries.length ===
                                        0
                                        ? (
                                            <div className="muted small">
                                                No
                                                matching
                                                batteries
                                                (only
                                                status{" "}
                                                <b>
                                                    warehouse
                                                </b>{" "}
                                                is
                                                shown).
                                            </div>
                                        )
                                        : filteredBatteries.map(
                                            (
                                                b
                                            ) => {
                                                const tone =
                                                    statusTone(
                                                        b.status
                                                    );
                                                return (
                                                    <div
                                                        key={
                                                            b.id
                                                        }
                                                        className="slot-card"
                                                        role="listitem"
                                                        style={{
                                                            borderColor:
                                                                tone.br,
                                                            background:
                                                                "#fff",
                                                        }}
                                                    >
                                                        <div className="slot-head">
                                                            <span
                                                                className="status-badge"
                                                                style={{
                                                                    background:
                                                                        tone.bg,
                                                                    color: tone.fg,
                                                                    borderColor:
                                                                        tone.br,
                                                                }}
                                                            >
                                                                {
                                                                    tone.label
                                                                }
                                                            </span>
                                                        </div>

                                                        <div className="slot-body">
                                                            <div className="slot-id">
                                                                {
                                                                    b.id
                                                                }
                                                            </div>
                                                            <div className="kv">
                                                                <span>
                                                                    SOH
                                                                </span>
                                                                <b>
                                                                    {clamp01(
                                                                        b.soh
                                                                    )}
                                                                    %
                                                                </b>
                                                            </div>
                                                            <div className="kv">
                                                                <span>
                                                                    SOC
                                                                </span>
                                                                <b>
                                                                    {clamp01(
                                                                        b.soc
                                                                    )}
                                                                    %
                                                                </b>
                                                            </div>
                                                            <div className="socbar">
                                                                <span
                                                                    className="socbar-fill"
                                                                    style={{
                                                                        width: `${clamp01(
                                                                            b.soc
                                                                        )}%`,
                                                                        background:
                                                                            tone.br,
                                                                    }}
                                                                />
                                                            </div>
                                                        </div>

                                                        <div
                                                            className="slot-foot"
                                                            style={{
                                                                marginTop: 8,
                                                                display:
                                                                    "flex",
                                                                justifyContent:
                                                                    "flex-end",
                                                            }}
                                                        >
                                                            <button
                                                                className="btn"
                                                                onClick={() => {
                                                                    setOutBatteryId(
                                                                        b.id
                                                                    );
                                                                    setOpenPicker(
                                                                        false
                                                                    );
                                                                }}
                                                            >
                                                                Select
                                                            </button>
                                                        </div>
                                                    </div>
                                                );
                                            }
                                        )}
                            </div>
                        </div>

                        <footer className="drawer-foot">
                            <button
                                className="btn ghost"
                                onClick={() =>
                                    setOpenPicker(
                                        false
                                    )
                                }
                            >
                                Close
                            </button>
                        </footer>
                    </aside>
                </div>
            )}

            {/* ===== STYLES ===== */}
            <style>{`
        .row-between { display:flex; align-items:center; justify-content:space-between; gap:12px; }
        .small { font-size:12px; }
        .muted { color: var(--muted); }
        .m-0 { margin: 0; }

        .btn { height:36px; padding:0 12px; border-radius:10px; border:1px solid var(--line); background:#fff; cursor:pointer; }
        .btn.btn-primary { background:#2563eb; color:#fff; border-color:#1d4ed8; }
        .btn.btn-primary:disabled { opacity:.6; cursor:not-allowed; }
        .btn.ghost:hover { background:#f8fafc; }
        .btn-close { background:transparent; border:none; font-size:22px; line-height:1; cursor:pointer; color:#0f172a; }

        .slots-grid { display:grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap:12px; }
        @media (min-width: 920px) { .slots-grid { grid-template-columns: repeat(4, minmax(0, 1fr)); } }

        .slot-card { border:1px solid var(--line); border-radius:14px; padding:12px; display:flex; flex-direction:column; gap:8px; }
        .slot-card.skeleton { position:relative; overflow:hidden; min-height:120px; }
        .slot-card.skeleton::after {
          content:""; position:absolute; inset:0;
          background: linear-gradient(90deg, transparent, rgba(148,163,184,.1), transparent);
          animation: shimmer 1.2s infinite;
        }

        .slot-head { display:flex; align-items:center; justify-content:flex-end; gap:8px; }
        .status-badge { font-size:12px; padding:2px 8px; border-radius:999px; border:1px solid; white-space:nowrap; }

        .slot-body { display:flex; flex-direction:column; gap:6px; }
        .slot-id { font-weight:600; font-size:14px; }
        .kv { display:flex; align-items:center; justify-content:space-between; font-size:12px; }
        .socbar { height:6px; border-radius:999px; background:#e2e8f0; overflow:hidden; }
        .socbar-fill { display:block; height:100%; border-radius:999px; }
      `}</style>
        </section>
    );
}

/* ===== Helpers ===== */
const grid2 = {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 16,
};

const pre = {
    background: "#0f172a",
    color: "#e5e7eb",
    padding: 12,
    borderRadius: 8,
    overflowX: "auto",
};

function clamp01(n) {
    const x = Number(n);
    if (!Number.isFinite(x)) return 0;
    const r = Math.round(x);
    return Math.max(0, Math.min(100, r));
}

function isWarehouse(status) {
    return (status || "").trim().toLowerCase() === "warehouse";
}

function statusTone(status) {
    const s = (status || "").toLowerCase();
    if (s === "warehouse") {
        return {
            bg: "rgba(16,185,129,.10)",
            fg: "#065f46",
            br: "#10b981",
            label: "Warehouse",
        };
    }
    return {
        bg: "rgba(148,163,184,.12)",
        fg: "#334155",
        br: "#94a3b8",
        label: "Other",
    };
}
