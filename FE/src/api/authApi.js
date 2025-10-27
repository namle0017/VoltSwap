import axios from "axios";

// Base URL cho module Auth
const AUTH_API = axios.create({
  baseURL: "https://5b7876766e72.ngrok-free.app/api/Auth", // thay bằng URL ngrok hiện tại của bạn
  headers: { "Content-Type": "application/json" },
});

export default AUTH_API;
//VoltSwapProjectSwp
