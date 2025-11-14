// src/pages/staff/Booking.jsx
import React from "react";
import api from "@/api/api";

const LIST_ENDPOINT = "/Booking/station-booking-list";
const CREATE_TRANS_EP = "/BatterySwap/create-cancel-plan";
const CONFIRM_TX_EP = "/Transaction/staff-confirm-transaction";
const CANCEL_EP = "/Booking/expire-check";

/* ========== Helpers ========== */
function parseLocalDateTime(dateStr, timeStr) {
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
  return "pill pending";
}
const isCancelNote = (note) =>
  String(note || "")
    .toLowerCase()
    .includes("cancel");
const canCancel = (status = "") => {
  const s = String(status).toLowerCase();
  if (!s) return true;
  if (s.includes("cancel")) return false;
  if (s.includes("done") || s.includes("success") || s.includes("completed"))
    return false;
  return true;
};

/* ========== Normalizer ========== */
function normalizeBooking(b, idx) {
  const when = parseLocalDateTime(b?.date, b?.timeBooking);
  return {
    id: idx + 1,
    bookingId: b?.bookingId || "",
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

  // search theo tên
  const [searchName, setSearchName] = React.useState("");

  const [creatingIds, setCreatingIds] = React.useState(() => new Set());
  const [confirmingIds, setConfirmingIds] = React.useState(() => new Set());
  const [cancellingIds, setCancellingIds] = React.useState(() => new Set());
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
        setError("Missing StaffId in localStorage. Please sign in again.");
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
        "Failed to load booking list.";
      setError(msg);
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [staffId]);

  React.useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  /* ========== Derived: filtered rows by name ========== */
  const filteredRows = React.useMemo(() => {
    const q = searchName.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((bk) =>
      String(bk.driverName || "")
        .toLowerCase()
        .includes(q)
    );
  }, [rows, searchName]);

  /* ========== Actions ========== */
  const handleCreateTransaction = async (bk) => {
    if (!bk?.subcriptionId || !bk?.bookingId || !staffId) {
      alert("Missing data (subId / bookingId / staffId).");
      return;
    }
    if (creatingIds.has(bk.bookingId)) return;
    setCreatingIds((prev) => new Set(prev).add(bk.bookingId));
    try {
      const res = await api.post(CREATE_TRANS_EP, {
        subId: bk.subcriptionId,
        bookingId: bk.bookingId,
        staffId,
      });
      const txId =
        res?.data?.data?.createRefund?.transactionId ||
        res?.data?.transactionId ||
        res?.data?.data?.transactionId ||
        "";
      if (txId) setTxByBooking((prev) => ({ ...prev, [bk.bookingId]: txId }));
      alert("Transaction created successfully.");
    } catch (e) {
      const msg =
        e?.response?.data?.message ||
        e?.message ||
        "Failed to create transaction.";
      alert(msg);
    } finally {
      setCreatingIds((prev) => {
        const n = new Set(prev);
        n.delete(bk.bookingId);
        return n;
      });
    }
  };

  const handleConfirmTransaction = async (bk) => {
    const txId = txByBooking[bk.bookingId];
    if (!txId) {
      alert("No transactionId yet. Please click 'Create Transaction' first.");
      return;
    }
    if (confirmingIds.has(bk.bookingId)) return;
    setConfirmingIds((prev) => new Set(prev).add(bk.bookingId));
    try {
      await api.post(CONFIRM_TX_EP, { transactionId: txId });
      alert("Transaction confirmed successfully.");
    } catch (e) {
      const msg =
        e?.response?.data?.message ||
        e?.message ||
        "Failed to confirm transaction.";
      alert(msg);
    } finally {
      setConfirmingIds((prev) => {
        const n = new Set(prev);
        n.delete(bk.bookingId);
        return n;
      });
    }
  };

  const handleCancelBooking = async (bk) => {
    if (!bk?.bookingId) {
      alert("Missing bookingId.");
      return;
    }
    if (!canCancel(bk.status)) {
      alert("This booking cannot be cancelled.");
      return;
    }
    if (cancellingIds.has(bk.bookingId)) return;

    const ok = window.confirm(
      `Cancel booking #${bk.bookingId} for ${bk.driverName}?`
    );
    if (!ok) return;

    setCancellingIds((prev) => new Set(prev).add(bk.bookingId));
    try {
      await api.post(CANCEL_EP, { bookingId: bk.bookingId });
      alert("Booking cancelled successfully.");
      await fetchBookings();
    } catch (e) {
      const msg =
        e?.response?.data?.message || e?.message || "Failed to cancel booking.";
      alert(msg);
    } finally {
      setCancellingIds((prev) => {
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
        <div className="row-right">
          <input
            className="search-input"
            placeholder="Search by customer name..."
            value={searchName}
            onChange={(e) => setSearchName(e.target.value)}
          />
          <button className="btn" onClick={fetchBookings} disabled={loading}>
            ↻ Refresh
          </button>
        </div>
      </div>

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
          Loading bookings…
        </div>
      )}

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
              <th style={{ minWidth: 340 }}>Action</th>
            </tr>
          </thead>

          <tbody>
            {filteredRows.length === 0 && !loading ? (
              <tr>
                <td
                  colSpan={8}
                  className="muted"
                  style={{ textAlign: "center", padding: "16px" }}
                >
                  {rows.length === 0
                    ? "No bookings."
                    : "No bookings match this customer name."}
                </td>
              </tr>
            ) : (
              filteredRows.map((bk) => {
                const showCancelFlow = isCancelNote(bk.note);
                const creating = creatingIds.has(bk.bookingId);
                const confirming = confirmingIds.has(bk.bookingId);
                const cancelling = cancellingIds.has(bk.bookingId);
                const hasTxId = Boolean(txByBooking[bk.bookingId]);
                const allowCancel = canCancel(bk.status);

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
                    <td style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      <button
                        className="btn btn-cancel"
                        disabled={!allowCancel || cancelling}
                        onClick={() => handleCancelBooking(bk)}
                        title={
                          allowCancel
                            ? "Cancel this booking"
                            : "This booking cannot be cancelled"
                        }
                      >
                        {cancelling ? "Cancelling…" : "Cancel Booking"}
                      </button>

                      {showCancelFlow ? (
                        <>
                          <button
                            className="btn btn-create"
                            disabled={creating}
                            onClick={() => handleCreateTransaction(bk)}
                            title="Create refund transaction"
                          >
                            {creating ? "Creating…" : "Create Transaction"}
                          </button>

                          <button
                            className="btn btn-confirm"
                            disabled={!hasTxId || confirming}
                            onClick={() => handleConfirmTransaction(bk)}
                            title={
                              hasTxId
                                ? "Confirm transaction"
                                : "Please create transaction first"
                            }
                          >
                            {confirming ? "Confirming…" : "Confirm"}
                          </button>
                        </>
                      ) : (
                        <span className="muted" style={{ lineHeight: "36px" }}>
                          {/* no refund flow */}
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <style>{`
        .row-between { display:flex; align-items:baseline; justify-content:space-between; gap:12px; }
        .row-right { display:flex; align-items:center; gap:8px; }

        .search-input {
          height:36px;
          padding:0 10px;
          border-radius:10px;
          border:1px solid var(--line, #e5e7eb);
          font-size:13px;
          min-width:220px;
          background:#f9fafb;
          outline:none;
        }
        .search-input:focus {
          border-color:#4f46e5;
          box-shadow:0 0 0 1px rgba(79,70,229,0.09);
          background:#ffffff;
        }

        .btn { height:36px; padding:0 12px; border-radius:10px; border:1px solid var(--line); background:#fff; cursor:pointer; font-size:13px; }
        .btn-confirm { border-color:#f59e0b; background:#fff7ed; }
        .btn-create  { border-color:#10b981; background:#ecfdf5; }
        .btn-cancel  { border-color:#ef4444; background:#fef2f2; }
        .btn[disabled] { opacity:.55; cursor:not-allowed; }
        .card-padded { padding:16px 20px; }

        .table-wrap { overflow-x:auto; background:#fff; border:1px solid var(--line); border-radius:12px; }
        .table { width:100%; border-collapse:collapse; }
        .table th, .table td { padding:12px 14px; border-bottom:1px solid var(--line); text-align:left; }
        .table th { font-size:14px; font-weight:600; color:var(--muted,#6b7280); background:#fafafa; }
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
