import axios from "axios";

// Base URL cho module Auth
const AUTH_API = axios.create({
  baseURL: "https://c5f4c7e90a71.ngrok-free.app/api/Auth", // thay bằng URL ngrok hiện tại của bạn
  headers: { "Content-Type": "application/json" },
});

export default AUTH_API;
//VoltSwapProjectSwp
