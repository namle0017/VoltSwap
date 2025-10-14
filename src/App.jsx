import { createBrowserRouter, RouterProvider } from "react-router-dom";
import MainLayout from "./layouts/MainLayout";
import Home from "./pages/Home";
import AboutPage from "./pages/AboutPage";
import ServicesPage from "./pages/ServicesPage";
import BenefitsPage from "./pages/BenefitsPage";
import ContactPage from "./pages/ContactPage";
import StationSwap from "./pages/StationSwap";
import AdminPage from "./pages/AdminPage"; // import trang admin
import AdminLayout from "./layouts/AdminLayout"
import CustomerManagement from "./pages/CustomerManagement"
import "bootstrap-icons/font/bootstrap-icons.css";

const router = createBrowserRouter([
  {
    path: "/",
    element: <MainLayout />, // Layout có Navbar + Footer
    children: [
      { path: "/", element: <Home /> },
      { path: "/about", element: <AboutPage /> },
      { path: "/services", element: <ServicesPage /> },
      { path: "/benefits", element: <BenefitsPage /> },
      { path: "/contact", element: <ContactPage /> },
    ],
  },
  { path: "/station", element: <StationSwap /> },

  {
    path: "/admin",
    element: <AdminLayout />, // Admin layout có sidebar + navbar
    children: [
      { path: "/admin", element: <AdminPage /> },
      { path: "/admin/customers", element: <CustomerManagement /> },
      // sau này bạn có thể thêm các trang khác như:
      // { path: "/admin/reports", element: <ReportsPage /> },
      // { path: "/admin/employees", element: <EmployeePage /> },
    ],
  },
]);

function App() {
  return <RouterProvider router={router} />;
}

export default App;
