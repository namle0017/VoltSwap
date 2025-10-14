import { createBrowserRouter, RouterProvider } from "react-router-dom";
import MainLayout from "./layouts/MainLayout";
import Home from "./pages/Home";
import AboutPage from "./pages/AboutPage";
import ServicesPage from "./pages/ServicesPage";
import BenefitsPage from "./pages/BenefitsPage";
import ContactPage from "./pages/ContactPage";
import StationSwap from "./pages/StationSwap";
import AdminPage from "./pages/AdminPage";
import AdminLayout from "./layouts/AdminLayout";
import CustomerManagement from "./pages/CustomerManagement";
import ComplaintsManagement from "./pages/ComplaintsManagement"; // 👈 NEW
import ProtectedRoute from "./components/ProtectedRoute";
import "bootstrap-icons/font/bootstrap-icons.css";

const router = createBrowserRouter([
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

  // 🔒 Protect whole /admin tree
  {
    element: <ProtectedRoute requiredRole="Admin" />,
    children: [
      {
        path: "/admin",
        element: <AdminLayout />,
        children: [
          { index: true, element: <AdminPage /> },              // dashboard
          { path: "customers", element: <CustomerManagement /> },
          { path: "complaints", element: <ComplaintsManagement /> }, // 👈 NEW
          // { path: "transactions", element: <TransactionManagement /> }, // nếu cần
        ],
      },
    ],
  },
]);

export default function App() {
  return <RouterProvider router={router} />;
}
