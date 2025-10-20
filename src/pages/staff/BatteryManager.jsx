import React, { useMemo, useState } from "react";

/* ========= Helpers ========= */
const ROWS = ["A", "B", "C", "D", "E"]; // 5x4 = 20 slot
const toPos = (i) => `${ROWS[Math.floor(i / 4)]}${(i % 4) + 1}`;

const socColor = (soc) => {
    if (soc <= 20) return "#dc2626"; // red-600
    if (soc <= 50) return "#f59e0b"; // amber-500
    return "#22c55e"; // green-500
};

function makePillar(pillarIndex) {
    // tạo 20 ô với dữ liệu ngẫu nhiên
    return Array.from({ length: 20 }, (_, i) => {
        const soc = Math.floor(Math.random() * 101); // 0..100
        const soh = 70 + Math.floor(Math.random() * 31); // 70..100
        return {
            pillar: pillarIndex + 1,
            index: i,
            code: `PIN-${pillarIndex + 1}-${String(i + 1).padStart(3, "0")}`,
            pos: toPos(i),
            soc,
            soh,
        };
    });
}

function getDistribution(items) {
    const red = items.filter((x) => x.soc <= 20).length;
    const amber = items.filter((x) => x.soc >= 21 && x.soc <= 50).length;
    const green = items.filter((x) => x.soc > 50).length;
    return { red, amber, green };
}

/* ========= UI atoms ========= */
function PillarTile({ idx, items, onOpen }) {
    const { red, amber, green } = useMemo(() => getDistribution(items), [items]);

    return (
        <button
            onClick={onOpen}
            className="w-full rounded-2xl border bg-white shadow-sm p-5 text-left hover:shadow-md transition"
            title={`Pillar ${idx} • 20 slots`}
        >
            <div className="flex items-center justify-between">
                <div className="text-lg font-semibold">Pillar {idx}</div>
                <div className="text-2xl">🔋</div>
            </div>

            <div className="mt-4 space-y-2 text-sm">
                <div className="flex items-center gap-2">
                    <span className="inline-block w-3 h-3 rounded-[2px]" style={{ background: "#22c55e" }} />
                    <span className="text-slate-600">> 50% (xanh):</span>
                    <span className="font-medium">{green}</span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="inline-block w-3 h-3 rounded-[2px]" style={{ background: "#f59e0b" }} />
                    <span className="text-slate-600">21–50% (vàng):</span>
                    <span className="font-medium">{amber}</span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="inline-block w-3 h-3 rounded-[2px]" style={{ background: "#dc2626" }} />
                    <span className="text-slate-600">≤ 20% (đỏ):</span>
                    <span className="font-medium">{red}</span>
                </div>
            </div>

            <div className="mt-5 text-xs text-slate-500">Nhấn để xem 20 ô Pin</div>
        </button>
    );
}

function BatterySlot({ data, selected, onClick }) {
    const { soc } = data;
    const color = socColor(soc);

    return (
        <button
            onClick={onClick}
            className={`relative w-full h-[120px] rounded-xl border transition bg-slate-100
                  ${selected ? "ring-2 ring-blue-500" : ""}`}
            title={`${data.code} • ${data.pos} • SoC ${soc}%`}
        >
            {/* Cột màu SoC (đổ từ dưới lên) */}
            <div
                className="absolute bottom-0 left-0 right-0 rounded-b-xl"
                style={{ height: `${Math.min(Math.max(soc, 0), 100)}%`, background: color }}
            />
            {/* phần trăm */}
            <div className="absolute inset-0 grid place-items-center text-[13px] font-semibold">
                {soc}%
            </div>
            {/* vị trí */}
            <div className="absolute left-2 top-2 text-[11px] font-bold text-slate-700">{data.pos}</div>
            {/* mã pin */}
            <div className="absolute right-2 bottom-2 text-[11px] font-medium opacity-80">
                {data.code}
            </div>
        </button>
    );
}

function DetailPanel({ selected }) {
    return (
        <div className="rounded-2xl border bg-white shadow-sm p-4">
            <div className="font-semibold mb-3">Thông tin Pin</div>
            {!selected ? (
                <p className="text-sm text-slate-500">Chọn một ô để xem chi tiết (SoH, SoC, vị trí, mã Pin).</p>
            ) : (
                <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                        <span className="text-slate-500">Pillar</span>
                        <span className="font-medium">{selected.pillar}</span>
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="text-slate-500">Position</span>
                        <span className="font-medium">{selected.pos}</span>
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="text-slate-500">Battery Code</span>
                        <span className="font-medium">{selected.code}</span>
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="text-slate-500">SoC</span>
                        <span className="font-medium">{selected.soc}%</span>
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="text-slate-500">SoH</span>
                        <span className="font-medium">{selected.soh}%</span>
                    </div>
                    <div className="mt-3 h-2 w-full rounded-full bg-slate-200 overflow-hidden">
                        <div
                            className="h-full"
                            style={{ width: `${selected.soc}%`, background: socColor(selected.soc) }}
                        />
                    </div>
                </div>
            )}
        </div>
    );
}

/* ========= Page ========= */
export default function BatteryManager() {
    // dữ liệu cho 3 trụ
    const [pillars, setPillars] = useState(() => [makePillar(0), makePillar(1), makePillar(2)]);
    const [activePillar, setActivePillar] = useState(null); // 1..3 | null
    const [selected, setSelected] = useState(null);

    const legend = useMemo(
        () => [
            { color: "#dc2626", label: "≤ 20% (Đỏ)" },
            { color: "#f59e0b", label: "21–50% (Vàng)" },
            { color: "#22c55e", label: "> 50% (Xanh lá)" },
        ],
        []
    );

    const openPillar = (idx) => {
        setActivePillar(idx);
        setSelected(null);
    };

    const backToPillars = () => {
        setActivePillar(null);
        setSelected(null);
    };

    const rerandomizeActive = () => {
        if (!activePillar) return;
        setPillars((prev) => {
            const copy = [...prev];
            copy[activePillar - 1] = makePillar(activePillar - 1);
            return copy;
        });
        setSelected(null);
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                    <h1 className="text-xl font-bold">Battery Management</h1>
                    <p className="text-sm text-slate-500">
                        {activePillar
                            ? `Đang xem Pillar ${activePillar} • 20 slots`
                            : "Chọn một trụ để xem 20 ô Pin của trụ đó."}
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

                    {activePillar ? (
                        <div className="flex items-center gap-2">
                            <button
                                className="px-3 py-2 rounded-lg border text-sm"
                                onClick={backToPillars}
                            >
                                ← All pillars
                            </button>
                            <button
                                className="px-3 py-2 rounded-lg bg-slate-900 text-white text-sm"
                                onClick={rerandomizeActive}
                            >
                                Randomize
                            </button>
                        </div>
                    ) : null}
                </div>
            </div>

            {/* Body */}
            {activePillar == null ? (
                // ======= màn hình chọn 3 trụ =======
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <PillarTile idx={1} items={pillars[0]} onOpen={() => openPillar(1)} />
                    <PillarTile idx={2} items={pillars[1]} onOpen={() => openPillar(2)} />
                    <PillarTile idx={3} items={pillars[2]} onOpen={() => openPillar(3)} />
                </div>
            ) : (
                // ======= màn hình chi tiết 1 trụ (20 slot) =======
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                    <div className="xl:col-span-2 rounded-2xl border bg-white shadow-sm">
                        <div className="px-4 py-3 border-b flex items-center justify-between">
                            <div className="font-semibold">Pillar {activePillar}</div>
                            <div className="text-xs text-slate-500">20 slots • 5×4</div>
                        </div>

                        <div className="p-3 grid grid-cols-2 sm:grid-cols-4 gap-3">
                            {pillars[activePillar - 1].map((slot) => (
                                <BatterySlot
                                    key={slot.index}
                                    data={slot}
                                    selected={
                                        selected &&
                                        selected.pillar === activePillar &&
                                        selected.index === slot.index
                                    }
                                    onClick={() => setSelected({ ...slot, pillar: activePillar })}
                                />
                            ))}
                        </div>
                    </div>

                    <DetailPanel selected={selected} />
                </div>
            )}
        </div>
    );
}
