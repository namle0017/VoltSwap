import http from "./http"; // hoặc "./http.js" đều được với Vite

export const StationApi = {
  getStation: (stationId) =>
    http.get(`/stations/${stationId}`).then((r) => r.data),

  createSession: ({ userId, packageCount, stationId, subscriptionId }) =>
    http
      .post(`/sessions`, { userId, packageCount, stationId, subscriptionId })
      .then((r) => r.data),

  insertPin: (sessionId, { slotId, batteryId }) =>
    http
      .post(`/sessions/${sessionId}/pins`, { slotId, batteryId })
      .then((r) => r.data),

  validate: (sessionId, idempotencyKey) =>
    http
      .post(`/sessions/${sessionId}/validate`, null, {
        headers: idempotencyKey ? { "Idempotency-Key": idempotencyKey } : {},
      })
      .then((r) => r.data),

  finish: (sessionId, idempotencyKey) =>
    http
      .post(`/sessions/${sessionId}/finish`, null, {
        headers: idempotencyKey ? { "Idempotency-Key": idempotencyKey } : {},
      })
      .then((r) => r.data),

  getTransactions: (userId) =>
    http.get(`/transactions`, { params: { userId } }).then((r) => r.data),
};
