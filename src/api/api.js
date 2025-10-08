import axios from "axios";

const API_BASE_URL = "https://f40c5fb74a2a.ngrok-free.app/api/Auth";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

export default api;
