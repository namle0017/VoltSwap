// src/pages/AdminRequest.jsx
import React, { useEffect, useMemo, useState } from "react";
import { adminRequestsAPI } from "@/services/apiServices";

export default function AdminRequest() {
    // form
    const [requestType, setRequestType] = useState("");
    const [driverId, setDriverId] = useState("");
    const [description, setDescription] = useState("");

    // list + ui state
    const [items, setItems] = useState([]);
    const [loadingList, setLoadingList] = useState(false);
    const [creating, setCreating] = useState(false);
    const [error, setError] = useState("");

    const canSubmit = useMemo(
        () => requestType.trim() && driverId.trim() && description.trim(),
        [requestType, driverId, description]
    );

    async function load() {
        try {
            setLoadingList(true);
            setError("");
            const res = await adminRequestsAPI.fetchAdminRequests();
            setItems(res);
        } catch (e) {
            console.error(e);
            setError(e.message || "Load failed");
        } finally {
            setLoadingList(false);
        }
    }

    useEffect(() => {
        load();
    }, []);

    async function onSubmit(e) {
        e.preventDefault();
        if (!canSubmit) return;

        try {
            setCreating(true);
            setError("");
            const payload = {
                requestType: requestType.trim(),
                driverId: driverId.trim(),
                description: description.trim(),
            };
            const created = await adminRequestsAPI.createAdminRequest(payload);
            // optimistic prepend
            setItems((prev) => [created, ...prev]);
            setRequestType("");
            setDriverId("");
            setDescription("");
        } catch (e) {
            console.error(e);
            setError(e.message || "Submit failed");
        } finally {
            setCreating(false);
        }
    }

    return (
        <section style={{ fontFamily: "system-ui", color: "#0f172a" }}>
            <h2 style={{ margin: "0 0 12px", fontSize: 22, fontWeight: 800 }}>
                Submit Admin Support Request
            </h2>

            {/* FORM */}
            <form onSubmit={onSubmit} style={card}>
                <div style={grid2}>
                    <label style={label}>
                        Request Type
                        <input
                            style={input}
                            placeholder="Request Type"
                            value={requestType}
                            onChange={(e) => setRequestType(e.target.value)}
                        />
                    </label>

                    <label style={label}>
                        Driver ID
                        <input
                            style={input}
                            placeholder="Driver ID"
                            value={driverId}
                            onChange={(e) => setDriverId(e.target.value)}
                        />
                    </label>
                </div>

                <label style={{ ...label, marginTop: 12 }}>
                    Description
                    <textarea
                        rows={5}
                        style={{ ...input, resize: "vertical" }}
                        placeholder="Description"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                    />
                </label>

                <div style={{ marginTop: 14 }}>
                    <button
                        type="submit"
                        disabled={!canSubmit || creating}
                        style={{
                            ...btnPrimary,
                            opacity: !canSubmit || creating ? 0.6 : 1,
                            width: "100%",
                        }}
                    >
                        {creating ? "Sending…" : "Send Request"}
                    </button>
                </div>

                {error && (
                    <div style={{ color: "#b91c1c", marginTop: 10, fontWeight: 600 }}>
                        ❌ {error}
                    </div>
                )}
            </form>

            {/* TABLE */}
            <div style={{ ...card, marginTop: 18 }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800 }}>Requests</h3>
                    <button onClick={load} style={btn} disabled={loadingList}>
                        {loadingList ? "Loading…" : "Reload"}
                    </button>
                </div>

                <div style={{ overflowX: "auto", marginTop: 10 }}>
                    <table style={table}>
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Customer</th>
                                <th>ID Pin</th>
                                <th>Issue Type</th>
                                <th>Time</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loadingList ? (
                                <tr>
                                    <td colSpan={6} style={{ padding: 16, textAlign: "center" }}>
                                        Loading…
                                    </td>
                                </tr>
                            ) : items.length === 0 ? (
                                <tr>
                                    <td colSpan={6} style={{ padding: 16, textAlign: "center" }}>
                                        No data
                                    </td>
                                </tr>
                            ) : (
                                items.map((r) => (
                                    <tr key={r.id}>
                                        <td>{r.code || r.id}</td>
                                        <td>{r.customerName || "-"}</td>
                                        <td>{r.batteryId || "-"}</td>
                                        <td>{r.requestType || r.issueType}</td>
                                        <td>
                                            {r.time ||
                                                r.createdAt ||
                                                new Date(r.createdAtUtc || Date.now()).toLocaleTimeString()}
                                        </td>
                                        <td>{r.status || "Pending"}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </section>
    );
}

/* styles */
const card = {
    background: "#fff",
    border: "1px solid #e5e7eb",
    borderRadius: 12,
    padding: 16,
};
const grid2 = { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 };
const label = { display: "grid", gap: 6, fontSize: 13, fontWeight: 600 };
const input = {
    padding: "10px 12px",
    border: "1px solid #e5e7eb",
    borderRadius: 10,
    outline: "none",
};
const btn = {
    background: "#f3f4f6",
    border: "1px solid #e5e7eb",
    padding: "8px 12px",
    borderRadius: 8,
    cursor: "pointer",
};
const btnPrimary = {
    ...btn,
    background: "#4b5563",
    color: "#fff",
    borderColor: "#4b5563",
};
const table = {
    width: "100%",
    borderCollapse: "collapse",
    fontSize: 13,
};
table.thead = {};
