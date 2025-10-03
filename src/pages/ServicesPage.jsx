import Services from "../components/Services";
import PageTransition from "../components/PageTransition";

const ServicesPage = () => {
  return (
    <PageTransition>
      <main className="pt-16">
        <Services />

        {/* Additional Services Content */}
        <section className="bg-white section-padding">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-gray-900 mb-4">
                Service Packages
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
                Choose the perfect plan for your EV battery swap station needs.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              <div className="card p-8 text-center">
                <h3 className="text-2xl font-bold text-gray-900 mb-4">
                  Starter
                </h3>
                <div className="text-4xl font-bold text-primary mb-4">
                  $99<span className="text-lg text-gray-600">/month</span>
                </div>
                <ul className="space-y-3 text-gray-600 mb-8">
                  <li>✓ Basic booking system</li>
                  <li>✓ Up to 50 swaps/day</li>
                  <li>✓ Email support</li>
                  <li>✓ Basic analytics</li>
                </ul>
                <button className="btn-primary w-full">Get Started</button>
              </div>

              <div className="card p-8 text-center border-2 border-primary">
                <div className="bg-primary text-white px-3 py-1 rounded-full text-sm font-semibold mb-4 inline-block">
                  Most Popular
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">
                  Professional
                </h3>
                <div className="text-4xl font-bold text-primary mb-4">
                  $299<span className="text-lg text-gray-600">/month</span>
                </div>
                <ul className="space-y-3 text-gray-600 mb-8">
                  <li>✓ Advanced booking system</li>
                  <li>✓ Up to 200 swaps/day</li>
                  <li>✓ Priority support</li>
                  <li>✓ Advanced analytics</li>
                  <li>✓ Mobile app integration</li>
                  <li>✓ Inventory management</li>
                </ul>
                <button className="btn-primary w-full">Get Started</button>
              </div>

              <div className="card p-8 text-center">
                <h3 className="text-2xl font-bold text-gray-900 mb-4">
                  Enterprise
                </h3>
                <div className="text-4xl font-bold text-primary mb-4">
                  $599<span className="text-lg text-gray-600">/month</span>
                </div>
                <ul className="space-y-3 text-gray-600 mb-8">
                  <li>✓ Full feature access</li>
                  <li>✓ Unlimited swaps</li>
                  <li>✓ 24/7 dedicated support</li>
                  <li>✓ Custom analytics</li>
                  <li>✓ API access</li>
                  <li>✓ White-label solution</li>
                </ul>
                <button className="btn-primary w-full">Contact Sales</button>
              </div>
            </div>
          </div>
        </section>
      </main>
    </PageTransition>
  );
};

export default ServicesPage;
