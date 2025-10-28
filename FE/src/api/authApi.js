import axios from "axios";

// Base URL cho module Auth
const AUTH_API = axios.create({
  baseURL: "https://a5b22ee459cb.ngrok-free.app/api/Auth", // thay bằng URL ngrok hiện tại của bạn
  headers: { "Content-Type": "application/json" },
});

export default AUTH_API;
//VoltSwapProjectSwp
