import React from "react";
import { manualSwapAPI } from "@/services/apiServices";

export default function BatterySwap() {
    const [history, setHistory] = React.useState([]);
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState(null);

    React.useEffect(() => {
        async function loadHistory() {
            try {
                setError(null);
                const data = await manualSwapAPI.getHistory();
                setHistory(data);
            } catch (error) {
                console.error('Failed to load history:', error);
                setError(error.message || 'Không thể tải lịch sử');
                setHistory([]);
            } finally {
                setLoading(false);
            }
        }
        loadHistory();
    }, []);

    const retryLoadHistory = async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await manualSwapAPI.getHistory();
            setHistory(data);
        } catch (error) {
            console.error('Failed to load history:', error);
            setError(error.message || 'Không thể tải lịch sử');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <section>
                <h2 className="h1">Battery Swap — History</h2>
                <p className="muted">Loading history...</p>
            </section>
        );
    }

    return (
        <section>
            <h2 className="h1">Battery Swap — History</h2>
            <p className="muted">Lịch sử đổi pin (bao gồm các phiên staff manual assist).</p>

            {error && (
                <div className="card mt-4" style={{ borderColor: '#ef4444', backgroundColor: '#fef2f2' }}>
                    <div style={{ color: '#dc2626', fontWeight: '600' }}>
                        ❌ Lỗi: {error}
                    </div>
                    <div className="mt-2">
                        <button
                            className="btn btn-primary"
                            onClick={retryLoadHistory}
                            disabled={loading}
                        >
                            Thử lại
                        </button>
                    </div>
                </div>
            )}

            <div className="card mt-4">
                {history.length === 0 && !error ? (
                    <div className="muted">Chưa có bản ghi nào.</div>
                ) : (
                    <div className="grid" style={{ gap: 8 }}>
                        {history.map(h => (
                            <div key={h.id} className="ticket">
                                <div>
                                    <div className="ticket-title">{h.message}</div>
                                    <div className="ticket-sub">
                                        {new Date(h.at).toLocaleString()} • Station {h.stationId} • Cust {h.customerId} • Sub {h.subscriptionId}
                                    </div>
                                </div>
                                <div className="ticket-right">
                                    <span className="pill">{h.type}</span>
                                    <span className="time">Fee: {h.fee.toLocaleString()}đ</span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </section>
    );
}
