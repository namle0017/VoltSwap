import { useState } from 'react';
// eslint-disable-next-line no-unused-vars
import { motion } from 'framer-motion';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import PageTransition from '../components/PageTransition';

const AdminPage = () => {
  const [activeMenuItem, setActiveMenuItem] = useState('Overview');

  const menuItems = [
    { name: 'Overview', icon: '📊' },
    { name: 'Customers', icon: '👥' },
    { name: 'Reports', icon: '📈' },
    { name: 'Stations', icon: '⚡' },
    { name: 'Employees', icon: '👨‍💼' },
    { name: 'Complaints', icon: '📝' },
    { name: 'Packages', icon: '📦' },
  ];

  const statisticCards = [
    {
      title: 'Total Customers',
      value: '1,247',
      icon: '👥',
      color: 'bg-blue-500',
      change: '+12%',
      changeColor: 'text-green-600'
    },
    {
      title: 'Monthly Revenue',
      value: '$248M',
      icon: '💰',
      color: 'bg-green-500',
      change: '+8%',
      changeColor: 'text-green-600'
    },
    {
      title: 'Swaps Today',
      value: '489',
      icon: '⚡',
      color: 'bg-yellow-500',
      change: '+15%',
      changeColor: 'text-green-600'
    },
    {
      title: 'Active Stations',
      value: '45/47',
      icon: '📍',
      color: 'bg-purple-500',
      change: '95%',
      changeColor: 'text-blue-600'
    }
  ];

  // Service Package Usage Data for PieChart
  const servicePackageData = [
    { name: 'GU Package', value: 179, color: '#10B981' },
    { name: 'G2 Package', value: 198, color: '#3B82F6' },
    { name: 'G1 Package', value: 114, color: '#F59E0B' }
  ];

  // Monthly Battery Swaps Data for BarChart
  const monthlySwapsData = [
    { month: 'Jan', swaps: 1240 },
    { month: 'Feb', swaps: 1380 },
    { month: 'Mar', swaps: 1520 },
    { month: 'Apr', swaps: 1450 },
    { month: 'May', swaps: 1680 },
    { month: 'Jun', swaps: 1750 },
    { month: 'Jul', swaps: 1890 },
    { month: 'Aug', swaps: 1820 },
    { month: 'Sep', swaps: 1950 },
    { month: 'Oct', swaps: 2100 },
    { month: 'Nov', swaps: 2050 },
    { month: 'Dec', swaps: 2200 }
  ];

  const handleSignOut = () => {
    alert('Signing out...');
    // Add sign out logic here
  };

  // Custom tooltip for PieChart
  const CustomPieTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 rounded-lg shadow-lg border">
          <p className="font-semibold">{payload[0].name}</p>
          <p className="text-sm text-gray-600">{payload[0].value} customers</p>
        </div>
      );
    }
    return null;
  };

  // Custom tooltip for BarChart
  const CustomBarTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 rounded-lg shadow-lg border">
          <p className="font-semibold">{label}</p>
          <p className="text-sm text-gray-600">{payload[0].value.toLocaleString()} swaps</p>
        </div>
      );
    }
    return null;
  };

  return (
    <PageTransition>
      <div className="flex h-screen bg-gray-50">
        {/* Sidebar */}
        <motion.div
          className="w-64 bg-white shadow-lg fixed h-full z-10"
          initial={{ x: -250 }}
          animate={{ x: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center space-x-2">
              <div className="text-2xl">⚡</div>
              <div className="text-xl font-bold text-gray-900">EV Admin</div>
            </div>
          </div>

          <nav className="mt-6">
            {menuItems.map((item, index) => (
              <motion.button
                key={index}
                onClick={() => setActiveMenuItem(item.name)}
                className={`w-full flex items-center px-6 py-3 text-left transition-all duration-200 ${activeMenuItem === item.name
                  ? 'bg-primary text-white border-r-4 border-blue-600'
                  : 'text-gray-700 hover:bg-gray-100'
                  }`}
                whileHover={{ x: 5 }}
                whileTap={{ scale: 0.98 }}
              >
                <span className="text-xl mr-3">{item.icon}</span>
                <span className="font-medium">{item.name}</span>
              </motion.button>
            ))}

            <motion.button
              onClick={handleSignOut}
              className="w-full flex items-center justify-center gap-2 py-3 bg-red-500 text-white font-medium rounded-lg shadow-md hover:bg-red-600 active:scale-95 transition-all duration-200"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
            >
              <span className="text-xl">🚪</span>
              Sign Out
            </motion.button>
          </nav>
        </motion.div>

        {/* Main Content */}
        <div className="flex-1 ml-64 overflow-y-auto">
          <div className="p-8">
            {/* Header */}
            <motion.div
              className="mb-8"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard Overview</h1>
              <p className="text-gray-600">Welcome back! Here's what's happening with your EV stations today.</p>
            </motion.div>

            {/* Statistics Cards */}
            <motion.div
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              {statisticCards.map((card, index) => (
                <motion.div
                  key={index}
                  className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all duration-300"
                  whileHover={{ y: -5, scale: 1.02 }}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className={`p-3 rounded-lg ${card.color} text-white text-2xl`}>
                      {card.icon}
                    </div>
                    <span className={`text-sm font-medium ${card.changeColor}`}>{card.change}</span>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-1">{card.value}</h3>
                  <p className="text-gray-600 text-sm">{card.title}</p>
                </motion.div>
              ))}
            </motion.div>

            {/* Charts Section */}
            <div className="grid grid-cols-2 gap-8 mb-8">
              {/* Service Package Usage - PieChart */}
              <motion.div
                className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all duration-300"
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                whileHover={{ y: -2 }}
              >
                <h2 className="text-xl font-bold text-gray-900 mb-6">Service Package Usage</h2>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={servicePackageData}
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        innerRadius={40}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {servicePackageData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomPieTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-4 space-y-2">
                  {servicePackageData.map((item, index) => (
                    <motion.div
                      key={index}
                      className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                      whileHover={{ x: 5 }}
                    >
                      <div className="flex items-center space-x-3">
                        <div
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: item.color }}
                        ></div>
                        <span className="text-sm font-medium text-gray-700">{item.name}</span>
                      </div>
                      <span className="text-sm text-gray-600">{item.value} customers</span>
                    </motion.div>
                  ))}
                </div>
              </motion.div>

              {/* Monthly Battery Swaps - BarChart */}
              <motion.div
                className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all duration-300"
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                whileHover={{ y: -2 }}
              >
                <h2 className="text-xl font-bold text-gray-900 mb-6">Monthly Battery Swaps</h2>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={monthlySwapsData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis
                        dataKey="month"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 12, fill: '#6b7280' }}
                      />
                      <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 12, fill: '#6b7280' }}
                      />
                      <Tooltip content={<CustomBarTooltip />} />
                      <Bar
                        dataKey="swaps"
                        fill="#3B82F6"
                        radius={[4, 4, 0, 0]}
                        className="hover:opacity-80 transition-opacity duration-200"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-4 flex items-center justify-between text-sm text-gray-600">
                  <span>Average: {Math.round(monthlySwapsData.reduce((sum, item) => sum + item.swaps, 0) / monthlySwapsData.length).toLocaleString()} swaps/month</span>
                  <span className="text-green-600 font-medium">↗ +18% vs last year</span>
                </div>
              </motion.div>
            </div>

            {/* Recent Activity Section */}
            <motion.div
              className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all duration-300"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              whileHover={{ y: -2 }}
            >
              <h2 className="text-xl font-bold text-gray-900 mb-6">Recent Activity</h2>
              <div className="space-y-4">
                {[
                  { type: 'success', message: 'Battery swap completed at Thu Duc Station', time: '2 min ago', color: 'bg-green-100 text-green-800' },
                  { type: 'info', message: 'New customer registered at District 1 Station', time: '5 min ago', color: 'bg-blue-100 text-blue-800' },
                  { type: 'warning', message: 'Maintenance scheduled for Tan Binh Station', time: '10 min ago', color: 'bg-yellow-100 text-yellow-800' },
                  { type: 'info', message: 'G2 package subscription renewed', time: '15 min ago', color: 'bg-blue-100 text-blue-800' }
                ].map((activity, index) => (
                  <motion.div
                    key={index}
                    className="flex items-center justify-between p-4 rounded-lg hover:bg-gray-50 transition-all duration-200"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.4, delay: 0.6 + index * 0.1 }}
                    whileHover={{ x: 5 }}
                  >
                    <div className="flex items-center space-x-4">
                      <div className={`w-3 h-3 rounded-full ${activity.color.split(' ')[0]}`}></div>
                      <p className="text-gray-700 font-medium">{activity.message}</p>
                    </div>
                    <span className="text-sm text-gray-500">{activity.time}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </PageTransition>
  );
};

export default AdminPage;