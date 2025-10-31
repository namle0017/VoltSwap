// src/pages/staff/BatteryManager.jsx
import React, { useEffect, useMemo, useState } from "react";
import api from "@/api/api";

/* ===== Backend endpoints =====
 * 1) Pillar list for staff:           GET /PillarSlot/staff-pillar-slot?UserId=...
 * 2) 20 slots of 1 pillar:            GET /PillarSlot/battery-in-pillar?pillarId=PI-...
 * 3) Station warehouse (batteries):   GET /Station/station-inventory?StaffId=...
 * 4) Dock warehouse -> slot:          POST /PillarSlot/store-battery-inventory-to-pillar-slot
 * 5) Take out slot -> warehouse:      POST /PillarSlot/take-out-slot
 */
const ROUTES = {
    PILLARS: "/PillarSlot/staff-pillar-slot",
    SLOTS: "/PillarSlot/battery-in-pillar",
    WAREHOUSE: "/Station/station-inventory",
    STORE: "/PillarSlot/store-battery-inventory-to-pillar-slot",
    TAKE_OUT_WAREHOUSE: "/PillarSlot/take-out-slot",
};

/* ===== Helpers ===== */
const ROWS = ["A", "B", "C", "D", "E"]; // 5x4 = 20 slots
const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
const toPos = (zeroIndex) => `${ROWS[Math.floor(zeroIndex / 4)]}${(zeroIndex % 4) + 1}`;

const socColor = (soc) => {
    if (soc == null) return "#94a3b8"; // gray
    if (soc <= 20) return "#dc2626";   // red
    if (soc <= 50) return "#f59e0b";   // yellow
    return "#22c55e";                  // green
};

const clampPct = (x) => {
    const n = Number(x);
    return Number.isFinite(n) ? clamp(Math.round(n), 0, 100) : null;
};

/* ===== Normalizers ===== */
function normalizePillarsFromServer(payload) {
    const data = Array.isArray(payload)
        ? payload
        : Array.isArray(payload?.data)
            ? payload.data
            : [];

    return data
        .map((x) => {
            const id =
                x?.pillarSlotId ||
                x?.pillarId ||
                x?.id ||
                x?.pillar ||
                null;
            if (!id) return null;

            return {
                pillarId: id,
                pillarName: x?.pillarName || x?.name || id, // backend can send pillarName
                totalSlots:
                    Number(
                        x?.totalSlots ??
                        x?.slotCount ??
                        x?.numberOfSlots ??
                        x?.slots ??
                        20
                    ) || 20,
                summary: {
                    empty: Number(x?.numberOfSlotEmpty ?? x?.empty ?? 0) || 0,
                    red: Number(x?.numberOfSlotRed ?? x?.red ?? 0) || 0,
                    green: Number(x?.numberOfSlotGreen ?? x?.green ?? 0) || 0,
                    amber:
                        Number(
                            x?.numberOfSlotYellow ??
                            x?.amber ??
                            x?.yellow ??
                            0
                        ) || 0,
                },
            };
        })
        .filter(Boolean);
}

function normalizeSlotsFromServer(payload, pillarId) {
    const serverList = Array.isArray(payload)
        ? payload
        : Array.isArray(payload?.data)
            ? payload.data
            : [];

    // pre-fill 20 slots
    const slots = Array.from({ length: 20 }, (_, i) => ({
        pillarId,
        index: i,
        slotNumber: i + 1,
        slotId: null,
        code: null,
        pos: toPos(i),
        soc: null,
        soh: null,
        empty: true,

        stationId: null,
        batteryStatus: null,
        pillarStatus: null,
        status: null,
        isLocked: false,
    }));

    for (const s of serverList) {
        const slotNumber = Number(s?.slotNumber ?? s?.slotNo);
        if (!Number.isFinite(slotNumber) || slotNumber < 1 || slotNumber > 20) continue;

        const idx = slotNumber - 1;

        const code = s?.batteryId ?? s?.batteryCode ?? s?.code ?? null;
        const realSlotId = s?.slotId ?? s?.id ?? null;

        const socRaw = s?.batterySoc ?? s?.soc ?? s?.battery?.soc;
        const sohRaw = s?.batterySoh ?? s?.soh ?? s?.battery?.soh;

        const pillarStatusRaw = s?.pillarStatus ?? s?.slotStatus ?? null;
        const isLocked =
            String(pillarStatusRaw ?? "")
                .trim()
                .toLowerCase() === "lock";

        slots[idx] = {
            ...slots[idx],
            slotNumber,
            slotId: realSlotId,
            code,
            soc: clampPct(socRaw),
            soh: clampPct(sohRaw),
            stationId: s?.stationId ?? s?.station ?? null,
            batteryStatus: s?.batteryStatus ?? s?.battery_status ?? null,
            pillarStatus: pillarStatusRaw ?? null,
            status: s?.status ?? null,
            isLocked,
            empty: !code,
        };
    }

    return slots;
}

/* ===== Small UI bits ===== */
function PillarTile({ pillarId, pillarName, totalSlots, summary, onOpen }) {
    return (
        <button
            onClick={onOpen}
            className="w-full rounded-2xl border bg-white shadow-sm p-5 text-left hover:shadow-md transition"
            title={`${pillarName} (${pillarId}) • ${totalSlots} slots`}
            type="button"
        >
            <div className="flex items-center justify-between">
                <div className="text-lg font-semibold">{pillarName || pillarId}</div>
                <div className="text-xs text-slate-500">{totalSlots} slots</div>
            </div>

            <div className="mt-4 space-y-2 text-sm">
                <div className="flex items-center gap-2">
                    <span className="inline-block w-3 h-3 rounded-[2px]" style={{ background: "#22c55e" }} />
                    <span className="text-slate-600">Full batteries:</span>
                    <span className="font-medium">{summary.green}</span>
                </div>

                <div className="flex items-center gap-2">
                    <span className="inline-block w-3 h-3 rounded-[2px]" style={{ background: "#f59e0b" }} />
                    <span className="text-slate-600">Charging:</span>
                    <span className="font-medium">{summary.amber}</span>
                </div>

                <div className="flex items-center gap-2">
                    <span className="inline-block w-3 h-3 rounded-[2px]" style={{ background: "#dc2626" }} />
                    <span className="text-slate-600">Low / Empty:</span>
                    <span className="font-medium">{summary.red}</span>
                </div>

                <div className="flex items-center gap-2">
                    <span className="inline-block w-3 h-3 rounded-[2px] bg-slate-300" />
                    <span className="text-slate-600">Empty slots:</span>
                    <span className="font-medium">{summary.empty}</span>
                </div>
            </div>
        </button>
    );
}

function BatterySlot({ data, selected, onClick, onAdd }) {
    const isEmpty = data.empty;
    const soc = data.soc ?? 0;
    const color = socColor(isEmpty ? null : soc);

    const isMaintenance = String(data?.batteryStatus || "").toLowerCase() === "maintenance";
    const isLocked = !!data.isLocked;

    // background + border logic precedence: Locked > Maintenance > normal
    let baseClass = "bg-slate-100 border";
    if (isLocked) {
        baseClass = "bg-slate-200 border-slate-500";
    } else if (isMaintenance) {
        baseClass = "bg-red-50 border-red-500";
    }

    const ringClass = selected
        ? isMaintenance
            ? "ring-2 ring-red-500"
            : isLocked
                ? "ring-2 ring-slate-500"
                : "ring-2 ring-blue-500"
        : "";

    const titleText = isEmpty
        ? `${data.pillarId} • ${data.pos} • Empty • Slot ${data.slotNumber}`
        : `${data.pillarId} • ${data.code} • ${data.pos} • Slot ${data.slotNumber} • SoC ${soc}%`
        + (isLocked ? " • Locked" : isMaintenance ? " • Maintenance" : "");

    return (
        <button
            onClick={onClick}
            className={`relative w-full h-[120px] rounded-xl border transition ${baseClass} ${ringClass}`}
            title={titleText}
            type="button"
        >
            {/* SoC fill bar at bottom, hidden if empty / maintenance / locked */}
            {!isEmpty && !isMaintenance && !isLocked && (
                <div
                    className="absolute bottom-0 left-0 right-0 rounded-b-xl"
                    style={{
                        height: `${clamp(soc, 0, 100)}%`,
                        background: color,
                    }}
                />
            )}

            {/* Center content */}
            <div className="absolute inset-0 grid place-items-center text-[13px] font-semibold text-slate-800">
                {isEmpty
                    ? "＋"
                    : isLocked
                        ? "Locked 🔒"
                        : isMaintenance
                            ? "Maintenance"
                            : `${soc}%`}
            </div>

            {/* Top-left label: A1, B4... */}
            <div className="absolute left-2 top-2 text-[11px] font-bold text-slate-700">
                {data.pos}
            </div>

            {/* Bottom-right battery code */}
            {!isEmpty && (
                <div className="absolute right-2 bottom-2 text-[11px] font-medium opacity-80">
                    {data.code}
                </div>
            )}

            {/* Maintenance badge */}
            {isMaintenance && (
                <div className="absolute right-2 top-2 text-[10px] font-semibold px-1.5 py-0.5 rounded bg-red-500 text-white">
                    Maintenance
                </div>
            )}

            {/* Locked badge */}
            {isLocked && (
                <div className="absolute right-2 top-2 text-[10px] font-semibold px-1.5 py-0.5 rounded bg-slate-600 text-white">
                    Locked 🔒
                </div>
            )}

            {/* Empty slot action: only allow add if not locked */}
            {isEmpty && !isLocked && typeof onAdd === "function" && (
                <div className="absolute inset-x-2 bottom-2">
                    <span
                        role="button"
                        tabIndex={0}
                        className="w-full inline-flex justify-center text-xs px-2 py-1 rounded-md border bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                        onClick={(e) => {
                            e.stopPropagation();
                            onAdd(data);
                        }}
                        onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                                e.preventDefault();
                                e.stopPropagation();
                                onAdd(data);
                            }
                        }}
                    >
                        Add battery
                    </span>
                </div>
            )}
        </button>
    );
}

function Row({ k, v }) {
    return (
        <div className="flex items-center justify-between">
            <span className="text-slate-500">{k}</span>
            <span className="font-medium">{v}</span>
        </div>
    );
}

function DetailPanel({ selected, onRequestRemove }) {
    const isLocked = !!selected?.isLocked;

    return (
        <div className="rounded-2xl border bg-white shadow-sm p-4">
            <div className="font-semibold mb-3">Battery details</div>

            {!selected ? (
                <p className="text-sm text-slate-500">
                    Click a slot to view SoC / SoH / position / code.
                </p>
            ) : selected.empty ? (
                <div className="space-y-2 text-sm">
                    <Row k="Pillar ID" v={selected.pillarId} />
                    <Row k="Slot #" v={selected.slotNumber} />
                    <Row k="Grid Pos" v={selected.pos} />
                    <Row
                        k="Pillar Status"
                        v={isLocked ? "Locked 🔒" : selected.pillarStatus || "—"}
                    />
                    <div className="mt-2 px-3 py-2 rounded-lg bg-slate-100 text-slate-600 text-sm">
                        Empty slot
                    </div>
                </div>
            ) : (
                <div className="space-y-2 text-sm">
                    <Row k="Pillar ID" v={selected.pillarId} />
                    <Row k="Slot #" v={selected.slotNumber} />
                    <Row k="Slot ID (BE)" v={selected.slotId ?? "—"} />
                    <Row k="Grid Pos" v={selected.pos} />
                    <Row k="Battery Code" v={selected.code} />
                    <Row k="SoC" v={`${selected.soc}%`} />
                    <Row k="SoH" v={`${selected.soh}%`} />
                    {selected.stationId && <Row k="Station ID" v={selected.stationId} />}

                    {selected.batteryStatus && (
                        <Row
                            k="Battery Status"
                            v={
                                String(selected.batteryStatus).toLowerCase() === "maintenance"
                                    ? "Maintenance 🔧"
                                    : selected.batteryStatus
                            }
                        />
                    )}

                    <Row
                        k="Pillar Status"
                        v={isLocked ? "Locked 🔒" : selected.pillarStatus || "—"}
                    />

                    {/* SoC progress bar */}
                    <div className="mt-3 h-2 w-full rounded-full bg-slate-200 overflow-hidden">
                        <div
                            className="h-full"
                            style={{
                                width: `${clamp(selected.soc, 0, 100)}%`,
                                background: socColor(selected.soc),
                            }}
                        />
                    </div>

                    <div className="pt-3 flex justify-end gap-2">
                        <button
                            type="button"
                            className="px-3 py-2 rounded-lg border bg-red-600 text-white text-sm"
                            onClick={() => onRequestRemove?.(selected)}
                            title="Take battery out of this slot and return it to warehouse"
                        >
                            Take out to warehouse
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

/* ===== Modal: choose warehouse battery -> dock into slot ===== */
function AddBatteryModal({ open, onClose, slot, staffId, onDocked }) {
    const [search, setSearch] = useState("");
    const [busy, setBusy] = useState(false);
    const [msg, setMsg] = useState("");

    const [loadingInv, setLoadingInv] = useState(false);
    const [invErr, setInvErr] = useState("");
    const [warehouse, setWarehouse] = useState([]);

    const locked = !!slot?.isLocked;

    useEffect(() => {
        if (!open) return;

        setSearch("");
        setBusy(false);
        setMsg("");
        setWarehouse([]);
        setInvErr("");

        if (!staffId) {
            setInvErr("Missing staffId — please re-login or restore localStorage.");
            return;
        }

        const ac = new AbortController();
        (async () => {
            try {
                setLoadingInv(true);
                const res = await api.get(ROUTES.WAREHOUSE, {
                    params: { StaffId: staffId },
                    signal: ac.signal,
                });
                // BE can return either {data:[...]} or [...]
                const raw = Array.isArray(res?.data?.data)
                    ? res.data.data
                    : Array.isArray(res?.data)
                        ? res.data
                        : [];

                // Only show batteries that are in warehouse
                const mapped = raw
                    .filter(
                        (x) =>
                            (x?.status || "warehouse").toLowerCase() ===
                            "warehouse"
                    )
                    .map((it) => ({
                        batteryId: it?.batteryId,
                        soh: clampPct(it?.soh),
                        soc: clampPct(it?.soc),
                        capacity: Number(it?.capacity ?? it?.capacityKWh ?? 0),
                        stationId: it?.stationId,
                    }))
                    .sort((a, b) => (b.soh ?? 0) - (a.soh ?? 0));

                setWarehouse(mapped);
            } catch (e) {
                if (ac.signal.aborted) return;
                setInvErr(
                    e?.response?.data?.message ||
                    e?.message ||
                    "Failed to load warehouse batteries."
                );
            } finally {
                setLoadingInv(false);
            }
        })();

        return () => ac.abort();
    }, [open, staffId]);

    const [selectedId, setSelectedId] = useState(null);
    useEffect(() => {
        if (open) setSelectedId(null);
    }, [open]);

    const toast = (t, isErr = false) => {
        setMsg(t ? (isErr ? `❌ ${t}` : `✅ ${t}`) : "");
        if (t) {
            setTimeout(() => setMsg(""), 2200);
        }
    };

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        if (!q) return warehouse;
        return warehouse.filter((w) =>
            (w.batteryId || "").toLowerCase().includes(q)
        );
    }, [search, warehouse]);

    const handleDock = async () => {
        if (locked) {
            toast("This slot is Locked. You can't dock into it.", true);
            return;
        }
        if (!selectedId) {
            toast("Please pick one battery first.", true);
            return;
        }
        if (!slot?.slotId) {
            toast("Missing slotId. Please reopen this pillar to refresh.", true);
            return;
        }

        try {
            setBusy(true);
            const payload = {
                staffId,
                pillarSlotId: Number(slot.slotId) || slot.slotId,
                batteryWareHouseId: selectedId,
            };
            const res = await api.post(ROUTES.STORE, payload);
            toast(res?.data?.message || "Battery docked into slot.");
            onDocked?.();
            setTimeout(() => onClose?.(), 300);
        } catch (e) {
            console.error(e);
            toast(
                e?.response?.data?.message ||
                e?.message ||
                "Dock failed.",
                true
            );
        } finally {
            setBusy(false);
        }
    };

    if (!open || !slot) return null;

    return (
        <div className="fixed inset-0 z-[100]">
            <div
                className="absolute inset-0 bg-black/40"
                onClick={() => !busy && onClose?.()}
            />
            <div className="absolute inset-x-0 top-[8%] mx-auto max-w-3xl rounded-2xl border bg-white shadow-xl">
                {/* Header */}
                <div className="px-5 py-4 border-b flex items-center justify-between">
                    <div className="font-semibold">Dock battery from warehouse</div>
                    <button
                        className="text-slate-500 hover:text-slate-700"
                        onClick={() => !busy && onClose?.()}
                        title="Close"
                        type="button"
                    >
                        ✕
                    </button>
                </div>

                {/* Body */}
                <div className="p-5 space-y-4 text-sm">
                    {/* Slot info */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                        <div>
                            <div className="text-slate-500">Pillar</div>
                            <div className="font-medium">{slot.pillarId}</div>
                        </div>
                        <div>
                            <div className="text-slate-500">Slot</div>
                            <div className="font-medium">
                                {slot.slotNumber} ({slot.pos})
                            </div>
                        </div>
                        <div>
                            <div className="text-slate-500">Slot ID (BE)</div>
                            <div className="font-medium">
                                {slot.slotId ?? "—"}
                            </div>
                        </div>
                        <div>
                            <div className="text-slate-500">Staff</div>
                            <div className="font-medium">
                                {staffId || "—"}
                            </div>
                        </div>
                    </div>

                    {/* Locked warning */}
                    {locked && (
                        <div className="rounded-lg border border-slate-500 bg-slate-100 text-slate-700 px-3 py-2 text-xs font-medium">
                            This slot is <b>Locked 🔒</b>. You cannot dock a
                            battery here.
                        </div>
                    )}

                    {/* Search */}
                    <div className="flex items-center justify-between gap-3">
                        <input
                            className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Search by battery ID..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            disabled={loadingInv}
                        />
                        <div className="text-xs text-slate-500 shrink-0">
                            {loadingInv
                                ? "Loading warehouse..."
                                : `Warehouse: ${warehouse.length} batteries`}
                        </div>
                    </div>

                    {!!invErr && (
                        <div className="text-sm text-red-600">{invErr}</div>
                    )}
                    {!!msg && (
                        <div className="font-semibold">{msg}</div>
                    )}

                    {/* Warehouse table */}
                    <div className="rounded-xl border overflow-hidden">
                        <table className="w-full text-sm">
                            <thead className="bg-slate-50">
                                <tr>
                                    <th className="px-3 py-2 text-left">Pick</th>
                                    <th className="px-3 py-2 text-left">Battery ID</th>
                                    <th className="px-3 py-2 text-left">SoH</th>
                                    <th className="px-3 py-2 text-left">SoC</th>
                                    <th className="px-3 py-2 text-left">Capacity</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loadingInv ? (
                                    <tr>
                                        <td
                                            className="px-3 py-3 text-slate-500"
                                            colSpan={5}
                                        >
                                            Loading...
                                        </td>
                                    </tr>
                                ) : filtered.length === 0 ? (
                                    <tr>
                                        <td
                                            className="px-3 py-3 text-slate-500"
                                            colSpan={5}
                                        >
                                            No matching batteries.
                                        </td>
                                    </tr>
                                ) : (
                                    filtered.map((b) => (
                                        <tr
                                            key={b.batteryId}
                                            className="hover:bg-slate-50"
                                        >
                                            <td className="px-3 py-2">
                                                <input
                                                    type="radio"
                                                    name="pickBattery"
                                                    checked={selectedId === b.batteryId}
                                                    onChange={() => setSelectedId(b.batteryId)}
                                                    disabled={locked}
                                                />
                                            </td>
                                            <td className="px-3 py-2 font-medium">
                                                {b.batteryId}
                                            </td>
                                            <td className="px-3 py-2">
                                                {b.soh != null ? `${b.soh}%` : "—"}
                                            </td>
                                            <td className="px-3 py-2">
                                                {b.soc != null ? `${b.soc}%` : "—"}
                                            </td>
                                            <td className="px-3 py-2">
                                                {b.capacity
                                                    ? `${b.capacity} kWh`
                                                    : "—"}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Actions */}
                    <div className="pt-1 flex items-center justify-end gap-2">
                        <button
                            className="px-3 py-2 rounded-lg border text-sm"
                            onClick={() => !busy && onClose?.()}
                            type="button"
                        >
                            Cancel
                        </button>
                        <button
                            className="px-3 py-2 rounded-lg border bg-blue-600 text-white text-sm disabled:opacity-60"
                            onClick={handleDock}
                            disabled={busy || !selectedId || locked}
                            title={
                                locked
                                    ? "Slot is locked"
                                    : !selectedId
                                        ? "Pick one battery first"
                                        : "Dock battery into this slot"
                            }
                            type="button"
                        >
                            {busy ? "Working..." : "Dock battery"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

/* ===== Modal: take battery out of slot -> return to warehouse ===== */
function RemoveBatteryModal({ open, onClose, slot, staffId, onRemoved }) {
    const [busy, setBusy] = useState(false);
    const [msg, setMsg] = useState("");

    useEffect(() => {
        if (open) {
            setBusy(false);
            setMsg("");
        }
    }, [open]);

    const toast = (t, isErr = false) => {
        setMsg(t ? (isErr ? `❌ ${t}` : `✅ ${t}`) : "");
        if (t) setTimeout(() => setMsg(""), 2200);
    };

    const handleRemove = async () => {
        if (!slot?.slotId) {
            toast("Missing slotId. Please reopen the pillar to refresh.", true);
            return;
        }
        if (!staffId) {
            toast("Missing staffId — please log in again.", true);
            return;
        }

        try {
            setBusy(true);
            const payload = {
                staffId,
                pillarSlotId: Number(slot.slotId) || slot.slotId,
                batteryId: slot.code,
            };
            const res = await api.post(ROUTES.TAKE_OUT_WAREHOUSE, payload);
            toast(res?.data?.message || "Battery removed and sent to warehouse.");
            onRemoved?.();
            setTimeout(() => onClose?.(), 300);
        } catch (e) {
            console.error(e);
            toast(
                e?.response?.data?.message ||
                e?.message ||
                "Failed to take battery out.",
                true
            );
        } finally {
            setBusy(false);
        }
    };

    if (!open || !slot) return null;

    return (
        <div className="fixed inset-0 z-[100]">
            <div
                className="absolute inset-0 bg-black/40"
                onClick={() => !busy && onClose?.()}
            />
            <div className="absolute inset-x-0 top-[12%] mx-auto max-w-md rounded-2xl border bg-white shadow-xl">
                {/* Header */}
                <div className="px-5 py-4 border-b flex items-center justify-between">
                    <div className="font-semibold">Confirm take-out</div>
                    <button
                        className="text-slate-500 hover:text-slate-700"
                        onClick={() => !busy && onClose?.()}
                        title="Close"
                        type="button"
                    >
                        ✕
                    </button>
                </div>

                {/* Body */}
                <div className="p-5 space-y-3 text-sm">
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <div className="text-slate-500">Pillar</div>
                            <div className="font-medium">{slot.pillarId}</div>
                        </div>

                        <div>
                            <div className="text-slate-500">Slot</div>
                            <div className="font-medium">
                                {slot.slotNumber} ({slot.pos})
                            </div>
                        </div>

                        <div>
                            <div className="text-slate-500">Slot ID</div>
                            <div className="font-medium">{slot.slotId}</div>
                        </div>

                        <div>
                            <div className="text-slate-500">Battery</div>
                            <div className="font-medium">{slot.code}</div>
                        </div>
                    </div>

                    {!!msg && (
                        <div className="font-semibold">{msg}</div>
                    )}

                    <div className="pt-2 flex items-center justify-end gap-2">
                        <button
                            className="px-3 py-2 rounded-lg border text-sm"
                            onClick={() => !busy && onClose?.()}
                            type="button"
                        >
                            Cancel
                        </button>
                        <button
                            className="px-3 py-2 rounded-lg border bg-red-600 text-white text-sm disabled:opacity-60"
                            onClick={handleRemove}
                            disabled={busy}
                            title="Take battery out and send to warehouse"
                            type="button"
                        >
                            {busy ? "Working..." : "Confirm take-out"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

/* ===== Page component ===== */
export default function BatteryManager() {
    // userId is used to get pillars
    const [userId] = useState(() => (localStorage.getItem("userId") || "").trim());

    // staffId is sent in warehouse / dock / take-out actions
    const [staffId] = useState(() =>
        (
            localStorage.getItem("staffId") ||
            localStorage.getItem("StaffId") ||
            localStorage.getItem("userId") ||
            ""
        ).trim()
    );

    const [pillars, setPillars] = useState([]); // [{ pillarId, pillarName, totalSlots, summary }, ...]
    const [slotsByPillar, setSlotsByPillar] = useState({}); // { [pillarId]: Slot[] }
    const [activePillarId, setActivePillarId] = useState(null); // which pillar is currently open
    const [selected, setSelected] = useState(null); // currently selected slot in right panel

    const [loadingPillars, setLoadingPillars] = useState(false);
    const [loadingSlots, setLoadingSlots] = useState(false);
    const [error, setError] = useState("");

    // modal: dock from warehouse
    const [addOpen, setAddOpen] = useState(false);
    const [targetSlot, setTargetSlot] = useState(null);

    // modal: take-out to warehouse
    const [removeOpen, setRemoveOpen] = useState(false);
    const [removeTarget, setRemoveTarget] = useState(null);

    /* ===== Fetch pillars on mount ===== */
    useEffect(() => {
        const ac = new AbortController();
        (async () => {
            if (!userId) {
                setError("Missing userId in localStorage. Please log in again.");
                return;
            }
            try {
                setLoadingPillars(true);
                setError("");
                const res = await api.get(ROUTES.PILLARS, {
                    params: { UserId: userId },
                    signal: ac.signal,
                });
                const list = normalizePillarsFromServer(res.data);
                setPillars(list);
            } catch (e) {
                if (ac.signal.aborted) return;
                setError("Failed to load pillars from backend.");
            } finally {
                setLoadingPillars(false);
            }
        })();
        return () => ac.abort();
    }, [userId]);

    /* ===== Open 1 pillar (fetch its 20 slots if not cached yet) ===== */
    const openPillar = async (pillarId) => {
        setActivePillarId(pillarId);
        setSelected(null);

        // already fetched?
        if (slotsByPillar[pillarId]) return;

        const ac = new AbortController();
        try {
            setLoadingSlots(true);
            setError("");
            const res = await api.get(ROUTES.SLOTS, {
                params: { pillarId },
                signal: ac.signal,
            });
            const normalized = normalizeSlotsFromServer(res.data, pillarId);
            setSlotsByPillar((prev) => ({ ...prev, [pillarId]: normalized }));
        } catch (e) {
            if (ac.signal.aborted) return;
            setSlotsByPillar((prev) => ({ ...prev, [pillarId]: [] }));
            setError("Failed to load slots for this pillar.");
        } finally {
            setLoadingSlots(false);
        }
    };

    /* ===== Refresh currently active pillar's slots ===== */
    const refreshCurrentPillarSlots = async () => {
        if (!activePillarId) return;
        const ac = new AbortController();
        try {
            setLoadingSlots(true);
            const res = await api.get(ROUTES.SLOTS, {
                params: { pillarId: activePillarId },
                signal: ac.signal,
            });
            const normalized = normalizeSlotsFromServer(res.data, activePillarId);
            setSlotsByPillar((prev) => ({ ...prev, [activePillarId]: normalized }));
        } catch {
            // keep old data
        } finally {
            setLoadingSlots(false);
        }
    };

    const backToPillars = () => {
        setActivePillarId(null);
        setSelected(null);
    };

    // color legend (for top-right legend row)
    const legend = useMemo(
        () => [
            { color: "#ef4444", label: "Maintenance (red tile)" },
            { color: "#dc2626", label: "≤ 20% SoC (red fill)" },
            { color: "#f59e0b", label: "21–50% SoC (yellow fill)" },
            { color: "#22c55e", label: "> 50% SoC (green fill)" },
            { color: "#94a3b8", label: "Empty slot" },
            { color: "#64748b", label: "Locked 🔒" },
        ],
        []
    );

    // find active pillar info for header (pillarName)
    const activePillarInfo = useMemo(() => {
        if (!activePillarId) return null;
        return pillars.find((p) => p.pillarId === activePillarId) || null;
    }, [activePillarId, pillars]);

    const currentSlots = activePillarId ? slotsByPillar[activePillarId] : null;

    return (
        <div className="space-y-6">
            {/* ===== Header row ===== */}
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                    <h1 className="text-xl font-bold">
                        {activePillarId
                            ? `Battery Management – ${activePillarInfo?.pillarName || activePillarId}`
                            : "Battery Management"}
                    </h1>

                    <p className="text-sm text-slate-500">
                        {activePillarId
                            ? `${activePillarId} • 20 slots`
                            : loadingPillars
                                ? "Loading pillars list…"
                                : "Choose a pillar to view its 20 slots."}
                    </p>
                </div>

                <div className="flex items-center gap-4">
                    {/* Legend */}
                    <div className="hidden md:flex items-center gap-3">
                        {legend.map((l) => (
                            <div key={l.label} className="flex items-center gap-2 text-xs">
                                <span
                                    className="inline-block w-3 h-3 rounded-sm border"
                                    style={{ background: l.color }}
                                />
                                <span className="text-slate-600">{l.label}</span>
                            </div>
                        ))}
                    </div>

                    {/* Actions on right when inside a pillar */}
                    {activePillarId ? (
                        <div className="flex items-center gap-2">
                            <button
                                className="px-3 py-2 rounded-lg border text-sm"
                                onClick={backToPillars}
                                type="button"
                            >
                                ← All pillars
                            </button>
                            <button
                                className="px-3 py-2 rounded-lg border text-sm"
                                onClick={refreshCurrentPillarSlots}
                                disabled={loadingSlots}
                                title="Reload 20 slots"
                                type="button"
                            >
                                ↻ Refresh slots
                            </button>
                        </div>
                    ) : null}
                </div>
            </div>

            {/* general error */}
            {!!error && !loadingPillars && !activePillarId && (
                <div className="text-sm text-red-600">{error}</div>
            )}

            {/* ===== Main content ===== */}
            {!activePillarId ? (
                // Pillar cards grid
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {pillars.length === 0 && !loadingPillars ? (
                        <div className="text-slate-500 text-sm">
                            No pillar found.
                        </div>
                    ) : (
                        pillars.map((p) => (
                            <PillarTile
                                key={p.pillarId}
                                pillarId={p.pillarId}
                                pillarName={p.pillarName}
                                totalSlots={p.totalSlots}
                                summary={p.summary}
                                onOpen={() => openPillar(p.pillarId)}
                            />
                        ))
                    )}
                </div>
            ) : (
                // 2-column layout: slots grid + detail panel
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                    {/* left side: slots grid */}
                    <div className="xl:col-span-2 rounded-2xl border bg-white shadow-sm">
                        <div className="px-4 py-3 border-b flex items-center justify-between">
                            <div className="font-semibold">
                                {activePillarInfo?.pillarName || activePillarId}
                            </div>
                            <div className="text-xs text-slate-500">20 slots • 5×4</div>
                        </div>

                        {loadingSlots && !currentSlots ? (
                            <div className="p-6 text-sm text-slate-500">
                                Loading slots…
                            </div>
                        ) : currentSlots && currentSlots.length > 0 ? (
                            <div className="p-3 grid grid-cols-2 sm:grid-cols-4 gap-3">
                                {currentSlots.map((slot) => (
                                    <BatterySlot
                                        key={slot.slotId ?? `${slot.pillarId}-${slot.slotNumber}`}
                                        data={slot}
                                        selected={
                                            selected &&
                                            selected.pillarId === activePillarId &&
                                            selected.slotNumber === slot.slotNumber
                                        }
                                        onClick={() => setSelected({ ...slot })}
                                        onAdd={(emptySlot) => {
                                            setTargetSlot(emptySlot);
                                            setAddOpen(true);
                                        }}
                                    />
                                ))}
                            </div>
                        ) : (
                            <div className="p-6 text-sm text-slate-500">
                                No slot data from backend.
                            </div>
                        )}
                    </div>

                    {/* right side: details */}
                    <DetailPanel
                        selected={selected}
                        onRequestRemove={(slot) => {
                            if (!slot || slot.empty) return;
                            setRemoveTarget(slot);
                            setRemoveOpen(true);
                        }}
                    />
                </div>
            )}

            {/* ===== Modals ===== */}

            {/* Dock from warehouse -> slot */}
            <AddBatteryModal
                open={addOpen}
                onClose={() => setAddOpen(false)}
                slot={targetSlot}
                staffId={staffId}
                onDocked={refreshCurrentPillarSlots}
            />

            {/* Take out slot -> warehouse */}
            <RemoveBatteryModal
                open={removeOpen}
                onClose={() => setRemoveOpen(false)}
                slot={removeTarget}
                staffId={staffId}
                onRemoved={refreshCurrentPillarSlots}
            />
        </div>
    );
}
