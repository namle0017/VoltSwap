import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import ToastHost from "./components/Toast.jsx";
import './styles/ui.css'

createRoot(document.getElementById("root")).render(
  //<StrictMode>
  <>
    <App />
    <ToastHost />
  </>
  //</StrictMode>
);
