import { motion } from "framer-motion";
import PageTransition from "@/components/PageTransition";

export default function Reports() {
  const packages = [
    { name: "GU", revenue: "$125M", customers: 179 },
    { name: "G2", revenue: "$89M", customers: 198 },
    { name: "G1", revenue: "$34M", customers: 114 },
    { name: "G3", revenue: "$0K", customers: 0 },
  ];

  const summary = [
    { color: "blue", value: "$248K", label: "Total monthly revenue" },
    { color: "green", value: "1024", label: "Swap Times" },
    { color: "yellow", value: "491", label: "Active Customers" },
  ];

  return (
    <PageTransition>
      <div className="p-8 bg-gray-50 min-h-screen">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600">Detailed Reports</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Left: Revenue by Service */}
          <motion.div
            className="bg-white rounded-xl shadow-lg p-6 md:col-span-2"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Revenue by Service Subscription
            </h2>
            <div className="grid sm:grid-cols-2 gap-4">
              {packages.map((pkg, i) => (
                <motion.div
                  key={i}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-all duration-300"
                  whileHover={{ scale: 1.02 }}
                >
                  <div className="flex justify-between mb-2">
                    <h3 className="font-semibold text-gray-800">{pkg.name}</h3>
                  </div>
                  <div className="grid grid-cols-2 text-sm text-gray-600">
                    <div>
                      <p className="text-xs text-gray-400 uppercase">Revenue</p>
                      <p className="text-lg font-bold text-gray-900">
                        {pkg.revenue}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 uppercase">
                        Customers
                      </p>
                      <p className="text-lg font-bold text-gray-900">
                        {pkg.customers}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Right: Summary */}
          <motion.div
            className="space-y-4"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            {summary.map((item, i) => (
              <div
                key={i}
                className={`rounded-xl shadow text-center p-6 bg-${item.color}-100`}
              >
                <p className={`text-2xl font-bold text-${item.color}-700 mb-1`}>
                  {item.value}
                </p>
                <p className="text-gray-700 text-sm">{item.label}</p>
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </PageTransition>
  );
}
