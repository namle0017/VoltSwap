import { useState } from "react";
import Services from "../components/Services";
import PageTransition from "../components/PageTransition";
import AuthModal from "../components/AuthModal";

const ServicesPage = () => {
  // 🧩 State quản lý modal đăng nhập / đăng ký
  const [authModal, setAuthModal] = useState({ isOpen: false, mode: "signup" });

  const openAuthModal = (mode) => {
    setAuthModal({ isOpen: true, mode });
  };

  const closeAuthModal = () => {
    setAuthModal({ isOpen: false, mode: "signup" });
  };

  // 🔋 Battery swap packages
  const swapPackages = [
    { name: "G1", price: "300,000", pin: 1, km: "600 km/month", tag: "Limited" },
    { name: "G2", price: "450,000", pin: 2, km: "800 km/month", tag: "Limited" },
    { name: "G3", price: "850,000", pin: 3, km: "950 km/month", tag: "Limited" },
    { name: "GU", price: "3,000,000", pin: 3, km: "Unlimited", tag: "Unlimited" },
  ];

  // 🔌 Self-charging packages
  const selfChargingPackages = [
    { name: "TP1", price: "250,000", pin: 1, km: "600 km/month" },
    { name: "TP2", price: "400,000", pin: 2, km: "800 km/month" },
    { name: "TP3", price: "800,000", pin: 3, km: "950 km/month" },
    { name: "TPSU", price: "3,000,000", pin: 3, km: "Unlimited", tag: "Unlimited" },
  ];

  return (
    <PageTransition>
      <main className="pt-16 bg-gradient-to-b from-gray-50 via-white to-gray-100">
        <Services />

        {/* --- Service Packages --- */}
        <section className="section-padding">
          <div className="max-w-7xl mx-auto">
            {/* Title */}
            <div className="text-center mb-16">
              <h2 className="text-5xl font-extrabold bg-gradient-to-r from-primary to-blue-500 bg-clip-text text-transparent mb-4">Service Packages</h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">Choose the perfect battery service plan for your EV needs.</p>
            </div>

            {/* --- Monthly Battery Swap Service --- */}
            <div className="mb-20">
              <h3 className="text-3xl font-bold text-gray-900 mb-10 text-center">Monthly Battery Swap Service</h3>

              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                {swapPackages.map((pkg, i) => (
                  <div
                    key={i}
                    className={`p-8 text-center rounded-2xl shadow-md border transition transform hover:-translate-y-2 hover:shadow-2xl duration-300 ${pkg.tag === "Unlimited"
                      ? "border-2 border-primary bg-gradient-to-b from-white via-blue-50 to-blue-100"
                      : "bg-white"
                      }`}
                  >
                    <div className={`px-3 py-1 rounded-full text-xs font-semibold mb-4 inline-block ${pkg.tag === "Unlimited" ? "bg-gradient-to-r from-primary to-blue-500 text-white shadow-md" : "bg-primary text-white"}`}>{pkg.tag || "Limited"}</div>

                    <h4 className="text-2xl font-bold text-gray-900 mb-3">{pkg.name}</h4>

                    <div className="text-3xl font-extrabold text-primary mb-4 animate-pulse">{pkg.price}<span className="text-sm text-gray-600"> VND/month</span></div>

                    <ul className="space-y-2 text-gray-600 mb-6 text-sm"><li>• Battery count: {pkg.pin}</li><li>• Base mileage: {pkg.km}</li><li>• VAT included</li></ul>

                    <button onClick={() => openAuthModal("signup")} className="btn-primary w-full text-sm py-2 rounded-full font-semibold hover:scale-105 hover:bg-blue-600 transition">Choose Plan</button>
                  </div>
                ))}
              </div>

              {/* --- Excess Mileage Fee (Table Style) --- */}
              <div className="mt-16 bg-gradient-to-b from-blue-50 to-green-50 p-8 rounded-3xl shadow-inner">
                <h4 className="text-2xl font-extrabold text-primary text-center mb-6 tracking-wide uppercase">Excess Mileage Fee</h4>

                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-center bg-white rounded-2xl shadow-sm overflow-hidden">
                    <thead>
                      <tr className="bg-gradient-to-r from-blue-100 to-blue-50 text-gray-800 text-sm font-semibold"><th className="py-3 px-4 border border-blue-200 rounded-tl-2xl">Monthly mileage (km)</th><th className="py-3 px-4 border border-blue-200">Up to 2,000</th><th className="py-3 px-4 border border-blue-200">From 2,001 to 4,000</th><th className="py-3 px-4 border border-blue-200 rounded-tr-2xl">From 4,001 onwards</th></tr>
                    </thead>
                    <tbody>
                      <tr className="text-gray-700"><td className="py-4 px-4 border border-blue-100 font-medium text-sm bg-blue-50">Extra fee (VND/km) – VAT included</td><td className="py-4 px-4 border border-blue-100 font-semibold text-primary">357</td><td className="py-4 px-4 border border-blue-100 font-semibold text-primary">346</td><td className="py-4 px-4 border border-blue-100 font-semibold text-primary">313</td></tr>
                    </tbody>
                  </table>
                </div>

                <div className="text-center mt-8"><div className="inline-block bg-gradient-to-r from-blue-600 to-blue-500 text-white px-8 py-3 rounded-full font-semibold text-sm shadow-lg hover:shadow-xl hover:scale-105 transition duration-300">Battery Deposit: <span className="font-bold text-yellow-300">400,000 VND</span></div></div>
              </div>
            </div>

            {/* --- Monthly Self-Charging Battery Rental Service --- */}
            <div>
              <h3 className="text-3xl font-bold text-gray-900 mb-10 text-center">Monthly Self-Charging Battery Rental Service</h3>

              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                {selfChargingPackages.map((pkg, i) => (
                  <div
                    key={i}
                    className={`p-8 text-center rounded-2xl shadow-md border transition transform hover:-translate-y-2 hover:shadow-2xl duration-300 ${pkg.tag
                      ? "border-primary bg-gradient-to-b from-white via-blue-50 to-blue-100"
                      : "bg-white"
                      }`}
                  >
                    <div className={`px-3 py-1 rounded-full text-xs font-semibold mb-4 inline-block ${pkg.tag ? "bg-primary text-white" : "bg-gray-200 text-gray-700"}`}>{pkg.tag || "Limited"}</div>

                    <h4 className="text-2xl font-bold text-gray-900 mb-3">{pkg.name}</h4>

                    <div className="text-3xl font-extrabold text-primary mb-4 animate-pulse">{pkg.price}<span className="text-sm text-gray-600"> VND/month</span></div>

                    <ul className="space-y-2 text-gray-600 mb-6 text-sm"><li>• Battery count: {pkg.pin}</li><li>• Base mileage: {pkg.km}</li><li>• VAT included</li></ul>

                    <button onClick={() => openAuthModal("signup")} className="btn-primary w-full text-sm py-2 rounded-full font-semibold hover:scale-105 hover:bg-blue-600 transition">Choose Plan</button>
                  </div>
                ))}
              </div>

              {/* --- Second Excess Mileage Fee area --- */}
              <div className="mt-16 bg-gradient-to-b from-blue-50 to-green-50 p-8 rounded-3xl shadow-inner">
                <h4 className="text-2xl font-extrabold text-primary text-center mb-6 tracking-wide uppercase">Excess Mileage Fee</h4>

                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-center bg-white rounded-2xl shadow-sm overflow-hidden">
                    <thead>
                      <tr className="bg-gradient-to-r from-blue-100 to-blue-50 text-gray-800 text-sm font-semibold"><th className="py-3 px-4 border border-blue-200 rounded-tl-2xl">Monthly mileage (km)</th><th className="py-3 px-4 border border-blue-200">Up to 2,000</th><th className="py-3 px-4 border border-blue-200">From 2,001 to 4,000</th><th className="py-3 px-4 border border-blue-200 rounded-tr-2xl">From 4,001 onwards</th></tr>
                    </thead>
                    <tbody>
                      <tr className="text-gray-700"><td className="py-4 px-4 border border-blue-100 font-medium text-sm bg-blue-50">Extra fee (VND/km) – VAT included</td><td className="py-4 px-4 border border-blue-100 font-semibold text-primary">200</td><td className="py-4 px-4 border border-blue-100 font-semibold text-primary">180</td><td className="py-4 px-4 border border-blue-100 font-semibold text-primary">160</td></tr>
                    </tbody>
                  </table>
                </div>

                <div className="flex flex-wrap justify-center gap-4 mt-8"><div className="bg-gradient-to-r from-blue-600 to-blue-500 text-white px-8 py-3 rounded-full font-semibold text-sm shadow-lg hover:shadow-xl hover:scale-105 transition duration-300">Swap Fee per Time: <span className="font-bold text-yellow-300">8,000 VND</span></div><div className="bg-gradient-to-r from-indigo-600 to-blue-500 text-white px-8 py-3 rounded-full font-semibold text-sm shadow-lg hover:shadow-xl hover:scale-105 transition duration-300">Battery Deposit: <span className="font-bold text-yellow-300">400,000 VND</span></div></div>
              </div>
            </div>
          </div>
        </section>

        {/* 🔹 Modal đăng nhập / đăng ký */}
        <AuthModal
          isOpen={authModal.isOpen}
          onClose={closeAuthModal}
          initialMode={authModal.mode}
        />
      </main>
    </PageTransition>
  );
};

export default ServicesPage;
