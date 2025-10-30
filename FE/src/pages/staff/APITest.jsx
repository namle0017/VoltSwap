import React, { useState } from "react";
import { manualSwapAPI } from "@/services/apiServices";

export default function APITest() {
  const [results, setResults] = useState({});
  const [loading, setLoading] = useState({});

  const testAPI = async (apiName, apiCall) => {
    setLoading((prev) => ({ ...prev, [apiName]: true }));
    try {
      const result = await apiCall();
      setResults((prev) => ({
        ...prev,
        [apiName]: { success: true, data: result },
      }));
    } catch (error) {
      setResults((prev) => ({
        ...prev,
        [apiName]: { success: false, error: error.message },
      }));
    } finally {
      setLoading((prev) => ({ ...prev, [apiName]: false }));
    }
  };

  const tests = [
    {
      name: "Manual Swap History",
      call: () => manualSwapAPI.getHistory(),
    },
    {
      name: "Station Slots",
      call: () => manualSwapAPI.getStationSlots("st-01"),
    },
    {
      name: "Ready Slots",
      call: () => manualSwapAPI.listReadySlots("st-01"),
    },
  ];

  return (
    <div style={{ padding: 20, fontFamily: "system-ui" }}>
      <h1>🧪 Manual Swap API Test</h1>
      <p>
        Testing connection to:{" "}
        <code>https://6cefe8355a09.ngrok-free.app/api</code>
      </p>
      <p style={{ color: "#666", fontSize: 14 }}>
        ⚠️ Chỉ test Manual Swap API. Các API khác sử dụng mock data.
      </p>

      <div style={{ marginTop: 20 }}>
        {tests.map((test) => (
          <div
            key={test.name}
            style={{
              marginBottom: 15,
              padding: 15,
              border: "1px solid #ddd",
              borderRadius: 8,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <h3 style={{ margin: 0 }}>{test.name}</h3>
              <button
                onClick={() => testAPI(test.name, test.call)}
                disabled={loading[test.name]}
                style={{
                  padding: "8px 16px",
                  background: loading[test.name] ? "#ccc" : "#007bff",
                  color: "white",
                  border: "none",
                  borderRadius: 4,
                  cursor: loading[test.name] ? "not-allowed" : "pointer",
                }}
              >
                {loading[test.name] ? "Testing..." : "Test"}
              </button>
            </div>

            {results[test.name] && (
              <div
                style={{
                  marginTop: 10,
                  padding: 10,
                  background: results[test.name].success
                    ? "#d4edda"
                    : "#f8d7da",
                  borderRadius: 4,
                  fontSize: 14,
                }}
              >
                {results[test.name].success ? (
                  <div>
                    <div style={{ color: "#155724", fontWeight: "bold" }}>
                      ✅ Success!
                    </div>
                    <pre
                      style={{
                        margin: "5px 0 0 0",
                        fontSize: 12,
                        overflow: "auto",
                      }}
                    >
                      {JSON.stringify(results[test.name].data, null, 2)}
                    </pre>
                  </div>
                ) : (
                  <div>
                    <div style={{ color: "#721c24", fontWeight: "bold" }}>
                      ❌ Error:
                    </div>
                    <div style={{ color: "#721c24" }}>
                      {results[test.name].error}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      <div
        style={{
          marginTop: 30,
          padding: 15,
          background: "#f8f9fa",
          borderRadius: 8,
        }}
      >
        <h3>📝 API Status:</h3>
        <ul>
          <li>
            ✅ <strong>Manual Swap API</strong> - Real API
            (https://6cefe8355a09.ngrok-free.app/api)
          </li>
          <li>
            📝 <strong>Admin Requests</strong> - Mock data (localStorage)
          </li>
          <li>
            📝 <strong>Dock Console</strong> - Mock data (localStorage)
          </li>
          <li>
            📝 <strong>Overview/Inventory</strong> - Mock data (localStorage)
          </li>
        </ul>
      </div>

      <div
        style={{
          marginTop: 20,
          padding: 15,
          background: "#e7f3ff",
          borderRadius: 8,
        }}
      >
        <h3>🔍 Debug Instructions:</h3>
        <ol>
          <li>Make sure your ngrok tunnel is running</li>
          <li>Check the browser console for detailed API logs</li>
          <li>If you see CORS errors, add CORS headers to your backend</li>
          <li>If you see 404 errors, check your API endpoints</li>
        </ol>
      </div>
    </div>
  );
}
