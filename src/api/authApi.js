import axios from "axios";

// Base URL cho module Auth
const AUTH_API = axios.create({
  baseURL: "https://6892852de3af.ngrok-free.app/api/Auth",
  headers: { "Content-Type": "application/json" },
});

export default AUTH_API;
//VoltSwapProjectSwp
