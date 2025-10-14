// src/App.jsx
import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import MainLayout from "./layouts/MainLayout.jsx";
import StaffLayout from "./layouts/StaffLayout.jsx";

// Pages
import Overview from "./pages/Overview.jsx";
import Inventory from "./pages/Inventory.jsx";
import ManualAssist from "./pages/ManualAssist.jsx";
import BatterySwap from "./pages/BatterySwap.jsx";   // History view
import Booking from "./pages/Booking.jsx";
import AdminRequest from "./pages/AdminRequest.jsx";
import CustomerSupport from "./pages/CustomerSupport.jsx";
import DockConsole from "./pages/DockConsole.jsx";
import Ping from "./pages/Ping.jsx";
import APITest from "./pages/APITest.jsx";



export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<MainLayout />}>
          <Route path="/" element={<Navigate to="/staff/overview" replace />} />
          <Route path="/ping" element={<Ping />} /> {/* <— test page */}
          <Route path="/api-test" element={<APITest />} /> {/* <— API test page */}

          <Route path="/staff" element={<StaffLayout />}>
            <Route index element={<Navigate to="overview" replace />} />
            <Route path="overview" element={<Overview />} />
            <Route path="inventory" element={<Inventory />} />
            <Route path="assist" element={<ManualAssist />} />
            <Route path="dock" element={<DockConsole />} />
            <Route path="swap" element={<BatterySwap />} />
            <Route path="booking" element={<Booking />} />
            <Route path="admin-request" element={<AdminRequest />} />
            <Route path="support" element={<CustomerSupport />} />
          </Route>
        </Route>
        <Route path="*" element={<Navigate to="/ping" replace />} />
      </Routes>
    </BrowserRouter>
  );
}