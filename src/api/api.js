// src/api/api.js
import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL; // đọc từ .env

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { "Content-Type": "application/json" },
});

// Gắn token vào mọi request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Chuẩn hoá lỗi + xử lý 401
api.interceptors.response.use(
  (res) => res,
  (err) => {
    const data = err?.response?.data;
    err.normalizedMessage =
      (typeof data === "string" && data) ||
      data?.message ||
      "Có lỗi xảy ra. Vui lòng thử lại.";
    if (err?.response?.status === 401) {
      localStorage.removeItem("token");
    }
    return Promise.reject(err);
  }
);

export default api;
