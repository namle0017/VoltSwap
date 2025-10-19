import axios from "axios";

const AUTH_API = axios.create({
  baseURL: "https://2560c42085af.ngrok-free.app/api/Auth", // ✅ chuẩn cú pháp
  headers: { "Content-Type": "application/json" },
});

export default AUTH_API;
