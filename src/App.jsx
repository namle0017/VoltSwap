// src/App.jsx
import { createBrowserRouter, RouterProvider, Navigate } from "react-router-dom";
import "bootstrap-icons/font/bootstrap-icons.css";

import MainLayout from "./layouts/MainLayout";
import Home from "./pages/Home";
import AboutPage from "./pages/AboutPage";
import ServicesPage from "./pages/ServicesPage";
import BenefitsPage from "./pages/BenefitsPage";
import ContactPage from "./pages/ContactPage";
import StationSwap from "./pages/StationSwap";

// Admin
import AdminLayout from "./layouts/AdminLayout";
import AdminPage from "./pages/AdminPage";
import CustomerManagement from "./pages/CustomerManagement";
import ComplaintsManagement from "./pages/ComplaintsManagement";

// User
import UserLayout from "./layouts/UserLayout";
import Service from "./pages/Service";
import RegisterService from "./pages/RegisterService";
import ChangeService from "./pages/ChangeService";
import Vehicle from "./pages/Vehicle";
import Station from "./pages/Station";
import Transaction from "./pages/Transaction";
import Payment from "./pages/Payment";
import Support from "./pages/Support";
import Profile from "./pages/Profile";

// Staff (thêm mới)
import StaffLayout from "./layouts/StaffLayout";
import Overview from "./pages/Overview";
import Inventory from "./pages/Inventory";
import ManualAssist from "./pages/ManualAssist";
import DockConsole from "./pages/DockConsole";
import BatterySwap from "./pages/BatterySwap"; // trang lịch sử/tra cứu swap
import Booking from "./pages/Booking";
import AdminRequest from "./pages/AdminRequest";
import CustomerSupport from "./pages/CustomerSupport";
import Ping from "./pages/Ping";
import APITest from "./pages/APITest";

import ProtectedRoute from "./components/ProtectedRoute";

const router = createBrowserRouter([
  // ---- Public site ----
  {
    path: "/",
    element: <MainLayout />,
    children: [
      { index: true, element: <Home /> },
      { path: "about", element: <AboutPage /> },
      { path: "services", element: <ServicesPage /> },
      { path: "benefits", element: <BenefitsPage /> },
      { path: "contact", element: <ContactPage /> },
    ],
  },
  { path: "/stations", element: <StationSwap /> },

  // ---- User app (/user/...) ----
  {
    path: "/user",
    element: <UserLayout />,
    children: [
      { path: "service", element: <Service /> },
      { path: "service/register", element: <RegisterService /> },
      { path: "service/change", element: <ChangeService /> },
      { path: "vehicle", element: <Vehicle /> },
      { path: "station", element: <Station /> },
      { path: "transaction", element: <Transaction /> },
      { path: "paynow/:id", element: <Payment /> },
      { path: "support", element: <Support /> },
      { path: "profile", element: <Profile /> },
    ],
  },

  // ---- Staff app (/staff/...) ----
  { // bỏ nếu không cần chặn role
    children: [
      {
        path: "/staff",
        element: <StaffLayout />,
        children: [
          { index: true, element: <Navigate to="overview" replace /> },
          { path: "overview", element: <Overview /> },
          { path: "inventory", element: <Inventory /> },
          { path: "assist", element: <ManualAssist /> },
          { path: "dock", element: <DockConsole /> },
          { path: "swap", element: <BatterySwap /> },
          { path: "booking", element: <Booking /> },
          { path: "admin-request", element: <AdminRequest /> },
          { path: "support", element: <CustomerSupport /> },
        ],
      },
    ],
  },

  // ---- Admin app (/admin/...) ----
  {
    element: <ProtectedRoute requiredRole="Admin" />,
    children: [
      {
        path: "/admin",
        element: <AdminLayout />,
        children: [
          { index: true, element: <AdminPage /> },
          { path: "customers", element: <CustomerManagement /> },
          { path: "complaints", element: <ComplaintsManagement /> },
          // { path: "transactions", element: <TransactionManagement /> },
        ],
      },
    ],
  },

  // ---- Utility pages (public) ----
  { path: "/ping", element: <Ping /> },
  { path: "/api-test", element: <APITest /> },

  // ---- Fallback ----
  { path: "*", element: <Navigate to="/ping" replace /> },
]);

export default function App() {
  return <RouterProvider router={router} />;
}
