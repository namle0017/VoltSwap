/* eslint-disable no-unused-vars */
// src/pages/staff/BatteryManager.jsx
import React, { useEffect, useMemo, useState } from "react";
import api from "@/api/api";

/* ===== Endpoints =====
 * 1) Danh sách 3 trụ:      GET /PillarSlot/staff-pillar-slot?UserId=...
 * 2) Slots của 1 trụ:      GET /PillarSlot/battery-in-pillar?pillarId=PI-...
 * 3) Kho pin:              GET /Station/station-inventory?StaffId=...
 * 4) Dock kho -> slot:     POST /PillarSlot/store-battery-inventory-to-pillar-slot
 * 5) Lấy pin ra kho:       POST /PillarSlot/take-out-slot
 */
const ROUTES = {
  PILLARS: "/PillarSlot/staff-pillar-slot",
  SLOTS: "/PillarSlot/battery-in-pillar",
  WAREHOUSE: "/Station/station-inventory",
  STORE: "/PillarSlot/store-battery-inventory-to-pillar-slot",
  TAKE_OUT_WAREHOUSE: "/PillarSlot/take-out-slot",
};

/* ===== Helpers ===== */
const ROWS = ["A", "B", "C", "D", "E"];
const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
const toPos = (zeroIndex) => `${ROWS[Math.floor(zeroIndex / 4)]}${(zeroIndex % 4) + 1}`;

const socColor = (soc) => {
  if (soc == null) return "#94a3b8";
  if (soc <= 20) return "#dc2626";
  if (soc <= 50) return "#f59e0b";
  return "#22c55e";
};

const clampPct = (x) => {
  const n = Number(x);
  return Number.isFinite(n) ? clamp(Math.round(n), 0, 100) : null;
};

/* ===== Normalizers ===== */
function normalizePillarsFromServer(payload) {
  const data = Array.isArray(payload) ? payload : Array.isArray(payload?.data) ? payload.data : [];
  return data
    .map((x) => {
      const id = x?.pillarSlotId || x?.pillarId || x?.id || x?.pillar || null;
      if (!id) return null;
      return {
        pillarId: id,
        totalSlots: Number(x?.totalSlots ?? x?.slotCount ?? x?.numberOfSlots ?? x?.slots ?? 20) || 20,
        summary: {
          empty: Number(x?.numberOfSlotEmpty ?? x?.empty ?? 0) || 0,
          red: Number(x?.numberOfSlotRed ?? x?.red ?? 0) || 0,
          green: Number(x?.numberOfSlotGreen ?? x?.green ?? 0) || 0,
          amber: Number(x?.numberOfSlotYellow ?? x?.amber ?? x?.yellow ?? 0) || 0,
        },
      };
    })
    .filter(Boolean);
}

function normalizeSlotsFromServer(payload, pillarId) {
  const serverList = Array.isArray(payload)
    ? payload
    : Array.isArray(payload?.data) ? payload.data : [];

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
    status: null,        // vẫn giữ nếu BE có trả
    isLocked: false,     // <-- tính từ pillarStatus
  }));

  for (const s of serverList) {
    const slotNumber = Number(s?.slotNumber ?? s?.slotNo);
    if (!Number.isFinite(slotNumber) || slotNumber < 1 || slotNumber > 20) continue;

    const idx = slotNumber - 1;
    const code = s?.batteryId ?? s?.batteryCode ?? s?.code ?? null;
    const realSlotId = s?.slotId ?? s?.id ?? null;

    const socRaw = s?.batterySoc ?? s?.soc ?? s?.battery?.soc;
    const sohRaw = s?.batterySoh ?? s?.soh ?? s?.battery?.soh;

    const pillarStatusRaw = s?.pillarStatus ?? s?.slotStatus ?? null; // <-- lấy đúng trụ
    const isLocked = String(pillarStatusRaw ?? "").trim().toLowerCase() === "lock"; // <-- LOCK theo pillarStatus

    slots[idx] = {
      ...slots[idx],
      slotNumber,
      slotId: realSlotId,
      code,
      soc: clampPct(socRaw),
      soh: clampPct(sohRaw),
      stationId: s?.stationId ?? s?.station ?? null,
      batteryStatus: s?.batteryStatus ?? s?.battery_status ?? null,
      pillarStatus: pillarStatusRaw,
      status: s?.status ?? null, // chỉ hiển thị nếu cần
      isLocked,
      empty: !code,
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
      type="button"
    >
      <div className="flex items-center justify-between">
        <div className="text-lg font-semibold">{pillarId}</div>
        <div className="text-xs text-slate-500">{totalSlots} slots</div>
      </div>

      <div className="mt-4 space-y-2 text-sm">
        <div className="flex items-center gap-2">
          <span className="inline-block w-3 h-3 rounded-[2px]" style={{ background: "#22c55e" }} />
          <span className="text-slate-600">đã đầy:</span>
          <span className="font-medium">{summary.green}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-block w-3 h-3 rounded-[2px]" style={{ background: "#f59e0b" }} />
          <span className="text-slate-600">đang sạc :</span>
          <span className="font-medium">{summary.amber}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-block w-3 h-3 rounded-[2px]" style={{ background: "#dc2626" }} />
          <span className="text-slate-600">hết Pin:</span>
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

function BatterySlot({ data, selected, onClick, onAdd }) {
  const isEmpty = data.empty;
  const soc = data.soc ?? 0;
  const color = socColor(isEmpty ? null : soc);
  const isMaintenance = String(data?.batteryStatus || "").toLowerCase() === "maintenance";
  const isLocked = !!data?.isLocked; // chỉ true khi status === "lock"

  return (
    <button
      onClick={onClick}
      className={`relative w-full h-[120px] rounded-xl border transition
        ${isMaintenance ? "bg-red-50 border-red-500" : "bg-slate-100"}
        ${selected ? (isMaintenance ? "ring-2 ring-red-500" : "ring-2 ring-blue-500") : ""}`}
      title={
        isEmpty
          ? `${data.pillarId} • ${data.pos} • ${isLocked ? "Locked" : "Empty"} • SlotNo ${data.slotNumber}`
          : `${data.pillarId} • ${data.code} • ${data.pos} • SlotNo ${data.slotNumber} • SoC ${soc}%`
          + (isMaintenance ? " • Maintenance" : "")
          + (isLocked ? " • Locked" : "")
      }
      type="button"
    >
      {/* SoC bar chỉ hiện khi không Maintenance và không Locked */}
      {!isEmpty && !isMaintenance && !isLocked && (
        <div
          className="absolute bottom-0 left-0 right-0 rounded-b-xl"
          style={{ height: `${clamp(soc, 0, 100)}%`, background: color }}
        />
      )}

      {/* text trung tâm */}
      <div className="absolute inset-0 grid place-items-center text-[13px] font-semibold">
        {isLocked ? "🔒 Locked"
          : isEmpty ? "＋"
            : (isMaintenance ? "Maintenance" : `${soc}%`)}
      </div>

      {/* nhãn pos */}
      <div className="absolute left-2 top-2 text-[11px] font-bold text-slate-700">
        {data.pos}
      </div>

      {/* mã pin */}
      {!isEmpty && (
        <div className="absolute right-2 bottom-2 text-[11px] font-medium opacity-80">
          {data.code}
        </div>
      )}

      {/* badge Maintenance */}
      {isMaintenance && (
        <div className="absolute right-2 top-2 text-[10px] font-semibold px-1.5 py-0.5 rounded bg-red-500 text-white">
          Maintenance
        </div>
      )}

      {/* badge Locked (status === 'lock') */}
      {isLocked && (
        <div className="absolute right-2 top-2 text-[10px] font-semibold px-1.5 py-0.5 rounded bg-slate-800 text-white">
          🔒 Locked
        </div>
      )}

      {/* Slot trống -> Thêm Pin (chỉ cho phép khi không lock) */}
      {isEmpty && !isLocked && typeof onAdd === "function" && (
        <div className="absolute inset-x-2 bottom-2">
          <span
            role="button"
            tabIndex={0}
            className="w-full inline-flex justify-center text-xs px-2 py-1 rounded-md border bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
            onClick={(e) => { e.stopPropagation(); onAdd(data); }}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") { e.preventDefault(); e.stopPropagation(); onAdd(data); }
            }}
          >
            Thêm Pin
          </span>
        </div>
      )}

      {/* overlay mờ khi locked */}
      {isLocked && (
        <div className="absolute inset-0 rounded-xl bg-black/10 pointer-events-none" />
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
      <div className="font-semibold mb-3">Thông tin Pin</div>
      {!selected ? (
        <p className="text-sm text-slate-500">Chọn một ô để xem chi tiết (SoH, SoC, vị trí, mã Pin).</p>
      ) : selected.empty ? (
        <div className="space-y-2 text-sm">
          <Row k="Pillar ID" v={selected.pillarId} />
          <Row k="Slot No." v={selected.slotNumber} />
          <Row k="Position" v={selected.pos} />
          <Row k="Status" v={isLocked ? "Locked 🔒" : (selected.status ?? "—")} />
          <div className="mt-2 px-3 py-2 rounded-lg bg-slate-100 text-slate-600 text-sm">Slot trống</div>
        </div>
      ) : (
        <div className="space-y-2 text-sm">
          <Row k="Pillar ID" v={selected.pillarId} />
          <Row k="Slot No." v={selected.slotNumber} />
          <Row k="Slot ID (BE)" v={selected.slotId ?? "—"} />
          <Row k="Position" v={selected.pos} />
          <Row k="Battery Code" v={selected.code} />
          <Row k="SoC" v={`${selected.soc}%`} />
          <Row k="SoH" v={`${selected.soh}%`} />
          {selected.stationId && <Row k="Station ID" v={selected.stationId} />}
          {selected.batteryStatus && (
            <Row
              k="Battery Status"
              v={String(selected.batteryStatus).toLowerCase() === "maintenance" ? "Maintenance 🔧" : selected.batteryStatus}
            />
          )}
          {/* Hiển thị đúng field status từ BE; lock chỉ khi status === "lock" */}
          <Row k="Status" v={isLocked ? "Locked 🔒" : (selected.status ?? "—")} />
          {selected.pillarStatus && <Row k="Pillar Status" v={selected.pillarStatus} />}

          <div className="mt-3 h-2 w-full rounded-full bg-slate-200 overflow-hidden">
            <div
              className="h-full"
              style={{ width: `${clamp(selected.soc, 0, 100)}%`, background: socColor(selected.soc) }}
            />
          </div>

          <div className="pt-3 flex justify-end gap-2">
            <button
              type="button"
              className="px-3 py-2 rounded-lg border bg-red-600 text-white text-sm"
              onClick={() => onRequestRemove?.(selected)}
              title="Lấy pin ra và đưa về kho"
            >
              Lấy Pin ra (kho)
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ===== Modal: Dock từ kho vào slot ===== */
function AddBatteryModal({ open, onClose, slot, staffId, onDocked }) {
  const [search, setSearch] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  const [loadingInv, setLoadingInv] = useState(false);
  const [invErr, setInvErr] = useState("");
  const [warehouse, setWarehouse] = useState([]);

  useEffect(() => {
    if (!open) return;
    setSearch(""); setBusy(false); setMsg(""); setWarehouse([]); setInvErr("");

    if (!staffId) {
      setInvErr("Thiếu StaffId — vui lòng đăng nhập lại hoặc set localStorage.staffId.");
      return;
    }

    const ac = new AbortController();
    (async () => {
      try {
        setLoadingInv(true);
        const res = await api.get(ROUTES.WAREHOUSE, { params: { StaffId: staffId }, signal: ac.signal });
        const raw = Array.isArray(res?.data?.data) ? res.data.data : Array.isArray(res?.data) ? res.data : [];
        const mapped = raw
          .filter((x) => (x?.status || "Warehouse").toLowerCase() === "warehouse")
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
        setInvErr(e?.response?.data?.message || e?.message || "Không thể tải kho pin.");
      } finally {
        setLoadingInv(false);
      }
    })();

    return () => ac.abort();
  }, [open, staffId]);

  const [selectedId, setSelectedId] = useState(null);
  useEffect(() => { if (open) setSelectedId(null); }, [open]);

  const toast = (t, isErr = false) => {
    setMsg(t ? (isErr ? `❌ ${t}` : `✅ ${t}`) : "");
    if (t) setTimeout(() => setMsg(""), 2200);
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return warehouse;
    return warehouse.filter((w) => (w.batteryId || "").toLowerCase().includes(q));
  }, [search, warehouse]);

  const handleDock = async () => {
    if (!selectedId) return toast("Chọn 1 Pin trong kho trước khi dock.", true);
    if (!slot?.slotId) return toast("Thiếu slotId (ID thật). Mở lại trụ để tải dữ liệu mới.", true);

    try {
      setBusy(true);
      const payload = {
        staffId,
        pillarSlotId: Number(slot.slotId) || slot.slotId,
        batteryWareHouseId: selectedId,
      };
      const res = await api.post(ROUTES.STORE, payload);
      toast(res?.data?.message || "Đã dock pin từ kho vào slot.");
      onDocked?.();
      setTimeout(() => onClose?.(), 300);
    } catch (e) {
      console.error(e);
      toast(e?.response?.data?.message || e?.message || "Dock thất bại", true);
    } finally {
      setBusy(false);
    }
  };

  if (!open || !slot) return null;

  const locked = !!slot?.isLocked; // lock đúng theo status === "lock"

  return (
    <div className="fixed inset-0 z-[100]">
      <div className="absolute inset-0 bg-black/40" onClick={() => !busy && onClose?.()} />
      <div className="absolute inset-x-0 top-[8%] mx-auto max-w-3xl rounded-2xl border bg-white shadow-xl">
        <div className="px-5 py-4 border-b flex items-center justify-between">
          <div className="font-semibold">Chọn Pin từ kho để dock vào slot</div>
          <button className="text-slate-500 hover:text-slate-700" onClick={() => !busy && onClose?.()} title="Đóng" type="button">✕</button>
        </div>

        <div className="p-5 space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
            <div><div className="text-slate-500">Pillar</div><div className="font-medium">{slot.pillarId}</div></div>
            <div><div className="text-slate-500">Slot No.</div><div className="font-medium">{slot.slotNumber} ({slot.pos})</div></div>
            <div><div className="text-slate-500">Slot ID (BE)</div><div className="font-medium">{slot.slotId ?? "—"}</div></div>
            <div><div className="text-slate-500">Staff</div><div className="font-medium">{staffId || "—"}</div></div>
          </div>

          {locked && (
            <div className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
              🔒 Slot đang ở trạng thái <b>Locked</b> (status = "lock"). Không thể dock pin vào slot này.
            </div>
          )}

          <div className="flex items-center justify-between gap-3">
            <input
              className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Tìm theo Battery Id..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              disabled={loadingInv || locked}
            />
            <div className="text-xs text-slate-500 shrink-0">
              {loadingInv ? "Đang tải kho…" : `Kho: ${warehouse.length} pin`}
            </div>
          </div>

          {!!invErr && <div className="text-sm text-red-600">{invErr}</div>}
          {!!msg && <div className="font-semibold">{msg}</div>}

          <div className="rounded-xl border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-3 py-2 text-left">Chọn</th>
                  <th className="px-3 py-2 text-left">Battery Id</th>
                  <th className="px-3 py-2 text-left">SoH</th>
                  <th className="px-3 py-2 text-left">SoC</th>
                  <th className="px-3 py-2 text-left">Capacity</th>
                </tr>
              </thead>
              <tbody>
                {loadingInv ? (
                  <tr><td className="px-3 py-3 text-slate-500" colSpan={5}>Đang tải…</td></tr>
                ) : (locked ? (
                  <tr><td className="px-3 py-3 text-slate-500" colSpan={5}>Slot đang Locked.</td></tr>
                ) : filtered.length === 0 ? (
                  <tr><td className="px-3 py-3 text-slate-500" colSpan={5}>Không có pin phù hợp.</td></tr>
                ) : (
                  filtered.map((b) => (
                    <tr key={b.batteryId} className="hover:bg-slate-50">
                      <td className="px-3 py-2">
                        <input
                          type="radio"
                          name="pickBattery"
                          checked={selectedId === b.batteryId}
                          onChange={() => setSelectedId(b.batteryId)}
                          disabled={locked}
                        />
                      </td>
                      <td className="px-3 py-2 font-medium">{b.batteryId}</td>
                      <td className="px-3 py-2">{b.soh != null ? `${b.soh}%` : "—"}</td>
                      <td className="px-3 py-2">{b.soc != null ? `${b.soc}%` : "—"}</td>
                      <td className="px-3 py-2">{b.capacity ? `${b.capacity} kWh` : "—"}</td>
                    </tr>
                  ))
                ))}
              </tbody>
            </table>
          </div>

          <div className="pt-1 flex items-center justify-end gap-2">
            <button className="px-3 py-2 rounded-lg border text-sm" onClick={() => !busy && onClose?.()} type="button">
              Hủy
            </button>
            <button
              className="px-3 py-2 rounded-lg border bg-blue-600 text-white text-sm disabled:opacity-60"
              onClick={handleDock}
              disabled={busy || !selectedId || locked}
              title={locked ? "Slot đang Locked" : (!selectedId ? "Chọn 1 Pin trước" : "Dock Pin vào slot")}
              type="button"
            >
              {busy ? "Đang xử lý…" : "Dock Pin"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ===== Modal: Lấy pin ra kho ===== */
function RemoveBatteryModal({ open, onClose, slot, staffId, onRemoved }) {
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => { if (open) { setBusy(false); setMsg(""); } }, [open]);

  const toast = (t, isErr = false) => {
    setMsg(t ? (isErr ? `❌ ${t}` : `✅ ${t}`) : "");
    if (t) setTimeout(() => setMsg(""), 2200);
  };

  const handleRemove = async () => {
    if (!slot?.slotId) return toast("Thiếu slotId (ID thật). Mở lại trụ để tải dữ liệu mới.", true);
    if (!staffId) return toast("Thiếu StaffId — vui lòng đăng nhập lại.", true);

    try {
      setBusy(true);
      const payload = {
        staffId,
        pillarSlotId: Number(slot.slotId) || slot.slotId,
        batteryId: slot.code,
      };
      const res = await api.post(ROUTES.TAKE_OUT_WAREHOUSE, payload);
      toast(res?.data?.message || "Đã lấy pin ra khỏi slot và đưa vào kho.");
      onRemoved?.();
      setTimeout(() => onClose?.(), 300);
    } catch (e) {
      console.error(e);
      toast(e?.response?.data?.message || e?.message || "Thao tác thất bại", true);
    } finally {
      setBusy(false);
    }
  };

  if (!open || !slot) return null;

  return (
    <div className="fixed inset-0 z-[100]">
      <div className="absolute inset-0 bg-black/40" onClick={() => !busy && onClose?.()} />
      <div className="absolute inset-x-0 top-[12%] mx-auto max-w-md rounded-2xl border bg-white shadow-xl">
        <div className="px-5 py-4 border-b flex items-center justify-between">
          <div className="font-semibold">Xác nhận lấy Pin ra (về kho)</div>
          <button className="text-slate-500 hover:text-slate-700" onClick={() => !busy && onClose?.()} title="Đóng" type="button">✕</button>
        </div>

        <div className="p-5 space-y-3 text-sm">
          <div className="grid grid-cols-2 gap-3">
            <div><div className="text-slate-500">Pillar</div><div className="font-medium">{slot.pillarId}</div></div>
            <div><div className="text-slate-500">Slot No.</div><div className="font-medium">{slot.slotNumber} ({slot.pos})</div></div>
            <div><div className="text-slate-500">Slot ID</div><div className="font-medium">{slot.slotId}</div></div>
            <div><div className="text-slate-500">Battery</div><div className="font-medium">{slot.code}</div></div>
          </div>

          {!!msg && <div className="font-semibold">{msg}</div>}

          <div className="pt-2 flex items-center justify-end gap-2">
            <button className="px-3 py-2 rounded-lg border text-sm" onClick={() => !busy && onClose?.()} type="button">
              Hủy
            </button>
            <button
              className="px-3 py-2 rounded-lg border bg-red-600 text-white text-sm disabled:opacity-60"
              onClick={handleRemove}
              disabled={busy}
              title="Lấy pin ra và đưa về kho"
              type="button"
            >
              {busy ? "Đang xử lý…" : "Xác nhận lấy Pin"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ===== Page ===== */
export default function BatteryManager() {
  const [userId] = useState(() => (localStorage.getItem("userId") || "").trim());
  const [staffId] = useState(() =>
    (localStorage.getItem("staffId") || localStorage.getItem("StaffId") || localStorage.getItem("userId") || "").trim()
  );

  const [pillars, setPillars] = useState([]);
  const [slotsByPillar, setSlotsByPillar] = useState({});
  const [activePillarId, setActivePillarId] = useState(null);
  const [selected, setSelected] = useState(null);

  const [loadingPillars, setLoadingPillars] = useState(false);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [error, setError] = useState("");

  const [addOpen, setAddOpen] = useState(false);
  const [targetSlot, setTargetSlot] = useState(null);

  const [removeOpen, setRemoveOpen] = useState(false);
  const [removeTarget, setRemoveTarget] = useState(null);

  useEffect(() => {
    const ac = new AbortController();
    (async () => {
      if (!userId) {
        setError("Thiếu userId trong localStorage. Vui lòng đăng nhập lại.");
        return;
      }
      try {
        setLoadingPillars(true);
        setError("");
        const res = await api.get(ROUTES.PILLARS, { params: { UserId: userId }, signal: ac.signal });
        const list = normalizePillarsFromServer(res.data);
        setPillars(list);
      } catch (e) {
        if (ac.signal.aborted) return;
        setError("Lỗi khi tải danh sách pillars từ BE.");
      } finally {
        setLoadingPillars(false);
      }
    })();
    return () => ac.abort();
  }, [userId]);

  const openPillar = async (pillarId) => {
    setActivePillarId(pillarId);
    setSelected(null);
    if (slotsByPillar[pillarId]) return;

    const ac = new AbortController();
    try {
      setLoadingSlots(true);
      setError("");
      const res = await api.get(ROUTES.SLOTS, { params: { pillarId }, signal: ac.signal });
      const normalized = normalizeSlotsFromServer(res.data, pillarId);
      setSlotsByPillar((prev) => ({ ...prev, [pillarId]: normalized }));
    } catch (e) {
      if (ac.signal.aborted) return;
      setSlotsByPillar((prev) => ({ ...prev, [pillarId]: [] }));
      setError("Chưa lấy được danh sách slot từ BE.");
    } finally {
      setLoadingSlots(false);
    }
  };

  const refreshCurrentPillarSlots = async () => {
    if (!activePillarId) return;
    const ac = new AbortController();
    try {
      setLoadingSlots(true);
      const res = await api.get(ROUTES.SLOTS, { params: { pillarId: activePillarId }, signal: ac.signal });
      const normalized = normalizeSlotsFromServer(res.data, activePillarId);
      setSlotsByPillar((prev) => ({ ...prev, [activePillarId]: normalized }));
    } catch {
      // giữ nguyên
    } finally {
      setLoadingSlots(false);
    }
  };

  const backToPillars = () => { setActivePillarId(null); setSelected(null); };

  const legend = useMemo(
    () => [
      { color: "#111827", label: "Locked (status='lock')" },
      { color: "#ef4444", label: "Maintenance (ô đỏ)" },
      { color: "#dc2626", label: "≤ 20% (Đỏ SoC)" },
      { color: "#f59e0b", label: "21–50% (Vàng SoC)" },
      { color: "#22c55e", label: "> 50% (Xanh lá SoC)" },
      { color: "#94a3b8", label: "Empty" },
    ],
    []
  );

  const currentSlots = activePillarId ? slotsByPillar[activePillarId] : null;

  return (
    <div className="space-y-6">
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
              <button className="px-3 py-2 rounded-lg border text-sm" onClick={backToPillars} type="button">
                ← All pillars
              </button>
              <button
                className="px-3 py-2 rounded-lg border text-sm"
                onClick={refreshCurrentPillarSlots}
                disabled={loadingSlots}
                title="Làm mới 20 slot"
                type="button"
              >
                ↻ Refresh slots
              </button>
            </div>
          ) : null}
        </div>
      </div>

      {!!error && !loadingPillars && !activePillarId && <div className="text-sm text-red-600">{error}</div>}

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
                    key={slot.slotId ?? `${slot.pillarId}-${slot.slotNumber}`}
                    data={slot}
                    selected={selected && selected.pillarId === activePillarId && selected.slotNumber === slot.slotNumber}
                    onClick={() => setSelected({ ...slot })}
                    onAdd={(emptySlot) => { setTargetSlot(emptySlot); setAddOpen(true); }}
                  />
                ))}
              </div>
            ) : (
              <div className="p-6 text-sm text-slate-500">Chưa có dữ liệu slot từ BE.</div>
            )}
          </div>

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

      {/* Modal: chọn pin từ kho rồi dock */}
      <AddBatteryModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        slot={targetSlot}
        staffId={staffId}
        onDocked={refreshCurrentPillarSlots}
      />

      {/* Modal: lấy pin ra kho */}
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