import { useState } from "react";
import { useNavigate } from "react-router-dom";
import hero from "../assets/hero.png";
import AuthModal from "../components/AuthModal";
import PageTransition from "@/components/PageTransition";

const Hero = () => {
  const [authModal, setAuthModal] = useState({ isOpen: false, mode: "signup" });
  const navigate = useNavigate();

  const openAuthModal = (mode) => {
    setAuthModal({ isOpen: true, mode });
  };

  const closeAuthModal = () => {
    setAuthModal({ isOpen: false, mode: "signup" });
  };

  return (
    <PageTransition>
      <main>
        <section
          id="home"
          className="pt-20 bg-gradient-to-br from-blue-50 via-white to-green-50 overflow-hidden"
        >
          <div className="max-w-7xl mx-auto section-padding">
            <div className="grid md:grid-cols-2 gap-16 items-center">
              {/* Left side */}
              <div className="animate-slide-up">
                <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
                  EV Battery Swap{" "}
                  <span className="text-primary">Station</span>
                  <br />
                  <span className="text-secondary">Management System</span>
                </h1>

                <p className="text-lg md:text-xl text-gray-600 mb-8 leading-relaxed">
                  Revolutionize your electric vehicle experience with our
                  cutting-edge battery swap station management platform. Fast,
                  efficient, and eco-friendly solutions for the future of
                  transportation.
                </p>

                {/* Buttons */}
                <div className="flex flex-col sm:flex-row gap-4">
                  <button
                    onClick={() => openAuthModal("signup")}
                    className="btn-primary text-lg sm:w-auto w-full rounded-full hover:scale-105 hover:bg-blue-600 transition"
                  >
                    Get Started Today
                  </button>

                  <button
                    onClick={() => navigate("/about")}
                    className="btn-secondary text-lg sm:w-auto w-full rounded-full hover:scale-105 hover:bg-blue-600 transition"
                  >
                    Learn More
                  </button>
                </div>

                {/* Stats */}
                <div className="flex items-center mt-10 space-x-8">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">500+</div>
                    <div className="text-sm text-gray-600">Stations</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-secondary">24/7</div>
                    <div className="text-sm text-gray-600">Service</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-accent">100%</div>
                    <div className="text-sm text-gray-600">Eco-Friendly</div>
                  </div>
                </div>
              </div>

              {/* Right side image */}
              <div className="relative flex justify-center animate-fade-in">
                <div className="absolute -inset-16 bg-gradient-to-r from-blue-400/25 via-green-300/25 to-transparent rounded-[4rem] blur-[140px]"></div>
                <img
                  src={hero}
                  alt="EV Battery Swap Station"
                  className="relative z-10 w-[120%] max-w-2xl rounded-[2rem] shadow-2xl object-cover transition-transform duration-700 hover:scale-[1.05]"
                  decoding="async"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Auth Modal */}
        <AuthModal
          isOpen={authModal.isOpen}
          onClose={closeAuthModal}
          initialMode={authModal.mode}
        />
      </main>
    </PageTransition>
  );
};

export default Hero;
