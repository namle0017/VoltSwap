import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import PageTransition from "@/components/PageTransition";

export default function Employees() {
  // Sample data
  const [employees, setEmployees] = useState([
    {
      id: 1,
      name: "Michael Johnson",
      email: "michael@company.com",
      phone: "0123456789",
      station: "Tan Binh Station",
      workHour: "8:00–17:00",
      status: "Active",
    },
    {
      id: 2,
      name: "Sarah Wilson",
      email: "sarah@company.com",
      phone: "0987654321",
      station: "District 1 Station",
      workHour: "9:00–12:00",
      status: "Active",
    },
  ]);

  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    workHour: "",
    station: "",
  });

  // Open modal for Add
  const openAddModal = () => {
    setEditMode(false);
    setSelectedId(null);
    setFormData({
      name: "",
      email: "",
      phone: "",
      workHour: "",
      station: "",
    });
    setShowModal(true);
  };

  // Open modal for Edit
  const openEditModal = (emp) => {
    setEditMode(true);
    setSelectedId(emp.id);
    setFormData({
      name: emp.name,
      email: emp.email,
      phone: emp.phone,
      workHour: emp.workHour,
      station: emp.station,
    });
    setShowModal(true);
  };

  // Handle Submit
  const handleSubmit = (e) => {
    e.preventDefault();
    if (editMode) {
      // Update existing employee
      setEmployees((prev) =>
        prev.map((emp) =>
          emp.id === selectedId ? { ...emp, ...formData } : emp
        )
      );
    } else {
      // Add new employee
      const newEmployee = {
        id: employees.length ? Math.max(...employees.map((e) => e.id)) + 1 : 1,
        status: "Active",
        ...formData,
      };
      setEmployees([...employees, newEmployee]);
    }
    setShowModal(false);
  };

  return (
    <PageTransition>
      <div className="p-8 bg-gray-50 min-h-screen">
        {/* Header */}
        <motion.div
          className="mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Admin Dashboard
          </h1>
          <p className="text-gray-600">Employee Management</p>
        </motion.div>

        {/* Staff List Section */}
        <motion.div
          className="bg-white rounded-xl shadow-lg p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                Staff List
              </h2>
              <p className="text-gray-500 text-sm">
                Manage staff information and work locations
              </p>
            </div>
            <motion.button
              onClick={openAddModal}
              className="flex items-center space-x-2 bg-gray-900 text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
            >
              <i className="bi bi-person-plus" />
              <span>Add New Employee</span>
            </motion.button>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">
                    Employee
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">
                    Phone
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">
                    Station
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">
                    Work hours
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {employees.map((emp) => (
                  <tr key={emp.id} className="border-b hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">
                        {emp.name}
                      </div>
                      <div className="text-sm text-gray-500">{emp.email}</div>
                    </td>
                    <td className="px-6 py-4 text-gray-700">{emp.phone}</td>
                    <td className="px-6 py-4 text-gray-700">{emp.station}</td>
                    <td className="px-6 py-4 text-gray-700">{emp.workHour}</td>
                    <td className="px-6 py-4">
                      <span className="inline-block px-3 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                        {emp.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        className="flex items-center text-gray-600 hover:text-blue-600"
                        onClick={() => openEditModal(emp)}
                      >
                        <i className="bi bi-pencil-square mr-1" /> Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* Modal */}
        <AnimatePresence>
          {showModal && (
            <motion.div
              className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div
                className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6"
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
              >
                <div className="flex justify-between items-center mb-4 border-b pb-2">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {editMode ? "Edit Employee" : "Add New Employee"}
                  </h3>
                  <button
                    onClick={() => setShowModal(false)}
                    className="p-2 hover:bg-gray-100 rounded-lg"
                  >
                    <i className="bi bi-x-lg" />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm text-gray-700 mb-1">
                      Name
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      className="w-full border border-gray-300 rounded-lg px-3 py-2"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-700 mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                      className="w-full border border-gray-300 rounded-lg px-3 py-2"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-700 mb-1">
                      Phone
                    </label>
                    <input
                      type="text"
                      value={formData.phone}
                      onChange={(e) =>
                        setFormData({ ...formData, phone: e.target.value })
                      }
                      className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-700 mb-1">
                      Work Hours
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 8:00–17:00"
                      value={formData.workHour}
                      onChange={(e) =>
                        setFormData({ ...formData, workHour: e.target.value })
                      }
                      className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-700 mb-1">
                      Station
                    </label>
                    <input
                      type="text"
                      value={formData.station}
                      onChange={(e) =>
                        setFormData({ ...formData, station: e.target.value })
                      }
                      className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    />
                  </div>

                  <div className="flex justify-end gap-3 pt-4 border-t mt-4">
                    <button
                      type="button"
                      onClick={() => setShowModal(false)}
                      className="px-4 py-2 border rounded-lg"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800"
                    >
                      {editMode ? "Save Changes" : "Add Employee"}
                    </button>
                  </div>
                </form>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </PageTransition>
  );
}
