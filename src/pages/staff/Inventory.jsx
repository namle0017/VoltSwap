import React from "react";

export default function Inventory() {
    return (
        <section>
            <h2 className="h1">Inventory</h2>
            <p className="muted">Manage batteries, stations stock and movements.</p>

            <div className="grid grid-12 mt-4">
                <div className="col-12 md-col-6 card">
                    <h3 style={{ marginTop: 0 }}>Stock Summary</h3>
                    <ul className="mt-2">
                        <li>Fully charged: <b>124</b></li>
                        <li>Charging: <b>36</b></li>
                        <li>Defective: <b>5</b></li>
                    </ul>
                </div>
                <div className="col-12 md-col-6 card">
                    <h3 style={{ marginTop: 0 }}>Recent Movements</h3>
                    <p className="small muted">Last 24 hours</p>
                    <div className="mt-2">+ 42 batteries received at Station A</div>
                    <div className="mt-2">- 30 batteries swapped at Station B</div>
                </div>
            </div>
        </section>
    );
}
