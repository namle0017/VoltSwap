// src/pages/staff/Booking.jsx
import React from "react";
import api from "@/api/api";

const LIST_ENDPOINT = "/Booking/station-booking-list";
const CREATE_TRANS_EP = "/BatterySwap/create-cancel-plan";
const CONFIRM_TX_EP = "/Transaction/staff-confirm-transaction";

/* ========== Helpers ========== */
function parseLocalDateTime(dateStr, timeStr) {
  // date: "2025-10-25", time: "13:36:00"
  if (!dateStr) return null;
  const [y, m, d] = (dateStr || "").split("-").map(Number);
  const [hh = 0, mm = 0, ss = 0] = (timeStr || "00:00:00")
    .split(":")
    .map(Number);
  if (!Number.isFinite(y) || !Number.isFinite(m) || !Number.isFinite(d))
    return null;
  return new Date(y, (m || 1) - 1, d || 1, hh || 0, mm || 0, ss || 0);
}
function fmtDateDMY(d) {
  if (!(d instanceof Date) || isNaN(d)) return "—";
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yy = d.getFullYear();
  return `${dd}-${mm}-${yy}`;
}
function fmtTimeAMPM(d) {
  if (!(d instanceof Date) || isNaN(d)) return "—";
  let hh = d.getHours();
  const mm = String(d.getMinutes()).padStart(2, "0");
  const ampm = hh >= 12 ? "PM" : "AM";
  hh = hh % 12;
  if (hh === 0) hh = 12;
  return `${String(hh).padStart(2, "0")}:${mm}${ampm}`;
}
function statusPillClass(text) {
  const v = String(text || "").toLowerCase();
  if (v.includes("cancel")) return "pill cancelled";
  if (v.includes("confirm")) return "pill confirmed";
  if (v.includes("success") || v.includes("done") || v.includes("completed"))
    return "pill successful";
  return "pill pending"; // "Processing"/"Not done"
}
const isCancelNote = (note) =>
  String(note || "")
    .toLowerCase()
    .includes("cancel");

/* ========== Normalizer ========== */
function normalizeBooking(b, idx) {
  const when = parseLocalDateTime(b?.date, b?.timeBooking);
  return {
    id: idx + 1,
    bookingId: b?.bookingId || "",
    // BE trả "subcriptionId" (đúng chính tả từ BE)
    subcriptionId: b?.subcriptionId || b?.subscriptionId || b?.subId || "",
    driverName: b?.driverName || "—",
    phone: b?.driverTele || "—",
    batteries: Number(b?.numberBattery ?? 0) || 0,
    status: b?.status || "Not done",
    note: b?.note || "",
    when,
  };
}

/* ========== Component ========== */
export default function Booking() {
  const [rows, setRows] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");

  // tracking theo bookingId
  const [creatingIds, setCreatingIds] = React.useState(() => new Set());
  const [confirmingIds, setConfirmingIds] = React.useState(() => new Set());
  // map bookingId -> transactionId (nhận sau khi create)
  const [txByBooking, setTxByBooking] = React.useState({});

  const staffId = React.useMemo(
    () =>
      localStorage.getItem("staffId") || localStorage.getItem("userId") || "",
    []
  );

  const fetchBookings = React.useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      if (!staffId) {
        setError("Thiếu StaffId trong localStorage. Vui lòng đăng nhập lại.");
        setRows([]);
        setLoading(false);
        return;
      }
      const res = await api.get(LIST_ENDPOINT, {
        params: { StaffId: staffId },
      });
      const list = Array.isArray(res?.data?.data)
        ? res.data.data
        : Array.isArray(res?.data)
        ? res.data
        : [];
      const mapped = list
        .map(normalizeBooking)
        .sort(
          (a, b) => (a.when?.getTime?.() ?? 0) - (b.when?.getTime?.() ?? 0)
        );
      setRows(mapped);
    } catch (e) {
      const msg =
        e?.response?.data?.message ||
        e?.message ||
        "Không thể tải danh sách booking.";
      setError(msg);
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [staffId]);

  React.useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  /* ========== Actions ========== */
  // Create Transaction: { subId, bookingId, staffId }
  const handleCreateTransaction = async (bk) => {
    if (!bk?.subcriptionId || !bk?.bookingId || !staffId) {
      alert("Thiếu dữ liệu (subId/bookingId/staffId).");
      return;
    }
    if (creatingIds.has(bk.bookingId)) return; // chống double click
    setCreatingIds((prev) => new Set(prev).add(bk.bookingId));
    try {
      const res = await api.post(CREATE_TRANS_EP, {
        subId: bk.subcriptionId,
        bookingId: bk.bookingId,
        staffId,
      });
      // Lấy transactionId từ response
      const txId =
        res?.data?.data?.createRefund?.transactionId ||
        res?.data?.transactionId ||
        res?.data?.data?.transactionId ||
        "";
      if (txId) setTxByBooking((prev) => ({ ...prev, [bk.bookingId]: txId }));
      alert("Tạo transaction thành công.");
    } catch (e) {
      const msg =
        e?.response?.data?.message || e?.message || "Tạo transaction thất bại.";
      alert(msg);
    } finally {
      setCreatingIds((prev) => {
        const n = new Set(prev);
        n.delete(bk.bookingId);
        return n;
      });
    }
  };

  // Confirm Transaction: { transactionId }
  const handleConfirmTransaction = async (bk) => {
    const txId = txByBooking[bk.bookingId];
    if (!txId) {
      alert("Chưa có transactionId. Vui lòng bấm 'Create Transaction' trước.");
      return;
    }
    if (confirmingIds.has(bk.bookingId)) return; // chống double click
    setConfirmingIds((prev) => new Set(prev).add(bk.bookingId));
    try {
      await api.post(CONFIRM_TX_EP, { transactionId: txId });
      alert("Xác nhận transaction thành công.");
    } catch (e) {
      const msg =
        e?.response?.data?.message ||
        e?.message ||
        "Xác nhận transaction thất bại.";
      alert(msg);
    } finally {
      setConfirmingIds((prev) => {
        const n = new Set(prev);
        n.delete(bk.bookingId);
        return n;
      });
    }
  };

  /* ========== Render ========== */
  return (
    <section>
      <div className="row-between">
        <div>
          <h2 className="h1">Booking</h2>
          <p className="muted">Manage customer bookings and schedules.</p>
        </div>
        <button className="btn" onClick={fetchBookings} disabled={loading}>
          ↻ Refresh
        </button>
      </div>

      {/* Error / Loading */}
      {error && (
        <div
          className="card card-padded mt-3"
          style={{
            border: "1px solid #fecaca",
            background: "#fee2e2",
            color: "#991b1b",
          }}
        >
          {error}
        </div>
      )}
      {loading && (
        <div
          className="card card-padded mt-3"
          style={{
            border: "1px solid #c7d2fe",
            background: "#eef2ff",
            color: "#3730a3",
          }}
        >
          Đang tải bookings…
        </div>
      )}

      {/* Table */}
      <div className="table-wrap mt-4">
        <table className="table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Customer</th>
              <th>Quantity</th>
              <th>Phone Number</th>
              <th>Time</th>
              <th>Status</th>
              <th>Note</th>
              <th>Action</th>
            </tr>
          </thead>

          <tbody>
            {rows.length === 0 && !loading ? (
              <tr>
                <td
                  colSpan={8}
                  className="muted"
                  style={{ textAlign: "center", padding: "16px" }}
                >
                  Không có lịch đặt nào.
                </td>
              </tr>
            ) : (
              rows.map((bk) => {
                const showCancelFlow = isCancelNote(bk.note);
                const creating = creatingIds.has(bk.bookingId);
                const confirming = confirmingIds.has(bk.bookingId);
                const hasTxId = Boolean(txByBooking[bk.bookingId]);

                return (
                  <tr key={bk.id}>
                    <td>{fmtDateDMY(bk.when)}</td>
                    <td>{bk.driverName}</td>
                    <td>{bk.batteries}</td>
                    <td>{bk.phone}</td>
                    <td>{fmtTimeAMPM(bk.when)}</td>
                    <td>
                      <span className={statusPillClass(bk.status)}>
                        {bk.status}
                      </span>
                    </td>
                    <td>{bk.note || "—"}</td>
                    <td style={{ display: "flex", gap: 8 }}>
                      {showCancelFlow ? (
                        <>
                          <button
                            className="btn btn-create"
                            disabled={creating}
                            onClick={() => handleCreateTransaction(bk)}
                            title="Tạo giao dịch hoàn tiền"
                          >
                            {creating ? "Creating…" : "Create Transaction"}
                          </button>

                          <button
                            className="btn btn-confirm"
                            disabled={!hasTxId || confirming}
                            onClick={() => handleConfirmTransaction(bk)}
                            title={
                              hasTxId
                                ? "Xác nhận transaction"
                                : "Create transaction trước"
                            }
                          >
                            {confirming ? "Confirming…" : "Confirm"}
                          </button>
                        </>
                      ) : (
                        "—"
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Styles */}
      <style>{`
        .row-between { display:flex; align-items:baseline; justify-content:space-between; gap:12px; }
        .btn { height:36px; padding:0 12px; border-radius:10px; border:1px solid var(--line); background:#fff; }
        .btn-confirm { border-color:#f59e0b; background:#fff7ed; }
        .btn-create  { border-color:#10b981; background:#ecfdf5; }
        .btn[disabled] { opacity:.55; cursor:not-allowed; }
        .card-padded { padding:16px 20px; }

        .table-wrap { overflow-x:auto; background:#fff; border:1px solid var(--line); border-radius:12px; }
        .table { width:100%; border-collapse:collapse; }
        .table th, .table td { padding:12px 14px; border-bottom:1px solid var(--line); text-align:left; }
        .table th { font-size:14px; font-weight:600; color:var(--muted); background:#fafafa; }
        .table tr:last-child td { border-bottom:none; }
        .table tbody tr:hover { background:#f8fafc; }

        .pill {
          display:inline-block; padding:4px 10px; border-radius:999px;
          font-size:12px; font-weight:600; border:1px solid transparent;
        }
        .pill.confirmed  { background:#dbeafe; border-color:#93c5fd; color:#1d4ed8; }
        .pill.cancelled  { background:#fee2e2; border-color:#fecaca; color:#b91c1c; }
        .pill.successful { background:#dcfce7; border-color:#86efac; color:#047857; }
        .pill.pending    { background:#fef9c3; border-color:#fde68a; color:#a16207; }
      `}</style>
    </section>
  );
}
