// src/pages/staff/BatteryManager.jsx
import React, { useEffect, useMemo, useState } from "react";
import api from "@/api/api";

/* ===== Endpoint BE =====
 * 1) Lấy danh sách trụ (pillar) cho staff:
 *    GET /PillarSlot/staff-pillar-slot?UserId=...
 *
 * 2) Lấy 20 ô pin (slot) của 1 trụ:
 *    GET /PillarSlot/battery-in-pillar?pillarId=PI-...
 *
 * 3) Lấy kho pin tại station (warehouse):
 *    GET /Station/station-inventory?StaffId=...
 *
 * 4) Gắn pin từ kho vào 1 slot trống:
 *    POST /PillarSlot/store-battery-inventory-to-pillar-slot
 *
 * 5) Lấy pin ra khỏi slot, trả về kho:
 *    POST /PillarSlot/take-out-slot
 */
const ROUTES = {
    PILLARS: "/PillarSlot/staff-pillar-slot",
    SLOTS: "/PillarSlot/battery-in-pillar",
    WAREHOUSE: "/Station/station-inventory",
    STORE: "/PillarSlot/store-battery-inventory-to-pillar-slot",
    TAKE_OUT_WAREHOUSE: "/PillarSlot/take-out-slot",
};

/* ===== Hàm tiện ích ===== */

// mapping vị trí ô 5x4 = 20 ô: A1..E4
const ROWS = ["A", "B", "C", "D", "E"];

const clamp = (n, a, b) => Math.max(a, Math.min(b, n));

const toPos = (zeroIndex) =>
    `${ROWS[Math.floor(zeroIndex / 4)]}${(zeroIndex % 4) + 1}`;

// màu thanh fill SoC
const socColor = (soc) => {
    if (soc == null) return "#94a3b8"; // xám
    if (soc <= 20) return "#dc2626";   // đỏ
    if (soc <= 50) return "#f59e0b";   // vàng
    return "#22c55e";                  // xanh lá
};

// ép %, phòng hờ BE trả weird value
const clampPct = (x) => {
    const n = Number(x);
    return Number.isFinite(n) ? clamp(Math.round(n), 0, 100) : null;
};

/* ===== Chuẩn hoá dữ liệu trụ (pillar) từ BE =====
 * BE có thể trả data trực tiếp hoặc { data: [...] }
 * Ta gom lại thành { pillarId, pillarName, totalSlots, summary{...} }
 */
function normalizePillarsFromServer(payload) {
    const data = Array.isArray(payload)
        ? payload
        : Array.isArray(payload?.data)
        ? payload.data
        : [];

    return data
        .map((x) => {
            // BE có thể đặt tên khác nhau cho id trụ
            const id =
                x?.pillarSlotId ||
                x?.pillarId ||
                x?.id ||
                x?.pillar ||
                null;
            if (!id) return null;

            return {
                pillarId: id,
                // BE có thể gửi pillarName hoặc name, fallback dùng id
                pillarName: x?.pillarName || x?.name || id,
                // tổng số slot, fallback 20
                totalSlots:
                    Number(
                        x?.totalSlots ??
                            x?.slotCount ??
                            x?.numberOfSlots ??
                            x?.slots ??
                            20
                    ) || 20,
                // thống kê số lượng theo màu/trạng thái
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

/* ===== Chuẩn hoá dữ liệu slot từ BE =====
 * Mỗi trụ luôn hiển thị lưới 20 ô.
 * BE có thể chỉ trả những ô đang có dữ liệu.
 * Ta merge vào khung mặc định 20 ô (A1..E4).
 *
 * Quan trọng:
 * - pillarStatus === "lock"  => slot bị khoá, ko dock pin vào được
 * - batteryStatus === "maintenance" => ô sẽ tô đỏ, badge "Maintenance"
 */
function normalizeSlotsFromServer(payload, pillarId) {
    const serverList = Array.isArray(payload)
        ? payload
        : Array.isArray(payload?.data)
        ? payload.data
        : [];

    // khung mặc định 20 slot
    const slots = Array.from({ length: 20 }, (_, i) => ({
        pillarId,
        index: i,
        slotNumber: i + 1,
        slotId: null,      // id slot thật bên BE
        code: null,        // mã pin/batteryId
        pos: toPos(i),     // A1, A2, ...
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
        if (!Number.isFinite(slotNumber) || slotNumber < 1 || slotNumber > 20)
            continue;

        const idx = slotNumber - 1;

        const code =
            s?.batteryId ?? s?.batteryCode ?? s?.code ?? null;
        const realSlotId = s?.slotId ?? s?.id ?? null;

        const socRaw = s?.batterySoc ?? s?.soc ?? s?.battery?.soc;
        const sohRaw = s?.batterySoh ?? s?.soh ?? s?.battery?.soh;

        // pillarStatus: nếu = "lock" -> isLocked = true
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

/* ===== UI component: Thẻ trụ (PillarTile)
 * Một card đại diện cho 1 trụ. Click sẽ mở trụ đó.
 */
function PillarTile({ pillarId, pillarName, totalSlots, summary, onOpen }) {
    return (
        <button
            onClick={onOpen}
            className="w-full rounded-2xl border bg-white shadow-sm p-5 text-left hover:shadow-md transition"
            title={`${pillarName} (${pillarId}) • ${totalSlots} slots`}
            type="button"
        >
            <div className="flex items-center justify-between">
                <div className="text-lg font-semibold">
                    {pillarName || pillarId}
                </div>
                <div className="text-xs text-slate-500">
                    {totalSlots} slots
                </div>
            </div>

            <div className="mt-4 space-y-2 text-sm">
                <div className="flex items-center gap-2">
                    <span
                        className="inline-block w-3 h-3 rounded-[2px]"
                        style={{ background: "#22c55e" }}
                    />
                    <span className="text-slate-600">Full batteries:</span>
                    <span className="font-medium">{summary.green}</span>
                </div>

                <div className="flex items-center gap-2">
                    <span
                        className="inline-block w-3 h-3 rounded-[2px]"
                        style={{ background: "#f59e0b" }}
                    />
                    <span className="text-slate-600">Charging:</span>
                    <span className="font-medium">{summary.amber}</span>
                </div>

                <div className="flex items-center gap-2">
                    <span
                        className="inline-block w-3 h-3 rounded-[2px]"
                        style={{ background: "#dc2626" }}
                    />
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

/* ===== UI component: 1 ô slot pin (BatterySlot)
 * - Hiển thị pin trong ô slot hoặc "＋" nếu trống
 * - Hiển thị trạng thái "Maintenance" (pin hư) hoặc "Locked 🔒" (slot bị khoá)
 * - Nếu slot trống và không lock => có nút "Add battery"
 */
function BatterySlot({ data, selected, onClick, onAdd }) {
    const isEmpty = data.empty;
    const soc = data.soc ?? 0;
    const color = socColor(isEmpty ? null : soc);

    const isMaintenance =
        String(data?.batteryStatus || "").toLowerCase() ===
        "maintenance";
    const isLocked = !!data.isLocked;

    // chọn màu nền / viền ưu tiên: Lock > Maintenance > bình thường
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
        : `${data.pillarId} • ${data.code} • ${data.pos} • Slot ${data.slotNumber} • SoC ${soc}%` +
          (isLocked
              ? " • Locked"
              : isMaintenance
              ? " • Maintenance"
              : "");

    return (
        <button
            onClick={onClick}
            className={`relative w-full h-[120px] rounded-xl border transition ${baseClass} ${ringClass}`}
            title={titleText}
            type="button"
        >
            {/* Thanh fill SoC dưới đáy (ẩn nếu slot rỗng / maintenance / locked) */}
            {!isEmpty && !isMaintenance && !isLocked && (
                <div
                    className="absolute bottom-0 left-0 right-0 rounded-b-xl"
                    style={{
                        height: `${clamp(soc, 0, 100)}%`,
                        background: color,
                    }}
                />
            )}

            {/* Nội dung chính giữa ô */}
            <div className="absolute inset-0 grid place-items-center text-[13px] font-semibold text-slate-800">
                {isEmpty
                    ? "＋"
                    : isLocked
                    ? "Locked 🔒"
                    : isMaintenance
                    ? "Maintenance"
                    : `${soc}%`}
            </div>

            {/* Nhãn góc trên trái: vị trí A1, A2,... */}
            <div className="absolute left-2 top-2 text-[11px] font-bold text-slate-700">
                {data.pos}
            </div>

            {/* Góc dưới phải: mã pin */}
            {!isEmpty && (
                <div className="absolute right-2 bottom-2 text-[11px] font-medium opacity-80">
                    {data.code}
                </div>
            )}

            {/* Badge Maintenance ở góc trên phải */}
            {isMaintenance && (
                <div className="absolute right-2 top-2 text-[10px] font-semibold px-1.5 py-0.5 rounded bg-red-500 text-white">
                    Maintenance
                </div>
            )}

            {/* Badge Locked ở góc trên phải */}
            {isLocked && (
                <div className="absolute right-2 top-2 text-[10px] font-semibold px-1.5 py-0.5 rounded bg-slate-600 text-white">
                    Locked 🔒
                </div>
            )}

            {/* Ô trống + không lock => cho phép "Add battery" */}
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

/* ===== UI tiện ích: 1 dòng key-value trong panel chi tiết ===== */
function Row({ k, v }) {
    return (
        <div className="flex items-center justify-between">
            <span className="text-slate-500">{k}</span>
            <span className="font-medium">{v}</span>
        </div>
    );
}

/* ===== Panel chi tiết bên phải (DetailPanel)
 * - Hiện thông tin slot đang chọn
 * - Có nút Take out đưa pin về kho (nếu slot có pin)
 * - KHÔNG còn nút "đưa pin cho khách"
 */
function DetailPanel({ selected, onRequestRemove }) {
    const isLocked = !!selected?.isLocked;

    return (
        <div className="rounded-2xl border bg-white shadow-sm p-4">
            <div className="font-semibold mb-3">Battery details</div>

            {/* Nếu chưa chọn ô nào */}
            {!selected ? (
                <p className="text-sm text-slate-500">
                    Click a slot to view SoC / SoH / position / code.
                </p>
            ) : selected.empty ? (
                /* Nếu ô trống */
                <div className="space-y-2 text-sm">
                    <Row k="Pillar ID" v={selected.pillarId} />
                    <Row k="Slot #" v={selected.slotNumber} />
                    <Row k="Grid Pos" v={selected.pos} />
                    <Row
                        k="Pillar Status"
                        v={
                            isLocked
                                ? "Locked 🔒"
                                : selected.pillarStatus || "—"
                        }
                    />
                    <div className="mt-2 px-3 py-2 rounded-lg bg-slate-100 text-slate-600 text-sm">
                        Empty slot
                    </div>
                </div>
            ) : (
                /* Nếu ô có pin */
                <div className="space-y-2 text-sm">
                    <Row k="Pillar ID" v={selected.pillarId} />
                    <Row k="Slot #" v={selected.slotNumber} />
                    <Row k="Slot ID (BE)" v={selected.slotId ?? "—"} />
                    <Row k="Grid Pos" v={selected.pos} />
                    <Row k="Battery Code" v={selected.code} />
                    <Row k="SoC" v={`${selected.soc}%`} />
                    <Row k="SoH" v={`${selected.soh}%`} />

                    {selected.stationId && (
                        <Row k="Station ID" v={selected.stationId} />
                    )}

                    {selected.batteryStatus && (
                        <Row
                            k="Battery Status"
                            v={
                                String(selected.batteryStatus).toLowerCase() ===
                                "maintenance"
                                    ? "Maintenance 🔧"
                                    : selected.batteryStatus
                            }
                        />
                    )}

                    <Row
                        k="Pillar Status"
                        v={
                            isLocked
                                ? "Locked 🔒"
                                : selected.pillarStatus || "—"
                        }
                    />

                    {/* Thanh hiển thị SoC dạng progress */}
                    <div className="mt-3 h-2 w-full rounded-full bg-slate-200 overflow-hidden">
                        <div
                            className="h-full"
                            style={{
                                width: `${clamp(selected.soc, 0, 100)}%`,
                                background: socColor(selected.soc),
                            }}
                        />
                    </div>

                    {/* Nút lấy pin ra trả kho */}
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

/* ===== Modal AddBatteryModal =====
 * Mục đích:
 * - Chọn pin từ kho (warehouse)
 * - Dock pin vào slot trống
 * Ràng buộc:
 * - Slot bị Lock thì không được dock
 */
function AddBatteryModal({ open, onClose, slot, staffId, onDocked }) {
    const [search, setSearch] = useState("");
    const [busy, setBusy] = useState(false);
    const [msg, setMsg] = useState("");

    const [loadingInv, setLoadingInv] = useState(false);
    const [invErr, setInvErr] = useState("");
    const [warehouse, setWarehouse] = useState([]);

    const locked = !!slot?.isLocked;

    // Khi mở modal: load danh sách pin trong kho
    useEffect(() => {
        if (!open) return;

        setSearch("");
        setBusy(false);
        setMsg("");
        setWarehouse([]);
        setInvErr("");

        if (!staffId) {
            setInvErr(
                "Missing staffId — please re-login or restore localStorage."
            );
            return;
        }

        const ac = new AbortController();
        (async () => {
            try {
                setLoadingInv(true);
                // gọi BE lấy kho pin theo staffId
                const res = await api.get(ROUTES.WAREHOUSE, {
                    params: { StaffId: staffId },
                    signal: ac.signal,
                });

                // BE có thể trả {data:[...]} hoặc [...]
                const raw = Array.isArray(res?.data?.data)
                    ? res.data.data
                    : Array.isArray(res?.data)
                    ? res.data
                    : [];

                // chỉ lấy pin có status = warehouse
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
                        capacity: Number(
                            it?.capacity ?? it?.capacityKWh ?? 0
                        ),
                        stationId: it?.stationId,
                    }))
                    // sắp xếp pin theo chất lượng SoH giảm dần
                    .sort(
                        (a, b) => (b.soh ?? 0) - (a.soh ?? 0)
                    );

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

    // pin user chọn trong kho để dock
    const [selectedId, setSelectedId] = useState(null);
    useEffect(() => {
        if (open) setSelectedId(null);
    }, [open]);

    // helper hiển thị toast
    const toast = (t, isErr = false) => {
        setMsg(t ? (isErr ? `❌ ${t}` : `✅ ${t}`) : "");
        if (t) {
            setTimeout(() => setMsg(""), 2200);
        }
    };

    // filter theo search
    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        if (!q) return warehouse;
        return warehouse.filter((w) =>
            (w.batteryId || "").toLowerCase().includes(q)
        );
    }, [search, warehouse]);

    // Gửi yêu cầu dock pin vào slot
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
            toast(
                "Missing slotId. Please reopen this pillar to refresh.",
                true
            );
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
            toast(
                res?.data?.message || "Battery docked into slot."
            );
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
                {/* Header modal */}
                <div className="px-5 py-4 border-b flex items-center justify-between">
                    <div className="font-semibold">
                        Dock battery from warehouse
                    </div>
                    <button
                        className="text-slate-500 hover:text-slate-700"
                        onClick={() => !busy && onClose?.()}
                        title="Close"
                        type="button"
                    >
                        ✕
                    </button>
                </div>

                {/* Body modal */}
                <div className="p-5 space-y-4 text-sm">
                    {/* Info slot đang gắn pin */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                        <div>
                            <div className="text-slate-500">Pillar</div>
                            <div className="font-medium">
                                {slot.pillarId}
                            </div>
                        </div>
                        <div>
                            <div className="text-slate-500">Slot</div>
                            <div className="font-medium">
                                {slot.slotNumber} ({slot.pos})
                            </div>
                        </div>
                        <div>
                            <div className="text-slate-500">
                                Slot ID (BE)
                            </div>
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

                    {/* Cảnh báo nếu slot đang lock */}
                    {locked && (
                        <div className="rounded-lg border border-slate-500 bg-slate-100 text-slate-700 px-3 py-2 text-xs font-medium">
                            This slot is <b>Locked 🔒</b>. You cannot dock
                            a battery here.
                        </div>
                    )}

                    {/* Ô search pin trong kho */}
                    <div className="flex items-center justify-between gap-3">
                        <input
                            className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Search by battery ID..."
                            value={search}
                            onChange={(e) =>
                                setSearch(e.target.value)
                            }
                            disabled={loadingInv}
                        />
                        <div className="text-xs text-slate-500 shrink-0">
                            {loadingInv
                                ? "Loading warehouse..."
                                : `Warehouse: ${warehouse.length} batteries`}
                        </div>
                    </div>

                    {!!invErr && (
                        <div className="text-sm text-red-600">
                            {invErr}
                        </div>
                    )}
                    {!!msg && (
                        <div className="font-semibold">{msg}</div>
                    )}

                    {/* Bảng danh sách pin trong kho */}
                    <div className="rounded-xl border overflow-hidden">
                        <table className="w-full text-sm">
                            <thead className="bg-slate-50">
                                <tr>
                                    <th className="px-3 py-2 text-left">
                                        Pick
                                    </th>
                                    <th className="px-3 py-2 text-left">
                                        Battery ID
                                    </th>
                                    <th className="px-3 py-2 text-left">
                                        SoH
                                    </th>
                                    <th className="px-3 py-2 text-left">
                                        SoC
                                    </th>
                                    <th className="px-3 py-2 text-left">
                                        Capacity
                                    </th>
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
                                                    checked={
                                                        selectedId ===
                                                        b.batteryId
                                                    }
                                                    onChange={() =>
                                                        setSelectedId(
                                                            b.batteryId
                                                        )
                                                    }
                                                    disabled={
                                                        locked
                                                    }
                                                />
                                            </td>
                                            <td className="px-3 py-2 font-medium">
                                                {b.batteryId}
                                            </td>
                                            <td className="px-3 py-2">
                                                {b.soh != null
                                                    ? `${b.soh}%`
                                                    : "—"}
                                            </td>
                                            <td className="px-3 py-2">
                                                {b.soc != null
                                                    ? `${b.soc}%`
                                                    : "—"}
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

                    {/* Nút hành động */}
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
                            disabled={
                                busy ||
                                !selectedId ||
                                locked
                            }
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

/* ===== Modal RemoveBatteryModal =====
 * Mục đích:
 * - Xác nhận lấy pin ra khỏi slot
 * - Gửi pin đó về kho
 */
function RemoveBatteryModal({
    open,
    onClose,
    slot,
    staffId,
    onRemoved,
}) {
    const [busy, setBusy] = useState(false);
    const [msg, setMsg] = useState("");

    // reset state khi mở modal
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

    // gửi request BE lấy pin ra khỏi slot
    const handleRemove = async () => {
        if (!slot?.slotId) {
            toast(
                "Missing slotId. Please reopen the pillar to refresh.",
                true
            );
            return;
        }
        if (!staffId) {
            toast(
                "Missing staffId — please log in again.",
                true
            );
            return;
        }

        try {
            setBusy(true);
            const payload = {
                staffId,
                pillarSlotId:
                    Number(slot.slotId) || slot.slotId,
                batteryId: slot.code,
            };
            const res = await api.post(
                ROUTES.TAKE_OUT_WAREHOUSE,
                payload
            );
            toast(
                res?.data?.message ||
                    "Battery removed and sent to warehouse."
            );
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
                {/* Header modal */}
                <div className="px-5 py-4 border-b flex items-center justify-between">
                    <div className="font-semibold">
                        Confirm take-out
                    </div>
                    <button
                        className="text-slate-500 hover:text-slate-700"
                        onClick={() => !busy && onClose?.()}
                        title="Close"
                        type="button"
                    >
                        ✕
                    </button>
                </div>

                {/* Body modal */}
                <div className="p-5 space-y-3 text-sm">
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <div className="text-slate-500">
                                Pillar
                            </div>
                            <div className="font-medium">
                                {slot.pillarId}
                            </div>
                        </div>

                        <div>
                            <div className="text-slate-500">
                                Slot
                            </div>
                            <div className="font-medium">
                                {slot.slotNumber} ({slot.pos})
                            </div>
                        </div>

                        <div>
                            <div className="text-slate-500">
                                Slot ID
                            </div>
                            <div className="font-medium">
                                {slot.slotId}
                            </div>
                        </div>

                        <div>
                            <div className="text-slate-500">
                                Battery
                            </div>
                            <div className="font-medium">
                                {slot.code}
                            </div>
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
                            {busy
                                ? "Working..."
                                : "Confirm take-out"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

/* ===== Component trang chính BatteryManager =====
 * Đây là trang "Battery Management" của Staff
 * Luồng chính:
 *  - B1: load danh sách pillar bằng userId (từ localStorage)
 *  - B2: click 1 pillar -> load 20 slots (nếu chưa có cache)
 *  - B3: chọn 1 slot -> xem detail panel
 *  - B4: modal AddBatteryModal để dock pin từ kho
 *  - B5: modal RemoveBatteryModal để lấy pin ra trả kho
 * Ngoài ra:
 *  - Hiển thị Locked 🔒 nếu pillarStatus = "lock"
 *  - Hiển thị Maintenance nếu batteryStatus = "maintenance"
 *  - Header hiển thị pillarName BE trả về
 */
export default function BatteryManager() {
    // userId: dùng để gọi API lấy danh sách pillar
    const [userId] = useState(() =>
        (localStorage.getItem("userId") || "").trim()
    );

    // staffId: gửi lên các API thao tác kho / dock / take-out
    const [staffId] = useState(() =>
        (
            localStorage.getItem("staffId") ||
            localStorage.getItem("StaffId") ||
            localStorage.getItem("userId") ||
            ""
        ).trim()
    );

    // danh sách pillar
    const [pillars, setPillars] = useState([]); // [{ pillarId, pillarName, totalSlots, summary }, ...]

    // cache slot theo pillarId
    const [slotsByPillar, setSlotsByPillar] = useState({}); // { [pillarId]: Slot[] }

    // pillar đang mở để show grid 20 ô
    const [activePillarId, setActivePillarId] = useState(null);

    // slot đang được chọn để show detail panel
    const [selected, setSelected] = useState(null);

    // state loading / error
    const [loadingPillars, setLoadingPillars] = useState(false);
    const [loadingSlots, setLoadingSlots] = useState(false);
    const [error, setError] = useState("");

    // state modal dock pin
    const [addOpen, setAddOpen] = useState(false);
    const [targetSlot, setTargetSlot] = useState(null);

    // state modal take-out pin
    const [removeOpen, setRemoveOpen] = useState(false);
    const [removeTarget, setRemoveTarget] = useState(null);

    /* ===== useEffect: load danh sách pillar khi mount ===== */
    useEffect(() => {
        const ac = new AbortController();
        (async () => {
            if (!userId) {
                setError(
                    "Missing userId in localStorage. Please log in again."
                );
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

    /* ===== Hàm mở 1 pillar cụ thể
     * nếu chưa cache slotsByPillar[pillarId] thì gọi BE để lấy 20 slot
     */
    const openPillar = async (pillarId) => {
        setActivePillarId(pillarId);
        setSelected(null);

        // nếu đã có cache rồi thì không fetch lại liền
        if (slotsByPillar[pillarId]) return;

        const ac = new AbortController();
        try {
            setLoadingSlots(true);
            setError("");
            const res = await api.get(ROUTES.SLOTS, {
                params: { pillarId },
                signal: ac.signal,
            });
            const normalized = normalizeSlotsFromServer(
                res.data,
                pillarId
            );
            setSlotsByPillar((prev) => ({
                ...prev,
                [pillarId]: normalized,
            }));
        } catch (e) {
            if (ac.signal.aborted) return;
            setSlotsByPillar((prev) => ({
                ...prev,
                [pillarId]: [],
            }));
            setError("Failed to load slots for this pillar.");
        } finally {
            setLoadingSlots(false);
        }
    };

    /* ===== Hàm refresh lại 20 slot cho pillar đang mở ===== */
    const refreshCurrentPillarSlots = async () => {
        if (!activePillarId) return;
        const ac = new AbortController();
        try {
            setLoadingSlots(true);
            const res = await api.get(ROUTES.SLOTS, {
                params: { pillarId: activePillarId },
                signal: ac.signal,
            });
            const normalized = normalizeSlotsFromServer(
                res.data,
                activePillarId
            );
            setSlotsByPillar((prev) => ({
                ...prev,
                [activePillarId]: normalized,
            }));
        } catch {
            // nếu fail thì giữ nguyên data cũ
        } finally {
            setLoadingSlots(false);
        }
    };

    // quay lại màn danh sách pillar
    const backToPillars = () => {
        setActivePillarId(null);
        setSelected(null);
    };

    // legend màu ở góc phải header
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

    // tìm thông tin pillar đang mở để hiển thị tên (pillarName)
    const activePillarInfo = useMemo(() => {
        if (!activePillarId) return null;
        return (
            pillars.find(
                (p) => p.pillarId === activePillarId
            ) || null
        );
    }, [activePillarId, pillars]);

    // danh sách slot (20 ô) của pillar đang mở
    const currentSlots = activePillarId
        ? slotsByPillar[activePillarId]
        : null;

    return (
        <div className="space-y-6">
            {/* ===== Header trang ===== */}
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                    <h1 className="text-xl font-bold">
                        {activePillarId
                            ? `Battery Management – ${
                                  activePillarInfo?.pillarName ||
                                  activePillarId
                              }`
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
                    {/* legend màu trạng thái */}
                    <div className="hidden md:flex items-center gap-3">
                        {legend.map((l) => (
                            <div
                                key={l.label}
                                className="flex items-center gap-2 text-xs"
                            >
                                <span
                                    className="inline-block w-3 h-3 rounded-sm border"
                                    style={{
                                        background: l.color,
                                    }}
                                />
                                <span className="text-slate-600">
                                    {l.label}
                                </span>
                            </div>
                        ))}
                    </div>

                    {/* nút quay lại / refresh chỉ xuất hiện nếu đang xem 1 pillar */}
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

            {/* báo lỗi nếu có lỗi load pillar ban đầu */}
            {!!error &&
                !loadingPillars &&
                !activePillarId && (
                    <div className="text-sm text-red-600">
                        {error}
                    </div>
                )}

            {/* ===== Nội dung chính ===== */}
            {!activePillarId ? (
                // màn danh sách pillar
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {pillars.length === 0 &&
                    !loadingPillars ? (
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
                                onOpen={() =>
                                    openPillar(p.pillarId)
                                }
                            />
                        ))
                    )}
                </div>
            ) : (
                // màn chi tiết 1 pillar: grid slot + panel detail
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                    {/* Vùng grid 20 slot bên trái */}
                    <div className="xl:col-span-2 rounded-2xl border bg-white shadow-sm">
                        <div className="px-4 py-3 border-b flex items-center justify-between">
                            <div className="font-semibold">
                                {activePillarInfo?.pillarName ||
                                    activePillarId}
                            </div>
                            <div className="text-xs text-slate-500">
                                20 slots • 5×4
                            </div>
                        </div>

                        {loadingSlots && !currentSlots ? (
                            <div className="p-6 text-sm text-slate-500">
                                Loading slots…
                            </div>
                        ) : currentSlots &&
                          currentSlots.length >
                              0 ? (
                            <div className="p-3 grid grid-cols-2 sm:grid-cols-4 gap-3">
                                {currentSlots.map(
                                    (slot) => (
                                        <BatterySlot
                                            key={
                                                slot.slotId ??
                                                `${slot.pillarId}-${slot.slotNumber}`
                                            }
                                            data={slot}
                                            selected={
                                                selected &&
                                                selected.pillarId ===
                                                    activePillarId &&
                                                selected.slotNumber ===
                                                    slot.slotNumber
                                            }
                                            onClick={() =>
                                                setSelected({
                                                    ...slot,
                                                })
                                            }
                                            onAdd={(
                                                emptySlot
                                            ) => {
                                                setTargetSlot(
                                                    emptySlot
                                                );
                                                setAddOpen(
                                                    true
                                                );
                                            }}
                                        />
                                    )
                                )}
                            </div>
                        ) : (
                            <div className="p-6 text-sm text-slate-500">
                                No slot data from
                                backend.
                            </div>
                        )}
                    </div>

                    {/* Panel chi tiết bên phải */}
                    <DetailPanel
                        selected={selected}
                        onRequestRemove={(
                            slot
                        ) => {
                            if (
                                !slot ||
                                slot.empty
                            )
                                return;
                            setRemoveTarget(
                                slot
                            );
                            setRemoveOpen(
                                true
                            );
                        }}
                    />
                </div>
            )}

            {/* ===== Các modal thao tác ===== */}

            {/* Modal dock pin từ kho vào slot */}
            <AddBatteryModal
                open={addOpen}
                onClose={() =>
                    setAddOpen(false)
                }
                slot={targetSlot}
                staffId={staffId}
                onDocked={
                    refreshCurrentPillarSlots
                }
            />

            {/* Modal lấy pin ra -> trả kho */}
            <RemoveBatteryModal
                open={removeOpen}
                onClose={() =>
                    setRemoveOpen(false)
                }
                slot={removeTarget}
                staffId={staffId}
                onRemoved={
                    refreshCurrentPillarSlots
                }
            />
        </div>
    );
}
