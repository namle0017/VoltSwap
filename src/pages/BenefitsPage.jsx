import Benefits from "../components/Benefits";
import PageTransition from "../components/PageTransition";

const BenefitsPage = () => {
  return (
    <PageTransition>
      <main className="pt-16">
        <Benefits />

        {/* Additional Benefits Content */}
        <section className="bg-gray-50 section-padding">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-gray-900 mb-4">
                Success Stories
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
                See how our system has transformed EV infrastructure for
                businesses worldwide.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-12">
              <div className="card p-8">
                <div className="flex items-center mb-6">
                  <img
                    src="https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=150"
                    alt="Client"
                    className="w-16 h-16 rounded-full mr-4"
                  />
                  <div>
                    <h4 className="font-semibold text-gray-900">
                      Sarah Johnson
                    </h4>
                    <p className="text-gray-600">
                      Station Manager, GreenCharge
                    </p>
                  </div>
                </div>
                <p className="text-gray-600 leading-relaxed mb-4">
                  "Since implementing this system, our station efficiency
                  increased by 300%. The automated booking and inventory
                  management saved us countless hours."
                </p>
                <div className="flex text-yellow-400">⭐⭐⭐⭐⭐</div>
              </div>

              <div className="card p-8">
                <div className="flex items-center mb-6">
                  <img
                    src="https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=150"
                    alt="Client"
                    className="w-16 h-16 rounded-full mr-4"
                  />
                  <div>
                    <h4 className="font-semibold text-gray-900">
                      Michael Chen
                    </h4>
                    <p className="text-gray-600">CEO, EcoFleet Solutions</p>
                  </div>
                </div>
                <p className="text-gray-600 leading-relaxed mb-4">
                  "The analytics and reporting features gave us insights we
                  never had before. We optimized our operations and reduced
                  costs by 40%."
                </p>
                <div className="flex text-yellow-400">⭐⭐⭐⭐⭐</div>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-white section-padding">
          <div className="max-w-7xl mx-auto text-center">
            <h2 className="text-4xl font-bold text-gray-900 mb-8">
              Ready to Experience the Benefits?
            </h2>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              Join thousands of satisfied customers who have transformed their
              EV infrastructure with our system.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="btn-primary">Start Free Trial</button>
              <button className="btn-secondary">Schedule Demo</button>
            </div>
          </div>
        </section>
      </main>
    </PageTransition>
  );
};

export default BenefitsPage;
