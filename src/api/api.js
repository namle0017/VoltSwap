import axios from "axios";
const api = axios.create({
    baseURL: "/api",         // dùng Vite proxy -> ngrok
    headers: { "Content-Type": "application/json" },
});
api.interceptors.request.use((config) => {
    console.log("🌐", config.method?.toUpperCase(), (config.baseURL || "") + (config.url || ""), config.params || config.data || {});
    return config;
});
export default api;
