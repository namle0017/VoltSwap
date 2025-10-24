import Contact from "../components/Contact";
import PageTransition from "@/components/PageTransition";

const ContactPage = () => {
  return (
    <PageTransition>
      <main className="pt-16">
        <Contact />

        <section className="bg-gray-50 section-padding">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-8">
              Frequently Asked Questions
            </h2>
            <div className="space-y-6 text-left">
              <div className="card p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  How quickly can I set up the system?
                </h3>
                <p className="text-gray-600">
                  Most installations are completed within 2-3 business days,
                  including training and support.
                </p>
              </div>
              <div className="card p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Do you provide 24/7 support?
                </h3>
                <p className="text-gray-600">
                  Yes, our Enterprise customers receive 24/7 dedicated support.
                  Other plans include business hours support.
                </p>
              </div>
              <div className="card p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Can the system integrate with existing infrastructure?
                </h3>
                <p className="text-gray-600">
                  Absolutely! Our system is designed to work with most existing
                  EV charging and battery swap equipment.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
    </PageTransition>
  );
};

export default ContactPage;
