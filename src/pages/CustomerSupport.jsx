import React from "react";

export default function CustomerSupport() {
    return (
        <section>
            <h2 className="h1">Customer Support</h2>
            <p className="muted">Tickets and conversations with customers.</p>

            <div className="tickets mt-4">
                <div className="tickets-head">
                    <span>🎧</span><span>Open Tickets</span>
                </div>
                <div className="ticket">
                    <div>
                        <div className="ticket-title">Cannot redeem package</div>
                        <div className="ticket-sub">User: 0901-xxx-xxx • App v1.8.2</div>
                    </div>
                    <div className="ticket-right">
                        <span className="pill processing">Processing</span>
                        <span className="time">08:45 AM</span>
                    </div>
                </div>
            </div>
        </section>
    );
}