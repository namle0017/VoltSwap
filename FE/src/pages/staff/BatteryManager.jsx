/* eslint-disable no-unused-vars */
// src/pages/staff/BatteryManager.jsx
import React, { useEffect, useMemo, useState } from "react";
import api from "@/api/api";

/* ===== Endpoints =====
 * 1) Danh sách 3 trụ:   GET /PillarSlot/staff-pillar-slot?UserId=...
 * 2) Slots của 1 trụ:   GET /PillarSlot/battery-in-pillar?pillarId=PI-...
 */
const ROUTES = {
    PILLARS: "/PillarSlot/staff-pillar-slot",
    SLOTS: "/PillarSlot/battery-in-pillar",
};

/* ===== Helpers ===== */
const ROWS = ["A", "B", "C", "D", "E"]; // 5x4 = 20
const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
const toPos = (zeroIndex) =>
    `${ROWS[Math.floor(zeroIndex / 4)]}${(zeroIndex % 4) + 1}`;

const socColor = (soc) => {
    if (soc == null) return "#94a3b8"; // empty
    if (soc <= 20) return "#dc2626";   // red
    if (soc <= 50) return "#f59e0b";   // amber
    return "#22c55e";                  // green
};

/* ===== Normalizers ===== */
// 3 trụ
function normalizePillarsFromServer(payload) {
    const data = Array.isArray(payload) ? payload : Array.isArray(payload?.data) ? payload.data : [];
    return data
        .map((x) => {
            const id = x?.pillarSlotId || x?.pillarId || x?.id || x?.pillar || null;
            if (!id) return null;
            return {
                pillarId: id,
                totalSlots: Number(x?.slotId ?? x?.totalSlots ?? 20) || 20,
                summary: {
                    empty: Number(x?.numberOfSlotEmpty ?? 0) || 0,
                    red: Number(x?.numberOfSlotRed ?? 0) || 0,
                    green: Number(x?.numberOfSlotGreen ?? 0) || 0,
                    amber: Number(x?.numberOfSlotYellow ?? 0) || 0,
                },
            };
        })
        .filter(Boolean);
}

// 20 ô của 1 trụ từ API /battery-in-pillar
function normalizeSlotsFromServer(payload, pillarId) {
    const serverList = Array.isArray(payload) ? payload : Array.isArray(payload?.data) ? payload.data : [];

    // tạo 20 ô trống mặc định
    const slots = Array.from({ length: 20 }, (_, i) => ({
        pillarId,
        index: i,
        slotId: i + 1,
        code: null,
        pos: toPos(i),
        soc: null,
        soh: null,
        empty: true,
        stationId: null,
        batteryStatus: null,
        pillarStatus: null,
    }));

    // đặt dữ liệu của BE vào đúng vị trí theo slotNumber (1..20)
    for (const s of serverList) {
        const n = Number(s?.slotNumber ?? s?.slotId);
        if (!Number.isFinite(n) || n < 1 || n > 20) continue;

        const idx = n - 1;
        const code = s?.batteryId ?? s?.batteryCode ?? null;
        const soc = typeof s?.batterySoc === "number" ? Math.round(s.batterySoc) : null;
        const soh = typeof s?.batterySoh === "number" ? Math.round(s.batterySoh) : null;

        slots[idx] = {
            ...slots[idx],
            code,
            soc,
            soh,
            stationId: s?.stationId ?? null,
            batteryStatus: s?.batteryStatus ?? null,
            pillarStatus: s?.pillarStatus ?? null,
            empty: !code, // coi là trống khi không có batteryId
        };
    }

    return slots;
}

/* ===== UI atoms ===== */
function PillarTile({ pillarId, totalSlots, summary, onOpen }) {
    return (
        <button
            onClick={onOpen}
            className="w-full rounded-2xl border bg-white shadow-sm p-5 text-left hover:shadow-md transition"
            title={`${pillarId} • ${totalSlots} slots`}
        >
            <div className="flex items-center justify-between">
                <div className="text-lg font-semibold">{pillarId}</div>
                <div className="text-xs text-slate-500">{totalSlots} slots</div>
            </div>

            <div className="mt-4 space-y-2 text-sm">
                <div className="flex items-center gap-2">
                    <span className="inline-block w-3 h-3 rounded-[2px]" style={{ background: "#22c55e" }} />
                    <span className="text-slate-600">{"> 50% (xanh):"}</span>
                    <span className="font-medium">{summary.green}</span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="inline-block w-3 h-3 rounded-[2px]" style={{ background: "#f59e0b" }} />
                    <span className="text-slate-600">21–50% (vàng):</span>
                    <span className="font-medium">{summary.amber}</span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="inline-block w-3 h-3 rounded-[2px]" style={{ background: "#dc2626" }} />
                    <span className="text-slate-600">≤ 20% (đỏ):</span>
                    <span className="font-medium">{summary.red}</span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="inline-block w-3 h-3 rounded-[2px] bg-slate-300" />
                    <span className="text-slate-600">Empty:</span>
                    <span className="font-medium">{summary.empty}</span>
                </div>
            </div>
        </button>
    );
}

function BatterySlot({ data, selected, onClick }) {
    const isEmpty = data.empty;
    const soc = data.soc ?? 0;
    const color = socColor(isEmpty ? null : soc);

    return (
        <button
            onClick={onClick}
            className={`relative w-full h-[120px] rounded-xl border transition bg-slate-100
                  ${selected ? "ring-2 ring-blue-500" : ""}`}
            title={
                isEmpty
                    ? `${data.pillarId} • ${data.pos} • Empty • Slot ${data.slotId}`
                    : `${data.pillarId} • ${data.code} • ${data.pos} • Slot ${data.slotId} • SoC ${soc}%`
            }
        >
            {!isEmpty && (
                <div
                    className="absolute bottom-0 left-0 right-0 rounded-b-xl"
                    style={{ height: `${clamp(soc, 0, 100)}%`, background: color }}
                />
            )}
            <div className="absolute inset-0 grid place-items-center text-[13px] font-semibold">
                {isEmpty ? "＋" : `${soc}%`}
            </div>
            <div className="absolute left-2 top-2 text-[11px] font-bold text-slate-700">{data.pos}</div>
            {!isEmpty && (
                <div className="absolute right-2 bottom-2 text-[11px] font-medium opacity-80">{data.code}</div>
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

function DetailPanel({ selected }) {
    return (
        <div className="rounded-2xl border bg-white shadow-sm p-4">
            <div className="font-semibold mb-3">Thông tin Pin</div>
            {!selected ? (
                <p className="text-sm text-slate-500">Chọn một ô để xem chi tiết (SoH, SoC, vị trí, mã Pin).</p>
            ) : selected.empty ? (
                <div className="space-y-2 text-sm">
                    <Row k="Pillar ID" v={selected.pillarId} />
                    <Row k="Slot ID" v={selected.slotId} />
                    <Row k="Position" v={selected.pos} />
                    <div className="mt-2 px-3 py-2 rounded-lg bg-slate-100 text-slate-600 text-sm">Slot trống (Empty)</div>
                </div>
            ) : (
                <div className="space-y-2 text-sm">
                    <Row k="Pillar ID" v={selected.pillarId} />
                    <Row k="Slot ID" v={selected.slotId} />
                    <Row k="Position" v={selected.pos} />
                    <Row k="Battery Code" v={selected.code} />
                    <Row k="SoC" v={`${selected.soc}%`} />
                    <Row k="SoH" v={`${selected.soh}%`} />
                    {selected.stationId && <Row k="Station ID" v={selected.stationId} />}
                    {selected.batteryStatus && <Row k="Battery Status" v={selected.batteryStatus} />}
                    {selected.pillarStatus && <Row k="Pillar Status" v={selected.pillarStatus} />}
                    <div className="mt-3 h-2 w-full rounded-full bg-slate-200 overflow-hidden">
                        <div
                            className="h-full"
                            style={{ width: `${clamp(selected.soc, 0, 100)}%`, background: socColor(selected.soc) }}
                        />
                    </div>
                </div>
            )}
        </div>
    );
}

/* ===== Page ===== */
export default function BatteryManager() {
    // 1) Lấy 3 trụ dùng UserId
    const [userId] = useState(() => localStorage.getItem("userId") || "");

    const [pillars, setPillars] = useState([]);
    const [slotsByPillar, setSlotsByPillar] = useState({});
    const [activePillarId, setActivePillarId] = useState(null);
    const [selected, setSelected] = useState(null);

    const [loadingPillars, setLoadingPillars] = useState(false);
    const [loadingSlots, setLoadingSlots] = useState(false);
    const [error, setError] = useState("");

    // Lấy danh sách trụ
    useEffect(() => {
        let mounted = true;
        (async () => {
            if (!userId) {
                setError("Thiếu userId trong localStorage. Vui lòng đăng nhập lại.");
                return;
            }
            try {
                setLoadingPillars(true);
                setError("");
                const res = await api.get(ROUTES.PILLARS, { params: { UserId: userId } });
                const list = normalizePillarsFromServer(res.data);
                if (!mounted) return;
                setPillars(list);
            } catch (e) {
                if (mounted) setError("Lỗi khi tải danh sách pillars từ BE.");
            } finally {
                if (mounted) setLoadingPillars(false);
            }
        })();
        return () => { mounted = false; };
    }, [userId]);

    // Mở 1 trụ → lấy 20 slot từ /battery-in-pillar?pillarId=...
    const openPillar = async (pillarId) => {
        setActivePillarId(pillarId);
        setSelected(null);

        if (slotsByPillar[pillarId]) return;

        try {
            setLoadingSlots(true);
            setError("");
            const res = await api.get(ROUTES.SLOTS, { params: { pillarId } });
            const normalized = normalizeSlotsFromServer(res.data, pillarId);
            setSlotsByPillar((prev) => ({ ...prev, [pillarId]: normalized }));
        } catch (e) {
            setSlotsByPillar((prev) => ({ ...prev, [pillarId]: [] }));
            setError("Chưa lấy được danh sách slot từ BE.");
        } finally {
            setLoadingSlots(false);
        }
    };

    const backToPillars = () => { setActivePillarId(null); setSelected(null); };

    const legend = useMemo(
        () => [
            { color: "#dc2626", label: "≤ 20% (Đỏ)" },
            { color: "#f59e0b", label: "21–50% (Vàng)" },
            { color: "#22c55e", label: "> 50% (Xanh lá)" },
            { color: "#94a3b8", label: "Empty" },
        ],
        []
    );

    const currentSlots = activePillarId ? slotsByPillar[activePillarId] : null;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                    <h1 className="text-xl font-bold">Battery Management</h1>
                    <p className="text-sm text-slate-500">
                        {activePillarId
                            ? `${activePillarId} • 20 slots`
                            : loadingPillars
                                ? "Đang tải danh sách pillars…"
                                : "Chọn một pillarId để xem 20 ô Pin."}
                    </p>
                </div>

                <div className="flex items-center gap-4">
                    <div className="hidden md:flex items-center gap-3">
                        {legend.map((l) => (
                            <div key={l.label} className="flex items-center gap-2 text-xs">
                                <span className="inline-block w-3 h-3 rounded-sm border" style={{ background: l.color }} />
                                <span className="text-slate-600">{l.label}</span>
                            </div>
                        ))}
                    </div>

                    {activePillarId ? (
                        <div className="flex items-center gap-2">
                            <button className="px-3 py-2 rounded-lg border text-sm" onClick={backToPillars}>
                                ← All pillars
                            </button>
                        </div>
                    ) : null}
                </div>
            </div>

            {!!error && !loadingPillars && !activePillarId && (
                <div className="text-sm text-red-600">{error}</div>
            )}

            {/* Body */}
            {!activePillarId ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {pillars.length === 0 && !loadingPillars ? (
                        <div className="text-slate-500 text-sm">Không có pillar nào.</div>
                    ) : (
                        pillars.map((p) => (
                            <PillarTile
                                key={p.pillarId}
                                pillarId={p.pillarId}
                                totalSlots={p.totalSlots}
                                summary={p.summary}
                                onOpen={() => openPillar(p.pillarId)}
                            />
                        ))
                    )}
                </div>
            ) : (
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                    <div className="xl:col-span-2 rounded-2xl border bg-white shadow-sm">
                        <div className="px-4 py-3 border-b flex items-center justify-between">
                            <div className="font-semibold">{activePillarId}</div>
                            <div className="text-xs text-slate-500">20 slots • 5×4</div>
                        </div>

                        {loadingSlots && !currentSlots ? (
                            <div className="p-6 text-sm text-slate-500">Đang tải slots…</div>
                        ) : currentSlots && currentSlots.length > 0 ? (
                            <div className="p-3 grid grid-cols-2 sm:grid-cols-4 gap-3">
                                {currentSlots.map((slot) => (
                                    <BatterySlot
                                        key={slot.slotId}
                                        data={slot}
                                        selected={selected && selected.pillarId === activePillarId && selected.slotId === slot.slotId}
                                        onClick={() => setSelected({ ...slot })}
                                    />
                                ))}
                            </div>
                        ) : (
                            <div className="p-6 text-sm text-slate-500">Chưa có dữ liệu slot từ BE.</div>
                        )}
                    </div>

                    <DetailPanel selected={selected} />
                </div>
            )}
        </div>
    );
}