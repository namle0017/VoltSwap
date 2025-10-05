import axios from "axios";

const API_BASE_URL = "https://8ff9ccb93170.ngrok-free.app/api/Auth";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

export default api;
