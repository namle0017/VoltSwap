import hero from "../assets/hero.png";

const Hero = () => {
  return (
    <section
      id="home"
      className="pt-16 bg-gradient-to-br from-blue-50 via-white to-green-50"
    >
      <div className="max-w-7xl mx-auto section-padding">
        <div className="grid md:grid-cols-2 gap-8 items-center">
          <div className="animate-slide-up">
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
              EV Battery Swap
              <span className="text-primary"> Station</span>
              <br />
              <span className="text-secondary">Management System</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 leading-relaxed">
              Revolutionize your electric vehicle experience with our
              cutting-edge battery swap station management platform. Fast,
              efficient, and eco-friendly solutions for the future of
              transportation.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <button className="btn-primary text-lg">Get Started Today</button>
              <button className="btn-secondary text-lg">Learn More</button>
            </div>
            <div className="flex items-center mt-8 space-x-8">
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
          <div className="relative animate-fade-in">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-secondary/20 rounded-full blur-3xl"></div>
            <img
              src={hero}
              alt="Electric Vehicle Charging"
              className="relative z-10 w-full h-auto rounded-2xl shadow-2xl transform hover:scale-105 transition-transform duration-500"
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
