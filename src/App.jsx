import { createBrowserRouter, RouterProvider } from "react-router-dom";
import MainLayout from "./layouts/MainLayout";
import Home from "./pages/Home";
import AboutPage from "./pages/AboutPage";
import ServicesPage from "./pages/ServicesPage";
import BenefitsPage from "./pages/BenefitsPage";
import ContactPage from "./pages/ContactPage";
import StationPage from "./pages/StationDemo";
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
  { path: "/Station", element: <StationPage /> },
]);

function App() {
  return <RouterProvider router={router} />;
}

export default App;
