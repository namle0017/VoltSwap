import React from "react";

export default function Booking() {
    return (
        <section>
            <h2 className="h1">Booking</h2>
            <p className="muted">Manage customer bookings and schedules.</p>

            <div className="card mt-4">
                <h3 style={{ marginTop: 0 }}>Upcoming</h3>
                <div className="mt-2">09:00 • Nguyen Q.Anh • Station A</div>
                <div className="mt-2">10:30 • Tran T.Binh • Station C</div>
            </div>
        </section>
    );
}
