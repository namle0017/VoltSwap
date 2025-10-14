import { createBrowserRouter, RouterProvider } from "react-router-dom";

// 🧱 Layouts
import MainLayout from "./layouts/MainLayout";
import UserLayout from "./layouts/UserLayout";

// 🌐 Public Pages
import Home from "./pages/Home";
import AboutPage from "./pages/AboutPage";
import ServicesPage from "./pages/ServicesPage";
import BenefitsPage from "./pages/BenefitsPage";
import ContactPage from "./pages/ContactPage";

// ⚙️ Admin + Demo
import AdminDashboard from "./pages/AdminPage";
import StationPage from "./pages/StationDemo"; // nếu bạn muốn giữ trang demo cũ

// 🔋 User Pages
import Service from "./pages/Service";
import RegisterService from "./pages/RegisterService";
import ChangeService from "./pages/ChangeService";
import Station from "./pages/Station";
import Transaction from "./pages/Transaction";
import Payment from "./pages/Payment";
import Vehicle from "./pages/Vehicle";
import Support from "./pages/Support";
import Profile from "./pages/Profile"; // 🧩 THIẾU import này!

// ⚙️ Routing setup
const router = createBrowserRouter([
  // 🏠 Public layout (marketing pages)
  {
    path: "/",
    element: <MainLayout />,
    children: [
      { index: true, element: <Home /> }, // dùng index cho route "/"
      { path: "about", element: <AboutPage /> },
      { path: "services", element: <ServicesPage /> },
      { path: "benefits", element: <BenefitsPage /> },
      { path: "contact", element: <ContactPage /> },
    ],
  },

  // 🔋 User layout (sau khi login)
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
      { path: "profile", element: <Profile /> }, // 🟢 thêm vào đúng chỗ
    ],
  },

  // 📊 Admin page riêng
  { path: "/admin", element: <AdminDashboard /> },

  // 📍 Trang demo cũ (tùy bạn giữ hoặc bỏ)
  { path: "/station", element: <StationPage /> },
]);

function App() {
  return <RouterProvider router={router} />;
}

export default App;
